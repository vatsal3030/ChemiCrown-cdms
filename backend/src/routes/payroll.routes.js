const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

router.use(requireAuth);

// Admin routes — OWNER, SUPER_ADMIN, MANAGER (HR)
const adminOnly = requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']);

router.get('/', adminOnly, payrollController.getAllSalaries);
router.post('/generate', adminOnly, payrollController.generateMonthlyPayroll);
router.post('/:id/pay', adminOnly, payrollController.markAsPaid);
router.get('/pf/:employeeId', adminOnly, payrollController.getPFLedger);
router.post('/pf/:employeeId/settle', adminOnly, payrollController.settlePF);

// Employee self-service
router.get('/my', requireRole(['MANAGER', 'SALES', 'INVENTORY_MANAGER', 'MARKETING', 'DIGITAL_MARKETING', 'SUPER_ADMIN', 'OWNER']), payrollController.getMyPayroll);

module.exports = router;
