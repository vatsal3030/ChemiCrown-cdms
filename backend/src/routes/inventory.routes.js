const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const upload = require('../middlewares/upload.middleware');

const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

router.get('/', inventoryController.getInventory);
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER']), upload.single('image'), inventoryController.addProduct);
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER']), upload.single('image'), inventoryController.updateProduct);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER']), inventoryController.deleteProduct);

module.exports = router;
