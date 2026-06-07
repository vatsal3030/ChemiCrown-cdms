const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'OWNER']));

router.get('/overview', financeController.getFinanceOverview);

module.exports = router;
