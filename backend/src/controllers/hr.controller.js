const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../services/email.service');

exports.getEmployees = async (req, res, next) => {
  try {
    const { search, sortField = 'firstName', sortOrder = 'asc', showTerminated = 'true', status, role, dept, attendanceDate } = req.query;

    const queryDate = attendanceDate ? new Date(attendanceDate) : new Date();
    const targetYear = queryDate.getUTCFullYear();
    const targetMonth = queryDate.getUTCMonth();
    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 1));

    // By default show all including terminated (HR needs to see them), unless explicitly filtered
    const where = {};
    if (showTerminated === 'false') where.deletedAt = null;

    if (role) where.role = role;
    
    // We need to filter by status and dept which are inside the employeeProfile relation
    if ((status && status !== 'all') || (dept && dept !== 'all')) {
      where.employeeProfile = {
        ...(status && status !== 'all' ? { status } : {}),
        ...(dept && dept !== 'all' ? { department: dept } : {})
      };
    }

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
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            },
            salaries: { orderBy: { month: 'desc' }, take: 3 },
            warnings: { orderBy: { createdAt: 'desc' } }
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

exports.getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await prisma.user.findUnique({
      where: { id },
      include: {
        employeeProfile: {
          include: {
            attendances: { orderBy: { date: 'desc' }, take: 30 },
            salaries: { orderBy: { month: 'desc' } },
            warnings: { orderBy: { createdAt: 'desc' } }
          }
        }
      }
    });

    if (!employee || employee.role === 'CUSTOMER') {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({ success: true, data: employee });
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
          status: 'ACTIVE',
          baseSalary: baseSalary ? parseFloat(baseSalary) : null,
          ctc: ctc ? parseFloat(ctc) : null,
          pfRate: pfRate ? parseFloat(pfRate) : 12.0
        }
      });

      return { user, employee };
    });

    // Send Welcome Email containing credentials
    await sendWelcomeEmail(email, password, firstName);

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

    const targetDateStr = date || new Date().toISOString().split('T')[0];
    const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`);
    const nextDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: targetDate, lt: nextDay }
      }
    });

    let attendance;
    if (status === 'REMOVE') {
      if (existing) {
        await prisma.attendance.delete({ where: { id: existing.id } });
      }
      return res.status(200).json({ success: true, message: 'Attendance removed' });
    }

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
    const { id } = req.params; // employeeId (Employee table id)
    const { message } = req.body;

    // Legacy: still send notification
    const notification = await prisma.notification.create({
      data: { userId: id, message: `[WARNING from HR] ${message}` }
    });

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// ── NEW: Formal Warning System ────────────────────────────────────────────────

exports.issueWarning = async (req, res, next) => {
  try {
    const { id } = req.params; // employee.id
    const { type = 'VERBAL', reason } = req.body;

    if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { id: true, firstName: true, lastName: true } } }
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (employee.userId === req.user.id) return res.status(403).json({ success: false, message: 'You cannot issue a warning to yourself' });

    const [warning] = await prisma.$transaction([
      prisma.employeeWarning.create({
        data: { employeeId: id, type, reason, issuedBy: req.user.id }
      }),
      prisma.notification.create({
        data: {
          userId: employee.userId,
          message: `[${type} WARNING] ${reason}`
        }
      })
    ]);

    // Audit log
    prisma.auditLog.create({
      data: {
        userId: req.user.id, action: `ISSUED_${type}_WARNING`,
        entity: 'Employee', entityId: id,
        details: JSON.stringify({ reason })
      }
    }).catch(() => {});

    res.status(201).json({ success: true, data: warning, message: `${type} warning issued` });
  } catch (error) { next(error); }
};

exports.getWarnings = async (req, res, next) => {
  try {
    const { id } = req.params; // employee.id
    const warnings = await prisma.employeeWarning.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: warnings });
  } catch (error) { next(error); }
};

exports.deleteWarning = async (req, res, next) => {
  try {
    const { warnId } = req.params;
    await prisma.employeeWarning.delete({ where: { id: warnId } });
    res.json({ success: true, message: 'Warning deleted' });
  } catch (error) { next(error); }
};

// ── Terminate Employee ────────────────────────────────────────────────────────
exports.terminateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params; // employee.id
    const { reason, effectiveDate } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });

    const employee = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (employee.userId === req.user.id) return res.status(403).json({ success: false, message: 'You cannot terminate yourself' });

    const termDate = effectiveDate ? new Date(effectiveDate) : new Date();

    await prisma.$transaction([
      prisma.employee.update({
        where: { id },
        data: { status: 'TERMINATED', isActive: false, terminatedAt: termDate, terminationReason: reason }
      }),
      prisma.user.update({
        where: { id: employee.userId },
        data: { deletedAt: termDate } // prevents login
      }),
      prisma.notification.create({
        data: { userId: employee.userId, message: `Your employment has been terminated effective ${termDate.toLocaleDateString('en-IN')}. Reason: ${reason}` }
      })
    ]);

    prisma.auditLog.create({
      data: { userId: req.user.id, action: 'TERMINATED_EMPLOYEE', entity: 'Employee', entityId: id, details: JSON.stringify({ reason, effectiveDate: termDate }) }
    }).catch(() => {});

    res.json({ success: true, message: 'Employee terminated' });
  } catch (error) { next(error); }
};

// ── Suspend / Reinstate Employee ──────────────────────────────────────────────
exports.suspendEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to, reason } = req.body;
    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to dates required' });

    const employee = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (employee.userId === req.user.id) return res.status(403).json({ success: false, message: 'You cannot suspend yourself' });

    await prisma.$transaction([
      prisma.employee.update({ where: { id }, data: { status: 'SUSPENDED', suspendedFrom: new Date(from), suspendedTo: new Date(to) } }),
      prisma.notification.create({ data: { userId: employee.userId, message: `You have been suspended from ${from} to ${to}. Reason: ${reason || 'Not specified'}` } })
    ]);

    res.json({ success: true, message: 'Employee suspended' });
  } catch (error) { next(error); }
};

exports.reinstateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.employee.update({ where: { id }, data: { status: 'ACTIVE', suspendedFrom: null, suspendedTo: null, isActive: true } });
    const emp = await prisma.employee.findUnique({ where: { id } });
    await prisma.notification.create({ data: { userId: emp.userId, message: 'Your suspension has been lifted. You are reinstated as an active employee.' } });
    res.json({ success: true, message: 'Employee reinstated' });
  } catch (error) { next(error); }
};

// ── Update Salary Configuration ───────────────────────────────────────────────
exports.updateSalaryConfig = async (req, res, next) => {
  try {
    const { id } = req.params; // employee.id
    const { baseSalary, ctc, pfRate, salesTarget } = req.body;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(baseSalary !== undefined && { baseSalary: parseFloat(baseSalary) }),
        ...(ctc !== undefined && { ctc: parseFloat(ctc) }),
        ...(pfRate !== undefined && { pfRate: parseFloat(pfRate) }),
        ...(salesTarget !== undefined && { salesTarget: parseFloat(salesTarget) })
      }
    });

    prisma.auditLog.create({
      data: { userId: req.user.id, action: 'UPDATED_SALARY_CONFIG', entity: 'Employee', entityId: id, details: JSON.stringify({ baseSalary, ctc, pfRate, salesTarget }) }
    }).catch(() => {});

    res.json({ success: true, data: updated, message: 'Salary configuration updated' });
  } catch (error) { next(error); }
};

/**
 * PUT /api/hr/:id/bank-details
 * Update employee bank account & UPI details for salary transfers
 */
exports.updateBankDetails = async (req, res, next) => {
  try {
    const { id } = req.params; // employee.id
    const { bankAccountNumber, bankIFSC, bankName, bankAccountName, upiId, paymentPreference } = req.body;

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(bankAccountNumber !== undefined && { bankAccountNumber }),
        ...(bankIFSC !== undefined && { bankIFSC: bankIFSC?.toUpperCase() }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccountName !== undefined && { bankAccountName }),
        ...(upiId !== undefined && { upiId }),
        ...(paymentPreference !== undefined && { paymentPreference })
      }
    });

    prisma.auditLog.create({
      data: { userId: req.user.id, action: 'UPDATED_BANK_DETAILS', entity: 'Employee', entityId: id, details: JSON.stringify({ bankName, upiId, paymentPreference }) }
    }).catch(() => {});

    res.json({ success: true, data: updated, message: 'Bank details updated successfully' });
  } catch (error) { next(error); }
};

/**
 * PUT /api/hr/customers/:customerId/assign-sales
 * Assign a sales employee as account manager for a customer
 */
exports.assignSalesRep = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { employeeId } = req.body; // null to unassign

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { user: true }
      });
      if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
      if (!['SALES', 'MANAGER', 'OWNER', 'SUPER_ADMIN'].includes(employee.user.role)) {
        return res.status(400).json({ success: false, message: 'Only SALES or Manager employees can be assigned as account managers' });
      }
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: { assignedSalesId: employeeId || null }
    });

    res.json({ success: true, message: employeeId ? 'Sales representative assigned' : 'Sales representative unassigned' });
  } catch (error) { next(error); }
};
