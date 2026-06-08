const express = require('express');
const { getIncentives, calculateIncentive, createIncentive, approveIncentive, deleteIncentive } = require('../controllers/incentive.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const router = express.Router();
router.use(requireAuth);

// View incentives (filtered by role)
router.get('/', getIncentives);

// Auto-calculate from orders — SUPER_ADMIN only
router.post('/calculate', requireRole(['SUPER_ADMIN']), calculateIncentive);

// Manual incentive entry — SUPER_ADMIN only
router.post('/', requireRole(['SUPER_ADMIN']), createIncentive);

// Approve / Reject — SUPER_ADMIN only
router.put('/:id/approve', requireRole(['SUPER_ADMIN']), approveIncentive);

// Delete — SUPER_ADMIN only
router.delete('/:id', requireRole(['SUPER_ADMIN']), deleteIncentive);

module.exports = router;
