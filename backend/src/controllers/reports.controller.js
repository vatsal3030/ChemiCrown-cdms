const prisma = require('../config/prisma');

exports.getAnalyticsReports = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const [
      rawData,
      orderStatusRaw,
      inventoryValuationRaw,
      expiringLotsCount,
      stockOutCount
    ] = await Promise.all([
      // 1. Top Customers by Revenue
      prisma.order.groupBy({
        by: ['customerId'],
        where: { status: 'DELIVERED', deletedAt: null },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } }
      }),
      // 2. Order Fulfillment Status
      prisma.order.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { status: true }
      }),
      // 3. Inventory Valuation (top 10 stock items)
      prisma.inventory.findMany({
        where: { product: { deletedAt: null } },
        include: { product: { select: { name: true } } },
        orderBy: { quantity: 'desc' },
        take: 10
      }),
      // 4. Lots Nearing Expiry
      prisma.lot.count({
        where: {
          expiryDate: { lte: thirtyDaysFromNow, gt: now },
          status: { not: 'EXPIRED' }
        }
      }),
      // 5. Stock Out Count
      prisma.inventory.count({
        where: { quantity: 0, product: { deletedAt: null } }
      })
    ]);

    const topCustomersRaw = rawData.filter(tc => tc.customerId).slice(0, 5);

    const topCustomers = await Promise.all(topCustomersRaw.map(async (tc) => {
      const cust = await prisma.customer.findUnique({ where: { id: tc.customerId }, select: { companyName: true } });
      return {
        name: cust?.companyName || 'Unknown',
        revenue: tc._sum.total || 0
      };
    }));

    const orderStatusDistribution = orderStatusRaw.map(st => ({
      name: st.status,
      value: st._count.status
    }));

    const inventoryValuation = inventoryValuationRaw.map(inv => ({
      name: inv.product?.name || 'Unknown',
      stock: inv.quantity
    }));

    res.status(200).json({
      success: true,
      data: {
        topCustomers,
        orderStatusDistribution,
        inventoryValuation,
        expiringLotsCount,
        stockOutCount
      }
    });
  } catch (error) {
    console.error('[Reports] getAnalyticsReports error:', error);
    next(error);
  }
};
