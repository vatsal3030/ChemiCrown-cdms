const prisma = require('../config/prisma');

/**
 * POST /api/support
 * Submit a support ticket
 */
exports.createTicket = async (req, res, next) => {
  try {
    const { type, priority, title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        submittedBy: req.user.id,
        type: type || 'BUG',
        priority: priority || 'MEDIUM',
        title,
        description
      }
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'OWNER'] }, deletedAt: null }
    });
    await Promise.all(admins.map(admin =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          message: `[${priority || 'MEDIUM'} Priority] New ${type || 'BUG'} ticket: "${title}" from ${req.user.firstName} ${req.user.lastName}`
        }
      })
    ));

    res.status(201).json({ success: true, message: 'Ticket submitted successfully', data: ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/support
 * List all tickets (admin) or own tickets (employee)
 */
exports.getTickets = async (req, res, next) => {
  try {
    const { status, type, priority } = req.query;
    const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(req.user.role);

    const where = {};
    if (!isAdmin) where.submittedBy = req.user.id;
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
    });

    // Enrich with submitter name
    const userIds = [...new Set(tickets.map(t => t.submittedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const enriched = tickets.map(t => ({
      ...t,
      submitter: userMap[t.submittedBy] || null
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/support/:id/resolve
 * Admin resolves or closes a ticket
 */
exports.resolveTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    if (!['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedBy: status === 'RESOLVED' || status === 'CLOSED' ? req.user.id : undefined
      }
    });

    // Notify submitter
    await prisma.notification.create({
      data: {
        userId: ticket.submittedBy,
        message: `Your support ticket "${ticket.title}" has been updated to ${status}.${resolution ? ` Resolution: ${resolution}` : ''}`
      }
    });

    res.json({ success: true, message: 'Ticket updated', data: ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/support/:id
 * Admin deletes a closed ticket (cleanup)
 */
exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.supportTicket.delete({ where: { id } });
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/audit-logs
 * Admin views audit logs (read only, cannot create/update — industry standard)
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { userId, entity, action, from, to, page = 1, limit = 50, sortField = 'createdAt', sortOrder = 'desc' } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (entity) where.entity = { contains: entity, mode: 'insensitive' };
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } }
        },
        orderBy: { [sortField]: sortOrder },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ success: true, data: logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/audit-logs/:id
 */
exports.getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, role: true } }
      }
    });
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/audit-logs/:id
 * Admin can delete a single log entry (for compliance cleanup — industry standard)
 */
exports.deleteAuditLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.auditLog.delete({ where: { id } });
    res.json({ success: true, message: 'Audit log entry deleted' });
  } catch (error) {
    next(error);
  }
};
