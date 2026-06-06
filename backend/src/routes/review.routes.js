const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.post('/', requireAuth, reviewController.addReview);
router.get('/:productId', reviewController.getProductReviews);

module.exports = router;
