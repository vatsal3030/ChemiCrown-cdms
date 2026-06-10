const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { requireAuthStrict } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

router.use(requireAuthStrict);

// Support Tickets
router.post('/', supportController.createTicket);
router.get('/', supportController.getTickets);
router.put('/:id/resolve', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), supportController.resolveTicket);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'OWNER']), supportController.deleteTicket);

// Audit Logs — Read-only for all admins, delete for SUPER_ADMIN/OWNER only (industry standard: immutable by default)
router.get('/audit-logs', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), supportController.getAuditLogs);
router.get('/audit-logs/:id', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), supportController.getAuditLogById);
router.delete('/audit-logs/:id', requireRole(['SUPER_ADMIN', 'OWNER']), supportController.deleteAuditLog);

module.exports = router;
