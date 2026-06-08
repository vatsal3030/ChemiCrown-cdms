const errorHandler = (err, req, res, next) => {
  // Only log in non-production or for unexpected errors
  if (process.env.NODE_ENV !== 'production' || !err.code) {
    console.error('[Error Middleware]:', err.message || err);
  }

  // ── Prisma known errors ───────────────────────────────────────────────────
  // P2002 — Unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({
      error: 'Conflict',
      message: `A record with this ${fields} already exists.`,
    });
  }

  // P2025 — Record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not Found',
      message: err.meta?.cause || 'The requested record was not found.',
    });
  }

  // P2003 — Foreign key constraint failed
  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'This action references a related record that does not exist.',
    });
  }

  // P2014 — Relation violation
  if (err.code === 'P2014') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'The change you are trying to make would violate a required relation.',
    });
  }

  // P1001 — Can't reach database
  if (err.code === 'P1001') {
    console.error('[DB] Cannot reach database server:', err.meta);
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database is temporarily unreachable. Please try again shortly.',
    });
  }

  // P1008 — Database query timeout
  if (err.code === 'P1008') {
    return res.status(504).json({
      error: 'Gateway Timeout',
      message: 'The database query timed out. Please try again.',
    });
  }

  // P1017 — Server closed the connection
  if (err.code === 'P1017') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection was lost. Please try again.',
    });
  }

  // P2000 — Input value too long for column
  if (err.code === 'P2000') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'One of the input values is too long.',
    });
  }

  // PrismaClientInitializationError (connection pool exhausted, etc.)
  if (err.name === 'PrismaClientInitializationError' || err.name === 'PrismaClientUnknownRequestError') {
    console.error('[DB] Prisma client error:', err.message);
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database is temporarily unavailable. Please try again.',
    });
  }

  // ── JWT errors (shouldn't reach here, but as a fallback) ─────────────────
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token.' });
  }

  // ── CORS errors ───────────────────────────────────────────────────────────
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Forbidden', message: 'CORS policy does not allow this origin.' });
  }

  // ── Validation errors (express-validator / Zod) ───────────────────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid JSON in request body.' });
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : (err.message || 'Unexpected error'),
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `${req.method} ${req.originalUrl} does not exist.`,
  });
};

module.exports = { errorHandler, notFoundHandler };
