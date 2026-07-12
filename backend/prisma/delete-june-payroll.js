const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting June 2026 payroll removal...');

  const month = '2026-06';

  // 1. Find all salaries for June 2026
  const salaries = await prisma.salary.findMany({
    where: { month }
  });

  console.log(`Found ${salaries.length} salary slips for June 2026.`);

  if (salaries.length === 0) {
    console.log('No June salary slips found.');
    return;
  }

  const salaryIds = salaries.map(s => s.id);

  // 2. Reset Overtimes that were linked to these salaries
  console.log('Resetting linked overtime status back to APPROVED...');
  const otUpdate = await prisma.overtime.updateMany({
    where: { salaryId: { in: salaryIds } },
    data: { status: 'APPROVED', salaryId: null }
  });
  console.log(`Updated ${otUpdate.count} overtime entries.`);

  // 3. Reset Sales Incentives that were linked to these salaries
  console.log('Resetting linked sales incentives status back to APPROVED...');
  const siUpdate = await prisma.salesIncentive.updateMany({
    where: { salaryId: { in: salaryIds } },
    data: { status: 'APPROVED', salaryId: null }
  });
  console.log(`Updated ${siUpdate.count} sales incentive entries.`);

  // 4. Delete the salary records
  console.log('Deleting June salary slips...');
  const deleteResult = await prisma.salary.deleteMany({
    where: { id: { in: salaryIds } }
  });
  console.log(`Deleted ${deleteResult.count} salary records.`);

  console.log('✅ June 2026 payroll successfully removed and component status reset!');
}

main()
  .catch((e) => {
    console.error('❌ Deletion error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
