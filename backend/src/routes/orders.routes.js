const express = require('express');
const { createOrder, verifyPayment, getOrders, getOrderById, cancelOrder, verifyCodOrder, advanceOrderStatus } = require('../controllers/orders.controller');
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
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);
router.put('/:id/verify-cod', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), verifyCodOrder);

// Admin-only: advance order through the status pipeline
router.post('/:id/advance', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES']), advanceOrderStatus);

module.exports = router;
