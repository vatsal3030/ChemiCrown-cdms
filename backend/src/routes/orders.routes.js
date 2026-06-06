const express = require('express');
const { createOrder, verifyPayment, getOrders, getOrderById, cancelOrder } = require('../controllers/orders.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const { createOrderSchema, verifyPaymentSchema } = require('../validations/orders.validation');

const router = express.Router();

router.use(requireAuth);
// Allow CUSTOMER, SALES, SUPER_ADMIN to interact with orders
router.use(requireRole(['CUSTOMER', 'SALES', 'SUPER_ADMIN']));

router.post('/', validateRequest(createOrderSchema), createOrder);
router.post('/verify', validateRequest(verifyPaymentSchema), verifyPayment);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

module.exports = router;
