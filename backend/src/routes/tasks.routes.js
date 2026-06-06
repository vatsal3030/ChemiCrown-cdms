const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.get('/', tasksController.getTasks);
router.post('/', tasksController.createTask);
router.patch('/:id/status', tasksController.updateTaskStatus);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;
