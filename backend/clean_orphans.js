const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const result = await prisma.$executeRawUnsafe(`DELETE FROM "Employee" WHERE "userId" NOT IN (SELECT id FROM "User")`);
    console.log('Cleaned orphaned employees:', result);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
