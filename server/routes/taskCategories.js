const express = require('express');
const router = express.Router();
const TaskCategory = require('../models/TaskCategory');
const UserTask = require('../models/UserTask');
const { protect } = require('../middleware/auth');

const DEFAULT_CATEGORIES = [
  'Sales Team',
  'CRD Team',
  'Accounts Team',
  'Administration (Superadmins)',
  'General'
];

const mongoose = require('mongoose');

// @route   GET /api/task-categories
// @desc    Get all task categories (auto-seeds defaults if empty or missing)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    for (const catName of DEFAULT_CATEGORIES) {
      const safeRegex = catName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exists = await TaskCategory.findOne({ name: new RegExp(`^${safeRegex}$`, 'i') });
      if (!exists) {
        await TaskCategory.create({ name: catName, createdBy: req.user._id });
      }
    }

    const categories = await TaskCategory.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/task-categories
// @desc    Create a new task category
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  const trimmed = name.trim();
  const safeRegex = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    const exists = await TaskCategory.findOne({ name: new RegExp(`^${safeRegex}$`, 'i') });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new TaskCategory({
      name: trimmed,
      createdBy: req.user?._id
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: err.message || 'Failed to create category' });
  }
});

// @route   PUT /api/task-categories/:id
// @desc    Update / rename a task category & sync existing tasks
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  const trimmed = name.trim();

  try {
    const category = await TaskCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const oldName = category.name;

    // Check if new name already exists elsewhere
    const duplicate = await TaskCategory.findOne({
      _id: { $ne: category._id },
      name: new RegExp(`^${trimmed}$`, 'i')
    });
    if (duplicate) {
      return res.status(400).json({ message: 'Another category with this name already exists' });
    }

    category.name = trimmed;
    await category.save();

    // Sync all tasks with old category name to new category name
    if (oldName !== trimmed) {
      await UserTask.updateMany({ category: oldName }, { category: trimmed });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/task-categories/:id
// @desc    Delete a task category
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  try {
    const category = await TaskCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await TaskCategory.findByIdAndDelete(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
