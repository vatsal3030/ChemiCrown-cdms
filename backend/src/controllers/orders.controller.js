const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../services/email.service');
const { normalizePhone } = require('../utils/phone');

// Lazy Razorpay init — only needed for online payment flows, not COD/UPI
let _razorpay = null;
const getRazorpay = () => {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw { status: 503, message: 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.' };
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return _razorpay;
};


const createOrder = async (req, res, next) => {
  let keyCreated = false;
  let idempotencyKey = '';
  try {
    const { items, distanceKm, shippingAddress, orderNotes, paymentMethod } = req.body; // array of { chemicalId, quantity }
    const userId = req.user.id;

    idempotencyKey = `${userId}-${JSON.stringify(items)}`;
    
    // Cleanup old keys first so they don't cause false duplicate detections
    await prisma.idempotencyKey.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 60000) }
      }
    }).catch(() => {});

    try {
      await prisma.idempotencyKey.create({
        data: { key: idempotencyKey }
      });
      keyCreated = true;
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Duplicate order detected. Please wait before placing the same order again.' });
      }
      throw err;
    }

    let customer = await prisma.customer.findUnique({ where: { userId } });
    
    // Auto-create customer profile if missing (helps smoothly onboard legacy users or fast-registrations, and allows staff to place orders)
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId,
          companyName: req.body.companyName || (req.user.role === 'CUSTOMER' ? 'Retail Customer' : 'Internal Staff Order'),
          isVerified: true // Set to true to allow immediate ordering
        }
      });
    }
    if (!customer.isVerified) {
      return res.status(403).json({ error: 'Your account is pending admin verification. You cannot place orders yet.' });
    }

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const { order, totalAmount } = await prisma.$transaction(async (tx) => {
      let calcTotal = 0;
      let totalTax = 0;
      const orderItemsData = [];

      for (const item of items) {
        if (item.quantity <= 0) throw new Error(`Invalid quantity for product ${item.chemicalId}`);

        const product = await tx.product.findUnique({ 
          where: { id: item.chemicalId },
          include: { inventory: true }
        });

        if (!product) throw { status: 404, message: `Product not found: ${item.chemicalId}` };
        if (!product.inventory || product.inventory.quantity < item.quantity) {
          throw { 
            status: 400, 
            message: `Insufficient stock for ${product.name}. Available: ${product.inventory?.quantity || 0}`,
            outOfStockItem: { id: product.id, name: product.name, available: product.inventory?.quantity || 0 }
          };
        }

        const itemTotal = product.price * item.quantity;
        calcTotal += itemTotal;

        // Per-product GST calculation (default 18% if not set)
        const gstRate = product.gstRate || 18;
        const itemTax = Number((itemTotal * gstRate / 100).toFixed(2));
        const halfTax = Number((itemTax / 2).toFixed(2));
        totalTax += itemTax;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          costPrice: product.costPrice || null,
          hsnCode: product.hsnCode || null,
          gstRate: gstRate,
          // Default to intra-state (CGST + SGST) — invoice generation will recalc if inter-state
          cgst: halfTax,
          sgst: halfTax,
          igst: null,
          taxAmount: itemTax
        });
      }
      // Delivery Cost Calculation:
      // 1. Base Fee: ₹50
      // 2. Distance Cost: ₹10 per km
      // 3. Weight/Size Cost: ₹2 per Kg/L
      // 4. Hazardous Handling Surcharge: ₹150 if any product has hazardClasses
      const baseDeliveryFee = calcTotal > 0 ? 50 : 0;
      const computedDistanceCost = (distanceKm || 0) * 10;
      
      let totalSize = 0;
      let isHazardous = false;
      for (const itemData of orderItemsData) {
        const product = await tx.product.findUnique({ where: { id: itemData.productId } });
        if (product) {
          totalSize += itemData.quantity * (product.packageSize || 1);
          if (product.hazardClasses && product.hazardClasses.length > 0) {
            isHazardous = true;
          }
        }
      }
      
      const weightCost = totalSize * 2;
      const hazardousSurcharge = isHazardous ? 150 : 0;
      
      const distanceCost = Number((baseDeliveryFee + computedDistanceCost + weightCost).toFixed(2));
      const hazardousShippingCost = Number(hazardousSurcharge.toFixed(2));
      const taxAmount = Number(totalTax.toFixed(2));
      calcTotal = Number(calcTotal.toFixed(2));
      const finalTotal = Number((calcTotal + distanceCost + hazardousShippingCost + taxAmount).toFixed(2));

      const dbOrder = await tx.order.create({
        data: {
          customerId: customer.id,
          status: paymentMethod === 'PAY_ON_DELIVERY' ? 'REQUESTED' : 'PENDING',
          total: finalTotal,
          baseCost: calcTotal,
          distanceKm: distanceKm || 0,
          distanceCost: distanceCost,
          hazardousShippingCost: hazardousShippingCost,
          taxAmount: taxAmount,
          cgstTotal: Number((totalTax / 2).toFixed(2)),
          sgstTotal: Number((totalTax / 2).toFixed(2)),
          shippingAddress: shippingAddress,
          orderNotes: orderNotes,
          items: {
            create: orderItemsData
          }
        }
      });

      return { order: dbOrder, totalAmount: finalTotal };
    });

      // Create Payment Record (Pending)
      await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMethod: paymentMethod === 'PAY_ON_DELIVERY' ? 'PAY_ON_DELIVERY' : paymentMethod === 'UPI_QR' ? 'UPI' : 'RAZORPAY',
          amount: totalAmount,
          status: 'PENDING'
        }
      });

      // Send order confirmation email (non-blocking)
      (async () => {
        try {
          const orderWithItems = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: { include: { product: { select: { name: true } } } }, customer: { include: { user: { select: { email: true, firstName: true } } } } }
          });
          if (orderWithItems?.customer?.user) {
            const emailItems = orderWithItems.items.map(i => ({ name: i.product?.name || 'Chemical', quantity: i.quantity, price: i.price * i.quantity }));
            sendOrderConfirmationEmail(orderWithItems.customer.user.email, orderWithItems.customer.user.firstName, order.id, totalAmount, emailItems).catch(() => {});
          }
        } catch (_) { /* non-critical */ }
      })();

      if (paymentMethod === 'PAY_ON_DELIVERY') {
        return res.status(201).json({
          message: 'Order requested successfully. Awaiting manual verification.',
          orderId: order.id
        });
      }

      // UPI/QR payment — return the order ID so frontend can show QR scanner
      if (paymentMethod === 'UPI_QR') {
        return res.status(201).json({
          message: 'Order created. Please complete UPI payment.',
          orderId: order.id,
          merchantUpi: process.env.MERCHANT_UPI_VPA || 'chemicrown@upi',
          merchantName: process.env.MERCHANT_NAME || 'ChemiCrown CDMS',
          amount: totalAmount
        });
      }

      // Create Order in Razorpay for online payments
      const options = {
        amount: Math.round(totalAmount * 100), // paise
        currency: "INR",
        receipt: `rcpt_${order.id.substring(0, 8)}`
      };

      const rzpOrder = await getRazorpay().orders.create(options);

      // Update payment record with razorpay order ID
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { razorpayOrderId: rzpOrder.id }
      });

      res.status(201).json({
        message: 'Order created, proceed to payment',
        orderId: order.id,
        razorpayOrder: rzpOrder
      });
    } catch (error) {
      if (keyCreated && idempotencyKey) {
        // Delete key on failure so the user can retry immediately
        await prisma.idempotencyKey.delete({
          where: { key: idempotencyKey }
        }).catch(() => {});
      }

      if (error.status) {
        return res.status(error.status).json({ error: error.message, outOfStockItem: error.outOfStockItem });
      }
      throw error;
    }
  };

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Server configuration error: Razorpay secret not set' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      await prisma.$transaction(async (tx) => {
        // 1. Update Payment Record
        await tx.payment.update({
          where: { orderId },
          data: {
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: 'SUCCESS'
          }
        });

        // 2. Deduct Inventory now that payment is confirmed
        const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
        for (const item of order.items) {
          await tx.inventory.updateMany({
            where: { productId: item.productId, quantity: { gte: item.quantity } },
            data: { quantity: { decrement: item.quantity } }
          });
        }

        // 3. Update Order Status to PROCESSING after payment confirmation
        await tx.orderStatusHistory.create({
          data: {
            orderId: orderId,
            oldStatus: order.status,
            newStatus: 'PROCESSING',
            note: 'Razorpay payment verified successfully'
          }
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PROCESSING' }
        });
      });

      res.status(200).json({ message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid Signature' });
    }
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const {
      search, sortField, sortOrder,
      status, from, to,
      minAmount, maxAmount
    } = req.query;

    let where = {};

    // Scope to customer if role is CUSTOMER or myOrders is explicitly true
    if (req.user.role === 'CUSTOMER' || req.query.myOrders === 'true') {
      const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
      if (customer) {
        where.customerId = customer.id;
      } else {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Date range filter
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        // Include full day by setting to end of that day
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      where.total = {};
      if (minAmount) where.total.gte = parseFloat(minAmount);
      if (maxAmount) where.total.lte = parseFloat(maxAmount);
    }

    // Search filter (by order ID prefix or customer name)
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { customer: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { [sortField || 'createdAt']: sortOrder || 'desc' },
      include: { 
        items: true,
        customer: {
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        payment: { select: { paymentMethod: true, status: true } },
        history: {
          orderBy: { changedAt: 'desc' },
          take: 1,
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      }
    });

    const formatted = orders.map(o => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      customer: o.customer,
      total: o.total || o.items.reduce((acc, item) => acc + (item.quantity * item.price), 0),
      paymentMethod: o.payment?.paymentMethod || null,
      paymentStatus: o.payment?.status || null,
      lastHandledBy: o.history?.[0]?.user
        ? `${o.history[0].user.firstName || ''} ${o.history[0].user.lastName || ''}`.trim()
        : null
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};


const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    let where = { id };
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
      if (!customer) return res.status(404).json({ error: 'Customer not found' });
      where.customerId = customer.id;
    }

    const order = await prisma.order.findUnique({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } }
          }
        },
        payment: true,
        refund: true,
        history: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { changedAt: 'desc' }
        }
      }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    let assignedSales = null;
    if (order.customer?.assignedSalesId) {
      const emp = await prisma.employee.findUnique({
        where: { id: order.customer.assignedSalesId },
        include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } }
      });
      if (emp) {
        assignedSales = {
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
          phone: emp.user.phone,
          email: emp.user.email
        };
      }
    }

    res.status(200).json({ success: true, data: { ...order, assignedSales } });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    // Fetch order with payment — schema has singular `payment` relation only
    const order = await prisma.order.findUnique({ 
      where: { id },
      include: { 
        items: true, 
        customer: { include: { user: { select: { id: true, firstName: true } } } },
        payment: true,
        refund: true     // check if refund already exists
      }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // RBAC: customers can only cancel their own orders
    if (role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId } });
      if (!customer || order.customerId !== customer.id) {
        return res.status(403).json({ error: 'You can only cancel your own orders' });
      }
    }

    // Status gate
    const CUSTOMER_CANCELLABLE = ['PENDING', 'REQUESTED', 'PROCESSING'];
    const ADMIN_CANCELLABLE    = ['PENDING', 'REQUESTED', 'PROCESSING', 'PACKAGED'];
    const allowed = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(role) ? ADMIN_CANCELLABLE : CUSTOMER_CANCELLABLE;

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }
    if (order.status === 'DELIVERED') {
      return res.status(400).json({ error: 'Delivered orders cannot be cancelled. Please contact support for a return.' });
    }
    if (!allowed.includes(order.status)) {
      return res.status(400).json({ 
        error: `Order cannot be cancelled at this stage (${order.status}).${role === 'CUSTOMER' ? ' Contact support for assistance.' : ''}` 
      });
    }

    // Guard: don't create duplicate refund
    if (order.refund) {
      return res.status(409).json({ error: 'A refund is already associated with this order.' });
    }

    // ── Refund Calculation ────────────────────────────────────────────────
    const paymentSucceeded = order.payment?.status === 'SUCCESS';
    const paidAmount = paymentSucceeded ? (order.payment.amount || 0) : 0;

    // 1% cancellation fee only for CUSTOMER cancelling after processing has begun
    const isLateCancel = ['PROCESSING', 'PACKAGED'].includes(order.status);
    const feeRate = (role === 'CUSTOMER' && isLateCancel) ? 0.01 : 0;
    const cancellationFee = parseFloat((paidAmount * feeRate).toFixed(2));
    const refundAmount    = parseFloat((paidAmount - cancellationFee).toFixed(2));

    // Determine payment method for refund routing
    const payMethod = order.payment?.paymentMethod || 'UNKNOWN';
    const razorpayPaymentId = order.payment?.razorpayPaymentId || null;
    
    // Determine refund delivery method
    let refundMethod = 'COD_NOT_PAID';
    if (paymentSucceeded) {
      if (razorpayPaymentId) refundMethod = 'RAZORPAY';
      else if (payMethod === 'UPI_QR') refundMethod = 'MANUAL_UPI';
      else if (payMethod === 'PAY_ON_DELIVERY') refundMethod = 'COD_NOT_PAID';
      else refundMethod = 'MANUAL_BANK';
    }

    // ── DB Transaction ────────────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      // 1. Restore inventory stock for each cancelled item + audit trail
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } }
        });

        // Create IN transaction record for audit (reverse of dispatch OUT)
        const inv = await tx.inventory.findFirst({ where: { productId: item.productId } });
        if (inv) {
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inv.id,
              type: 'IN',
              quantity: item.quantity,
              remarks: `Order #${id.substring(0, 8).toUpperCase()} cancelled — stock restored`,
              userId: req.user?.id,
              createdBy: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email
            }
          }).catch(() => {}); // Don't block cancellation if audit fails
        }
      }

      // 2. Mark order as CANCELLED with tracking fields
      await tx.order.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          cancellationReason: reason?.trim() || null,
          cancelledAt:        new Date(),
          cancelledBy:        role
        }
      });

      // 3. Log status change in history
      await tx.orderStatusHistory.create({
        data: {
          orderId:   id,
          oldStatus: order.status,
          newStatus: 'CANCELLED',
          note:      reason?.trim() || null,
          changedById: req.user?.id
        }
      });

      // 4. Create Refund record
      const refundStatus = !paymentSucceeded ? 'NOT_APPLICABLE'
        : refundAmount <= 0              ? 'NOT_APPLICABLE'
        : razorpayPaymentId              ? 'PROCESSING'     // will attempt Razorpay refund
        : 'MANUAL_PENDING';                                 // admin must manually transfer

      await tx.refund.create({
        data: {
          orderId:         id,
          amount:          refundAmount,
          cancellationFee: cancellationFee,
          originalAmount:  paidAmount,
          status:          refundStatus,
          reason:          reason?.trim() || 'Customer cancellation',
          paymentMethod:   refundMethod,
          initiatedBy:     userId
        }
      });

      // 5. Finance ledger: debit refund amount (reduces revenue)
      if (refundAmount > 0) {
        await tx.financeLedger.create({
          data: {
            type:        'DEBIT',
            category:    'REFUND',
            amount:      refundAmount,
            description: `Refund for cancelled order #${id.substring(0, 8).toUpperCase()}${cancellationFee > 0 ? ` (₹${cancellationFee.toFixed(2)} fee withheld)` : ''}`,
            referenceId: id,
            date:        new Date(),
            isAutomatic: true
          }
        });
      }

      // 6. Notify customer
      const refundMsg = refundAmount > 0
        ? ` A refund of ₹${refundAmount.toFixed(2)} will be processed within 5–7 business days via ${refundMethod === 'RAZORPAY' ? 'your original payment method' : 'bank/UPI transfer'}.`
        : '';
      await tx.notification.create({
        data: {
          userId:  order.customer.userId,
          type:    'REFUND',
          message: `Your order #${id.substring(0, 8).toUpperCase()} has been cancelled.${refundMsg}`
        }
      });
    });

    // ── Razorpay Refund (best-effort, outside main transaction) ───────────
    if (razorpayPaymentId && refundAmount > 0) {
      try {
        const rzRefund = await razorpay.payments.refund(razorpayPaymentId, {
          amount: Math.round(refundAmount * 100), // Razorpay expects paise
          notes: { orderId: id, reason: reason || 'Customer cancellation' }
        });

        // Update refund record with Razorpay refund ID and mark PROCESSED
        await prisma.refund.update({
          where: { orderId: id },
          data: {
            razorpayRefundId: rzRefund.id,
            status:           'PROCESSED',
            processedAt:      new Date()
          }
        });
      } catch (rzErr) {
        console.error('[Refund] Razorpay refund initiation failed:', rzErr.message);
        // Mark as FAILED so admin dashboard can flag it for manual processing
        await prisma.refund.update({
          where: { orderId: id },
          data: { status: 'FAILED', notes: `Auto-refund failed: ${rzErr.message}` }
        }).catch(() => {}); // silent — don't break the cancel response
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Order cancelled successfully',
      cancellationFee,
      refundAmount,
      refundStatus:       refundAmount > 0 ? 'REFUND_INITIATED' : 'NO_REFUND',
      refundMethod,
      estimatedRefundDays: refundAmount > 0 ? '5–7 business days' : null
    });
  } catch (error) {
    next(error);
  }
};

const verifyCodOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true, items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'REQUESTED') {
      return res.status(400).json({ error: `Order cannot be verified in ${order.status} status` });
    }

    if (order.payment?.paymentMethod !== 'PAY_ON_DELIVERY') {
      return res.status(400).json({ error: 'Only Pay on Delivery orders can be manually verified' });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Deduct inventory
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: { productId: item.productId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          oldStatus: order.status,
          newStatus: 'PROCESSING',
          note: 'COD verification completed by admin',
          changedById: req.user?.id
        }
      });

      return await tx.order.update({
        where: { id },
        data: { status: 'PROCESSING' }
      });
    }, { timeout: 10000 });

    // Fetch the fully populated order outside the interactive transaction
    const fullOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } }
          }
        },
        payment: true,
        history: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { changedAt: 'desc' }
        }
      }
    });

    let assignedSales = null;
    if (fullOrder.customer?.assignedSalesId) {
      const emp = await prisma.employee.findUnique({
        where: { id: fullOrder.customer.assignedSalesId },
        include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } }
      });
      if (emp) {
        assignedSales = {
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
          phone: emp.user.phone,
          email: emp.user.email
        };
      }
    }

    res.status(200).json({ 
      message: 'Pay on Delivery order verified successfully', 
      order: { ...fullOrder, assignedSales } 
    });
  } catch (error) {
    next(error);
  }
};

