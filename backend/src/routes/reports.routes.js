const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const reportsController = require('../controllers/reports.controller');

router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), reportsController.getAnalyticsReports);

module.exports = router;
