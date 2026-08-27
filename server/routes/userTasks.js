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

    // Role check: Only Superadmin / Admin can view all users' tasks. Regular users see only tasks assigned to or by them.
    const roleNorm = (req.user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
    const isSuperAdmin = roleNorm === 'superadmin' || roleNorm === 'admin';
    if (!isSuperAdmin) {
      query.$or = [
        { assignedTo: req.user._id },
        { assignedBy: req.user._id }
      ];
    }

    if (status && ['New', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].includes(status)) {
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
      .populate('history.updatedBy', 'name email role')
      .sort({ createdAt: -1, _id: -1 });

    if (search) {
      const term = search.toLowerCase();
      tasks = tasks.filter(task => 
        (task.title || '').toLowerCase().includes(term) ||
        (task.description || '').toLowerCase().includes(term) ||
        (task.projectName || '').toLowerCase().includes(term) ||
        (task.assignedTo?.name || '').toLowerCase().includes(term) ||
        (task.assignedBy?.name || '').toLowerCase().includes(term) ||
        (task.history && task.history.some(h => (h.note || '').toLowerCase().includes(term)))
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
      .populate('history.updatedBy', 'name email role')
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
  const { title, description, projectName, dueDate, assignedTo, status, priority, category, repeatType, reminderInterval, attachments, note } = req.body;

  if (!title || !dueDate || !assignedTo) {
    return res.status(400).json({ message: 'Title, Due Date, and Assigned Person are required' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDue = new Date(dueDate);
  selectedDue.setHours(0, 0, 0, 0);

  if (selectedDue < today) {
    return res.status(400).json({ message: 'Due date cannot be a past date. Please select today or a future date.' });
  }

  try {
    const targetUser = await User.findById(assignedTo);
    if (!targetUser) {
      return res.status(404).json({ message: 'Assigned User not found' });
    }

    const newTask = new UserTask({
      title,
      description,
      projectName: projectName ? projectName.trim() : '',
      dueDate,
      assignedTo: targetUser._id,
      assignedBy: req.user._id,
      status: status || 'New',
      priority: priority || 'Medium',
      category: category || 'General',
      repeatType: repeatType || 'None',
      reminderInterval: Number(reminderInterval) || 1,
      attachments: Array.isArray(attachments) ? attachments : [],
      actionTaken: false,
      snoozedBy: [],
      history: [
        {
          action: 'Task Created',
          status: status || 'New',
          updatedBy: req.user._id,
          note: note || (description ? `Task created: ${description}` : `Task created and assigned to ${targetUser.name}`),
          timestamp: new Date()
        }
      ]
    });

    await newTask.save();
    const populated = await UserTask.findById(newTask._id)
      .populate('assignedTo', 'name email role phone')
      .populate('assignedBy', 'name email role phone')
      .populate('history.updatedBy', 'name email role');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/user-tasks/:id
// @desc    Update task details or status
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { title, description, projectName, dueDate, assignedTo, status, priority, category, repeatType, reminderInterval, actionTaken, attachments, note } = req.body;

  try {
    const task = await UserTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    let changeDesc = [];
    if (title !== undefined && title !== task.title) {
      changeDesc.push(`Title changed from "${task.title}" to "${title}"`);
      task.title = title;
    }
    if (description !== undefined && description !== task.description) {
      changeDesc.push(`Description updated`);
      task.description = description;
    }
    if (projectName !== undefined && projectName !== task.projectName) {
      changeDesc.push(`Project name changed to "${projectName}"`);
      task.projectName = projectName;
    }
    if (dueDate !== undefined && new Date(dueDate).toISOString() !== new Date(task.dueDate).toISOString()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDue = new Date(dueDate);
      selectedDue.setHours(0, 0, 0, 0);

      if (selectedDue < today) {
        return res.status(400).json({ message: 'Due date cannot be a past date. Please select today or a future date.' });
      }

      changeDesc.push(`Due date updated to ${new Date(dueDate).toLocaleDateString()}`);
      task.dueDate = dueDate;
    }
    if (priority !== undefined && priority !== task.priority) {
      changeDesc.push(`Priority changed to ${priority}`);
      task.priority = priority;
    }
    if (category !== undefined && category !== task.category) {
      changeDesc.push(`Category changed to ${category}`);
      task.category = category;
    }
    if (repeatType !== undefined) task.repeatType = repeatType;
    if (reminderInterval !== undefined) task.reminderInterval = Number(reminderInterval) || 1;
    if (attachments !== undefined && Array.isArray(attachments)) task.attachments = attachments;

    if (assignedTo !== undefined && task.assignedTo.toString() !== assignedTo.toString()) {
      const targetUser = await User.findById(assignedTo);
      if (targetUser) {
        changeDesc.push(`Reassigned to ${targetUser.name} (${targetUser.role})`);
        task.snoozedBy = [];
        task.actionTaken = false;
        task.assignedTo = targetUser._id;
      }
    }
    if (status !== undefined && status !== task.status) {
      changeDesc.push(`Status changed from ${task.status} to ${status}`);
      task.status = status;
      if (status === 'Completed') {
        task.actionTaken = true;
      }
    }
    if (actionTaken !== undefined) task.actionTaken = actionTaken;

    // Record history log if changes occurred or note was provided
    if (changeDesc.length > 0 || note) {
      task.history.push({
        action: status !== undefined ? `Status: ${status}` : 'Task Updated',
        status: task.status,
        updatedBy: req.user._id,
        note: note ? note.trim() : changeDesc.join('; '),
        timestamp: new Date()
      });
    }

    await task.save();

    const populated = await UserTask.findById(task._id)
      .populate('assignedTo', 'name email role phone')
      .populate('assignedBy', 'name email role phone')
      .populate('history.updatedBy', 'name email role');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/user-tasks/:id/comments
// @desc    Add comment / login history note to task
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  const { note, action } = req.body;
  if (!note || !note.trim()) {
    return res.status(400).json({ message: 'Reply note is required' });
  }

  try {
    const task = await UserTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    let defaultAction = 'Reply';
    if (task.assignedTo && req.user._id.toString() === task.assignedTo.toString()) {
      defaultAction = 'Reply to Assigner';
    } else if (task.assignedBy && req.user._id.toString() === task.assignedBy.toString()) {
      defaultAction = 'Reply to Assignee';
    }

    task.history.push({
      action: action || defaultAction,
      status: task.status,
      updatedBy: req.user._id,
      note: note.trim(),
      timestamp: new Date()
    });

    await task.save();

    const populated = await UserTask.findById(task._id)
      .populate('assignedTo', 'name email role phone')
      .populate('assignedBy', 'name email role phone')
      .populate('history.updatedBy', 'name email role');

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

// @route   POST /api/user-tasks/:id/attachments
// @desc    Add attachment to task
// @access  Private
router.post('/:id/attachments', protect, async (req, res) => {
  const { url, name } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'Attachment URL is required' });
  }
  try {
    const task = await UserTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.attachments.push({
      url,
      name: name || 'Attachment',
      uploadedAt: new Date()
    });

    task.history.push({
      action: 'Attachment Added',
      status: task.status,
      updatedBy: req.user._id,
      note: `Added attachment: ${name || 'Image'}`,
      timestamp: new Date()
    });

    await task.save();

    const populated = await UserTask.findById(task._id)
      .populate('assignedTo', 'name email role phone')
      .populate('assignedBy', 'name email role phone')
      .populate('history.updatedBy', 'name email role');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/user-tasks/:id/attachments/:attachmentId
// @desc    Remove attachment from task
// @access  Private
router.delete('/:id/attachments/:attachmentId', protect, async (req, res) => {
  try {
    const task = await UserTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.attachments = task.attachments.filter(att => att._id.toString() !== req.params.attachmentId);
    await task.save();

    const populated = await UserTask.findById(task._id)
      .populate('assignedTo', 'name email role phone')
      .populate('assignedBy', 'name email role phone')
      .populate('history.updatedBy', 'name email role');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
