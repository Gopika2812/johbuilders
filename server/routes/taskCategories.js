const express = require('express');
const router = express.Router();
const TaskCategory = require('../models/TaskCategory');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
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
// @desc    Update / rename a task category & sync existing tasks & employees
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  const trimmed = name.trim();
  const safeTrimmedRegex = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    let category = null;
    if (id && id !== 'undefined' && mongoose.Types.ObjectId.isValid(id)) {
      category = await TaskCategory.findById(id);
    }
    
    // Fallback: search by name if not found by ID or if ID is a name
    if (!category && id && id !== 'undefined') {
      const decodedId = decodeURIComponent(id).trim();
      const safeIdRegex = decodedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      category = await TaskCategory.findOne({ name: new RegExp(`^${safeIdRegex}$`, 'i') });
    }

    let oldName = '';

    if (category) {
      oldName = category.name;
      // Check if another category already has this name
      const duplicate = await TaskCategory.findOne({
        _id: { $ne: category._id },
        name: new RegExp(`^${safeTrimmedRegex}$`, 'i')
      });
      if (duplicate) {
        return res.status(400).json({ message: `Department "${trimmed}" already exists` });
      }

      category.name = trimmed;
      await category.save();
    } else {
      // If category document doesn't exist yet in collection, check if name exists or create it
      const existing = await TaskCategory.findOne({ name: new RegExp(`^${safeTrimmedRegex}$`, 'i') });
      if (existing) {
        category = existing;
        oldName = existing.name;
      } else {
        category = new TaskCategory({
          name: trimmed,
          createdBy: req.user?._id
        });
        await category.save();
      }
      if (id && id !== 'undefined') {
        oldName = decodeURIComponent(id).trim();
      }
    }

    // Sync all tasks & employees with old category name to new category name
    if (oldName && oldName !== trimmed) {
      const safeOldRegex = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await UserTask.updateMany({ category: new RegExp(`^${safeOldRegex}$`, 'i') }, { category: trimmed });
      await User.updateMany({ department: new RegExp(`^${safeOldRegex}$`, 'i') }, { department: trimmed });
    }

    res.json(category);
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ message: err.message || 'Failed to update department' });
  }
});

// @route   DELETE /api/task-categories/:id
// @desc    Delete a task category
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') {
    return res.status(400).json({ message: 'Invalid category identifier' });
  }

  try {
    let category = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      category = await TaskCategory.findById(id);
    }
    if (!category) {
      const decodedId = decodeURIComponent(id).trim();
      const safeIdRegex = decodedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      category = await TaskCategory.findOne({ name: new RegExp(`^${safeIdRegex}$`, 'i') });
    }

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await TaskCategory.findByIdAndDelete(category._id);
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({ message: err.message || 'Failed to delete department' });
  }
});

module.exports = router;
