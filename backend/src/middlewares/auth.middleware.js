const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Startup guard: crash loudly if JWT secret is missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
}

/**
 * requireAuth — lightweight, no DB hit.
 * Decodes the JWT and attaches payload to req.user.
 * Use for all standard authenticated routes.
 */
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user from JWT — no DB round-trip needed for basic auth
    // The JWT was signed by us at login and contains: id, email, role
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * requireAuthStrict — verifies user still exists and is NOT soft-deleted.
 * Makes one DB query. Use ONLY for sensitive routes:
 * payroll disbursement, finance operations, HR changes, role mutations.
 */
const requireAuthStrict = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        deletedAt: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImageUrl: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'Unauthorized: Account not found' });
    }
    if (dbUser.deletedAt) {
      return res.status(401).json({ error: 'Unauthorized: Account has been deactivated' });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      phone: dbUser.phone,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    console.error('Auth Strict Middleware Error:', error.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * requireRole — RBAC guard. Call AFTER requireAuth or requireAuthStrict.
 * @param {string[]} roles  Allowed roles for this route
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: This action requires one of: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { requireAuth, requireAuthStrict, requireRole };
