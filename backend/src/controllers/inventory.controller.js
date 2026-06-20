const prisma = require('../config/prisma');
const cloudinary = require('../config/cloudinary');
const stream = require('stream');
const { logAudit } = require('../services/audit.service');

// Get all inventory with sorting, filtering, and searching
exports.getInventory = async (req, res, next) => {
  try {
    const {
      search, sortField = 'name', sortOrder = 'asc',
      categoryId, stockStatus, isAvailable,
      grade, minPrice, maxPrice, inStockOnly, hazard,
      page = 1, limit = 10
    } = req.query;

    // Guard against NaN / invalid page values from frontend
    const safePage  = Math.max(1, isNaN(parseInt(page))  ? 1 : parseInt(page));
    const safeLimit = Math.max(1, isNaN(parseInt(limit)) ? 10 : parseInt(limit));

    const where = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { casNumber: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId && categoryId !== 'all') where.categoryId = categoryId;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';

    // Grade filter — e.g. "AR", "LR", "Technical"
    if (grade && grade !== 'all') {
      where.grade = { equals: grade, mode: 'insensitive' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Hazard filter: products that have a UN number (are hazardous)
    if (hazard === 'hazardous') {
      where.unNumber = { not: null };
    } else if (hazard === 'non-hazardous') {
      where.unNumber = null;
    }

    // In stock filter
    if (inStockOnly === 'true' || stockStatus === 'in') {
      where.inventory = { quantity: { gt: 0 } };
    } else if (stockStatus === 'out') {
      where.inventory = { quantity: { lte: 0 } };
    } else if (stockStatus === 'low') {
      const lowStockInventories = await prisma.inventory.findMany({
        select: { productId: true, quantity: true, minThreshold: true }
      });
      const lowStockIds = lowStockInventories
        .filter(inv => inv.quantity <= inv.minThreshold)
        .map(inv => inv.productId);
      where.id = { in: lowStockIds };
    }

    const take = safeLimit;
    const skip = (safePage - 1) * take;

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          inventory: true,
          reviews: { select: { rating: true } }
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take
      }),
      prisma.product.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: safePage,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all product categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } }
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// Add new product
exports.addProduct = async (req, res, next) => {
  try {
    const { name, description, unit, packageSize, baseUnit, price, costPrice, hsnCode, gstRate, quantity, categoryId, casNumber, unNumber, hazardClasses, packingGroup, sdsUrl, sku, supplierId, safetyNotes, storageInstructions, mfgDate, expiryDate, minThreshold, isAvailable, brand, manufacturer, itemForm, purity, grade } = req.body;
    
    if (parseFloat(price) < 0) return res.status(400).json({ error: 'Price cannot be negative.' });
    if (parseInt(quantity) < 0) return res.status(400).json({ error: 'Quantity cannot be negative.' });
    
    // Check for uniqueness
    if (sku) {
      const existingSku = await prisma.product.findFirst({ where: { sku, deletedAt: null } });
      if (existingSku) return res.status(400).json({ error: 'A product with this SKU already exists.' });
    }
    const existingName = await prisma.product.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, deletedAt: null } });
    if (existingName) return res.status(400).json({ error: 'A product with this name already exists.' });

    // Handle Cloudinary upload if multiple files exist
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'chemicrown/inventory' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.Readable.from(file.buffer).pipe(uploadStream);
        });
      });
      imageUrls = await Promise.all(uploadPromises);
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        unit,
        packageSize: packageSize ? parseFloat(packageSize) : null,
        baseUnit,
        price: parseFloat(price),
        categoryId: categoryId || null,
        casNumber,
        unNumber,
        hazardClasses: hazardClasses ? JSON.parse(hazardClasses) : [],
        packingGroup,
        sdsUrl,
        sku,
        supplierId: supplierId || null,
        safetyNotes,
        storageInstructions,
        mfgDate: mfgDate ? new Date(mfgDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isAvailable: isAvailable !== undefined ? String(isAvailable) === 'true' : true,
        brand,
        manufacturer,
        itemForm,
        purity,
        grade,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        hsnCode: hsnCode || null,
        gstRate: gstRate ? parseFloat(gstRate) : null,
        imageUrls,
        inventory: {
          create: {
            quantity: parseInt(quantity) || 0,
            minThreshold: minThreshold ? parseInt(minThreshold) : 10
          }
        }
      },
      include: { inventory: true }
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'CREATED_PRODUCT',
        entity: 'Product',
        entityId: newProduct.id,
        details: { name: newProduct.name, sku: newProduct.sku }
      });
    }

    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    next(error);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, unit, packageSize, baseUnit, price, costPrice, hsnCode, gstRate, quantity, categoryId, casNumber, unNumber, hazardClasses, packingGroup, sdsUrl, sku, supplierId, safetyNotes, storageInstructions, mfgDate, expiryDate, minThreshold, isAvailable, brand, manufacturer, itemForm, purity, grade } = req.body;
    
    if (price !== undefined && parseFloat(price) < 0) return res.status(400).json({ error: 'Price cannot be negative.' });
    if (quantity !== undefined && parseInt(quantity) < 0) return res.status(400).json({ error: 'Quantity cannot be negative.' });
    
    const existingName = await prisma.product.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, id: { not: id }, deletedAt: null } });
    if (existingName) return res.status(400).json({ error: 'A product with this name already exists.' });

    if (sku) {
      const existingSku = await prisma.product.findFirst({ where: { sku, id: { not: id }, deletedAt: null } });
      if (existingSku) return res.status(400).json({ error: 'A product with this SKU already exists.' });
    }

    let updateData = { 
      name, 
      description, 
      unit, 
      packageSize: packageSize ? parseFloat(packageSize) : null,
      baseUnit,
      price: price !== undefined ? parseFloat(price) : undefined, 
      categoryId: categoryId || null, 
      casNumber: casNumber || null,
      unNumber: unNumber || null,
      hazardClasses: hazardClasses ? JSON.parse(hazardClasses) : undefined,
      packingGroup: packingGroup || null,
      sdsUrl: sdsUrl || null,
      sku: sku || null,
      supplierId: supplierId || null,
      safetyNotes,
      storageInstructions,
      mfgDate: mfgDate ? new Date(mfgDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      brand,
      manufacturer,
      itemForm,
      purity,
      grade,
      costPrice: costPrice !== undefined ? (costPrice ? parseFloat(costPrice) : null) : undefined,
      hsnCode: hsnCode !== undefined ? (hsnCode || null) : undefined,
      gstRate: gstRate !== undefined ? (gstRate ? parseFloat(gstRate) : null) : undefined,
    };
    
    if (isAvailable !== undefined) {
      updateData.isAvailable = String(isAvailable) === 'true';
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'chemicrown/inventory' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.Readable.from(file.buffer).pipe(uploadStream);
        });
      });
      updateData.imageUrls = await Promise.all(uploadPromises);
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
    
    if (minThreshold !== undefined && minThreshold !== null) {
      await prisma.inventory.update({
        where: { productId: id },
        data: { minThreshold: parseInt(minThreshold) }
      });
      updatedProduct.inventory.minThreshold = parseInt(minThreshold);
    }

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'UPDATED_PRODUCT',
        entity: 'Product',
        entityId: updatedProduct.id,
        details: { updatedFields: Object.keys(updateData) }
      });
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

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'DELETED_PRODUCT',
        entity: 'Product',
        entityId: id,
      });
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get unique units
exports.getUniqueUnits = async (req, res, next) => {
  try {
    const units = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { unit: true },
      distinct: ['unit'],
    });
    const unitList = units.map(u => u.unit).filter(Boolean);
    res.status(200).json({ success: true, data: unitList });
  } catch (error) {
    next(error);
  }
};

