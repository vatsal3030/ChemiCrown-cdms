const prisma = require('../config/prisma');

exports.getDeletedItems = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, sku: true, deletedAt: true }
    });

    const employees = await prisma.user.findMany({
      where: { deletedAt: { not: null }, role: { not: 'CUSTOMER' } },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, deletedAt: true }
    });

    const items = [
      ...products.map(p => ({ ...p, type: 'PRODUCT' })),
      ...employees.map(e => ({ ...e, type: 'EMPLOYEE', name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email }))
    ].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

exports.restoreItem = async (req, res, next) => {
  try {
    const { id, type } = req.body;

    if (!id || !type) {
      return res.status(400).json({ error: 'ID and Type are required' });
    }

    if (type === 'PRODUCT') {
      await prisma.product.update({
        where: { id },
        data: { deletedAt: null }
      });
    } else if (type === 'EMPLOYEE') {
      await prisma.user.update({
        where: { id },
        data: { deletedAt: null }
      });
      // Also restore related employee profile
      await prisma.employee.updateMany({
        where: { userId: id },
        data: { deletedAt: null }
      });
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    res.status(200).json({ success: true, message: `${type} restored successfully` });
  } catch (error) {
    next(error);
  }
};

exports.permanentlyDeleteItem = async (req, res, next) => {
  try {
    // Accept from query params (DELETE with body is unreliable across clients/proxies)
    const id   = req.query.id   || req.body?.id;
    const type = req.query.type || req.body?.type;

    if (!id || !type) {
      return res.status(400).json({ error: 'id and type query params are required' });
    }

    if (type === 'PRODUCT') {
      await prisma.product.delete({ where: { id } });
    } else if (type === 'EMPLOYEE') {
      await prisma.employee.deleteMany({ where: { userId: id } });
      await prisma.user.delete({ where: { id } });
    } else {
      return res.status(400).json({ error: 'Invalid type. Must be PRODUCT or EMPLOYEE' });
    }

    res.status(200).json({ success: true, message: `${type} permanently deleted` });
  } catch (error) {
    next(error);
  }
};
