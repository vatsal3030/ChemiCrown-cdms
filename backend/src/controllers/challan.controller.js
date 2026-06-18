const prisma = require('../config/prisma');

/**
 * Generate delivery challan data for an order
 * A delivery challan is required under GST when goods are transported
 * without a tax invoice (e.g., for approvals, returns, job work)
 * Format: DC/YYYY-YY/NNNN
 */
const generateDeliveryChallan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true, hsnCode: true, gstRate: true,
                unit: true, packageSize: true, baseUnit: true, sku: true,
                casNumber: true, unNumber: true, hazardClass: true
              }
            }
          }
        },
        customer: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true }
            }
          }
        }
      }
    });

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Challan only for PACKAGED, DISPATCHED, or DELIVERED orders
    const allowedStatuses = ['PACKAGED', 'DISPATCHED', 'DELIVERED'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `Delivery challan is available for ${allowedStatuses.join('/')} orders. Current: ${order.status}`
      });
    }

    // Build challan number from order creation date + short ID
    const orderDate = new Date(order.createdAt);
    const month = orderDate.getMonth();
    const year = orderDate.getFullYear();
    const fyStart = month >= 3 ? year : year - 1;
    const fyEnd = fyStart + 1;
    const challanNumber = `DC/${fyStart}-${String(fyEnd).slice(-2)}/${order.id.substring(0, 8).toUpperCase()}`;

    // Determine if any items are hazardous
    const hasHazardous = order.items.some(item =>
      item.product?.unNumber || item.product?.hazardClass
    );

    const challan = {
      // Company info
      company: {
        name: 'ChemiCrown',
        legalName: 'ChemiCrown Chemical Distributors',
        address: 'Bhavnagar, Gujarat, India - 364001',
        gstin: process.env.COMPANY_GSTIN || '24XXXXX0000X0ZX',
        phone: process.env.COMPANY_PHONE || '+91 98765 43210',
        email: process.env.COMPANY_EMAIL || 'sales@chemicrown.com',
        stateCode: '24',
        stateName: 'Gujarat'
      },
      // Challan meta
      challanNumber,
      challanDate: order.updatedAt || order.createdAt, // Date of dispatch/packaging
      orderId: order.id,
      invoiceNumber: order.invoiceNumber || null,
      // Consignee (customer)
      consignee: {
        name: `${order.customer.user.firstName} ${order.customer.user.lastName}`.trim(),
        companyName: order.customer.companyName,
        gstin: order.customer.gstNumber || null,
        phone: order.customer.user.phone,
        email: order.customer.user.email,
        address: order.shippingAddress || 'N/A'
      },
      // Items
      items: order.items.map((item, i) => ({
        sr: i + 1,
        name: item.product?.name || 'Unknown',
        sku: item.product?.sku || '',
        hsnCode: item.product?.hsnCode || item.hsnCode || '',
        casNumber: item.product?.casNumber || '',
        unNumber: item.product?.unNumber || '',
        hazardClass: item.product?.hazardClass || '',
        unit: item.product?.unit || '',
        packageSize: item.product?.packageSize || '',
        baseUnit: item.product?.baseUnit || '',
        quantity: item.quantity
      })),
      // Transport
      transport: {
        mode: 'Road',
        vehicleNumber: order.vehicleNumber || '—',
        driverName: order.driverName || '—',
        distanceKm: order.distanceKm || 0,
        dispatchedAt: order.status === 'DISPATCHED' || order.status === 'DELIVERED'
          ? order.updatedAt
          : null
      },
      // Safety
      hasHazardous,
      orderStatus: order.status
    };

    res.json({ success: true, data: challan });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateDeliveryChallan };
