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

    // 5. Monthly Revenue Trend (Mock 6 months structure but filled with actual DB logic if exists)
    // For simplicity, we just return empty or current month if DB is small
    const revenueData = [
      { name: 'Jan', value: 0 },
      { name: 'Feb', value: 0 },
      { name: 'Mar', value: 0 },
      { name: 'Apr', value: 0 },
      { name: 'May', value: 0 },
      { name: 'Jun', value: totalRevenue }, // Dump all revenue in current month for demo
    ];

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
        attendanceData
      }
    });
  } catch (error) {
    next(error);
  }
};
