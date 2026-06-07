const prisma = require('../config/prisma');

/**
 * GET /api/payroll
 * List all salary records with employee info (admin view)
 */
exports.getAllSalaries = async (req, res, next) => {
  try {
    const { month, employeeId, status } = req.query;
    const where = {};
    if (month) where.month = month;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const salaries = await prisma.salary.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, profileImageUrl: true } }
          }
        }
      },
      orderBy: [{ month: 'desc' }, { employee: { user: { firstName: 'asc' } } }]
    });

    res.json({ success: true, data: salaries });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payroll/generate
 * Auto-generate payroll for all active employees for a given month.
 * Computes: baseSalary, absentDays, deductions, PF, netPay
 * Idempotent: skips employees who already have a slip for the month.
 */
exports.generateMonthlyPayroll = async (req, res, next) => {
  try {
    const { month } = req.body; // e.g. "2026-06"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Invalid month format. Use YYYY-MM' });
    }

    const employees = await prisma.employee.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        user: { select: { firstName: true, lastName: true } },
        attendance: {
          where: {
            date: {
              gte: new Date(`${month}-01`),
              lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1))
            }
          }
        },
        salaries: { where: { month } }
      }
    });

    const results = [];
    const workingDays = 26; // Standard working days per month

    await prisma.$transaction(async (tx) => {
      for (const emp of employees) {
        // Skip if already generated
        if (emp.salaries.length > 0) {
          results.push({ employeeId: emp.id, skipped: true, reason: 'Slip already exists' });
          continue;
        }

        const baseSalary = emp.baseSalary || 0;
        if (baseSalary === 0) {
          results.push({ employeeId: emp.id, skipped: true, reason: 'No base salary configured' });
          continue;
        }

        const pfRate = emp.pfRate || 12;
        const perDaySalary = baseSalary / workingDays;

        // Count absent days and half days
        let absentDays = 0;
        emp.attendance.forEach(a => {
          if (a.status === 'ABSENT') absentDays += 1;
          else if (a.status === 'HALF_DAY') absentDays += 0.5;
        });

        const deductions = Number((perDaySalary * absentDays).toFixed(2));
        const pfContribution = Number(((baseSalary * pfRate) / 100).toFixed(2));
        const netPay = Number(Math.max(0, baseSalary - deductions - pfContribution).toFixed(2));

        const slip = await tx.salary.create({
          data: {
            employeeId: emp.id,
            month,
            amount: baseSalary,
            deductions,
            pfContribution,
            netPay,
            absentDays,
            status: 'PENDING'
          }
        });

        // Update PF ledger
        await tx.pFLedger.upsert({
          where: { employeeId: emp.id },
          create: { employeeId: emp.id, balance: pfContribution, lastUpdatedMonth: month },
          update: {
            balance: { increment: pfContribution },
            lastUpdatedMonth: month
          }
        });

        results.push({ employeeId: emp.id, salaryId: slip.id, netPay, pfContribution, absentDays });
      }
    });

    res.json({ success: true, message: `Payroll generated for ${month}`, data: results });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payroll/:id/pay
 * Mark a specific salary slip as PAID
 */
exports.markAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slip = await prisma.salary.findUnique({ where: { id } });
    if (!slip) return res.status(404).json({ success: false, message: 'Salary slip not found' });
    if (slip.status === 'PAID') return res.status(409).json({ success: false, message: 'Salary already paid' });

    const updated = await prisma.salary.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payroll/my
 * Employee self-service: view own salary slips
 */
exports.getMyPayroll = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

    const salaries = await prisma.salary.findMany({
      where: { employeeId: employee.id },
      orderBy: { month: 'desc' }
    });

    const pfLedger = await prisma.pFLedger.findUnique({ where: { employeeId: employee.id } });

    res.json({ success: true, data: { salaries, pfBalance: pfLedger?.balance || 0, lastUpdatedMonth: pfLedger?.lastUpdatedMonth } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payroll/pf/:employeeId
 * Get PF ledger for a specific employee
 */
exports.getPFLedger = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const ledger = await prisma.pFLedger.findUnique({ where: { employeeId } });
    res.json({ success: true, data: ledger || { balance: 0 } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payroll/pf/:employeeId/settle
 * On resignation/termination, settle PF and reset to 0
 */
exports.settlePF = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const ledger = await prisma.pFLedger.findUnique({ where: { employeeId } });
    if (!ledger || ledger.balance === 0) {
      return res.status(404).json({ success: false, message: 'No PF balance to settle' });
    }

    const settled = await prisma.$transaction(async (tx) => {
      const result = await tx.pFLedger.update({
        where: { employeeId },
        data: { balance: 0, settledAt: new Date() }
      });
      return result;
    });

    res.json({ success: true, message: `PF of ₹${ledger.balance} settled for employee`, data: settled });
  } catch (error) {
    next(error);
  }
};
