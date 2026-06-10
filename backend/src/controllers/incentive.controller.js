const prisma = require('../config/prisma');

/**
 * GET /api/incentives
 * List incentives — admins see all, sales sees own
 */
exports.getIncentives = async (req, res, next) => {
  try {
    const { month, status, employeeId } = req.query;
    const where = {};

    // Sales employees can only see their own
    const isSalesEmployee = ['SALES', 'MARKETING', 'DIGITAL_MARKETING'].includes(req.user.role);
    if (isSalesEmployee) {
      const emp = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
      where.employeeId = emp.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (month) where.month = month;
    if (status) where.status = status;

    const incentives = await prisma.salesIncentive.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        }
      },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }]
    });

    res.json({ success: true, data: incentives });
  } catch (error) { next(error); }
};

/**
 * POST /api/incentives/calculate
 * Auto-calculate sales incentive for an employee for a given month
 * Based on total order value from their assigned customers
 */
exports.calculateIncentive = async (req, res, next) => {
  try {
    const { employeeId, month, commissionRate } = req.body;

    if (!employeeId || !month) {
      return res.status(400).json({ success: false, message: 'employeeId and month required' });
    }

    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true }
    });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Check if already exists for this month
    const existing = await prisma.salesIncentive.findFirst({
      where: { employeeId, month }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Incentive already calculated for this month. Update or delete the existing one.' });
    }

    const [y, m] = month.split('-').map(Number);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 1);

    // Find customers assigned to this sales person
    const assignedCustomers = await prisma.customer.findMany({
      where: { assignedSalesId: employeeId }
    });
    const customerIds = assignedCustomers.map(c => c.id);

    // Sum all completed/delivered orders from those customers in the month
    const orders = await prisma.order.findMany({
      where: {
        customerId: { in: customerIds },
        status: { in: ['DELIVERED', 'DISPATCHED', 'PACKAGED', 'PROCESSING'] },
        createdAt: { gte: monthStart, lt: monthEnd }
      },
      select: { total: true }
    });

    const achievedAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const target = emp.salesTarget || 0;
    const rate = commissionRate !== undefined ? parseFloat(commissionRate) : 2.5;

    // Commission only on amount ABOVE target (industry standard)
    const commissionableAmount = Math.max(0, achievedAmount - target);
    const incentiveAmount = Number(((commissionableAmount * rate) / 100).toFixed(2));

    const incentive = await prisma.salesIncentive.create({
      data: {
        employeeId,
        month,
        targetAmount: target,
        achievedAmount: Number(achievedAmount.toFixed(2)),
        commissionRate: rate,
        incentiveAmount,
        status: 'PENDING',
        notes: `Auto-calculated from ${orders.length} orders. Commission on ₹${commissionableAmount.toFixed(2)} above target.`
      }
    });

    res.status(201).json({
      success: true,
      data: incentive,
      message: `Incentive calculated: ₹${incentiveAmount} (${orders.length} orders, ₹${achievedAmount.toFixed(2)} achieved vs ₹${target} target)`
    });
  } catch (error) { next(error); }
};

/**
 * POST /api/incentives
 * Manually create an incentive (for Marketing/other roles without auto-calculation)
 */
exports.createIncentive = async (req, res, next) => {
  try {
    const { employeeId, month, incentiveAmount, notes } = req.body;

    if (!employeeId || !month || !incentiveAmount) {
      return res.status(400).json({ success: false, message: 'employeeId, month, and incentiveAmount are required' });
    }

    const existing = await prisma.salesIncentive.findFirst({ where: { employeeId, month } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Incentive already exists for this month. Delete existing first.' });
    }

    const incentive = await prisma.salesIncentive.create({
      data: {
        employeeId,
        month,
        incentiveAmount: parseFloat(incentiveAmount),
        notes: notes || 'Manual incentive entry',
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: incentive });
  } catch (error) { next(error); }
};

/**
 * PUT /api/incentives/:id/approve
 * Manager approves or rejects an incentive
 */
exports.approveIncentive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    if (!['APPROVE', 'REJECT', 'PENDING'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be APPROVE, REJECT, or PENDING' });
    }

    const incentive = await prisma.salesIncentive.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } }
    });
    if (!incentive) return res.status(404).json({ success: false, message: 'Incentive not found' });
    if (incentive.status === 'PAID') return res.status(400).json({ success: false, message: 'Cannot change status of a PAID incentive' });

    const newStatus = action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED' : 'PENDING');
    await prisma.salesIncentive.update({
      where: { id },
      data: { status: newStatus, ...(notes && { notes }) }
    });

    await prisma.notification.create({
      data: {
        userId: incentive.employee.userId,
        message: action === 'APPROVE'
          ? `🎉 Your incentive of ₹${incentive.incentiveAmount} for ${incentive.month} has been approved! It will be added to your next payroll.`
          : `❌ Your incentive for ${incentive.month} was not approved. ${notes || ''}`
      }
    }).catch(() => {});

    res.json({ success: true, message: `Incentive ${newStatus.toLowerCase()}` });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/incentives/:id
 */
exports.deleteIncentive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const incentive = await prisma.salesIncentive.findUnique({ where: { id } });
    if (!incentive) return res.status(404).json({ success: false, message: 'Not found' });
    if (incentive.status === 'PAID') return res.status(400).json({ success: false, message: 'Cannot delete a paid incentive' });

    await prisma.salesIncentive.delete({ where: { id } });
    res.json({ success: true, message: 'Incentive deleted' });
  } catch (error) { next(error); }
};
