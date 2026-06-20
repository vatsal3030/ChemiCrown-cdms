const prisma = require('../config/prisma');
const cloudinary = require('../config/cloudinary');
const stream = require('stream');
const { logAudit } = require('../services/audit.service');

// Get all lots with pagination and filtering
exports.getLots = async (req, res, next) => {
  try {
    const { 
      page = 1, limit = 20, 
      search = '', status, productId, supplierId, 
      sortField = 'createdAt', sortOrder = 'desc' 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (productId && productId !== 'all') where.productId = productId;
    if (supplierId && supplierId !== 'all') where.supplierId = supplierId;

    if (search) {
      where.OR = [
        { lotNumber: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [lots, total] = await Promise.all([
      prisma.lot.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
          supplier: { select: { id: true, name: true } },
          _count: { select: { transactions: true } }
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take
      }),
      prisma.lot.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: lots,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new Lot
exports.createLot = async (req, res, next) => {
  try {
    const { lotNumber, productId, mfgDate, expiryDate, status, supplierId, notes } = req.body;

    const existingLot = await prisma.lot.findUnique({ where: { lotNumber } });
    if (existingLot) {
      return res.status(400).json({ success: false, message: 'Lot number already exists' });
    }

    let coaUrl = null;
    if (req.file) {
      // Upload CoA to Cloudinary
      coaUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'chemicrown/lots/coa' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.Readable.from(req.file.buffer).pipe(uploadStream);
      });
    }

    const lot = await prisma.lot.create({
      data: {
        lotNumber,
        productId,
        mfgDate: mfgDate ? new Date(mfgDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: status || 'QUARANTINED',
        supplierId: supplierId || null,
        notes,
        coaUrl
      }
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'CREATED_LOT',
        entity: 'Lot',
        entityId: lot.id,
        details: { lotNumber: lot.lotNumber, status: lot.status }
      });
    }

    res.status(201).json({ success: true, data: lot });
  } catch (error) {
    next(error);
  }
};

// Update a Lot (e.g., status changes from QUARANTINED to APPROVED)
exports.updateLot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mfgDate, expiryDate, status, notes } = req.body;

    let coaUrl = undefined;
    if (req.file) {
      coaUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'chemicrown/lots/coa' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.Readable.from(req.file.buffer).pipe(uploadStream);
      });
    }

    const updateData = {};
    if (mfgDate) updateData.mfgDate = new Date(mfgDate);
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (coaUrl) updateData.coaUrl = coaUrl;

    const lot = await prisma.lot.update({
      where: { id },
      data: updateData
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'UPDATED_LOT',
        entity: 'Lot',
        entityId: lot.id,
        details: { updatedFields: Object.keys(updateData) }
      });
    }

    res.status(200).json({ success: true, data: lot });
  } catch (error) {
    next(error);
  }
};

// Get a single Lot by ID
exports.getLotById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lot = await prisma.lot.findUnique({
      where: { id },
      include: {
        product: true,
        supplier: true,
        transactions: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!lot) return res.status(404).json({ success: false, message: 'Lot not found' });

    res.status(200).json({ success: true, data: lot });
  } catch (error) {
    next(error);
  }
};
