const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/prisma');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

const processedRequests = new Map();

const createOrder = async (req, res, next) => {
  try {
    const { items, distanceKm, shippingAddress, orderNotes, paymentMethod } = req.body; // array of { chemicalId, quantity }
    const userId = req.user.id;

    const idempotencyKey = `${userId}-${JSON.stringify(items)}`;
    if (processedRequests.has(idempotencyKey)) {
      return res.status(409).json({ error: 'Duplicate order detected. Please wait before placing the same order again.' });
    }
    processedRequests.set(idempotencyKey, true);
    setTimeout(() => processedRequests.delete(idempotencyKey), 5000);

    let customer = await prisma.customer.findUnique({ where: { userId } });
    
    // Auto-create customer profile if missing (helps smoothly onboard legacy users or fast-registrations)
    if (!customer) {
      if (req.user.role === 'CUSTOMER') {
        customer = await prisma.customer.create({
          data: {
            userId,
            companyName: req.body.companyName || 'Retail Customer',
            isVerified: true // Set to true to allow immediate ordering
          }
        });
      } else {
        return res.status(403).json({ error: 'Customer profile required.' });
      }
    }
    if (!customer.isVerified) {
      return res.status(403).json({ error: 'Your account is pending admin verification. You cannot place orders yet.' });
    }

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const { order, totalAmount } = await prisma.$transaction(async (tx) => {
      let calcTotal = 0;
      const orderItemsData = [];

      for (const item of items) {
        if (item.quantity <= 0) throw new Error(`Invalid quantity for product ${item.chemicalId}`);

        const product = await tx.product.findUnique({ 
          where: { id: item.chemicalId },
          include: { inventory: true }
        });

        if (!product) throw new Error(`Product not found: ${item.chemicalId}`);
        if (!product.inventory || product.inventory.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.inventory?.quantity || 0}`);
        }

        // Deduct inventory atomically to prevent race condition
        const updateRes = await tx.inventory.updateMany({
          where: { productId: product.id, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } }
        });

        if (updateRes.count === 0) {
          throw new Error(`Insufficient stock for ${product.name} during checkout race condition.`);
        }

        const itemTotal = product.price * item.quantity;
        calcTotal += itemTotal;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price
        });
      }

      const distanceCost = Number(((distanceKm || 0) * 10).toFixed(2));
      const hazardousShippingCost = calcTotal > 0 ? 2500 : 0;
      const taxAmount = Number((calcTotal * 0.18).toFixed(2));
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

      const rzpOrder = await razorpay.orders.create(options);

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
      next(error);
    }
  };

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // 1. Update Payment Record
      await prisma.payment.update({
        where: { orderId },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'SUCCESS'
        }
      });

      // 2. Update Order Status to PROCESSING after payment confirmation
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' }
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

    // Scope to customer if role is CUSTOMER
    if (req.user.role === 'CUSTOMER') {
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

    // Search filter (by order ID prefix)
    if (search) {
      where.id = { contains: search, mode: 'insensitive' };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { [sortField || 'createdAt']: sortOrder || 'desc' },
      include: { items: true }
    });

    const formatted = orders.map(o => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      total: o.total || o.items.reduce((acc, item) => acc + (item.quantity * item.price), 0)
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
        }
      }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.status(200).json({ success: true, data: order });
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
      // 1. Restore inventory stock for each cancelled item
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } }
        });
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
          newStatus: 'CANCELLED'
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
      include: { payment: true }
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

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'PROCESSING' }
    });

    res.status(200).json({ message: 'Pay on Delivery order verified successfully', order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// Status advancement pipeline — only admins
const STATUS_PIPELINE = ['REQUESTED', 'PENDING', 'PROCESSING', 'PACKAGED', 'DISPATCHED', 'DELIVERED'];

const advanceOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

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
          newStatus: nextStatus
        }
      });

      // Notify customer
      await tx.notification.create({
        data: {
          userId:  order.customer.userId,
          type:    'ORDER',
          message: `Your order #${id.substring(0, 8).toUpperCase()} status updated: ${order.status} → ${nextStatus}${note ? '. Note: ' + note : ''}`
        }
      });

      return tx.order.update({
        where: { id },
        data: {
          status: nextStatus,
          updatedBy: req.user.id
        }
      });
    });

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

    res.json({ success: true, message: `Order advanced to ${nextStatus}`, data: updated });
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

        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PROCESSING' }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            oldStatus: order.status,
            newStatus: 'PROCESSING'
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

/**
 * updateRefundStatus - Admin: mark a refund as PROCESSED (for manual transfers)
 * PUT /api/orders/refunds/:refundId
 */
const updateRefundStatus = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    const ALLOWED_STATUSES = ['PROCESSED', 'FAILED', 'MANUAL_PENDING'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const refund = await prisma.refund.findUnique({ where: { id: refundId } });
    if (!refund) return res.status(404).json({ error: 'Refund not found' });

    const updated = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status,
        notes:       notes || refund.notes,
        processedBy: adminId,
        processedAt: status === 'PROCESSED' ? new Date() : refund.processedAt
      }
    });

    // If marking as processed, notify customer
    if (status === 'PROCESSED') {
      const order = await prisma.order.findUnique({
        where: { id: refund.orderId },
        include: { customer: true }
      });
      if (order) {
        await prisma.notification.create({
          data: {
            userId:  order.customer.userId,
            type:    'REFUND',
            message: `Your refund of ₹${refund.amount.toFixed(2)} for order #${refund.orderId.substring(0, 8).toUpperCase()} has been processed successfully.`
          }
        }).catch(() => {});
      }
    }

    res.json({ success: true, data: updated, message: `Refund marked as ${status}` });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  createOrder, verifyPayment, getOrders, getOrderById, 
  cancelOrder, verifyCodOrder, advanceOrderStatus, 
  submitUpiPayment, verifyUpiPayment, getPendingUpiOrders,
  getRefunds, updateRefundStatus
};

