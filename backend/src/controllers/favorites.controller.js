const prisma = require('../config/prisma');

exports.toggleFavorite = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id }
      });
      return res.status(200).json({ success: true, message: 'Removed from favorites', action: 'removed' });
    } else {
      const newFavorite = await prisma.favorite.create({
        data: {
          userId,
          productId
        }
      });
      return res.status(201).json({ success: true, message: 'Added to favorites', action: 'added', data: newFavorite });
    }
  } catch (error) {
    next(error);
  }
};

exports.getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            inventory: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: favorites });
  } catch (error) {
    next(error);
  }
};
