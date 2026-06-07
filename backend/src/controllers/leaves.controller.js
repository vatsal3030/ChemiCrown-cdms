const prisma = require('../config/prisma');

/**
 * POST /api/leaves
 * Employee submits a leave request
 */
exports.submitLeaveRequest = async (req, res, next) => {
  try {
    const { date, reason, type } = req.body;
    
    const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    // Check if a leave for this date already exists
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const existing = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: employee.id,
        date: targetDate,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A leave request already exists for this date.' });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        date: targetDate,
        type: type || 'FULL_DAY',
        reason
      }
    });

    // Notify all managers/admins
    const managers = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'OWNER', 'MANAGER'] }, deletedAt: null }
    });
    await Promise.all(managers.map(m => 
      prisma.notification.create({
        data: {
          userId: m.id,
          message: `Leave request from ${req.user.firstName} ${req.user.lastName} for ${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}.`
        }
      })
    ));

    res.status(201).json({ success: true, message: 'Leave request submitted', data: leave });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leaves/my
 * Employee views their own leave requests
 */
exports.getMyLeaves = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
    if (!employee) return res.status(200).json({ success: true, data: [] });

    const leaves = await prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    res.json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leaves
 * Admin/Manager views all pending leave requests
 */
exports.getAllLeaves = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, profileImageUrl: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/leaves/:id/review
 * HR/Manager approves or rejects a leave request
 */
exports.reviewLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } }
    });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
    if (leave.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Leave request is already reviewed' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedLeave = await tx.leaveRequest.update({
        where: { id },
        data: { status, reviewedBy: req.user.id, reviewNote }
      });

      // If approved, mark attendance as LEAVE on that date
      if (status === 'APPROVED') {
        const targetDate = new Date(leave.date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(targetDate.getDate() + 1);

        const existing = await tx.attendance.findFirst({
          where: { employeeId: leave.employeeId, date: { gte: targetDate, lt: nextDay } }
        });
        
        const attendanceStatus = leave.type === 'HALF_DAY' ? 'HALF_DAY' : 'LEAVE';
        if (existing) {
          await tx.attendance.update({ where: { id: existing.id }, data: { status: attendanceStatus } });
        } else {
          await tx.attendance.create({ data: { employeeId: leave.employeeId, date: targetDate, status: attendanceStatus } });
        }
      }

      // Notify employee
      await tx.notification.create({
        data: {
          userId: leave.employee.userId,
          message: `Your leave request for ${new Date(leave.date).toLocaleDateString('en-IN')} has been ${status.toLowerCase()}.${reviewNote ? ` Note: ${reviewNote}` : ''}`
        }
      });

      return updatedLeave;
    });

    res.json({ success: true, message: `Leave ${status.toLowerCase()} successfully`, data: updated });
  } catch (error) {
    next(error);
  }
};
