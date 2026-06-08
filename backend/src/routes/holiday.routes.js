const express = require('express');
const { getHolidays, addHoliday, deleteHoliday, seedHolidays } = require('../controllers/holiday.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

const router = express.Router();
router.use(requireAuth);

// All authenticated users can view holidays (used in HR calendar)
router.get('/', getHolidays);

// Admin-only: seed, add, delete
router.post('/seed', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), seedHolidays);
router.post('/', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), addHoliday);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), deleteHoliday);

module.exports = router;
