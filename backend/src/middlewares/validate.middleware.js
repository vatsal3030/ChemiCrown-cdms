const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate the body, query, and params against the provided Zod schema
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error.errors) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({ error: 'Validation Error', details: error.message });
    }
  };
};

module.exports = { validateRequest };
