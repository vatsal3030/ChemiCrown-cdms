const express = require('express');
const { getOvertime, createOvertime, approveOvertime, deleteOvertime } = require('../controllers/overtime.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const router = express.Router();
router.use(requireAuth);

// All employees and admins can view (filtered by role in controller)
router.get('/', getOvertime);

// Manager/Owner/Admin logs overtime for an employee — SUPER_ADMIN only
router.post('/', requireRole(['SUPER_ADMIN']), createOvertime);

// Only SUPER_ADMIN can approve / reject overtime
router.put('/:id/approve', requireRole(['SUPER_ADMIN']), approveOvertime);

// Delete PENDING record — SUPER_ADMIN only
router.delete('/:id', requireRole(['SUPER_ADMIN']), deleteOvertime);

module.exports = router;
