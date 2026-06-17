const prisma = require('../config/prisma');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } }
    });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    // Check duplicate (case-insensitive)
    const existing = await prisma.category.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), description: description?.trim() || null }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_CREATED',
        entity: 'Category',
        entityId: category.id,
        details: JSON.stringify({ name: category.name })
      }
    }).catch(() => {});

    res.status(201).json({ success: true, data: category, message: 'Category created' });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Check duplicate name (case-insensitive, exclude self)
    if (name && name.trim()) {
      const duplicate = await prisma.category.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' }, id: { not: id } }
      });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Another category with this name already exists' });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null })
      }
    });

    res.json({ success: true, data: updated, message: 'Category updated' });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } }
    });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    if (category._count.products > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${category._count.products} product(s) are using this category. Reassign them first.`
      });
    }

    await prisma.category.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_DELETED',
        entity: 'Category',
        entityId: id,
        details: JSON.stringify({ name: category.name })
      }
    }).catch(() => {});

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
