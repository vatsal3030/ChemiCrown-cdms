const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

router.use(requireAuth);

router.post('/toggle', favoritesController.toggleFavorite);
router.get('/', favoritesController.getFavorites);

module.exports = router;
