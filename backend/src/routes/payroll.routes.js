const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const hrAccess = requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']);

router.use(requireAuth);

// Employee self-service
router.get('/my', payrollController.getMyPayroll);

// Admin/HR access
router.get('/', hrAccess, payrollController.getAllSalaries);
router.post('/generate', hrAccess, payrollController.generateMonthlyPayroll);
router.post('/:id/pay', hrAccess, payrollController.markAsPaid);
router.get('/pf/:employeeId', hrAccess, payrollController.getPFLedger);
router.post('/pf/:employeeId/settle', hrAccess, payrollController.settlePF);

module.exports = router;
