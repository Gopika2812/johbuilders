const express = require('express');
const router = express.Router();
const BudgetPlan = require('../models/BudgetPlan');
const { protect } = require('../middleware/auth');

// @route   GET /api/budget-plans/:month
// @desc    Get budget plan for a specific month
router.get('/:month', protect, async (req, res) => {
  try {
    let plan = await BudgetPlan.findOne({ month: req.params.month });
    if (!plan) {
      plan = { month: req.params.month, allocations: [] };
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/budget-plans
// @desc    Save or update monthly budget plan
router.post('/', protect, async (req, res) => {
  const { month, allocations } = req.body;
  try {
    if (!month) {
      return res.status(400).json({ message: 'Month string is required' });
    }

    let plan = await BudgetPlan.findOne({ month });
    if (plan) {
      plan.allocations = allocations || [];
      await plan.save();
    } else {
      plan = new BudgetPlan({ month, allocations: allocations || [] });
      await plan.save();
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
