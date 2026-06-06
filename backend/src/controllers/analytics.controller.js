const prisma = require('../config/prisma');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Revenue (all SUCCESS payments)
    const payments = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    const totalRevenue = payments._sum.amount || 0;

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

    const newCustomersThisWeek = await prisma.customer.count({
      where: {
        isVerified: true,
        deletedAt: null,
        // Mocking 'this week' logic by just taking recent items in a real app
      }
    });

    // 4. Low Inventory Alerts
    const allInventory = await prisma.inventory.findMany({
      include: { product: true }
    });
    const lowInventoryAlerts = allInventory.filter(i => i.quantity <= i.minThreshold).length;

    // 5. Monthly Revenue Trend (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of the month

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

    // 7. Attendance (Mocked for today)
    const attendanceData = [
      { name: 'Present', value: 0 },
      { name: 'Absent', value: 0 },
      { name: 'On Leave', value: 0 },
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
          inventoryAlerts: lowInventoryAlerts
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
