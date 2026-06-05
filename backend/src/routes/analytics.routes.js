const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/dashboard', requireAuth, analyticsController.getDashboardStats);

module.exports = router;
