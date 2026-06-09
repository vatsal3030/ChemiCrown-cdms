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
      /**
       * Must delete in dependency order to avoid FK constraint violations.
       * The Prisma schema has a required relation `InventoryToProduct`, so
       * prisma.product.delete() will fail if any Inventory record references this product.
       * Delete all dependents manually before deleting the product.
       */

      // 1. Find all inventories for this product
      const inventories = await prisma.inventory.findMany({
        where: { productId: id },
        select: { id: true }
      });
      const inventoryIds = inventories.map(inv => inv.id);

      // 2. Delete stock transaction logs that reference these inventories
      if (inventoryIds.length > 0) {
        await prisma.inventoryTransaction.deleteMany({ where: { inventoryId: { in: inventoryIds } } }).catch(() => {});
        await prisma.inventory.deleteMany({ where: { productId: id } });
      }

      // 3. Delete reviews and favorites
      await prisma.review.deleteMany({ where: { productId: id } }).catch(() => {});
      await prisma.favorite.deleteMany({ where: { productId: id } }).catch(() => {});

      // 4. Delete OrderItems (set productId to null if nullable, or just delete them)
      await prisma.orderItem.deleteMany({ where: { productId: id } }).catch(() => {});

      // 5. Now delete the product (order items have a FK but usually cascade or are nullable)
      await prisma.product.delete({ where: { id } });

    } else if (type === 'EMPLOYEE') {
      /**
       * Employee permanent deletion cascade:
       * - Attendance, Payroll, LeaveRequest, EmployeeWarning, Task all use Employee.id (not User.id)
       * - Must fetch the Employee record first to get its ID before deleting.
       */
      const employeeRecord = await prisma.employee.findFirst({
        where: { userId: id },
        select: { id: true }
      });

      if (employeeRecord) {
        const empId = employeeRecord.id;
        // Delete all records that reference Employee.id (use correct model names from schema)
        await prisma.attendance.deleteMany({ where: { employeeId: empId } }).catch(() => {});
        await prisma.leaveRequest.deleteMany({ where: { employeeId: empId } }).catch(() => {});
        await prisma.employeeWarning.deleteMany({ where: { employeeId: empId } }).catch(() => {});
        await prisma.overtime.deleteMany({ where: { employeeId: empId } }).catch(() => {});
        await prisma.salesIncentive.deleteMany({ where: { employeeId: empId } }).catch(() => {});
        // Task.assignedToId is non-nullable — soft-delete tasks instead of nullifying
        await prisma.task.updateMany({ where: { assignedToId: empId }, data: { deletedAt: new Date() } }).catch(() => {});
        await prisma.salary.deleteMany({ where: { employeeId: empId } }).catch(() => {});
        await prisma.pFLedger.deleteMany({ where: { employeeId: empId } }).catch(() => {});
        await prisma.employee.delete({ where: { id: empId } });
      }

      // Clean up user-level records (AuditLog.userId is non-nullable — delete them too)
      await prisma.notification.deleteMany({ where: { userId: id } }).catch(() => {});
      await prisma.auditLog.deleteMany({ where: { userId: id } }).catch(() => {});
      await prisma.favorite.deleteMany({ where: { userId: id } }).catch(() => {});
      await prisma.task.deleteMany({ where: { createdById: id } }).catch(() => {});
      await prisma.user.delete({ where: { id } });
    } else {
      return res.status(400).json({ error: 'Invalid type. Must be PRODUCT or EMPLOYEE' });
    }

    res.status(200).json({ success: true, message: `${type} permanently deleted` });
  } catch (error) {
    // Provide a clear error message for debugging
    console.error('[permanentlyDeleteItem]', error.message);
    next(error);
  }
};
