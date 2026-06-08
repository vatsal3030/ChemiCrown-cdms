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
 * Helper: count Sundays in a month
 */
function countSundaysInMonth(year, monthNum) {
  let count = 0;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, monthNum - 1, d).getDay() === 0) count++;
  }
  return count;
}

/**
 * POST /api/payroll/generate
 * Auto-generate payroll for all active employees for a given month.
 * - Accounts for holidays (govt + festival) and Sundays in working day calculation
 * - Includes approved overtime and approved sales incentives
 * Idempotent: skips employees who already have a slip for the month.
 */
exports.generateMonthlyPayroll = async (req, res, next) => {
  try {
    const { month } = req.body; // e.g. "2026-06"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Invalid month format. Use YYYY-MM' });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    // Count Sundays in this month
    const sundaysCount = countSundaysInMonth(year, monthNum);

    // Count approved holidays (govt + festival) in this month from HolidayCalendar
    const holidays = await prisma.holidayCalendar.findMany({
      where: {
        date: { gte: monthStart, lt: monthEnd },
        type: { in: ['NATIONAL', 'FESTIVAL'] }
      }
    });
    // Only count holidays that don't fall on Sundays (Sundays already excluded)
    const holidayDates = holidays.filter(h => new Date(h.date).getDay() !== 0);
    const holidayDays = holidayDates.length;

    // Total working days = all days − Sundays − holidays
    const totalWorkingDays = Math.max(1, daysInMonth - sundaysCount - holidayDays);

    const employees = await prisma.employee.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        user: { select: { firstName: true, lastName: true } },
        attendances: {
          where: { date: { gte: monthStart, lt: monthEnd } }
        },
        salaries: { where: { month } },
        overtimes: { where: { 
          status: 'APPROVED',
          date: { gte: monthStart, lt: monthEnd }
        }},
        salesIncentives: { where: {
          month,
          status: 'APPROVED'
        }}
      }
    });

    const results = [];

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
        const perDaySalary = baseSalary / totalWorkingDays;

        // Count absent days and half days (only on actual working days)
        let absentDays = 0;
        emp.attendances.forEach(a => {
          const dayOfWeek = new Date(a.date).getDay();
          const isSunday = dayOfWeek === 0;
          const isHoliday = holidayDates.some(h => 
            new Date(h.date).toDateString() === new Date(a.date).toDateString()
          );
          // Don't count absences on Sundays or holidays
          if (!isSunday && !isHoliday) {
            if (a.status === 'ABSENT') absentDays += 1;
            else if (a.status === 'HALF_DAY') absentDays += 0.5;
          }
        });

        // Overtime payout (sum of all approved overtime for the month)
        const overtimePayout = emp.overtimes.reduce((sum, ot) => sum + (ot.amount || 0), 0);

        // Incentive payout (sales/marketing commission)
        const incentivePayout = emp.salesIncentives.reduce((sum, si) => sum + (si.incentiveAmount || 0), 0);

        const absentDeduction = Number((perDaySalary * absentDays).toFixed(2));
        const pfContribution = Number(((baseSalary * pfRate) / 100).toFixed(2));
        const netPay = Number(Math.max(0,
          baseSalary
          + overtimePayout
          + incentivePayout
          - absentDeduction
          - pfContribution
        ).toFixed(2));

        const slip = await tx.salary.create({
          data: {
            employeeId: emp.id,
            month,
            amount: baseSalary,
            overtime: Number(overtimePayout.toFixed(2)),
            incentive: Number(incentivePayout.toFixed(2)),
            absentDeduction,
            deductions: absentDeduction, // for compatibility
            pfContribution,
            netPay,
            absentDays,
            workingDays: totalWorkingDays,
            holidayDays,
            status: 'PENDING'
          }
        });

        // Mark overtime as PAID and link to salary
        if (emp.overtimes.length > 0) {
          await tx.overtime.updateMany({
            where: { id: { in: emp.overtimes.map(o => o.id) } },
            data: { status: 'PAID', salaryId: slip.id }
          });
        }

        // Mark incentives as PAID and link to salary
        if (emp.salesIncentives.length > 0) {
          await tx.salesIncentive.updateMany({
            where: { id: { in: emp.salesIncentives.map(si => si.id) } },
            data: { status: 'PAID', salaryId: slip.id }
          });
        }

        // Upsert PF ledger
        await tx.pFLedger.upsert({
          where: { employeeId: emp.id },
          create: { employeeId: emp.id, balance: pfContribution, lastUpdatedMonth: month },
          update: {
            balance: { increment: pfContribution },
            lastUpdatedMonth: month
          }
        });

        results.push({ employeeId: emp.id, salaryId: slip.id, netPay, pfContribution, absentDays, overtimePayout, incentivePayout });
      }
    });

    res.json({ success: true, message: `Payroll generated for ${month}. Working days: ${totalWorkingDays} (Sundays: ${sundaysCount}, Holidays: ${holidayDays})`, data: results });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payroll/:id/pay
 * Mark a specific salary slip as PAID with full payment details (4 modes)
 */
