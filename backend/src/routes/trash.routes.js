const express = require('express');
const router = express.Router();
const trashController = require('../controllers/trash.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']));

router.get('/', trashController.getDeletedItems);
router.post('/restore', trashController.restoreItem);

module.exports = router;