// Status advancement pipeline — only admins
const STATUS_PIPELINE = ['REQUESTED', 'PENDING', 'PROCESSING', 'PACKAGED', 'DISPATCHED', 'DELIVERED'];

const advanceOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, driverName, driverPhone, vehicleNumber } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: { include: { user: true } }, payment: true }
    });

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Cannot advance a cancelled order' });
    }
    if (order.status === 'DELIVERED') {
      return res.status(400).json({ success: false, error: 'Order is already delivered' });
    }

    const currentIdx = STATUS_PIPELINE.indexOf(order.status);
    const nextStatus = STATUS_PIPELINE[currentIdx + 1];

    if (!nextStatus) {
      return res.status(400).json({ success: false, error: 'No next status available' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Record history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          oldStatus: order.status,
          newStatus: nextStatus,
          note: note || null,
          changedById: req.user?.id
        }
      });

      // ── SPRINT 2: Inventory deduction on DISPATCHED ────────────────────
      // When order moves to DISPATCHED, deduct stock for each item.
      // Creates InventoryTransaction OUT records for audit trail.
      if (nextStatus === 'DISPATCHED') {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
          include: { product: { include: { inventory: true } } }
        });

        for (const item of orderItems) {
          if (!item.product?.inventory) continue;

          // Verify sufficient stock before deducting
          if (item.product.inventory.quantity < item.quantity) {
            throw {
              status: 400,
              message: `Insufficient stock for ${item.product.name}. Available: ${item.product.inventory.quantity}, Required: ${item.quantity}. Cannot dispatch.`
            };
          }

          // Decrement inventory
          await tx.inventory.update({
            where: { id: item.product.inventory.id },
            data: { quantity: { decrement: item.quantity } }
          });

          // Create OUT transaction record
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: item.product.inventory.id,
              type: 'OUT',
              quantity: item.quantity,
              remarks: `Order #${id.substring(0, 8).toUpperCase()} dispatched`,
              userId: req.user?.id,
              createdBy: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email
            }
          });
        }
      }

      // Bug 3 Fix: Auto-mark PAY_ON_DELIVERY payment as PAID when order is DELIVERED
      if (nextStatus === 'DELIVERED' && order.payment?.paymentMethod === 'PAY_ON_DELIVERY') {
        await tx.payment.update({
          where: { orderId: id },
          data: { status: 'SUCCESS' }
        });
      }

      // ── Revenue ledger entry on DELIVERED ───────────────────────────────
      if (nextStatus === 'DELIVERED') {
        await tx.financeLedger.create({
          data: {
            type: 'CREDIT',
            category: 'REVENUE',
            amount: order.total,
            description: `Order #${id.substring(0, 8).toUpperCase()} delivered — ${order.payment?.paymentMethod || 'Unknown'}`,
            referenceId: id,
            isAutomatic: true,
            createdBy: req.user?.id
          }
        }).catch(() => {}); // Don't block order delivery if ledger fails
      }

      // Notify customer
      await tx.notification.create({
        data: {
          userId:  order.customer.userId,
          type:    'ORDER',
          message: `Your order #${id.substring(0, 8).toUpperCase()} status updated: ${order.status} → ${nextStatus}${note ? '. Note: ' + note : ''}${nextStatus === 'DELIVERED' && order.payment?.paymentMethod === 'PAY_ON_DELIVERY' ? ' Payment marked as received.' : ''}`
        }
      });

      return tx.order.update({
        where: { id },
        data: {
          status: nextStatus,
          updatedBy: req.user.id,
          driverName: driverName || order.driverName,
          driverPhone: driverPhone ? normalizePhone(driverPhone) : order.driverPhone,
          vehicleNumber: vehicleNumber || order.vehicleNumber
        }
      });
    }, { timeout: 15000 });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ORDER_STATUS_ADVANCED',
        entity: 'Order',
        entityId: id,
        details: JSON.stringify({ from: order.status, to: nextStatus, note })
      }
    }).catch(() => {}); // Non-blocking

    // Fetch the fully populated order outside the interactive transaction
    const fullOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } }
          }
        },
        payment: true,
        history: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { changedAt: 'desc' }
        }
      }
    });

    let assignedSales = null;
    if (fullOrder.customer?.assignedSalesId) {
      const emp = await prisma.employee.findUnique({
        where: { id: fullOrder.customer.assignedSalesId },
        include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } }
      });
      if (emp) {
        assignedSales = {
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
          phone: emp.user.phone,
          email: emp.user.email
        };
      }
    }

    // Send order status update email to customer only for DELIVERED (important event)
    if (fullOrder?.customer?.user?.email && nextStatus === 'DELIVERED') {
      sendOrderStatusUpdateEmail(
        fullOrder.customer.user.email,
        fullOrder.customer.user.firstName,
        id,
        nextStatus
      ).catch(() => {});
    }

    res.json({ 
      success: true, 
      message: `Order advanced to ${nextStatus}`, 
      data: { ...fullOrder, assignedSales } 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * submitUpiPayment — Customer submits UTR after paying via UPI/QR
 * This is a separate flow from Razorpay, works immediately regardless of account activation.
 */
const submitUpiPayment = async (req, res, next) => {
  try {
    const { orderId, utrNumber, upiVpa } = req.body;
    const userId = req.user.id;

    if (!orderId || !utrNumber || utrNumber.trim().length < 8) {
      return res.status(400).json({ error: 'Valid orderId and UTR number are required' });
    }

    // Validate order belongs to this customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, customer: { include: { user: true } } }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customer.userId !== userId) return res.status(403).json({ error: 'Access denied' });
    if (!order.payment) return res.status(400).json({ error: 'No payment record found for this order' });
    if (order.payment.status === 'SUCCESS') return res.status(400).json({ error: 'Payment already verified' });

    await prisma.payment.update({
      where: { orderId },
      data: {
        utrNumber: utrNumber.trim(),
        upiVpa: upiVpa?.trim() || null,
        status: 'PENDING_VERIFICATION',
        paymentMethod: 'UPI'
      }
    });

    // Notify admin about pending UPI verification
    // Get all admin users to notify
    const admins = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'OWNER', 'MANAGER'] } },
      select: { id: true }
    });

    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        message: `UPI payment submitted for Order #${orderId.substring(0, 8).toUpperCase()}. UTR: ${utrNumber.trim()}. Please verify and approve.`
      }))
    });

    res.status(200).json({ 
      success: true, 
      message: 'UPI payment details submitted successfully. Our team will verify within 30 minutes.' 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * verifyUpiPayment — Admin manually verifies a UPI payment after checking the UTR in the bank
 */
const verifyUpiPayment = async (req, res, next) => {
  try {
    const { orderId, action, reason } = req.body; // action: 'APPROVE' | 'REJECT'
    const adminId = req.user.id;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'action must be APPROVE or REJECT' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, customer: { include: { user: true } } }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.payment || order.payment.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ error: 'No pending UPI payment to verify' });
    }

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { orderId },
          data: {
            status: 'SUCCESS',
            verifiedAt: new Date(),
            verifiedBy: adminId
          }
        });

        // Deduct inventory on manual UPI approval
        const orderItems = await tx.orderItem.findMany({ where: { orderId } });
        for (const item of orderItems) {
          await tx.inventory.updateMany({
            where: { productId: item.productId, quantity: { gte: item.quantity } },
            data: { quantity: { decrement: item.quantity } }
          });
        }

        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PROCESSING' }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            oldStatus: order.status,
            newStatus: 'PROCESSING',
            changedById: req.user?.id
          }
        });

        // Notify customer
        await tx.notification.create({
          data: {
            userId:  order.customer.userId,
            type:    'PAYMENT',
            message: `Your UPI payment for Order #${orderId.substring(0, 8).toUpperCase()} has been verified! Your order is now being processed.`
          }
        });
      });

      res.json({ success: true, message: 'UPI payment approved. Order moved to PROCESSING.' });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { orderId },
          data: {
            status: 'REJECTED',
            rejectionReason: reason || 'Payment could not be verified',
            verifiedAt: new Date(),
            verifiedBy: adminId
          }
        });

        // Notify customer
        await tx.notification.create({
          data: {
            userId:  order.customer.userId,
            type:    'PAYMENT',
            message: `Your UPI payment for Order #${orderId.substring(0, 8).toUpperCase()} could not be verified. Reason: ${reason || 'Payment not found'}. Please contact support or retry.`
          }
        });
      });

      res.json({ success: true, message: 'UPI payment rejected. Customer has been notified.' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * getPendingUpiOrders - Admin: get all orders with pending UPI verification
 */
const getPendingUpiOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        payment: {
          status: 'PENDING_VERIFICATION'
        }
      },
      include: {
        customer: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } }
          }
        },
        payment: {
          select: {
            id: true,
            utrNumber: true,
            upiVpa: true,
            amount: true,
            status: true,
            createdAt: true,
            paymentMethod: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // Oldest first — FIFO processing
    });

    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    next(error);
  }
};

