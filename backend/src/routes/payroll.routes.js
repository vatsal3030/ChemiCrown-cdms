const express = require('express');
const router = express.Router();
const pc = require('../controllers/payroll.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

router.use(requireAuth);

const adminOnly = requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']);
const allStaff  = requireRole(['MANAGER', 'SALES', 'INVENTORY_MANAGER', 'MARKETING', 'DIGITAL_MARKETING', 'SUPER_ADMIN', 'OWNER']);

// ── Employee self-service ─────────────────────────────────────────────────────
router.get('/my',          allStaff,  pc.getMyPayroll);
router.post('/:id/confirm', pc.confirmReceipt);  // legacy / MyAttendance
router.put('/:id/confirm',  pc.confirmReceipt);  // MyPayroll page


// ── Admin / HR ────────────────────────────────────────────────────────────────
router.get('/',                        adminOnly, pc.getAllSalaries);
router.post('/generate',               adminOnly, pc.generateMonthlyPayroll);
router.post('/bulk-pay',               adminOnly, pc.bulkPay);              // ← NEW: bulk pay all pending
router.delete('/month/:month',         adminOnly, pc.deleteMonthSlips);    // ← NEW: delete all pending for month

router.get('/:id',       allStaff, pc.getSlipById);   // ← NEW: get single slip
router.post('/:id/pay',  adminOnly, pc.markAsPaid);
router.put('/:id',       adminOnly, pc.updateSlip);    // ← NEW: edit slip
router.delete('/:id',    adminOnly, pc.deleteSlip);    // ← NEW: delete single slip

// PF Ledger
router.get('/pf/:employeeId',          adminOnly, pc.getPFLedger);
router.post('/pf/:employeeId/settle',  adminOnly, pc.settlePF);

module.exports = router;
