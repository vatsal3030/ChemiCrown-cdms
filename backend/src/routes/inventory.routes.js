const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const upload = require('../middlewares/upload.middleware');

router.get('/', inventoryController.getInventory);
router.post('/', upload.single('image'), inventoryController.addProduct);
router.delete('/:id', inventoryController.deleteProduct);

module.exports = router;
