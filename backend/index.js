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
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate Limiter middleware
const apiLimiter = rateLimit({
  windowMs: 1.5 * 60 * 1000, // 1.5 minutes
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
const categoryRoutes = require('./src/routes/category.routes');
const reviewRoutes = require('./src/routes/review.routes');

// API Routes will be mounted here
app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);

// Global Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
server.listen(PORT, () => {
  console.log(`✅ Backend server is actively listening on port ${PORT}`);
});
