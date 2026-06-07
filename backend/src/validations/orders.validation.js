const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      chemicalId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })).min(1, "Cart cannot be empty"),
    companyName: z.string().min(2, "Company name is required"),
    gstNumber: z.string().min(5, "Valid GST/Tax ID is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    email: z.string().email("Valid email is required"),
    shippingAddress: z.string().min(10, "Complete shipping address is required"),
    orderNotes: z.string().optional(),
    paymentMethod: z.enum(['bank_transfer', 'RAZORPAY', 'PAY_ON_DELIVERY', 'razorpay']).optional(),
    distanceKm: z.number().nonnegative().optional(),
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
