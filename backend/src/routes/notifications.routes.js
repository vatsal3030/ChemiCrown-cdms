const express = require('express');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification, createTestNotification } = require('../controllers/notifications.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
router.post('/test', createTestNotification);

module.exports = router;
