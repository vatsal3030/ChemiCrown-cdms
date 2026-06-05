const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflict Error',
      message: `A record with this ${err.meta.target.join(', ')} already exists.`
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not Found',
      message: 'The requested record was not found in the database.'
    });
  }

  // Fallback for unexpected errors
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong on the server.'
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `The route ${req.method} ${req.originalUrl} does not exist.`
  });
};

module.exports = { errorHandler, notFoundHandler };
