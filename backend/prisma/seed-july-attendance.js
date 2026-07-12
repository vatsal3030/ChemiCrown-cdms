const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting July 2026 attendance seeding up to today (July 12)...');

  // Get all employees
  const employees = await prisma.employee.findMany({
    include: { user: true }
  });

  console.log(`Found ${employees.length} employees to update.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const emp of employees) {
    const name = `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim();
    console.log(`Processing July attendance for: ${name}...`);

    for (let day = 1; day <= 12; day++) {
      const date = new Date(`2026-07-${String(day).padStart(2, '0')}T00:00:00.000Z`);
      const dayOfWeek = date.getUTCDay(); // 0 is Sunday

      if (dayOfWeek === 0) {
        // Skip Sunday
        continue;
      }

      // Check if attendance already exists for this day
      const nextDay = new Date(date);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      const existing = await prisma.attendance.findFirst({
        where: {
          employeeId: emp.id,
          date: { gte: date, lt: nextDay }
        }
      });

      if (existing) {
        // If they already have attendance, we leave it alone or update if it is empty/null
        if (!existing.status) {
          await prisma.attendance.update({
            where: { id: existing.id },
            data: { status: 'PRESENT' }
          });
          updatedCount++;
        }
      } else {
        // Create new realistic attendance
        let status = 'PRESENT';
        const rand = Math.random();
        if (rand < 0.04) {
          status = 'ABSENT';
        } else if (rand < 0.06) {
          status = 'HALF_DAY';
        } else if (rand < 0.08) {
          status = 'LEAVE';
        }

        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date,
            status
          }
        });
        createdCount++;
      }
    }
  }

  console.log(`✅ July attendance seeding completed! Created: ${createdCount}, Updated: ${updatedCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
