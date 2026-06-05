const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    chemicalId: z.string().uuid(),
    quantity: z.number().int().positive(),
  }),
  query: z.any(),
  params: z.any(),
});

const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    orderId: z.string().uuid()
  }),
  query: z.any(),
  params: z.any(),
});

module.exports = { createOrderSchema, verifyPaymentSchema };
