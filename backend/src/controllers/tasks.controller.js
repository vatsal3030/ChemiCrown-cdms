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

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, assignedToId } = req.body;
    
    if (!title || !assignedToId) {
      return res.status(400).json({ error: 'Title and Assignee are required' });
    }

    // Role check: Only SUPER_ADMIN, OWNER, MANAGER, HR can create tasks for others
    if (!['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to assign tasks.' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedToId,
        assignedById: req.user.id
      },
      include: {
        assignedTo: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        assignedBy: { select: { firstName: true, lastName: true, email: true } }
      }
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

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status }
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
