const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify local JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch the user's role from our Prisma database
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'Unauthorized: User not found in database' });
    }

    // Attach user and role to request object
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      phone: dbUser.phone
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of ${roles.join(', ')}` });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };
