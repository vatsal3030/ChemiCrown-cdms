require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const { errorHandler, notFoundHandler } = require('./src/middlewares/error.middleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', // Default Vite frontend port
  credentials: true
}));

// Rate Limiter middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

// Make io accessible to our routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'ChemiCrown CDMS API is running successfully in pure JavaScript!' 
  });
});

// Import Routes
const authRoutes = require('./src/routes/auth.routes');
const hrRoutes = require('./src/routes/hr.routes');
const ordersRoutes = require('./src/routes/orders.routes');
const inventoryRoutes = require('./src/routes/inventory.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const notificationsRoutes = require('./src/routes/notifications.routes');

// API Routes will be mounted here
app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Global Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
server.listen(PORT, () => {
  console.log(`✅ Backend server is actively listening on port ${PORT}`);
});
