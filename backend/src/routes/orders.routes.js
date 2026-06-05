const express = require('express');
const { createOrder, verifyPayment, getOrders } = require('../controllers/orders.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const { createOrderSchema, verifyPaymentSchema } = require('../validations/orders.validation');

const router = express.Router();

router.use(requireAuth);
// Allow CUSTOMER, SALES, SUPER_ADMIN to interact with orders
router.use(requireRole(['CUSTOMER', 'SALES', 'SUPER_ADMIN']));

router.get('/', getOrders);
router.post('/create', validateRequest(createOrderSchema), createOrder);
router.post('/verify-payment', validateRequest(verifyPaymentSchema), verifyPayment);

module.exports = router;
