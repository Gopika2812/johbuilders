const express = require('express');
const router = express.Router();
const LeadGroup = require('../models/LeadGroup');
const { protect } = require('../middleware/auth');

// @route   GET /api/lead-groups
// @desc    Get all lead groups
router.get('/', protect, async (req, res) => {
  try {
    const groups = await LeadGroup.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/lead-groups
// @desc    Create a lead group
router.post('/', protect, async (req, res) => {
  const { name, sources, budget, spent } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: 'Group Name is required' });
    }

    const exists = await LeadGroup.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'A group with this name already exists' });
    }

    const group = new LeadGroup({
      name,
      sources: sources || [],
      budget: Number(budget) || 0,
      spent: Number(spent) || 0
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/lead-groups/:id
// @desc    Update a lead group details
router.put('/:id', protect, async (req, res) => {
  const { name, sources, budget, spent } = req.body;
  try {
    const group = await LeadGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Lead group not found' });
    }

    if (name !== undefined) group.name = name;
    if (sources !== undefined) group.sources = sources;
    if (budget !== undefined) group.budget = Number(budget);
    if (spent !== undefined) group.spent = Number(spent);

    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/lead-groups/:id
// @desc    Delete a lead group
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await LeadGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Lead group not found' });
    }

    await LeadGroup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
