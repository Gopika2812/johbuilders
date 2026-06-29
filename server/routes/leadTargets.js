const express = require('express');
const router = express.Router();
const LeadTarget = require('../models/LeadTarget');
const { protect } = require('../middleware/auth');

// @route   GET /api/lead-targets/:month
// @desc    Get targets for a specific month
router.get('/:month', protect, async (req, res) => {
  try {
    let plan = await LeadTarget.findOne({ month: req.params.month });
    if (!plan) {
      plan = { month: req.params.month, targets: [] };
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/lead-targets
// @desc    Save or update monthly targets config
router.post('/', protect, async (req, res) => {
  const { month, targets } = req.body;
  try {
    if (!month) {
      return res.status(400).json({ message: 'Month string is required' });
    }

    let plan = await LeadTarget.findOne({ month });
    if (plan) {
      plan.targets = targets || [];
      await plan.save();
    } else {
      plan = new LeadTarget({ month, targets: targets || [] });
      await plan.save();
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
