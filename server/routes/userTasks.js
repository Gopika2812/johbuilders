const express = require('express');
const router = express.Router();
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/user-tasks
// @desc    Get all user tasks
// @access  Private (All authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;
    let query = {};

    // If user is not Superadmin, show only tasks assigned to them or assigned by them
    if (req.user.role !== 'Superadmin') {
      query.$or = [
        { assignedTo: req.user._id },
        { assignedBy: req.user._id }
      ];
    }

    if (status && ['New', 'In Progress', 'Completed'].includes(status)) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.dueDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dueDate.$lte = end;
      }
    }

    let tasks = await UserTask.find(query)
      .populate('assignedTo', 'name email role phone')
      .populate('assignedBy', 'name email role phone')
      .sort({ dueDate: 1, createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      tasks = tasks.filter(task => 
        (task.title || '').toLowerCase().includes(term) ||
        (task.description || '').toLowerCase().includes(term) ||
        (task.assignedTo?.name || '').toLowerCase().includes(term) ||
        (task.assignedBy?.name || '').toLowerCase().includes(term)
      );
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/user-tasks/notifications
// @desc    Get pending task notifications for the current user
// @access  Private
router.get('/notifications', protect, async (req, res) => {
  try {
    const tasks = await UserTask.find({
      assignedTo: req.user._id,
      status: { $ne: 'Completed' },
      actionTaken: false,
      snoozedBy: { $ne: req.user._id }
    })
      .populate('assignedBy', 'name role')
      .populate('assignedTo', 'name role')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/user-tasks
// @desc    Create a new task
// @access  Private (All authenticated users)
router.post('/', protect, async (req, res) => {
  const { title, description, dueDate, assignedTo, status } = req.body;

  if (!title || !dueDate || !assignedTo) {
    return res.status(400).json({ message: 'Title, Due Date, and Assigned Person are required' });
  }

  try {
    const targetUser = await User.findById(assignedTo);
    if (!targetUser) {
      return res.status(404).json({ message: 'Assigned User not found' });
    }

    const newTask = new UserTask({
      title,
      description,
      dueDate,
      assignedTo: targetUser._id,
      assignedBy: req.user._id,
      status: status || 'New',
      actionTaken: false,
      snoozedBy: []
    });

    await newTask.save();
    const populated = await UserTask.findById(newTask._id)
      .populate('assignedTo', 'name email role phone')
      .populate('assignedBy', 'name email role phone');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/user-tasks/:id
// @desc    Update task details or status
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { title, description, dueDate, assignedTo, status, actionTaken } = req.body;

  try {
    const task = await UserTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined) {
      const targetUser = await User.findById(assignedTo);
      if (targetUser) {
        // If assigned person changes, reset snoozedBy and actionTaken so new assignee gets notified
        if (task.assignedTo.toString() !== targetUser._id.toString()) {
          task.snoozedBy = [];
          task.actionTaken = false;
        }
        task.assignedTo = targetUser._id;
      }
    }
    if (status !== undefined) {
      task.status = status;
      if (status === 'Completed') {
        task.actionTaken = true;
      }
    }
    if (actionTaken !== undefined) task.actionTaken = actionTaken;

    await task.save();

    const populated = await UserTask.findById(task._id)
      .populate('assignedTo', 'name email role phone')
      .populate('assignedBy', 'name email role phone');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/user-tasks/:id/action
// @desc    Mark notification action as taken ("Take Action")
// @access  Private
router.put('/:id/action', protect, async (req, res) => {
  try {
    const task = await UserTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.actionTaken = true;
    await task.save();

    res.json({ message: 'Action taken on task notification', task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/user-tasks/:id/snooze
// @desc    Snooze notification for current user ("Ask Me Later")
// @access  Private
router.put('/:id/snooze', protect, async (req, res) => {
  try {
    const task = await UserTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.snoozedBy.includes(req.user._id)) {
      task.snoozedBy.push(req.user._id);
      await task.save();
    }

    res.json({ message: 'Task notification snoozed', task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/user-tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await UserTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await UserTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
