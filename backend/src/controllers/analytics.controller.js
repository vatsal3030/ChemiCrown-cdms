const prisma = require('../config/prisma');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // 1. Total Revenue — SUCCESS payments + DELIVERED COD orders
    const [onlineRevenue, codRevenue] = await Promise.all([
      // Online payments (Razorpay / UPI) that succeeded
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      // COD: DELIVERED orders where payment method is PAY_ON_DELIVERY
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          deletedAt: null,
          payment: { paymentMethod: 'PAY_ON_DELIVERY' }
        },
        _sum: { total: true }
      })
    ]);

    const totalRevenue = (onlineRevenue._sum.amount || 0) + (codRevenue._sum.total || 0);

    // 2. Active Orders
    const activeOrdersCount = await prisma.order.count({
      where: {
        status: { in: ['PENDING', 'PROCESSING', 'DISPATCHED'] },
        deletedAt: null
      }
    });

    const pendingOrdersCount = await prisma.order.count({
      where: {
        status: 'PENDING',
        deletedAt: null
      }
    });

    // 3. Verified Customers
    const verifiedCustomers = await prisma.customer.count({
      where: { isVerified: true, deletedAt: null }
    });

    // New verified customers this week (created/verified in last 7 days)
    const newCustomersThisWeek = await prisma.customer.count({
      where: {
        isVerified: true,
        deletedAt: null,
        createdAt: { gte: startOfWeek }
      }
    });

    // 4. Low Inventory Alerts — return full product list, not just count
    const lowInventoryItems = await prisma.inventory.findMany({
      where: {},
      include: { product: { select: { id: true, name: true, sku: true } } }
    });
    const lowStockProducts = lowInventoryItems
      .filter(i => i.quantity <= i.minThreshold)
      .map(i => ({ id: i.product.id, name: i.product.name, sku: i.product.sku, quantity: i.quantity, minThreshold: i.minThreshold }));

    // 5. Monthly Revenue Trend (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const recentPayments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: sixMonthsAgo }
      },
      select: { amount: true, createdAt: true }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueMap = {};

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = monthNames[d.getMonth()];
      revenueMap[m] = 0;
    }

    recentPayments.forEach(p => {
      const m = monthNames[p.createdAt.getMonth()];
      if (revenueMap[m] !== undefined) {
        revenueMap[m] += p.amount;
      }
    });

    // Calculate month-over-month trend
    const revenueValues = Object.values(revenueMap);
    const currentMonthRevenue = revenueValues[revenueValues.length - 1] || 0;
    const prevMonthRevenue = revenueValues[revenueValues.length - 2] || 0;
    let revenueTrend = null;
    if (prevMonthRevenue > 0) {
      revenueTrend = (((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1);
    }

    const revenueData = Object.keys(revenueMap).map(key => ({
      name: key,
      value: revenueMap[key]
    }));

    // 6. Top Products Inventory
    const topInventory = await prisma.inventory.findMany({
      take: 4,
      orderBy: { quantity: 'desc' },
      include: { product: true }
    });
    const inventoryData = topInventory.map(inv => ({
      name: inv.product.name,
      stock: inv.quantity
    }));

    // 7. Real Attendance for Today
    const todayAttendances = await prisma.attendance.groupBy({
      by: ['status'],
      where: { date: { gte: startOfToday } },
      _count: { status: true }
    }).catch(() => []);

    const attendanceMap = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, ON_LEAVE: 0 };
    todayAttendances.forEach(a => {
      if (attendanceMap[a.status] !== undefined) attendanceMap[a.status] = a._count.status;
    });
    const attendanceData = [
      { name: 'Present', value: attendanceMap.PRESENT },
      { name: 'Absent', value: attendanceMap.ABSENT },
      { name: 'On Leave', value: attendanceMap.HALF_DAY + attendanceMap.ON_LEAVE },
    ];

    // 8. Recent Orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          revenue: totalRevenue,
          orders: activeOrdersCount,
          pendingOrders: pendingOrdersCount,
          customers: verifiedCustomers,
          newCustomers: newCustomersThisWeek,
          inventoryAlerts: lowStockProducts.length,
          lowStockProducts,         // Full list with names
          revenueTrend              // e.g. "+5.2" or "-3.1"
        },
        revenueData,
        inventoryData,
        attendanceData,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};
