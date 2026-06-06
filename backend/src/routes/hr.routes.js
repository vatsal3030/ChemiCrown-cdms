const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hr.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const hrAccess = requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR']);

router.use(requireAuth);
router.use(hrAccess);

router.get('/', hrController.getEmployees);
router.post('/', hrController.addEmployee);
router.put('/:id', hrController.updateEmployee);
router.delete('/:id', hrController.deleteEmployee);

router.post('/:id/salary', hrController.updateSalary);
router.get('/:id/salary', hrController.getSalaries);

router.post('/:id/attendance', hrController.markAttendance);
router.get('/:id/attendance', hrController.getAttendance);

router.post('/:id/warning', hrController.sendWarning);

module.exports = router;