exports.markAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      paymentMethod,   // CASH | BANK_TRANSFER | UPI | CHEQUE
      transactionRef,  // UTR / NEFT ref / Cheque no.
      bankUsed,        // Bank account used
      chequeDate,      // Date on cheque
      chequeBank,      // Issuing bank
      remarks          // Admin notes
    } = req.body;

    if (!['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'paymentMethod must be CASH, BANK_TRANSFER, UPI, or CHEQUE' });
    }
    
    const slip = await prisma.salary.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } }
    });
    if (!slip) return res.status(404).json({ success: false, message: 'Salary slip not found' });
    if (slip.status === 'PAID') return res.status(409).json({ success: false, message: 'Salary already paid' });

    // Prevent self-payment (no one should pay their own salary)
    const payingUser = await prisma.employee.findUnique({ where: { userId: req.user.id } });
    if (payingUser && payingUser.id === slip.employeeId) {
      return res.status(403).json({ success: false, message: 'You cannot pay your own salary' });
    }

    // Prevent duplicate payment for same employee in the same month
    const existingPaid = await prisma.salary.findFirst({
      where: {
        employeeId: slip.employeeId,
        month: slip.month,
        status: 'PAID',
        id: { not: id }
      }
    });
    if (existingPaid) {
      return res.status(409).json({ success: false, message: `Salary for ${slip.month} has already been paid for this employee` });
    }

    // Validate required refs per method
    if (paymentMethod === 'BANK_TRANSFER' && !transactionRef) {
      return res.status(400).json({ success: false, message: 'Transaction reference is required for Bank Transfer' });
    }
    if (paymentMethod === 'UPI' && !transactionRef) {
      return res.status(400).json({ success: false, message: 'UTR number is required for UPI payment' });
    }
    if (paymentMethod === 'CHEQUE' && !transactionRef) {
      return res.status(400).json({ success: false, message: 'Cheque number is required' });
    }

    const updated = await prisma.salary.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidById: req.user.id,
        paymentMethod,
        transactionRef: transactionRef || null,
        bankUsed: bankUsed || null,
        chequeDate: chequeDate ? new Date(chequeDate) : null,
        chequeBank: chequeBank || null,
        remarks: remarks || slip.remarks
      }
    });

    // Build human-readable payment summary for notification
    const methodLabels = { CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer (NEFT/IMPS)', UPI: 'UPI Transfer', CHEQUE: 'Cheque' };
    let paymentDetail = methodLabels[paymentMethod];
    if (transactionRef) paymentDetail += ` | Ref: ${transactionRef}`;
    if (chequeBank) paymentDetail += ` | Bank: ${chequeBank}`;

    // Notify the employee with full payment details
    await prisma.notification.create({
      data: {
        userId: slip.employee.userId,
        message: `💰 Salary of ₹${slip.netPay.toFixed(2)} for ${slip.month} has been paid via ${paymentDetail}. Please confirm receipt in your Payroll section.`
      }
    });

    // Audit log for compliance
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SALARY_PAID',
        entity: 'Salary',
        entityId: id,
        details: JSON.stringify({
          employeeId: slip.employeeId,
          month: slip.month,
          amount: slip.netPay,
          method: paymentMethod,
          ref: transactionRef,
          bank: bankUsed
        })
      }
    }).catch(() => {}); // non-blocking

    // Finance ledger entry
    await prisma.financeLedger.create({
      data: {
        type: 'DEBIT',
        category: 'PAYROLL',
        amount: slip.netPay,
        description: `Salary ${slip.month} - ${slip.employee.user.firstName} ${slip.employee.user.lastName} via ${paymentMethod}`,
        referenceId: id,
        date: new Date(),
        isAutomatic: true
      }
    }).catch(() => {}); // non-blocking

    res.json({ success: true, data: updated, message: `Salary marked as paid via ${methodLabels[paymentMethod]}` });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payroll/:id/confirm
 * Employee confirms receipt of their salary
 */
