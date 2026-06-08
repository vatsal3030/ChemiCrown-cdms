const express = require('express');
const { getOvertime, createOvertime, approveOvertime, deleteOvertime } = require('../controllers/overtime.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const router = express.Router();
router.use(requireAuth);

// All employees and admins can view (filtered by role in controller)
router.get('/', getOvertime);

// Manager/Owner/Admin logs overtime for an employee
router.post('/', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), createOvertime);

// Manager approves / rejects
router.put('/:id/approve', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), approveOvertime);

// Delete PENDING record
router.delete('/:id', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), deleteOvertime);

module.exports = router;
