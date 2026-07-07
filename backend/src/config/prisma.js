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
  // In development, reuse the global instance across hot-reloads.
  // Use DIRECT_URL (port 5432) on localhost to bypass PgBouncer pooler limits
  // and prevent connection timeout/reachability errors during nodemon restarts.
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['warn', 'error'],
      datasources: {
        db: {
          url: process.env.DIRECT_URL || process.env.DATABASE_URL
        }
      }
    });
  }
  prisma = global.__prisma;
}

// Graceful shutdown — release all DB connections cleanly when terminated
const cleanDisconnect = async () => {
  console.log('[DB] Disconnecting Prisma Client cleanly...');
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error('[DB] Error during disconnect:', err);
  }
};

process.on('beforeExit', cleanDisconnect);
process.on('SIGINT', async () => {
  await cleanDisconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await cleanDisconnect();
  process.exit(0);
});

// Nodemon signal for restart
process.once('SIGUSR2', async () => {
  await cleanDisconnect();
  process.kill(process.pid, 'SIGUSR2');
});

module.exports = prisma;
