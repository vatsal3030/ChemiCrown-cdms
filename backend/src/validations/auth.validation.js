const { z } = require('zod');

const syncUserSchema = z.object({
  body: z.object({
    id: z.string().uuid({ message: "Invalid user ID format" }),
    email: z.string().email({ message: "Invalid email format" }),
    role: z.enum(['SUPER_ADMIN', 'MANAGER', 'SALES', 'CUSTOMER']).optional(),
  }),
  query: z.any(),
  params: z.any(),
});

module.exports = { syncUserSchema };
