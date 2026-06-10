const prisma = require('../config/prisma');

exports.getTasks = async (req, res, next) => {
  try {
    const { status, assignee } = req.query;
    
    let where = { deletedAt: null };
    
    // If not admin, they only see tasks assigned to them OR assigned by them
    if (!['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(req.user.role)) {
      where.OR = [
        { assignedTo: { userId: req.user.id } },
        { assignedById: req.user.id }
      ];
    } else {
      if (assignee) where.assignedToId = assignee;
    }

    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } } },
        assignedBy: { select: { firstName: true, lastName: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } } },
        assignedBy: { select: { firstName: true, lastName: true, email: true, role: true } }
      }
    });

    if (!task || task.deletedAt) return res.status(404).json({ error: 'Task not found' });

    // Role check
    const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(req.user.role);
    const isAssignee = task.assignedTo?.userId === req.user.id;
    const isAssigner = task.assignedById === req.user.id;

    if (!isAdmin && !isAssignee && !isAssigner) {
      return res.status(403).json({ error: 'Not authorized to view this task' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
    try {
      const { title, description, assignedToId, dueDate } = req.body;
      
      if (!title || !assignedToId) {
        return res.status(400).json({ error: 'Title and Assignee are required' });
      }

      // Role check: Only SUPER_ADMIN, OWNER, MANAGER, HR can create tasks for others
      if (!['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'You do not have permission to assign tasks.' });
      }

      const employee = await prisma.employee.findUnique({ where: { id: assignedToId } });
      if (!employee) return res.status(404).json({ error: 'Assignee not found' });

      const task = await prisma.$transaction(async (tx) => {
        const newTask = await tx.task.create({
          data: {
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : null,
            assignedToId,
            assignedById: req.user.id
          },
          include: {
            assignedTo: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            assignedBy: { select: { firstName: true, lastName: true, email: true } }
          }
        });

        await tx.notification.create({
          data: {
            userId: employee.userId,
            message: `You have been assigned a new task: "${title}" by ${req.user.firstName || 'Admin'}. ${dueDate ? `Due date: ${new Date(dueDate).toLocaleDateString()}` : ''}`
          }
        });

        return newTask;
      });

      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true }
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Can only update if they are the assignee or an admin
    const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(req.user.role);
    const isAssignee = task.assignedTo.userId === req.user.id;
    const isAssigner = task.assignedById === req.user.id;

    if (!isAdmin && !isAssignee && !isAssigner) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const taskRes = await tx.task.update({
        where: { id },
        data: { status },
        include: { assignedTo: { select: { userId: true } } }
      });
      
      // Notify the assigner and the assignee (if updated by the other)
      const notifyUserId = isAssignee ? task.assignedById : task.assignedTo.userId;
      if (notifyUserId) {
        await tx.notification.create({
          data: {
            userId: notifyUserId,
            message: `Task "${task.title}" status changed to ${status} by ${req.user.firstName || 'System'}`,
            type: "SYSTEM"
          }
        });
      }
      
      return taskRes;
    });

    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to delete tasks' });
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ success: true, message: 'Task soft-deleted' });
  } catch (error) {
    next(error);
  }
};
