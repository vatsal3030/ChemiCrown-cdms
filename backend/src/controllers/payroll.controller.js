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
 * GET /api/payroll/:id
 * Get a single salary slip by ID
 */
exports.getSlipById = async (req, res, next) => {
  try {
    const slip = await prisma.salary.findUnique({
      where: { id: req.params.id },
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true, profileImageUrl: true } }
          }
        }
      }
    });
    if (!slip) return res.status(404).json({ success: false, message: 'Slip not found' });

    // Restrict regular employees to their own payslips
    const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(req.user.role);
    if (!isAdmin && slip.employee.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own payslips' });
    }

    res.json({ success: true, data: slip });
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

async function unlinkPayrollComponents(tx, salaryIds) {
  if (!salaryIds || salaryIds.length === 0) return;

  // Reset Overtime status and salaryId
  await tx.overtime.updateMany({
    where: { salaryId: { in: salaryIds } },
    data: { status: 'APPROVED', salaryId: null }
  });

  // Reset SalesIncentive status and salaryId
  await tx.salesIncentive.updateMany({
    where: { salaryId: { in: salaryIds } },
    data: { status: 'APPROVED', salaryId: null }
  });
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
    const { month, force } = req.body; // e.g. "2026-06" ; force=true to regenerate PENDING slips
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Invalid month format. Use YYYY-MM' });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1);
    
    // Security Check: Block generation for future months
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (monthStart > currentMonthStart) {
      return res.status(400).json({ success: false, message: 'Cannot generate payroll for future months' });
    }

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

    // Auto-create Employee profiles for Users who don't have one (e.g. newly created users or missing ones)
    const missingEmployees = await prisma.user.findMany({
      where: { role: { not: 'CUSTOMER' }, deletedAt: null, employeeProfile: null }
    });
    if (missingEmployees.length > 0) {
      await prisma.employee.createMany({
        data: missingEmployees.map(u => ({
          userId: u.id,
          department: 'Unassigned',
          jobTitle: u.role,
          isActive: true
        }))
      });
    }

    // If force=true, delete existing PENDING slips so they can be regenerated
    // (e.g., after attendance corrections). PAID slips are never touched.
    if (force) {
      const pendingSlips = await prisma.salary.findMany({
        where: { month, status: 'PENDING' },
        select: { id: true }
      });
      const pendingIds = pendingSlips.map(s => s.id);

      if (pendingIds.length > 0) {
        await prisma.$transaction(async (tx) => {
          await unlinkPayrollComponents(tx, pendingIds);
          await tx.salary.deleteMany({ where: { id: { in: pendingIds } } });
        });
        console.log(`[PAYROLL] Force-deleted ${pendingIds.length} PENDING slips for ${month} before regeneration`);
      }
    }

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

    for (const emp of employees) {
      // Skip if already generated
      if (emp.salaries.length > 0) {
        results.push({ employeeId: emp.id, skipped: true, reason: 'Slip already exists' });
        continue;
      }

      // Security Check: Do not generate slip if they joined AFTER this month
      if (emp.joiningDate && new Date(emp.joiningDate) >= monthEnd) {
        results.push({ employeeId: emp.id, skipped: true, reason: 'Joined after this month' });
        continue;
      }

      // Security Check: Do not generate slip if they were terminated/resigned BEFORE this month started
      if ((emp.status === 'TERMINATED' || emp.status === 'RESIGNED') && emp.terminatedAt) {
        if (new Date(emp.terminatedAt) < monthStart) {
          results.push({ employeeId: emp.id, skipped: true, reason: 'Terminated/Resigned before this month' });
          continue;
        }
      }

      const baseSalary = emp.baseSalary || 0;
      if (baseSalary === 0) {
        results.push({ employeeId: emp.id, skipped: true, reason: 'No base salary configured' });
        continue;
      }

      const pfRate = emp.pfRate || 12;

      // Count positive days (Present, Half Day, Leave) on working days
      let presentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;

      emp.attendances.forEach(a => {
        const dayOfWeek = new Date(a.date).getDay();
        const isSunday = dayOfWeek === 0;
        const isHoliday = holidayDates.some(h => 
          new Date(h.date).toDateString() === new Date(a.date).toDateString()
        );
        // We only count marked attendance status on non-Sunday, non-Holiday days
        if (!isSunday && !isHoliday) {
          if (a.status === 'PRESENT') presentDays += 1;
          else if (a.status === 'HALF_DAY') halfDays += 1;
          else if (a.status === 'LEAVE') leaveDays += 1;
        }
      });

      // Positive accumulation of paid days
      const paidDays = Math.min(daysInMonth, presentDays + (0.5 * halfDays) + leaveDays + holidayDays + sundaysCount);
      const grossBasePay = (baseSalary / daysInMonth) * paidDays;

      // Deductions
      const absentDeduction = Number(Math.max(0, baseSalary - grossBasePay).toFixed(2));
      const pfContribution = Number(((baseSalary * pfRate) / 100).toFixed(2));

      // Overtime payout (sum of all approved overtime for the month)
      const overtimePayout = emp.overtimes.reduce((sum, ot) => sum + (ot.amount || 0), 0);

      // Incentive payout (sales/marketing commission)
      const incentivePayout = emp.salesIncentives.reduce((sum, si) => sum + (si.incentiveAmount || 0), 0);

      // Net Pay = grossBasePay + overtime + incentive - pfContribution
      const netPay = Number(Math.max(0,
        grossBasePay
        + overtimePayout
        + incentivePayout
        - pfContribution
      ).toFixed(2));

      const absentDays = Math.round(daysInMonth - paidDays);

      try {
        await prisma.$transaction(async (tx) => {
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
              workingDays: Math.round(paidDays),
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
        }, { timeout: 15000, maxWait: 5000 }); // Increase transaction timeout per employee
      } catch (err) {
        console.error(`Failed to process payroll for employee ${emp.id}:`, err);
        results.push({ employeeId: emp.id, skipped: true, reason: 'Transaction failed or timed out' });
      }
    }

    const generatedCount = results.filter(r => !r.skipped).length;
    const skippedCount = results.filter(r => r.skipped).length;

    res.json({ 
      success: true, 
      message: `Generated ${generatedCount} slips. Skipped ${skippedCount} (already exist or no base salary). Working days: ${totalWorkingDays}`, 
      data: results 
    });
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

    await prisma.$transaction(async (tx) => {
      await unlinkPayrollComponents(tx, [id]);
      await tx.salary.delete({ where: { id } });
    });
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
    const pendingSlips = await prisma.salary.findMany({
      where: { month, status: 'PENDING' },
      select: { id: true }
    });
    const pendingIds = pendingSlips.map(s => s.id);

    if (pendingIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        await unlinkPayrollComponents(tx, pendingIds);
        await tx.salary.deleteMany({ where: { id: { in: pendingIds } } });
      });
    }
    res.json({ success: true, message: `Deleted ${pendingIds.length} pending slip(s) for ${month}` });
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

    const slips = await prisma.salary.findMany({
      where: { month, status: 'PENDING' },
      include: { employee: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } }
    });
    if (slips.length === 0) return res.status(400).json({ success: false, message: `No pending slips for ${month}` });

    // Filter out slips belonging to the current user (prevent self-payment)
    const originalCount = slips.length;
    const filteredSlips = slips.filter(s => s.employee?.userId !== req.user.id);
    const selfSkipped = originalCount > filteredSlips.length;

    if (filteredSlips.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot process bulk payment: The only pending slip belongs to you. Self-payment is restricted!' 
      });
    }

    const now = new Date();
    const methodLabels = { CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer', UPI: 'UPI Transfer', CHEQUE: 'Cheque', DIGITAL_TRANSFER: 'Digital Transfer' };
    const methodLabel = methodLabels[paymentMethod] || paymentMethod;

    // Atomic transaction: update all slips + create ledger entries
    await prisma.$transaction([
      ...filteredSlips.map(s =>
        prisma.salary.update({
          where: { id: s.id },
          data: { status: 'PAID', paidAt: now, paymentMethod, paidById: req.user.id }
        })
      ),
      ...filteredSlips.map(s =>
        prisma.financeLedger.create({
          data: { type: 'DEBIT', category: 'PAYROLL', amount: s.netPay, description: `Bulk payroll ${month} - ${s.employee?.user?.firstName || ''} ${s.employee?.user?.lastName || ''}`, referenceId: s.id, date: now, isAutomatic: true }
        })
      )
    ]);

    // Notify each employee (non-blocking, outside transaction)
    for (const s of filteredSlips) {
      if (s.employee?.user?.id) {
        prisma.notification.create({
          data: {
            userId: s.employee.user.id,
            message: `💰 Salary of ₹${s.netPay.toFixed(2)} for ${month} has been paid via ${methodLabel}. Please confirm receipt in your Payroll section.`
          }
        }).catch(() => {});
      }
    }

    const message = selfSkipped
      ? `Processed ${filteredSlips.length} payments for ${month}. Note: Your own salary slip was skipped to prevent self-payment.`
      : `Processed ${filteredSlips.length} payments for ${month}`;

    res.json({ success: true, message });
  } catch (error) { next(error); }
};


/**
 * POST|PUT /api/payroll/:id/confirm
 * Employee confirms they have received their salary.
 * Sets confirmedByEmployee = true on the salary slip.
 */
exports.confirmReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const slip = await prisma.salary.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true } } }
        }
      }
    });

    if (!slip) {
      return res.status(404).json({ success: false, message: 'Salary slip not found' });
    }

    // Only the owner employee OR a super admin can confirm
    const isOwner = slip.employee?.user?.id === req.user.id;
    const isAdmin = ['SUPER_ADMIN', 'OWNER'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only confirm your own salary receipts' });
    }

    if (slip.status !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Only PAID salary slips can be confirmed' });
    }

    // Idempotent — already confirmed is fine
    if (slip.confirmedByEmployee) {
      return res.json({ success: true, message: 'Already confirmed', data: slip });
    }

    const updated = await prisma.salary.update({
      where: { id },
      data: { confirmedByEmployee: true, confirmedAt: new Date() }
    });

    res.json({ success: true, message: 'Salary receipt confirmed successfully', data: updated });
  } catch (error) {
    next(error);
  }
};
