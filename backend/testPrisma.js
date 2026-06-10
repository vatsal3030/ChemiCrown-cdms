const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function run() {
  try {
    const u = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    console.log("User:", u.id);
    const e = await prisma.employee.findUnique({
      where: { userId: u.id },
      include: { attendances: true, salaries: true }
    });
    console.log("Employee:", e);
  } catch(err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
