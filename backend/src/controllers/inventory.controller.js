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
    
    // Check for uniqueness
    if (casNumber) {
      const existingCas = await prisma.product.findFirst({ where: { casNumber, deletedAt: null } });
      if (existingCas) return res.status(400).json({ error: 'A product with this CAS Number already exists.' });
    }
    const existingName = await prisma.product.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, deletedAt: null } });
    if (existingName) return res.status(400).json({ error: 'A product with this name already exists.' });

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

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, unit, price, quantity, categoryId, casNumber } = req.body;
    
    if (casNumber) {
      const existingCas = await prisma.product.findFirst({ where: { casNumber, id: { not: id }, deletedAt: null } });
      if (existingCas) return res.status(400).json({ error: 'A product with this CAS Number already exists.' });
    }
    const existingName = await prisma.product.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, id: { not: id }, deletedAt: null } });
    if (existingName) return res.status(400).json({ error: 'A product with this name already exists.' });

    let updateData = { 
      name, 
      description, 
      unit, 
      price: parseFloat(price), 
      categoryId: categoryId || null, 
      casNumber: casNumber || null 
    };

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
      updateData.imageUrl = uploadResult.secure_url;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { inventory: true }
    });

    if (quantity !== undefined && quantity !== null) {
      await prisma.inventory.update({
        where: { productId: id },
        data: { quantity: parseInt(quantity) }
      });
      updatedProduct.inventory.quantity = parseInt(quantity);
    }

    res.status(200).json({ success: true, data: updatedProduct });
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
