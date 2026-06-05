const prisma = require('../config/prisma');
const cloudinary = require('../config/cloudinary');
const stream = require('stream');

// Get all inventory with sorting, filtering, and searching
exports.getInventory = async (req, res, next) => {
  try {
    const { search, sortField = 'name', sortOrder = 'asc', categoryId, page = 1, limit = 10 } = req.query;

    const where = {
      deletedAt: null // Soft delete check
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { casNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          inventory: true
        },
        orderBy: {
          [sortField]: sortOrder
        },
        skip,
        take
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.status(200).json({ 
      success: true, 
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add new product
exports.addProduct = async (req, res, next) => {
  try {
    const { name, description, unit, price, quantity, categoryId, casNumber } = req.body;
    
    // Handle Cloudinary upload if file exists
    let imageUrl = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'chemicrown/inventory' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.Readable.from(req.file.buffer).pipe(uploadStream);
      });
      imageUrl = uploadResult.secure_url;
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        unit,
        price: parseFloat(price),
        categoryId,
        casNumber,
        imageUrl,
        inventory: {
          create: {
            quantity: parseInt(quantity) || 0,
            minThreshold: 10
          }
        }
      },
      include: { inventory: true }
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    next(error);
  }
};

// Soft delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
