const prisma = require('../config/prisma');

/**
 * Generate a sequential invoice number in format: CC/YYYY-YY/NNNN
 * e.g., CC/2026-27/0001
 */
async function generateInvoiceNumber() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  
  // Indian financial year: April → March
  // If month >= April (3), FY starts this year; else FY started last year
  const fyStart = month >= 3 ? year : year - 1;
  const fyEnd = fyStart + 1;
  const fyPrefix = `CC/${fyStart}-${String(fyEnd).slice(-2)}/`;

  // Find the last invoice number for this financial year
  const lastOrder = await prisma.order.findFirst({
    where: {
      invoiceNumber: { startsWith: fyPrefix }
    },
    orderBy: { invoiceDate: 'desc' },
    select: { invoiceNumber: true }
  });

  let nextSeq = 1;
  if (lastOrder?.invoiceNumber) {
    const parts = lastOrder.invoiceNumber.split('/');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${fyPrefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Compute GST breakup for an order's items
 * @param {Array} items - Order items with gstRate and price
 * @param {boolean} isInterState - Whether IGST applies
 * @returns {{ items: Array, cgstTotal, sgstTotal, igstTotal, taxTotal }}
 */
function computeGstBreakup(items, isInterState = false) {
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const enrichedItems = items.map(item => {
    const lineValue = item.price * item.quantity;
    const gstRate = item.gstRate || item.product?.gstRate || 18; // default 18%
    const taxableAmount = lineValue;
    
    let cgst = 0, sgst = 0, igst = 0, taxAmount = 0;
    
    if (isInterState) {
      igst = Number((taxableAmount * gstRate / 100).toFixed(2));
      taxAmount = igst;
      igstTotal += igst;
    } else {
      cgst = Number((taxableAmount * gstRate / 200).toFixed(2)); // half rate
      sgst = Number((taxableAmount * gstRate / 200).toFixed(2)); // half rate
      taxAmount = cgst + sgst;
      cgstTotal += cgst;
      sgstTotal += sgst;
    }

    return {
      ...item,
      gstRate,
      cgst,
      sgst,
      igst,
      taxAmount
    };
  });

  return {
    items: enrichedItems,
    cgstTotal: Number(cgstTotal.toFixed(2)),
    sgstTotal: Number(sgstTotal.toFixed(2)),
    igstTotal: Number(igstTotal.toFixed(2)),
    taxTotal: Number((cgstTotal + sgstTotal + igstTotal).toFixed(2))
  };
}

/**
 * Generate invoice for an order (called when order moves to DISPATCHED or on-demand)
 */
const generateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { 
                name: true, hsnCode: true, gstRate: true, costPrice: true,
                unit: true, packageSize: true, baseUnit: true, sku: true
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
        },
        payment: true
      }
    });

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Only generate invoice for orders that are at least PROCESSING
    const allowedStatuses = ['PROCESSING', 'PACKAGED', 'DISPATCHED', 'DELIVERED'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invoice can only be generated for orders in ${allowedStatuses.join('/')} status. Current: ${order.status}` 
      });
    }

    // Determine inter-state (for now default to intra-state / Gujarat)
    const isInterState = order.isInterState || false;

    // Compute GST breakup
    const gstData = computeGstBreakup(order.items, isInterState);

    // Generate invoice number if not already assigned
    let invoiceNumber = order.invoiceNumber;
    let invoiceDate = order.invoiceDate;
    
    if (!invoiceNumber) {
      invoiceNumber = await generateInvoiceNumber();
      invoiceDate = new Date();

      // Update order with invoice details and GST breakup
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: {
            invoiceNumber,
            invoiceDate,
            cgstTotal: gstData.cgstTotal,
            sgstTotal: gstData.sgstTotal,
            igstTotal: gstData.igstTotal,
            isInterState
          }
        });

        // Update each OrderItem with GST breakup
        for (const item of gstData.items) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              gstRate: item.gstRate,
              cgst: item.cgst,
              sgst: item.sgst,
              igst: item.igst,
              taxAmount: item.taxAmount,
              hsnCode: item.product?.hsnCode || item.hsnCode || null,
              costPrice: item.product?.costPrice || item.costPrice || null
            }
          });
        }
      });
    }

    // Compute subtotal
    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Build invoice response
    const invoice = {
      // Company info (ChemiCrown)
      company: {
        name: 'ChemiCrown',
        legalName: 'ChemiCrown Chemical Distributors',
        address: 'Bhavnagar, Gujarat, India - 364001',
        gstin: process.env.COMPANY_GSTIN || '24XXXXX0000X0ZX', // Gujarat state code: 24
        phone: process.env.COMPANY_PHONE || '+91 98765 43210',
        email: process.env.COMPANY_EMAIL || 'sales@chemicrown.com',
        stateCode: '24', // Gujarat
        stateName: 'Gujarat'
      },
      // Invoice meta
      invoiceNumber,
      invoiceDate: invoiceDate || order.createdAt,
      orderDate: order.createdAt,
      orderId: order.id,
      // Customer
      customer: {
        name: `${order.customer.user.firstName} ${order.customer.user.lastName}`.trim(),
        companyName: order.customer.companyName,
        gstin: order.customer.gstin || null,
        phone: order.customer.user.phone,
        email: order.customer.user.email,
        address: order.shippingAddress || 'N/A'
      },
      // Items with GST breakup
      items: gstData.items.map(item => ({
        id: item.id,
        name: item.product?.name || 'Unknown Product',
        sku: item.product?.sku || '',
        hsnCode: item.product?.hsnCode || item.hsnCode || '',
        unit: item.product?.unit || '',
        packageSize: item.product?.packageSize || '',
        baseUnit: item.product?.baseUnit || '',
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: Number((item.price * item.quantity).toFixed(2)),
        gstRate: item.gstRate,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        taxAmount: item.taxAmount
      })),
      // Totals
      subtotal: Number(subtotal.toFixed(2)),
      cgstTotal: gstData.cgstTotal,
      sgstTotal: gstData.sgstTotal,
      igstTotal: gstData.igstTotal,
      taxTotal: gstData.taxTotal,
      shippingCost: (order.distanceCost || 0) + (order.hazardousShippingCost || 0),
      grandTotal: order.total,
      // Payment
      payment: order.payment ? {
        method: order.payment.paymentMethod,
        status: order.payment.status,
        paidAt: order.payment.paidAt
      } : null,
      // State
      isInterState,
      orderStatus: order.status
    };

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateInvoice, generateInvoiceNumber, computeGstBreakup };
