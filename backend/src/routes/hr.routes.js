const express = require('express');
const router = express.Router();
const hc = require('../controllers/hr.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const hrAccess = requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']);

router.use(requireAuth);

// Employee self-service (any authenticated user)
router.get('/me', hc.getMyPayroll);

// HR admin access required for everything below
router.use(hrAccess);

// Employee CRUD
router.get('/',       hc.getEmployees);
router.post('/',      hc.addEmployee);
router.put('/:id',    hc.updateEmployee);
router.delete('/:id', hc.deleteEmployee);

// Salary & Payroll
router.get('/:id/salary',         hc.getSalaries);
router.post('/:id/salary',        hc.updateSalary);
router.put('/:id/salary-config',  hc.updateSalaryConfig);   // ← NEW: set base salary / PF rate

// Attendance — READ: all HR roles, WRITE: SUPER_ADMIN only (Bug 5 fix)
router.post('/:id/attendance', requireRole(['SUPER_ADMIN']), hc.markAttendance);
router.get('/:id/attendance',  hc.getAttendance);

// ── Disciplinary Actions — SUPER_ADMIN only for write operations ──────────────
router.post('/:id/warnings',               requireRole(['SUPER_ADMIN']), hc.issueWarning);
router.get('/:id/warnings',                hc.getWarnings);               // readable by all HR roles
router.delete('/:id/warnings/:warnId',     requireRole(['SUPER_ADMIN']), hc.deleteWarning);

router.post('/:id/terminate',  hc.terminateEmployee);   // ← NEW
router.post('/:id/suspend',    hc.suspendEmployee);     // ← NEW
router.post('/:id/reinstate',  hc.reinstateEmployee);   // ← NEW

// Legacy warning notification (kept for backward compat)
router.post('/:id/warning', hc.sendWarning);

// Bank & UPI details for salary transfers
router.put('/:id/bank-details', hc.updateBankDetails);

// Assign sales representative to a customer
router.put('/customers/:customerId/assign-sales', hc.assignSalesRep);

module.exports = router;
