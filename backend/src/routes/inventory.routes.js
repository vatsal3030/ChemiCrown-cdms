const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const upload = require('../middlewares/upload.middleware');

const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

router.get('/', inventoryController.getInventory);
router.get('/logs/all', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER']), inventoryController.getAllTransactions);
router.get('/units/unique', inventoryController.getUniqueUnits);
router.get('/:id', inventoryController.getProductById);
router.get('/:id/logs', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER']), inventoryController.getProductTransactions);
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), upload.array('images', 5), inventoryController.addProduct);
router.post('/:id/stock', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER']), inventoryController.addStock);
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), upload.array('images', 5), inventoryController.updateProduct);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), inventoryController.deleteProduct);

module.exports = router;
