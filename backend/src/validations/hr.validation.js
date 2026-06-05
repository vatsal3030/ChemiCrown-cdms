const { z } = require('zod');

const markAttendanceSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    date: z.string().datetime().optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'])
  }),
  query: z.any(),
  params: z.any(),
});

const logSalarySchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    month: z.string(), // e.g., "YYYY-MM"
    amount: z.number().positive(),
    status: z.enum(['PENDING', 'PAID']).optional()
  }),
  query: z.any(),
  params: z.any(),
});

module.exports = { markAttendanceSchema, logSalarySchema };
