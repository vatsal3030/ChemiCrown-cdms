const prisma = require('../config/prisma');

/**
 * GET /api/finance/overview
 * Revenue, expenses (payroll), gross profit — for OWNER/SUPER_ADMIN
 * Uses valid OrderStatus values: REQUESTED, PENDING, PROCESSING, PACKAGED, DISPATCHED, DELIVERED, CANCELLED
 * Revenue is counted from non-cancelled orders
 */
exports.getFinanceOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Valid revenue statuses (all non-cancelled, non-pending-only orders)
    const revenueStatuses = ['PROCESSING', 'PACKAGED', 'DISPATCHED', 'DELIVERED'];

    // Total Revenue (YTD)
    const revenueAgg = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { in: revenueStatuses },
        deletedAt: null,
        createdAt: { gte: startOfYear }
      }
    });
    const totalRevenue = revenueAgg._sum.total || 0;

    // Monthly Revenue (current month)
    const monthRevenueAgg = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { in: revenueStatuses },
        deletedAt: null,
        createdAt: { gte: startOfMonth }
      }
    });
    const monthRevenue = monthRevenueAgg._sum.total || 0;

    // Total Payroll Expenses (PAID salaries this year)
    const currentYearPrefix = String(now.getFullYear());
    const payrollAgg = await prisma.salary.aggregate({
      _sum: { netPay: true, pfContribution: true },
      where: {
        status: 'PAID',
        month: { startsWith: currentYearPrefix }
      }
    });
    const totalPayrollExpense = (payrollAgg._sum.netPay || 0) + (payrollAgg._sum.pfContribution || 0);

    // Gross Profit
    const grossProfit = totalRevenue - totalPayrollExpense;

    // Monthly revenue breakdown (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const agg = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: revenueStatuses },
          deletedAt: null,
          createdAt: { gte: d, lt: end }
        }
      });
      monthlyRevenue.push({
        month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: Number((agg._sum.total || 0).toFixed(2))
      });
    }

    // Monthly payroll (last 6 months)
    const monthlyPayroll = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const agg = await prisma.salary.aggregate({
        _sum: { netPay: true },
        where: { status: 'PAID', month: monthStr }
      });
      monthlyPayroll.push({
        month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        expense: Number((agg._sum.netPay || 0).toFixed(2))
      });
    }

    // Pending salary slips count
    const pendingSalaries = await prisma.salary.count({ where: { status: 'PENDING' } });

    // Total & paid order counts
    const totalOrders = await prisma.order.count({ where: { deletedAt: null } });
    const deliveredOrders = await prisma.order.count({ where: { status: 'DELIVERED', deletedAt: null } });

    res.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        monthRevenue: Number(monthRevenue.toFixed(2)),
        totalPayrollExpense: Number(totalPayrollExpense.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        pendingSalaries,
        totalOrders,
        paidOrders: deliveredOrders,
        monthlyRevenue,
        monthlyPayroll
      }
    });
  } catch (error) {
    next(error);
  }
};
