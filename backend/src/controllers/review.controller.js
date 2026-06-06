const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add a review
exports.addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Find the customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId }
    });

    if (!customer) {
      return res.status(403).json({ success: false, message: 'Only registered customers can leave reviews' });
    }

    // Verify if customer has a DELIVERED order for this product
    const validOrder = await prisma.order.findFirst({
      where: {
        customerId: customer.id,
        status: 'DELIVERED',
        items: {
          some: {
            productId: productId
          }
        }
      }
    });

    if (!validOrder) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only review products after they have been successfully delivered to you.' 
      });
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        customerId: customer.id,
        productId: productId
      }
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        productId,
        customerId: customer.id
      }
    });

    res.status(201).json({ success: true, data: review, message: 'Review added successfully' });
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
