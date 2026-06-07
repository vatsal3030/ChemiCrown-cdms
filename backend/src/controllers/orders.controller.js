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
    const { items, distanceKm, shippingAddress, orderNotes } = req.body; // array of { chemicalId, quantity }
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
          status: 'REQUESTED',
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

    // Create Order in Razorpay
    const options = {
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt: `rcpt_${order.id.substring(0, 8)}`
    };

    const rzpOrder = await razorpay.orders.create(options);

    res.status(201).json({
      message: 'Order created',
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
      // 1. Create Payment Record
      await prisma.payment.create({
        data: {
          orderId,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpaySignature: razorpay_signature,
          amount: 0, // In real app, fetch from order total
          status: 'SUCCESS'
        }
      });

      // 2. Update Order Status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' }
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
    const { search, sortField, sortOrder } = req.query;
    
    let where = {};
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
      if (customer) {
         where.customerId = customer.id;
      } else {
         return res.status(200).json({ success: true, data: [] });
      }
    }
    
    if (search) {
      where.id = { contains: search };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { [sortField || 'createdAt']: sortOrder || 'desc' },
      include: {
        items: true
      }
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
    const order = await prisma.order.findUnique({ 
      where: { id },
      include: { items: true }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'CANCELLED') return res.status(400).json({ error: 'Order is already cancelled' });
    if (order.status === 'DELIVERED') return res.status(400).json({ error: 'Delivered orders cannot be cancelled' });

    // Implement a 1% cancellation charge
    const cancellationFee = order.total * 0.01;
    const refundAmount = order.total - cancellationFee;

    await prisma.$transaction(async (tx) => {
      // Restore inventory
      for (const item of order.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } }
        });
      }

      await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });
    });

    res.status(200).json({ 
      success: true, 
      message: 'Order cancelled successfully', 
      cancellationFee,
      refundAmount 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getOrders, getOrderById, cancelOrder };
