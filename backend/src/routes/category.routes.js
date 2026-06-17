const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

// Public: anyone can list categories (used on catalog page)
router.get('/', categoryController.getCategories);

// Admin CRUD
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), categoryController.createCategory);
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']), categoryController.updateCategory);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER']), categoryController.deleteCategory);

module.exports = router;
