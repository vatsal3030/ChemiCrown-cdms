const prisma = require('../config/prisma');

/**
 * GET /api/finance/overview
 * All-time P&L summary with optional date range
 */
exports.getOverview = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = buildDateFilter(from, to);

    // Revenue — from DELIVERED orders
    const orders = await prisma.order.findMany({
      where: { status: 'DELIVERED', createdAt: dateFilter },
      include: { items: { include: { product: true } } }
    });

    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const shippingRevenue = orders.reduce((s, o) => s + (o.distanceCost || 0), 0);

    // COGS — cost basis = purchase price proxy (use product price as proxy since no cost price field)
    // Real COGS would use inventory transaction costs; using price as a conservative proxy
    const cogs = orders.reduce((s, o) =>
      s + o.items.reduce((is, item) => is + (item.price * item.quantity * 0.6), 0), 0);
    // ↑ 60% cost ratio as conservative proxy — replace with actual cost_price when available

    // Gross Profit
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Payroll costs — PAID salaries
    const paidSalaries = await prisma.salary.findMany({
      where: { status: 'PAID', paidAt: dateFilter }
    });
    const payrollCost = paidSalaries.reduce((s, sl) => s + (sl.netPay || 0), 0);

    // Manual expenses
    const expenses = await prisma.expense.findMany({
      where: { date: dateFilter },
      orderBy: { date: 'desc' }
    });
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Tax collected (from orders — VAT/GST placeholder)
    const taxCollected = orders.reduce((s, o) => s + (o.taxAmount || 0), 0);

    // Net Profit
    const netProfit = grossProfit - payrollCost - totalExpenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Pending revenue (orders not yet delivered)
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ['REQUESTED', 'PENDING', 'PROCESSING', 'PACKAGED', 'DISPATCHED'] },
        createdAt: dateFilter
      }
    });
    const pendingRevenue = pendingOrders.reduce((s, o) => s + (o.total || 0), 0);

    // Monthly revenue trend (for chart — all months from first order)
    const monthlyRevenue = await getMonthlyRevenueTrend(from, to);

    // Expense breakdown by category
    const expenseByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // Payroll by month
    const payrollByMonth = paidSalaries.reduce((acc, s) => {
      acc[s.month] = (acc[s.month] || 0) + s.netPay;
      return acc;
    }, {});

    // Recent ledger entries (last 20)
    const recentLedger = await prisma.financeLedger.findMany({
      where: { date: dateFilter },
      orderBy: { date: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: {
        revenue,
        shippingRevenue,
        cogs,
        grossProfit,
        grossMargin,
        payrollCost,
        totalExpenses,
        taxCollected,
        netProfit,
        netMargin,
        pendingRevenue,
        orderCount: orders.length,
        pendingOrderCount: pendingOrders.length,
        monthlyRevenue,
        expenseByCategory,
        payrollByMonth,
        recentLedger,
        recentExpenses: expenses.slice(0, 10),
        dateRange: { from: from || null, to: to || null }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/finance/ledger
 * Full ledger with filters and pagination
 */
exports.getLedger = async (req, res, next) => {
  try {
    const { from, to, type, category, page = 1, limit = 50 } = req.query;
    const safePage  = Math.max(1, isNaN(parseInt(page))  ? 1 : parseInt(page));
    const safeLimit = Math.max(1, isNaN(parseInt(limit)) ? 50 : parseInt(limit));

    const where = {};
    if (from || to) where.date = buildDateFilter(from, to);
    if (type) where.type = type;
    if (category) where.category = { contains: category, mode: 'insensitive' };

    const [entries, total] = await Promise.all([
      prisma.financeLedger.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit
      }),
      prisma.financeLedger.count({ where })
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) }
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/finance/ledger/:id
 * Get single ledger entry
 */
exports.getLedgerById = async (req, res, next) => {
  try {
    const entry = await prisma.financeLedger.findUnique({
      where: { id: req.params.id }
    });
    if (!entry) return res.status(404).json({ success: false, error: 'Ledger entry not found' });
    res.json({ success: true, data: entry });
  } catch (error) { next(error); }
};

/**
 * GET /api/finance/expenses
 * List manual expenses
 */
exports.getExpenses = async (req, res, next) => {
  try {
    const { from, to, category, page = 1, limit = 20 } = req.query;
    const safePage  = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.max(1, parseInt(limit) || 20);
    const where = {};
    if (from || to) where.date = buildDateFilter(from, to);
    if (category && category !== 'all') where.category = category;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit
      }),
      prisma.expense.count({ where })
    ]);

    res.json({ success: true, data: expenses, pagination: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) } });
  } catch (error) { next(error); }
};

