const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/', categoryController.getCategories);

module.exports = router;
