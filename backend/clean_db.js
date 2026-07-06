const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting Database Cleanup of Test Data...');

  // 1. Transactional and historical models
  console.log('Cleaning Order history, items, payments, and refunds...');
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.order.deleteMany({});

  // 2. Customer and Employee interactions
  console.log('Cleaning inquiries, reviews, favorites, contact messages, and notifications...');
  await prisma.review.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.inquiry.deleteMany({});
  await prisma.contactMessage.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.idempotencyKey.deleteMany({});

  // 3. Project management and operations
  console.log('Cleaning tasks, inventory transactions, and lots...');
  await prisma.task.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.lot.deleteMany({});

  // 4. HR and Employee payroll
  console.log('Cleaning HR employee warnings, leave requests, overtime, commissions, and payroll...');
  await prisma.employeeWarning.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.overtime.deleteMany({});
  await prisma.salesIncentive.deleteMany({});
  await prisma.salary.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.pFLedger.deleteMany({});

  // 5. Users, Customers, and Employee Profiles
  console.log('Cleaning employee profiles, customer profiles, and user accounts...');
  await prisma.employee.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  // 6. Holiday calendar (optional: let them re-seed using seed-holidays if needed)
  console.log('Cleaning holiday calendar...');
  await prisma.holidayCalendar.deleteMany({});

  // 7. Reset inventory quantity to default starting stock (100) for clean catalog
  console.log('Resetting inventory quantities to default baseline (100)...');
  await prisma.inventory.updateMany({
    data: {
      quantity: 100,
      minThreshold: 20
    }
  });

  // 8. Re-seed default Super Admin account so they are not locked out
  console.log('Re-seeding default administrative users...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@chemicrown.com',
      password: adminPasswordHash,
      role: 'SUPER_ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '9999999999',
      employeeProfile: {
        create: {
          jobTitle: 'Super Administrator',
          department: 'Management',
          isActive: true
        }
      }
    }
  });

  const managerPasswordHash = await bcrypt.hash('manager123', 10);
  await prisma.user.create({
    data: {
      email: 'manager@chemicrown.com',
      password: managerPasswordHash,
      role: 'MANAGER',
      firstName: 'Operations',
      lastName: 'Manager',
      phone: '8888888888',
      employeeProfile: {
        create: {
          jobTitle: 'Operations Manager',
          department: 'Operations',
          isActive: true
        }
      }
    }
  });

  console.log('✨ Clean database setup complete!');
  console.log('==================================================');
  console.log('Default credentials to log in:');
  console.log('1. Super Admin: admin@chemicrown.com / admin123');
  console.log('2. Manager:     manager@chemicrown.com / manager123');
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
