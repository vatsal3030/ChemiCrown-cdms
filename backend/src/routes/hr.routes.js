const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hr.controller');

router.get('/', hrController.getEmployees);
router.post('/:id/salary', hrController.updateSalary);
router.delete('/:id', hrController.deleteEmployee);

module.exports = router;