/**
 * POST /api/finance/expenses
 * Create manual expense + ledger entry
 */
exports.createExpense = async (req, res, next) => {
  try {
    const { category, amount, description, date, receiptUrl } = req.body;
    if (!category || !amount || !description || !date) {
      return res.status(400).json({ success: false, message: 'category, amount, description, and date are required' });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }

    const [expense] = await prisma.$transaction([
      prisma.expense.create({
        data: { category, amount: parseFloat(amount), description, date: new Date(date), receiptUrl, createdBy: req.user.id }
      }),
      prisma.financeLedger.create({
        data: {
          type: 'DEBIT',
          category,
          amount: parseFloat(amount),
          description,
          date: new Date(date),
          createdBy: req.user.id,
          isAutomatic: false
        }
      })
    ]);

    res.status(201).json({ success: true, data: expense, message: 'Expense recorded' });
  } catch (error) { next(error); }
};

/**
 * PUT /api/finance/expenses/:id
 */
exports.updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, amount, description, date, receiptUrl } = req.body;
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(receiptUrl !== undefined && { receiptUrl })
      }
    });
    res.json({ success: true, data: expense });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/finance/expenses/:id
 */
exports.deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) { next(error); }
};

/**
 * POST /api/finance/sync-ledger
 * Admin: retroactively sync all historical orders and salaries into the ledger
 * This is a one-time or on-demand operation
 */
exports.syncLedger = async (req, res, next) => {
  try {
    // Sync delivered orders → CREDIT entries
    const orders = await prisma.order.findMany({
      where: { status: 'DELIVERED' },
      include: { items: true }
    });

    // Sync paid salaries → DEBIT entries
    const salaries = await prisma.salary.findMany({ where: { status: 'PAID' } });

    let creditCount = 0;
    let debitCount = 0;

    for (const order of orders) {
      const exists = await prisma.financeLedger.findFirst({ where: { referenceId: order.id, type: 'CREDIT' } });
      if (!exists) {
        await prisma.financeLedger.create({
          data: {
            type: 'CREDIT',
            category: 'REVENUE',
            amount: order.total || 0,
            description: `Order #${order.id.substring(0, 8).toUpperCase()} delivered`,
            referenceId: order.id,
            date: order.updatedAt || order.createdAt,
            isAutomatic: true
          }
        });
        creditCount++;
      }
    }

    for (const sal of salaries) {
      const exists = await prisma.financeLedger.findFirst({ where: { referenceId: sal.id, type: 'DEBIT' } });
      if (!exists) {
        await prisma.financeLedger.create({
          data: {
            type: 'DEBIT',
            category: 'PAYROLL',
            amount: sal.netPay || 0,
            description: `Payroll ${sal.month} - Employee ${sal.employeeId.substring(0, 8)}`,
            referenceId: sal.id,
            date: sal.paidAt || new Date(),
            isAutomatic: true
          }
        });
        debitCount++;
      }
    }

    res.json({ success: true, message: `Synced ${creditCount} revenue entries and ${debitCount} payroll entries` });
  } catch (error) { next(error); }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDateFilter(from, to) {
  if (!from && !to) return undefined;
  const filter = {};
  if (from) filter.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    filter.lte = toDate;
  }
  return filter;
}

async function getMonthlyRevenueTrend(from, to) {
  // Get first order date if no from
  let startDate = from ? new Date(from) : null;
  if (!startDate) {
    const firstOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'asc' }, where: { status: 'DELIVERED' } });
    startDate = firstOrder?.createdAt || new Date();
  }
  const endDate = to ? new Date(to) : new Date();

  const deliveredOrders = await prisma.order.findMany({
    where: { status: 'DELIVERED', createdAt: { gte: startDate, lte: endDate } },
    select: { total: true, createdAt: true, distanceCost: true }
  });

  const map = {};
  for (const o of deliveredOrders) {
    const key = o.createdAt.toISOString().substring(0, 7); // YYYY-MM
    if (!map[key]) map[key] = { month: key, revenue: 0, orders: 0 };
    map[key].revenue += o.total || 0;
    map[key].orders += 1;
  }

  // Paid salaries by month
  const paidSalaries = await prisma.salary.findMany({
    where: { status: 'PAID', paidAt: { gte: startDate, lte: endDate } },
    select: { netPay: true, month: true }
  });
  for (const s of paidSalaries) {
    const key = s.month;
    if (!map[key]) map[key] = { month: key, revenue: 0, orders: 0 };
    map[key].payroll = (map[key].payroll || 0) + s.netPay;
  }

  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}
