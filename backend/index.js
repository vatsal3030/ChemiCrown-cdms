require('dotenv').config();

// ── Startup: validate required environment variables ──────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌ FATAL: Missing required environment variables:\n  ${missing.join('\n  ')}\n`);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const { errorHandler, notFoundHandler } = require('./src/middlewares/error.middleware');

const app = express();
const server = http.createServer(app);

// ── Allowed origins ───────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Socket origin not allowed'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO: verify JWT on handshake so we know who's connecting
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized: no token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error('Unauthorized: invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join a personal room so we can emit to specific users
  socket.join(socket.userId);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Socket] Connected: ${socket.id} (user: ${socket.userId}, role: ${socket.userRole})`);
  }

  socket.on('disconnect', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    }
  });
});

const PORT = process.env.PORT || 5000;

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
// Auth endpoints: strict (prevents brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many auth attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failures
});

// General API: generous (300 req/min per IP covers normal dashboard usage)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Contact form: strict (5 per 10 minutes per IP) to prevent spam
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { error: 'Too many messages sent. Please wait 10 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// Will apply contactLimiter directly to the route

app.use('/api', apiLimiter);

// ── Make io accessible inside route controllers ───────────────────────────────
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Health check (no auth, no rate limit) ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});



// ── API Root Splash Page ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ChemiCrown API</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { text-align: center; background: white; padding: 3rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { margin: 0 0 0.5rem 0; color: #1e40af; }
        p { color: #64748b; margin-bottom: 2rem; }
        .pulse { display: inline-block; width: 10px; height: 10px; background-color: #22c55e; border-radius: 50%; margin-right: 8px; box-shadow: 0 0 0 rgba(34, 197, 94, 0.4); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🧪</div>
        <h1>ChemiCrown CDMS API</h1>
        <p><span class="pulse"></span> All systems operational</p>
        <p style="font-size: 0.875rem;">This is the backend server. Please visit the frontend application to use the platform.</p>
      </div>
    </body>
    </html>
  `);
});

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes       = require('./src/routes/auth.routes');
const hrRoutes         = require('./src/routes/hr.routes');
const ordersRoutes     = require('./src/routes/orders.routes');
const inventoryRoutes  = require('./src/routes/inventory.routes');
const analyticsRoutes  = require('./src/routes/analytics.routes');
const notificationRoutes = require('./src/routes/notifications.routes');
const trashRoutes      = require('./src/routes/trash.routes');
const tasksRoutes      = require('./src/routes/tasks.routes');
const categoryRoutes   = require('./src/routes/category.routes');
const reviewRoutes     = require('./src/routes/review.routes');
const contactRoutes    = require('./src/routes/contact.routes');

app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactLimiter, contactRoutes);
const favoritesRoutes  = require('./src/routes/favorites.routes');
const payrollRoutes    = require('./src/routes/payroll.routes');
const financeRoutes    = require('./src/routes/finance.routes');
const leavesRoutes     = require('./src/routes/leaves.routes');
const supportRoutes    = require('./src/routes/support.routes');
const holidayRoutes    = require('./src/routes/holiday.routes');
const overtimeRoutes   = require('./src/routes/overtime.routes');
const incentiveRoutes  = require('./src/routes/incentive.routes');

app.use('/api/auth',          authRoutes);
app.use('/api/hr',            hrRoutes);
app.use('/api/orders',        ordersRoutes);
app.use('/api/inventory',     inventoryRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/trash',         trashRoutes);
app.use('/api/tasks',         tasksRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/favorites',     favoritesRoutes);
app.use('/api/payroll',       payrollRoutes);
app.use('/api/finance',       financeRoutes);
app.use('/api/leaves',        leavesRoutes);
app.use('/api/support',       supportRoutes);
app.use('/api/holidays',      holidayRoutes);
app.use('/api/overtime',      overtimeRoutes);
app.use('/api/incentives',    incentiveRoutes);

// ── Global error handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`✅ ChemiCrown backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// ── Export io helper for targeted notifications ───────────────────────────────
// Controllers use: emitToUser(req.io, userId, event, data)
// This keeps socket logic out of every controller
const emitToUser = (ioInstance, userId, event, data) => {
  if (ioInstance && userId) {
    ioInstance.to(userId).emit(event, data);
  }
};
module.exports = { app, server, io, emitToUser };
