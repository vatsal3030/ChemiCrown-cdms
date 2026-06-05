const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getEmployees = async (req, res, next) => {
  try {
    const { search, sortField = 'firstName', sortOrder = 'asc' } = req.query;

    const where = {
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const employees = await prisma.user.findMany({
      where: {
        ...where,
        role: { in: ['MANAGER', 'SALES'] }
      },
      include: {
        employeeProfile: true
      },
      orderBy: {
        [sortField]: sortOrder
      }
    });

    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

exports.updateSalary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const employee = await prisma.employee.findUnique({ where: { userId: id } });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const newSalary = await prisma.salary.create({
      data: {
        employeeId: employee.id,
        amount: parseFloat(amount),
        status: 'PAID'
      }
    });

    res.status(200).json({ success: true, data: newSalary });
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    res.status(200).json({ success: true, message: 'Employee soft-deleted' });
  } catch (error) {
    next(error);
  }
};