/**
 * getRefunds - Admin: list all refunds with filtering by status
 * GET /api/orders/refunds
 */
const getRefunds = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        order: {
          include: {
            customer: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, phone: true } }
              }
            },
            payment: {
              select: { paymentMethod: true, razorpayPaymentId: true, amount: true, utrNumber: true, upiVpa: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: refunds, count: refunds.length });
  } catch (error) {
    next(error);
  }
};

const updateRefundStatus = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    const ALLOWED_STATUSES = ['PROCESSED', 'FAILED', 'MANUAL_PENDING'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const refund = await prisma.refund.findUnique({ 
      where: { id: refundId },
      include: {
        order: {
          include: {
            items: true,
            customer: { include: { user: true } }
          }
        }
      }
    });
    if (!refund) return res.status(404).json({ error: 'Refund not found' });

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update refund status
      const ref = await tx.refund.update({
        where: { id: refundId },
        data: {
          status,
          notes:       notes || refund.notes,
          processedBy: adminId,
          processedAt: status === 'PROCESSED' ? new Date() : refund.processedAt
        }
      });

      if (status === 'PROCESSED') {
        // 2. Update Order status to REFUNDED
        await tx.order.update({
          where: { id: refund.orderId },
          data: { status: 'REFUNDED' }
        });

        // 3. Log History
        await tx.orderStatusHistory.create({
          data: {
            orderId: refund.orderId,
            oldStatus: refund.order.status,
            newStatus: 'REFUNDED',
            note: notes || 'Refund approved and processed by admin',
            changedById: adminId
          }
        });

        // 4. Restore inventory stock
        for (const item of refund.order.items) {
          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: { quantity: { increment: item.quantity } }
          });

          // Create audit trail for stock restoration
          const inv = await tx.inventory.findFirst({ where: { productId: item.productId } });
          if (inv) {
            await tx.inventoryTransaction.create({
              data: {
                inventoryId: inv.id,
                type: 'IN',
                quantity: item.quantity,
                remarks: `Order #${refund.orderId.substring(0, 8).toUpperCase()} refunded — stock returned`,
                userId: adminId,
                createdBy: req.user?.email || 'System'
              }
            }).catch(() => {});
          }
        }

        // 5. Finance ledger debit entry (if not already created)
        const existingLedger = await tx.financeLedger.findFirst({
          where: { referenceId: refund.orderId, category: 'REFUND' }
        });

        if (!existingLedger) {
          await tx.financeLedger.create({
            data: {
              type:        'DEBIT',
              category:    'REFUND',
              amount:      refund.amount,
              description: `Refund processed for order #${refund.orderId.substring(0, 8).toUpperCase()}`,
              referenceId: refund.orderId,
              date:        new Date(),
              isAutomatic: true
            }
          });
        }

        // 6. Notify Customer of Approved Refund
        const customerNotif = await tx.notification.create({
          data: {
            userId:  refund.order.customer.userId,
            type:    'REFUND',
            message: `Your refund of ₹${refund.amount.toFixed(2)} for order #${refund.orderId.substring(0, 8).toUpperCase()} has been approved and processed.`
          }
        });

        // 7. Send email on Refund Approved (Important Event)
        if (refund.order.customer.user?.email) {
          sendOrderStatusUpdateEmail(
            refund.order.customer.user.email,
            refund.order.customer.user.firstName,
            refund.order.orderId || refund.orderId,
            'REFUNDED'
          ).catch(() => {});
        }

        return { ref, customerNotif };
      } else {
        // If refund failed/rejected
        const customerNotif = await tx.notification.create({
          data: {
            userId:  refund.order.customer.userId,
            type:    'REFUND',
            message: `Your refund request for order #${refund.orderId.substring(0, 8).toUpperCase()} was rejected/failed. Notes: ${notes || 'No reason provided'}.`
          }
        });

        return { ref, customerNotif };
      }
    });

    // Real-time socket emission
    if (req.io && updated.customerNotif) {
      req.io.to(updated.customerNotif.userId).emit('new_notification', { notification: updated.customerNotif });
    }

    res.json({ success: true, data: updated.ref, message: `Refund marked as ${status}` });
  } catch (error) {
    next(error);
  }
};

const requestRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
        refund: true,
        customer: { include: { user: true } },
        items: true
      }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // RBAC: customers can only request refund for their own orders
    if (role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId } });
      if (!customer || order.customerId !== customer.id) {
        return res.status(403).json({ error: 'You can only request refunds for your own orders' });
      }
    }

    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Refunds can only be requested for delivered orders' });
    }

    if (order.refund) {
      return res.status(400).json({ error: 'A refund request already exists for this order.' });
    }

    const paidAmount = order.payment?.status === 'SUCCESS' ? (order.payment.amount || order.total || 0) : 0;
    const payMethod = order.payment?.paymentMethod || 'UNKNOWN';
    const razorpayPaymentId = order.payment?.razorpayPaymentId || null;

    let refundMethod = 'MANUAL_BANK';
    if (razorpayPaymentId) refundMethod = 'RAZORPAY';
    else if (payMethod === 'UPI_QR') refundMethod = 'MANUAL_UPI';
    else if (payMethod === 'PAY_ON_DELIVERY') refundMethod = 'COD_REFUND';

    // Transaction to create refund request and update order status
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Refund Request
      const refund = await tx.refund.create({
        data: {
          orderId: id,
          amount: paidAmount,
          originalAmount: paidAmount,
          cancellationFee: 0,
          status: 'PENDING',
          reason: reason || 'Customer requested refund after delivery',
          paymentMethod: refundMethod,
          initiatedBy: userId
        }
      });

      // 2. Update Order status to REFUND_REQUESTED
      await tx.order.update({
        where: { id },
        data: { status: 'REFUND_REQUESTED' }
      });

      // 3. Log History
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          oldStatus: 'DELIVERED',
          newStatus: 'REFUND_REQUESTED',
          note: `Refund requested: ${reason || 'No reason provided'}`,
          changedById: userId
        }
      });

      // 4. Send notification to admin users (SUPER_ADMIN / OWNER)
      const admins = await tx.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'OWNER'] } },
        select: { id: true }
      });

      const createdNotifications = [];
      for (const admin of admins) {
        const notif = await tx.notification.create({
          data: {
            userId: admin.id,
            type: 'REFUND',
            message: `New refund request submitted for order #${id.substring(0, 8).toUpperCase()} (Amount: ₹${paidAmount.toFixed(2)}).`
          }
        });
        createdNotifications.push(notif);
      }

      return { refund, createdNotifications };
    });

    // Emit socket notifications outside transaction to avoid blocking/rollback issues
    if (req.io && result.createdNotifications) {
      result.createdNotifications.forEach(notif => {
        req.io.to(notif.userId).emit('new_notification', { notification: notif });
      });
    }

    res.status(200).json({ success: true, data: result.refund, message: 'Refund request submitted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  createOrder, verifyPayment, getOrders, getOrderById, 
  cancelOrder, verifyCodOrder, advanceOrderStatus, 
  submitUpiPayment, verifyUpiPayment, getPendingUpiOrders,
  getRefunds, updateRefundStatus, requestRefund
};


