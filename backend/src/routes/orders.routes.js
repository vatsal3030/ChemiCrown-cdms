const express = require('express');
const { 
  createOrder, verifyPayment, getOrders, getOrderById, 
  cancelOrder, verifyCodOrder, advanceOrderStatus, 
  submitUpiPayment, verifyUpiPayment, getPendingUpiOrders,
  getRefunds, updateRefundStatus, requestRefund
} = require('../controllers/orders.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const { createOrderSchema, verifyPaymentSchema } = require('../validations/orders.validation');

const router = express.Router();

router.use(requireAuth);
// Allow CUSTOMER, SALES, SUPER_ADMIN to interact with orders
router.use(requireRole(['CUSTOMER', 'SALES', 'SUPER_ADMIN', 'OWNER', 'MANAGER', 'MARKETING', 'INVENTORY_MANAGER']));

router.post('/', validateRequest(createOrderSchema), createOrder);
router.post('/verify', validateRequest(verifyPaymentSchema), verifyPayment);
router.get('/', getOrders);

// UPI Direct Payment routes (works without Razorpay activation)
router.get('/upi/pending', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), getPendingUpiOrders);
router.post('/upi/submit', submitUpiPayment);
router.post('/upi/verify', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), verifyUpiPayment);

// Refund management routes (OWNER + SUPER_ADMIN only)
router.get('/refunds',             requireRole(['SUPER_ADMIN', 'OWNER']), getRefunds);
router.put('/refunds/:refundId',   requireRole(['SUPER_ADMIN', 'OWNER']), updateRefundStatus);

// Per-order routes — must come AFTER static routes to avoid param collision
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/refund', requestRefund);
router.put('/:id/verify-cod', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), verifyCodOrder);
router.post('/:id/advance', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES']), advanceOrderStatus);

// Invoice generation — accessible by admin roles + customer who owns the order
const { generateInvoice } = require('../controllers/invoice.controller');
router.get('/:id/invoice', generateInvoice);

// Delivery challan — admin/sales only (transport document)
const { generateDeliveryChallan } = require('../controllers/challan.controller');
router.get('/:id/challan', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES']), generateDeliveryChallan);

module.exports = router;

