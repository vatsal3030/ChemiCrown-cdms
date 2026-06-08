const prisma = require('../config/prisma');

/**
 * GET /api/overtime
 * List overtime records — admins see all, employees see own
 */
exports.getOvertime = async (req, res, next) => {
  try {
    const { employeeId, status, month } = req.query;
    const where = {};

    if (req.user.role === 'SALES' || req.user.role === 'MARKETING' || req.user.role === 'DIGITAL_MARKETING' || req.user.role === 'INVENTORY_MANAGER') {
      // Employee can only see their own overtime
      const emp = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });
      where.employeeId = emp.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) where.status = status;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1)
      };
    }

    const records = await prisma.overtime.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ success: true, data: records });
  } catch (error) { next(error); }
};

/**
 * POST /api/overtime
 * Log overtime for an employee (manager submits on behalf)
 */
exports.createOvertime = async (req, res, next) => {
  try {
    const { employeeId, date, hours, reason } = req.body;

    if (!employeeId || !date || !hours) {
      return res.status(400).json({ success: false, message: 'employeeId, date, and hours are required' });
    }

    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true }
    });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (!emp.baseSalary) return res.status(400).json({ success: false, message: 'Employee has no base salary set — cannot calculate overtime rate' });

    const overtimeDate = new Date(date);
    const dayOfWeek = overtimeDate.getDay(); // 0 = Sunday

    // Check if the date is a holiday
    const isHoliday = await prisma.holidayCalendar.findFirst({
      where: {
        date: {
          gte: new Date(overtimeDate.getFullYear(), overtimeDate.getMonth(), overtimeDate.getDate()),
          lt: new Date(overtimeDate.getFullYear(), overtimeDate.getMonth(), overtimeDate.getDate() + 1)
        }
      }
    });

    // Multiplier: 2x for Sunday or holiday, 1.5x for weekdays
    const multiplier = (dayOfWeek === 0 || isHoliday) ? 2.0 : 1.5;

    // Hourly rate: baseSalary / 26 working days / 8 hours
    const hourlyRate = emp.baseSalary / 26 / 8;
    const amount = Number((parseFloat(hours) * hourlyRate * multiplier).toFixed(2));

    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: overtimeDate,
        hours: parseFloat(hours),
        hourlyRate: Number(hourlyRate.toFixed(2)),
        multiplier,
        amount,
        reason: reason || null,
        status: 'PENDING'
      }
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: emp.userId,
        message: `⏰ Overtime of ${hours} hours on ${overtimeDate.toDateString()} logged (₹${amount}). Awaiting manager approval.`
      }
    }).catch(() => {});

    res.status(201).json({ success: true, data: overtime, message: `Overtime logged: ₹${amount} (${hours}h × ${multiplier}x rate)` });
  } catch (error) { next(error); }
};

/**
 * PUT /api/overtime/:id/approve
 * Manager approves or rejects an overtime request
 */
exports.approveOvertime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'APPROVE' | 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be APPROVE or REJECT' });
    }

    const ot = await prisma.overtime.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } }
    });
    if (!ot) return res.status(404).json({ success: false, message: 'Overtime record not found' });
    if (ot.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Overtime is not in PENDING state' });

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await prisma.overtime.update({
      where: { id },
      data: { status: newStatus, approvedById: req.user.id }
    });

    await prisma.notification.create({
      data: {
        userId: ot.employee.userId,
        message: action === 'APPROVE'
          ? `✅ Your overtime of ${ot.hours}h on ${new Date(ot.date).toDateString()} has been approved (₹${ot.amount}). It will be included in next payroll.`
          : `❌ Your overtime of ${ot.hours}h on ${new Date(ot.date).toDateString()} was rejected. ${reason || ''}`
      }
    }).catch(() => {});

    res.json({ success: true, message: `Overtime ${newStatus.toLowerCase()}` });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/overtime/:id
 * Delete a PENDING overtime record
 */
exports.deleteOvertime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ot = await prisma.overtime.findUnique({ where: { id } });
    if (!ot) return res.status(404).json({ success: false, message: 'Not found' });
    if (ot.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Only PENDING overtime can be deleted' });

    await prisma.overtime.delete({ where: { id } });
    res.json({ success: true, message: 'Overtime record deleted' });
  } catch (error) { next(error); }
};
