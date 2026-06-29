const mongoose = require('mongoose');

const BudgetPlanSchema = new mongoose.Schema({
  month: {
    type: String, // e.g. "2026-06"
    required: true,
    unique: true
  },
  allocations: [{
    groupName: String,
    source: String,
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    expenses: [{
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      description: String
    }]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('BudgetPlan', BudgetPlanSchema);
