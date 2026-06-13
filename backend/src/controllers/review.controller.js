const prisma = require('../config/prisma');

// Add or update a review (upsert: one editable review per product per customer)
exports.addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Find the customer profile
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) {
      return res.status(403).json({ success: false, message: 'Only registered customers can leave reviews' });
    }

    // Verify the customer has a DELIVERED order for this product
    const validOrder = await prisma.order.findFirst({
      where: {
        customerId: customer.id,
        status: 'DELIVERED',
        items: { some: { productId } }
      }
    });

    if (!validOrder) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products after they have been delivered to you.'
      });
    }

    // Check if review already exists — if yes, UPDATE it (edit mode)
    const existingReview = await prisma.review.findFirst({
      where: { customerId: customer.id, productId }
    });

    let review;
    let isEdit = false;

    if (existingReview) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: { rating: parseInt(rating), comment: comment || null }
      });
      isEdit = true;
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          rating: parseInt(rating),
          comment: comment || null,
          productId,
          customerId: customer.id
        }
      });
    }

    res.status(isEdit ? 200 : 201).json({
      success: true,
      data: review,
      message: isEdit ? 'Review updated successfully' : 'Review added successfully',
      isEdit
    });
  } catch (error) {
    next(error);
  }
};


// Get reviews for a product
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        customer: {
          select: {
            companyName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average
    const avg = reviews.length > 0 
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
      : 0;

    res.status(200).json({ 
      success: true, 
      data: reviews,
      summary: {
        averageRating: avg.toFixed(1),
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    next(error);
  }
};
exports.getMyReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) return res.status(200).json({ review: null });

    const review = await prisma.review.findFirst({
      where: { customerId: customer.id, productId }
    });

    res.status(200).json({ review });
  } catch (error) {
    next(error);
  }
};