exports.confirmReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const slip = await prisma.salary.findUnique({
      where: { id },
      include: { employee: true }
    });
    if (!slip) return res.status(404).json({ success: false, message: 'Salary slip not found' });
    if (slip.status !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Salary has not been paid yet' });
    }
    // Verify the salary belongs to the requesting employee
    if (slip.employee.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only confirm your own salary receipts' });
    }
    if (slip.confirmedByEmployee) {
      return res.status(409).json({ success: false, message: 'Receipt already confirmed' });
    }

    const updated = await prisma.salary.update({
      where: { id },
      data: { confirmedByEmployee: true, confirmedAt: new Date() }
    });

    res.json({ success: true, message: 'Salary receipt confirmed', data: updated });
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

    res.json({
      success: true,
      data: {
        salaries,
        pfBalance: pfLedger?.balance || 0,
        lastUpdatedMonth: pfLedger?.lastUpdatedMonth
      }
    });
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
      return tx.pFLedger.update({
        where: { employeeId },
        data: { balance: 0, settledAt: new Date() }
      });
    });

    res.json({ success: true, message: `PF of ₹${ledger.balance} settled`, data: settled });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/payroll/:id
 * Edit a salary slip (adjust bonus, allowances, deductions, TDS, remarks)
 * Can only edit PENDING slips (once PAID, it is locked)
 */
exports.updateSlip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bonus, allowances, deductions, tds, remarks } = req.body;

    const slip = await prisma.salary.findUnique({ where: { id } });
    if (!slip) return res.status(404).json({ success: false, message: 'Salary slip not found' });
    if (slip.status === 'PAID') return res.status(400).json({ success: false, message: 'Cannot edit a PAID slip. Contact finance.' });

    // Recalculate netPay
    const b  = bonus      !== undefined ? parseFloat(bonus)      : (slip.bonus || 0);
    const al = allowances !== undefined ? parseFloat(allowances) : (slip.allowances || 0);
    const d  = deductions !== undefined ? parseFloat(deductions) : slip.deductions;
    const t  = tds        !== undefined ? parseFloat(tds)        : (slip.tds || 0);
    const pf = slip.pfContribution;
    const netPay = slip.amount + b + al - d - t - pf;

    const updated = await prisma.salary.update({
      where: { id },
      data: { bonus: b, allowances: al, deductions: d, tds: t, netPay: Math.max(0, netPay), ...(remarks !== undefined && { remarks }) }
    });

    res.json({ success: true, data: updated, message: 'Salary slip updated' });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/payroll/:id
 * Delete a single salary slip (PENDING only)
 */
exports.deleteSlip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slip = await prisma.salary.findUnique({ where: { id } });
    if (!slip) return res.status(404).json({ success: false, message: 'Salary slip not found' });
    if (slip.status === 'PAID') return res.status(400).json({ success: false, message: 'Cannot delete a PAID slip.' });

    await prisma.salary.delete({ where: { id } });
    res.json({ success: true, message: 'Salary slip deleted' });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/payroll/month/:month
 * Delete ALL PENDING slips for a given month
 */
exports.deleteMonthSlips = async (req, res, next) => {
  try {
    const { month } = req.params;
    const result = await prisma.salary.deleteMany({
      where: { month, status: 'PENDING' }
    });
    res.json({ success: true, message: `Deleted ${result.count} pending slip(s) for ${month}` });
  } catch (error) { next(error); }
};

/**
 * POST /api/payroll/bulk-pay
 * Mark all PENDING slips for a month as PAID in one action
 */
exports.bulkPay = async (req, res, next) => {
  try {
    const { month, paymentMethod = 'DIGITAL_TRANSFER' } = req.body;
    if (!month) return res.status(400).json({ success: false, message: 'Month is required' });

    const slips = await prisma.salary.findMany({ where: { month, status: 'PENDING' } });
    if (slips.length === 0) return res.status(400).json({ success: false, message: `No pending slips for ${month}` });

    const now = new Date();
    await prisma.$transaction(
      slips.map(s =>
        prisma.salary.update({
          where: { id: s.id },
          data: { status: 'PAID', paidAt: now, paymentMethod }
        })
      )
    );

    // Sync ledger
    for (const s of slips) {
      prisma.financeLedger.create({
        data: { type: 'DEBIT', category: 'PAYROLL', amount: s.netPay, description: `Bulk payroll ${month}`, referenceId: s.id, date: now, isAutomatic: true }
      }).catch(() => {});
    }

    res.json({ success: true, message: `Processed ${slips.length} payments for ${month}` });
  } catch (error) { next(error); }
};
