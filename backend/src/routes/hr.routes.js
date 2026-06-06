const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hr.controller');

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
