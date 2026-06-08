const { PrismaClient } = require('@prisma/client');

// Singleton pattern — prevents multiple Prisma clients in dev hot-reloads
// In production (NODE_ENV=production), always creates exactly one instance
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['warn', 'error'],
    errorFormat: 'minimal',
  });
} else {
  // In development, reuse the global instance across hot-reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

// Graceful shutdown — release all DB connections cleanly
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
