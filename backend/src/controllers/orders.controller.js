const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/prisma');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

const createOrder = async (req, res, next) => {
  try {
    const { chemicalId, quantity } = req.body;
    const customerId = req.user.id;

    // Check if customer is verified
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (customer && !customer.isVerified) {
      return res.status(403).json({ error: 'Your account is pending admin verification. You cannot place orders yet.' });
    }

    // Mock unit price logic (Assuming 500 INR per unit)
    const unitPrice = 500;
    const totalAmount = unitPrice * quantity;

    // Create Order in Database
    const dbOrder = await prisma.order.create({
      data: {
        customerId,
        status: 'PENDING',
        total: totalAmount,
        items: {
          create: {
            productId: chemicalId,
            quantity,
            price: unitPrice
          }
        }
      }
    });

    // Create Order in Razorpay
    const options = {
      amount: totalAmount * 100, // paise
      currency: "INR",
      receipt: `receipt_order_${dbOrder.id}`
    };

    const rzpOrder = await razorpay.orders.create(options);

    res.status(201).json({
      message: 'Order created',
      orderId: dbOrder.id,
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

module.exports = { createOrder, verifyPayment, getOrders };
