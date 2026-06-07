const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

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
        role: { not: 'CUSTOMER' } // Fetch all non-customer employees including OWNER
      },
      include: {
        employeeProfile: {
          include: {
            attendances: {
              where: {
                date: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                  lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                }
              }
            },
            salaries: { orderBy: { month: 'desc' }, take: 3 }
          }
        }
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

exports.getMyPayroll = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
      include: {
        attendances: {
          orderBy: { date: 'desc' }
        },
        salaries: {
          orderBy: { month: 'desc' }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

exports.updateSalary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { month } = req.body;
    const targetMonth = month || new Date().toISOString().substring(0, 7);

    let employee = await prisma.employee.findUnique({ 
      where: { userId: id },
      include: { attendances: true }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const baseSalary = employee.baseSalary || 0;
    const pfRate = employee.pfRate || 12;

    // Calculate absent days for the target month
    const [yearNum, monthNum] = targetMonth.split('-').map(Number);
    const monthStart = new Date(yearNum, monthNum - 1, 1);
    const monthEnd = new Date(yearNum, monthNum, 1);
    const monthAttendance = employee.attendances.filter(a => a.date >= monthStart && a.date < monthEnd);
    let absentDays = 0;
    monthAttendance.forEach(a => {
      if (a.status === 'ABSENT') absentDays += 1;
      if (a.status === 'HALF_DAY') absentDays += 0.5;
    });

    const deductions = baseSalary > 0 ? (baseSalary / 30) * absentDays : 0;
    const pfContribution = baseSalary > 0 ? (baseSalary * pfRate) / 100 : 0;
    const netPay = baseSalary - deductions - pfContribution;

    const newSalary = await prisma.salary.create({
      data: {
        employeeId: employee.id,
        amount: baseSalary,
        deductions,
        pfContribution,
        netPay: Math.max(0, netPay),
        absentDays,
        month: targetMonth,
        status: 'PAID',
        paidAt: new Date()
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

exports.addEmployee = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, department, jobTitle, phone, joiningDate, isActive, baseSalary, ctc, pfRate } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: role || 'MANAGER'
        }
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          department,
          jobTitle,
          joiningDate: joiningDate ? new Date(joiningDate) : undefined,
          isActive: isActive !== undefined ? isActive : true,
          baseSalary: baseSalary ? parseFloat(baseSalary) : null,
          ctc: ctc ? parseFloat(ctc) : null,
          pfRate: pfRate ? parseFloat(pfRate) : 12.0
        }
      });

      return { user, employee };
    });

    res.status(201).json({ success: true, message: 'Employee added successfully', data: newEmployee });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, department, jobTitle, joiningDate, isActive, baseSalary, ctc, pfRate } = req.body;
    const requestingUser = req.user;

    // RBAC: Prevent role escalation — only SUPER_ADMIN/OWNER can assign privileged roles
    const privilegedRoles = ['SUPER_ADMIN', 'OWNER', 'MANAGER'];
    if (role && privilegedRoles.includes(role)) {
      if (!['SUPER_ADMIN', 'OWNER'].includes(requestingUser.role)) {
        return res.status(403).json({
          success: false,
          message: `Only Super Admin or Owner can assign the '${role}' role.`
        });
      }
    }

    // Prevent any user from changing their own role
    if (id === requestingUser.id && role && role !== requestingUser.role) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own role.'
      });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { firstName, lastName, phone, role }
      });

      if (department !== undefined || jobTitle !== undefined || joiningDate !== undefined || isActive !== undefined) {
        await tx.employee.upsert({
          where: { userId: id },
          create: {
            userId: id,
            department,
            jobTitle,
            joiningDate: joiningDate ? new Date(joiningDate) : undefined,
            isActive: isActive !== undefined ? isActive : true,
            baseSalary: baseSalary ? parseFloat(baseSalary) : null,
            ctc: ctc ? parseFloat(ctc) : null,
            pfRate: pfRate ? parseFloat(pfRate) : 12.0
          },
          update: {
            department,
            jobTitle,
            joiningDate: joiningDate ? new Date(joiningDate) : undefined,
            isActive: isActive !== undefined ? isActive : true,
            baseSalary: baseSalary ? parseFloat(baseSalary) : null,
            ctc: ctc ? parseFloat(ctc) : null,
            pfRate: pfRate ? parseFloat(pfRate) : null
          }
        });
      }

      // Write audit log for role changes
      if (role) {
        const existingUser = await tx.user.findUnique({ where: { id }, select: { role: true } });
        if (existingUser && existingUser.role !== role) {
          await tx.auditLog.create({
            data: {
              userId: requestingUser.id,
              action: 'ROLE_CHANGED',
              entity: 'User',
              entityId: id
            }
          });
        }
      }

      return user;
    });

    res.status(200).json({ success: true, message: 'Employee updated successfully', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

exports.markAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, date } = req.body;
    
    let employee = await prisma.employee.findUnique({ where: { userId: id } });
    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          userId: id,
          department: 'Unassigned',
          jobTitle: 'Employee',
          isActive: true
        }
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: targetDate, lt: nextDay }
      }
    });

    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status }
      });
    } else {
      attendance = await prisma.attendance.create({
        data: { employeeId: employee.id, date: targetDate, status }
      });
    }

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    let employee = await prisma.employee.findUnique({ where: { userId: id } });
    if (!employee) return res.status(200).json({ success: true, data: [] });

    const attendances = await prisma.attendance.findMany({
      where: { employeeId: employee.id },
      orderBy: { date: 'desc' },
      take: 30
    });

    res.status(200).json({ success: true, data: attendances });
  } catch (error) {
    next(error);
  }
};

exports.getSalaries = async (req, res, next) => {
  try {
    const { id } = req.params;
    let employee = await prisma.employee.findUnique({ where: { userId: id } });
    if (!employee) return res.status(200).json({ success: true, data: [] });

    const salaries = await prisma.salary.findMany({
      where: { employeeId: employee.id },
      orderBy: { month: 'desc' }
    });

    res.status(200).json({ success: true, data: salaries });
  } catch (error) {
    next(error);
  }
};

exports.sendWarning = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    const notification = await prisma.notification.create({
      data: {
        userId: id,
        message: `[WARNING from HR] ${message}`
      }
    });

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};