// Add or Remove stock (Inventory Transaction IN/OUT)
exports.addStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { addedQuantity, supplierId, remarks } = req.body;
    const qtyChange = parseInt(addedQuantity);
    
    if (isNaN(qtyChange) || qtyChange === 0) {
      return res.status(400).json({ error: 'Quantity must be a non-zero integer' });
    }

    const inventory = await prisma.inventory.findUnique({ where: { productId: id } });
    if (!inventory) return res.status(404).json({ error: 'Inventory record not found' });

    if (inventory.quantity + qtyChange < 0) {
      return res.status(400).json({ error: 'Cannot reduce stock below 0' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create transaction
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: qtyChange > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(qtyChange),
          supplierId,
          remarks,
          userId: req.user ? req.user.id : null,
          createdBy: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'System'
        }
      });
      
      // 2. Adjust stock
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: { increment: qtyChange } }
      });

      // 3. Update Product mfg/expiry if provided
      if (req.body.mfgDate || req.body.expiryDate) {
        let updateData = {};
        if (req.body.mfgDate) updateData.mfgDate = new Date(req.body.mfgDate);
        if (req.body.expiryDate) updateData.expiryDate = new Date(req.body.expiryDate);
        
        await tx.product.update({
          where: { id },
          data: updateData
        });
      }
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'ADJUSTED_STOCK',
        entity: 'Inventory',
        entityId: inventory.id,
        details: { change: qtyChange, type: qtyChange > 0 ? 'IN' : 'OUT' }
      });
    }

    res.status(200).json({ success: true, message: 'Stock added successfully' });
  } catch (error) {
    next(error);
  }
};

// Get single product
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        inventory: true,
        reviews: {
          include: {
            customer: {
              select: {
                companyName: true,
                user: { select: { firstName: true, lastName: true, profileImageUrl: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// Get product inventory transactions
exports.getProductTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const inventory = await prisma.inventory.findUnique({
      where: { productId: id }
    });
    
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });

    const transactions = await prisma.inventoryTransaction.findMany({
      where: { inventoryId: inventory.id },
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        user: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

// Get all inventory transactions
exports.getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', type = 'all', sortOrder = 'desc', startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (type !== 'all') {
      where.type = type.toUpperCase();
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    if (search) {
      where.OR = [
        { inventory: { product: { name: { contains: search, mode: 'insensitive' } } } },
        { inventory: { product: { sku: { contains: search, mode: 'insensitive' } } } },
        { remarks: { contains: search, mode: 'insensitive' } },
        { createdBy: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        orderBy: { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { 
          supplier: true,
          user: { select: { id: true, firstName: true, lastName: true, employeeProfile: { select: { id: true } } } },
          inventory: {
            include: { product: { select: { id: true, name: true, sku: true, unit: true } } }
          }
        }
      }),
      prisma.inventoryTransaction.count({ where })
    ]);

    res.status(200).json({ 
      success: true, 
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single inventory transaction
exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.inventoryTransaction.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, employeeProfile: { select: { id: true } } } },
        inventory: {
          include: { product: true }
        }
      }
    });

    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};
