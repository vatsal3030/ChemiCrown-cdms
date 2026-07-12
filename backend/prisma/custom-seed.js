const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting custom data seeding...');

  // 1. Get Admin User
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@chemicrown.com' }
  });
  if (!admin) {
    throw new Error('Admin user (admin@chemicrown.com) not found in the database. Please run clean_db.js first.');
  }
  const adminUserId = admin.id;
  console.log(`Found Admin User: ${admin.email} (ID: ${adminUserId})`);

  // 2. Prepare Freshers Data (max 2 LPA CTC)
  const freshers = [
    {
      email: 'neha.sharma@chemicrown.com',
      firstName: 'Neha',
      lastName: 'Sharma',
      phone: '+919999012345',
      role: 'MANAGER',
      department: 'HR',
      jobTitle: 'HR Associate',
      baseSalary: 11000,
      ctc: 15000 * 12, // 1.8 LPA
      bankAccountNumber: '912345678901',
      bankIFSC: 'SBIN0001234',
      bankName: 'State Bank of India',
      bankAccountName: 'Neha Sharma'
    },
    {
      email: 'amit.patel@chemicrown.com',
      firstName: 'Amit',
      lastName: 'Patel',
      phone: '+919999012346',
      role: 'MANAGER',
      department: 'Finance',
      jobTitle: 'Finance Analyst',
      baseSalary: 12000,
      ctc: 16200 * 12, // ~1.94 LPA
      bankAccountNumber: '912345678902',
      bankIFSC: 'HDFC0000123',
      bankName: 'HDFC Bank',
      bankAccountName: 'Amit Patel'
    },
    {
      email: 'rahul.verma@chemicrown.com',
      firstName: 'Rahul',
      lastName: 'Verma',
      phone: '+919999012347',
      role: 'MANAGER',
      department: 'IT',
      jobTitle: 'IT Support Assistant',
      baseSalary: 11500,
      ctc: 15500 * 12, // 1.86 LPA
      bankAccountNumber: '912345678903',
      bankIFSC: 'ICIC0000456',
      bankName: 'ICICI Bank',
      bankAccountName: 'Rahul Verma'
    },
    {
      email: 'sanjay.singh@chemicrown.com',
      firstName: 'Sanjay',
      lastName: 'Singh',
      phone: '+919999012348',
      role: 'INVENTORY_MANAGER',
      department: 'Logistics',
      jobTitle: 'Logistics Executive',
      baseSalary: 10500,
      ctc: 14000 * 12, // 1.68 LPA
      bankAccountNumber: '912345678904',
      bankIFSC: 'BARB0INDAS',
      bankName: 'Bank of Baroda',
      bankAccountName: 'Sanjay Singh'
    },
    {
      email: 'priya.sen@chemicrown.com',
      firstName: 'Priya',
      lastName: 'Priya',
      phone: '+919999012349',
      role: 'INVENTORY_MANAGER',
      department: 'Procurement',
      jobTitle: 'Procurement Officer',
      baseSalary: 10000,
      ctc: 13500 * 12, // 1.62 LPA
      bankAccountNumber: '912345678905',
      bankIFSC: 'PUNB0123400',
      bankName: 'Punjab National Bank',
      bankAccountName: 'Priya Sen'
    },
    {
      email: 'karan.johar@chemicrown.com',
      firstName: 'Karan',
      lastName: 'Johar',
      phone: '+919999012350',
      role: 'INVENTORY_MANAGER',
      department: 'Quality Control',
      jobTitle: 'QC Inspector',
      baseSalary: 10500,
      ctc: 14000 * 12, // 1.68 LPA
      bankAccountNumber: '912345678906',
      bankIFSC: 'SBIN0005678',
      bankName: 'State Bank of India',
      bankAccountName: 'Karan Johar'
    },
    {
      email: 'suresh.mehta@chemicrown.com',
      firstName: 'Suresh',
      lastName: 'Mehta',
      phone: '+919999012351',
      role: 'SALES',
      department: 'Sales',
      jobTitle: 'Sales Executive',
      baseSalary: 11000,
      ctc: 14800 * 12, // 1.77 LPA
      bankAccountNumber: '912345678907',
      bankIFSC: 'HDFC0000999',
      bankName: 'HDFC Bank',
      bankAccountName: 'Suresh Mehta'
    },
    {
      email: 'maya.roy@chemicrown.com',
      firstName: 'Maya',
      lastName: 'Roy',
      phone: '+919999012352',
      role: 'DIGITAL_MARKETING',
      department: 'Marketing',
      jobTitle: 'Digital Marketing Analyst',
      baseSalary: 9500,
      ctc: 13000 * 12, // 1.56 LPA
      bankAccountNumber: '912345678908',
      bankIFSC: 'ICIC0000888',
      bankName: 'ICICI Bank',
      bankAccountName: 'Maya Roy'
    }
  ];

  // 3. Create Freshers
  console.log('Creating freshers...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  for (const f of freshers) {
    const existing = await prisma.user.findUnique({ where: { email: f.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: f.email,
          password: passwordHash,
          role: f.role,
          firstName: f.firstName,
          lastName: f.lastName,
          phone: f.phone,
          employeeProfile: {
            create: {
              jobTitle: f.jobTitle,
              department: f.department,
              joiningDate: new Date('2026-06-01T00:00:00.000Z'),
              baseSalary: f.baseSalary,
              ctc: f.ctc,
              pfRate: 12.0,
              paymentPreference: 'BANK_TRANSFER',
              bankAccountNumber: f.bankAccountNumber,
              bankIFSC: f.bankIFSC,
              bankName: f.bankName,
              bankAccountName: f.bankAccountName
            }
          }
        }
      });
      console.log(`Created employee: ${f.firstName} ${f.lastName} (${f.department})`);
    } else {
      console.log(`User already exists: ${f.email}`);
    }
  }

  // 4. Force all employees joining date to June 1st, 2026
  console.log('Updating all employees joining date to 1st June 2026...');
  await prisma.employee.updateMany({
    data: {
      joiningDate: new Date('2026-06-01T00:00:00.000Z')
    }
  });

  // Get all employees
  const employees = await prisma.employee.findMany({
    include: { user: true }
  });

  // 5. Seeding Attendance for June (1 to 30)
  console.log('Seeding June attendance...');
  for (const emp of employees) {
    // Delete existing June attendance
    await prisma.attendance.deleteMany({
      where: {
        employeeId: emp.id,
        date: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lt: new Date('2026-07-01T00:00:00.000Z')
        }
      }
    });

    const attendanceRecords = [];
    for (let day = 1; day <= 30; day++) {
      const date = new Date(`2026-06-${String(day).padStart(2, '0')}T00:00:00.000Z`);
      const dayOfWeek = date.getUTCDay(); // 0 is Sunday, 1 is Monday...

      if (dayOfWeek === 0) {
        // Sundays are weekly offs, do not log attendance
        continue;
      }

      // Random status with realistic distributions
      let status = 'PRESENT';
      const rand = Math.random();
      if (rand < 0.04) {
        status = 'ABSENT';
      } else if (rand < 0.06) {
        status = 'HALF_DAY';
      } else if (rand < 0.08) {
        status = 'LEAVE';
      }

      attendanceRecords.push({
        employeeId: emp.id,
        date,
        status
      });
    }

    await prisma.attendance.createMany({
      data: attendanceRecords
    });
  }
  console.log(`✅ Attendance seeded for all ${employees.length} employees.`);

  // 6. Overtime (June 2026)
  console.log('Seeding approved overtime entries for June...');
  // Clean existing June overtime
  const juneStart = new Date('2026-06-01T00:00:00.000Z');
  const juneEnd = new Date('2026-07-01T00:00:00.000Z');
  await prisma.overtime.deleteMany({
    where: {
      date: { gte: juneStart, lt: juneEnd }
    }
  });

  // Assign approved overtime to selected employees (mostly IT, Logistics, Operations)
  const overtimeCandidates = employees.filter(emp => 
    ['IT', 'Logistics', 'Operations', 'Procurement'].includes(emp.department)
  );

  for (const emp of overtimeCandidates) {
    const base = emp.baseSalary || 12000;
    const hourlyRate = Number((base / 26 / 8).toFixed(2));
    const multiplier = 1.5;

    // Create 2 overtime entries for each candidate
    for (let i = 1; i <= 2; i++) {
      const randomDay = 5 + (i * 7); // Spread days
      const hours = 2 + (i % 2) * 1.5; // 2 or 3.5 hours
      const amount = Number((hours * hourlyRate * multiplier).toFixed(2));

      await prisma.overtime.create({
        data: {
          employeeId: emp.id,
          date: new Date(`2026-06-${String(randomDay).padStart(2, '0')}T00:00:00.000Z`),
          hours,
          hourlyRate,
          multiplier,
          amount,
          status: 'APPROVED',
          reason: i === 1 ? 'System update & backup support' : 'Urgent inventory dispatch audit',
          approvedById: adminUserId
        }
      });
    }
  }

  // 7. Incentives (June 2026)
  console.log('Seeding approved sales incentive entries for June...');
  await prisma.salesIncentive.deleteMany({
    where: { month: '2026-06' }
  });

  const salesCandidates = employees.filter(emp => 
    ['Sales', 'Marketing'].includes(emp.department)
  );

  for (const emp of salesCandidates) {
    const target = 75000;
    const achieved = 85000 + Math.floor(Math.random() * 20000);
    const rate = 2.5;
    const incentiveAmount = Number((achieved * rate / 100).toFixed(2));

    await prisma.salesIncentive.create({
      data: {
        employeeId: emp.id,
        month: '2026-06',
        targetAmount: target,
        achievedAmount: achieved,
        commissionRate: rate,
        incentiveAmount,
        notes: 'Monthly sales target exceeded',
        status: 'APPROVED'
      }
    });
  }

  // 8. Finance & Accounting Manual Expenses
  console.log('Seeding cheap and genuine office expenses...');
  // Clean existing manual expenses for June/July 2026
  await prisma.expense.deleteMany({
    where: {
      date: { gte: juneStart }
    }
  });

  const cheapExpenses = [
    { category: 'UTILITIES', amount: 1199, description: 'Monthly high-speed internet subscription for office', date: '2026-06-05' },
    { category: 'UTILITIES', amount: 3250, description: 'Electricity bill for primary warehouse block B', date: '2026-06-10' },
    { category: 'OTHER', amount: 750, description: 'Pantry supplies - Tea, coffee, sugar, and milk packets', date: '2026-06-12' },
    { category: 'OTHER', amount: 1250, description: 'Office stationery - Diaries, ball pens, markers, and folders', date: '2026-06-15' },
    { category: 'MAINTENANCE', amount: 850, description: 'Water filter cartridge replacement service charge', date: '2026-06-18' },
    { category: 'MAINTENANCE', amount: 450, description: 'Main gate door latch and lock lubrication repair', date: '2026-06-20' },
    { category: 'TRAVEL', amount: 650, description: 'Taxi fare for sales team client visit to chemical cluster', date: '2026-06-22' },
    { category: 'TRAVEL', amount: 120, description: 'Auto-rickshaw fare for urgent courier pickup from GPO', date: '2026-06-25' },
    { category: 'UTILITIES', amount: 900, description: 'Drinking water bottles (20 Litre cans) supply for June', date: '2026-06-28' },
    { category: 'OTHER', amount: 380, description: 'First-aid box emergency medicine kit refill', date: '2026-07-02' },
    { category: 'MAINTENANCE', amount: 1800, description: 'Routine AC filter cleaning and service for office', date: '2026-07-05' },
    { category: 'UTILITIES', amount: 1200, description: 'Monthly high-speed internet subscription for office (July)', date: '2026-07-06' }
  ];

  for (const exp of cheapExpenses) {
    await prisma.expense.create({
      data: {
        category: exp.category,
        amount: exp.amount,
        description: exp.description,
        date: new Date(`${exp.date}T00:00:00.000Z`),
        createdBy: adminUserId
      }
    });
  }

  // 9. Support Tickets
  console.log('Seeding support tickets...');
  // Clean existing tickets
  await prisma.supportTicket.deleteMany({});

  const tickets = [
    {
      submittedBy: adminUserId,
      type: 'BUG',
      priority: 'HIGH',
      title: 'Payslip download link gives 404 in employee dashboard',
      description: 'Newly joined employee reported that clicking the PDF download button in My Payslips results in a API 404 error.',
      status: 'OPEN'
    },
    {
      submittedBy: adminUserId,
      type: 'FEATURE_REQUEST',
      priority: 'LOW',
      title: 'Need bulk import template for client onboarding',
      description: 'Requested by sales managers. Importing 50 clients at once using Excel sheet is highly requested instead of adding manually one by one.',
      status: 'IN_PROGRESS'
    },
    {
      submittedBy: adminUserId,
      type: 'DATA_ISSUE',
      priority: 'MEDIUM',
      title: 'Duplicate attendance entry for Samarth on 15th June',
      description: 'Samarth has two present entries on 15th June calendar in attendance register view. Needs manual DB reconciliation.',
      status: 'OPEN'
    },
    {
      submittedBy: adminUserId,
      type: 'BUG',
      priority: 'MEDIUM',
      title: 'Holiday calendar does not show regional public holidays',
      description: 'Regional state holidays are not showing up in the Calendar dashboard view.',
      status: 'RESOLVED',
      resolution: 'Updated holiday configuration service to seed state-specific holiday codes.',
      resolvedBy: adminUserId
    },
    {
      submittedBy: adminUserId,
      type: 'OTHER',
      priority: 'LOW',
      title: 'Setup chemical handling safety training for new interns',
      description: 'Operations team needs to conduct a mandatory 2-hour safety protocols session for newly joined freshers.',
      status: 'CLOSED',
      resolution: 'Conducted successfully on 15th June 2026 at main training area.',
      resolvedBy: adminUserId
    }
  ];

  for (const t of tickets) {
    await prisma.supportTicket.create({
      data: {
        submittedBy: t.submittedBy,
        type: t.type,
        priority: t.priority,
        title: t.title,
        description: t.description,
        status: t.status,
        resolution: t.resolution || null,
        resolvedBy: t.resolvedBy || null
      }
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
