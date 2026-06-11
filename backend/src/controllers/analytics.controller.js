const prisma = require('../config/prisma');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // ── 1. Total Revenue ────────────────────────────────────────────────────
    // Sum order.total for all DELIVERED, non-deleted orders.
    // This is the canonical revenue: every delivered order = payment received.
    // Covers both COD (no payment record) and online (Razorpay/UPI) orders.
    const deliveredRevenue = await prisma.order.aggregate({
      where: { status: 'DELIVERED', deletedAt: null },
      _sum: { total: true }
    }).catch(() => ({ _sum: { total: 0 } }));

    const totalRevenue = deliveredRevenue._sum.total || 0;

    // ── 2. Active & Pending Orders ──────────────────────────────────────────
    const [activeOrdersCount, pendingOrdersCount] = await Promise.all([
      prisma.order.count({
        where: {
          status: { in: ['PENDING', 'PROCESSING', 'DISPATCHED'] },
          deletedAt: null
        }
      }).catch(() => 0),
      prisma.order.count({
        where: { status: 'PENDING', deletedAt: null }
      }).catch(() => 0)
    ]);

    // ── 3. Verified Customers ───────────────────────────────────────────────
    const [verifiedCustomers, newCustomersThisWeek] = await Promise.all([
      prisma.customer.count({
        where: { isVerified: true, deletedAt: null }
      }).catch(() => 0),
      // Customer has no createdAt — filter through the related User
      prisma.customer.count({
        where: {
          isVerified: true,
          deletedAt: null,
          user: { createdAt: { gte: startOfWeek } }
        }
      }).catch(() => 0)
    ]);

    // ── 4. Low Inventory Alerts ─────────────────────────────────────────────
    // IMPORTANT: filter out soft-deleted products (deletedAt != null)
    const lowInventoryItems = await prisma.inventory.findMany({
      where: { product: { deletedAt: null } },
      include: { product: { select: { id: true, name: true, sku: true } } }
    }).catch(() => []);

    const lowStockProducts = lowInventoryItems
      .filter(i => i.product && (i.quantity === 0 || (i.minThreshold != null && i.quantity <= i.minThreshold)))
      .map(i => ({
        id: i.product.id,
        name: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        minThreshold: i.minThreshold,
        isOutOfStock: i.quantity === 0
      }));

    // ── 5. Monthly Revenue Trend (Last 6 months) ────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const recentPayments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: sixMonthsAgo }
      },
      select: { amount: true, createdAt: true }
    }).catch(() => []);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      revenueMap[monthNames[d.getMonth()]] = 0;
    }

    recentPayments.forEach(p => {
      const m = monthNames[new Date(p.createdAt).getMonth()];
      if (revenueMap[m] !== undefined) revenueMap[m] += p.amount;
    });

    const revenueValues = Object.values(revenueMap);
    const currentMonthRevenue = revenueValues[revenueValues.length - 1] || 0;
    const prevMonthRevenue    = revenueValues[revenueValues.length - 2] || 0;
    let revenueTrend = null;
    if (prevMonthRevenue > 0) {
      revenueTrend = (((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1);
    }

    const revenueData = Object.keys(revenueMap).map(key => ({ name: key, value: revenueMap[key] }));

    // ── 6. Top Products by Stock ────────────────────────────────────────────
    const topInventory = await prisma.inventory.findMany({
      take: 4,
      orderBy: { quantity: 'desc' },
      include: { product: { select: { name: true } } }
    }).catch(() => []);

    const inventoryData = topInventory
      .filter(inv => inv.product)
      .map(inv => ({ name: inv.product.name, stock: inv.quantity }));

    // ── 7. Today's Attendance ───────────────────────────────────────────────
    // AttendanceStatus enum: PRESENT | ABSENT | HALF_DAY | LEAVE
    const todayAttendances = await prisma.attendance.groupBy({
      by: ['status'],
      where: { date: { gte: startOfToday, lt: startOfTomorrow } },
      _count: { status: true }
    }).catch(() => []);

    const attendanceMap = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0 };
    todayAttendances.forEach(a => {
      if (attendanceMap[a.status] !== undefined) {
        attendanceMap[a.status] = a._count.status;
      }
    });

    const totalEmployees = await prisma.employee.count({
      where: { user: { deletedAt: null, role: { not: 'CUSTOMER' } } }
    }).catch((e) => { console.error(e); return 0; });

    const markedCount = attendanceMap.PRESENT + attendanceMap.ABSENT + attendanceMap.HALF_DAY + attendanceMap.LEAVE;
    const unmarkedCount = Math.max(0, totalEmployees - markedCount);

    const attendanceData = [
      { name: 'Present',  value: attendanceMap.PRESENT },
      { name: 'Absent',   value: attendanceMap.ABSENT },
      { name: 'On Leave', value: attendanceMap.HALF_DAY + attendanceMap.LEAVE },
      { name: 'Unmarked', value: unmarkedCount },
    ];

    // ── 8. Recent Orders ────────────────────────────────────────────────────
    const recentOrders = await prisma.order.findMany({
      take: 5,
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { companyName: true } } }
    }).catch(() => []);

    // ── Response ────────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        stats: {
          revenue: totalRevenue,
          orders: activeOrdersCount,
          pendingOrders: pendingOrdersCount,
          customers: verifiedCustomers,
          newCustomers: newCustomersThisWeek,
          inventoryAlerts: lowStockProducts.length,
          lowStockProducts,
          revenueTrend
        },
        revenueData,
        inventoryData,
        attendanceData,
        recentOrders
      }
    });

  } catch (error) {
    // Log and pass to error handler — should never reach here with individual .catch()
    console.error('[Analytics] getDashboardStats error:', error?.message || error);
    next(error);
  }
};
