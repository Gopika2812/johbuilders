const mongoose = require('mongoose');

const ParameterPlanSchema = new mongoose.Schema({
  month: {
    type: String, // e.g. "2026-06"
    required: true,
    unique: true
  },
  registrationsTarget: { type: Number, default: 0 },
  keyHandoverTarget: { type: Number, default: 0 },
  totalDebtorsTarget: { type: Number, default: 0 },
  collectionAmountTarget: { type: Number, default: 0 },
  npaValueTarget: { type: Number, default: 0 },
  bankLoansTarget: { type: Number, default: 0 },
  criticalIssuesTarget: { type: Number, default: 0 },
  customerComplaintsTarget: { type: Number, default: 0 },
  extraWorksTarget: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('ParameterPlan', ParameterPlanSchema);
