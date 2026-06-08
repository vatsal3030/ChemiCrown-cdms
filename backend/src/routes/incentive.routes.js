const express = require('express');
const { getIncentives, calculateIncentive, createIncentive, approveIncentive, deleteIncentive } = require('../controllers/incentive.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const router = express.Router();
router.use(requireAuth);

// View incentives (filtered by role)
router.get('/', getIncentives);

// Auto-calculate from orders (Sales role)
router.post('/calculate', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), calculateIncentive);

// Manual incentive entry (Marketing/other)
router.post('/', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), createIncentive);

// Approve / Reject
router.put('/:id/approve', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), approveIncentive);

// Delete
router.delete('/:id', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), deleteIncentive);

module.exports = router;
