const mongoose = require('mongoose');

const SummaryPlanSchema = new mongoose.Schema({
  month: {
    type: String, // e.g. "2026-06"
    required: true,
    unique: true
  },
  salesTarget: { type: Number, default: 0 },
  housesTarget: { type: Number, default: 0 },
  plotsTarget: { type: Number, default: 0 },
  projectTargets: [{
    projectId: String,
    enquiriesTarget: { type: Number, default: 0 },
    hotlistTarget: { type: Number, default: 0 },
    sitevisitsTarget: { type: Number, default: 0 },
    bookedTarget: { type: Number, default: 0 },
    valueTarget: { type: Number, default: 0 }
  }],
  marketingTargets: [{
    name: String,
    target: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('SummaryPlan', SummaryPlanSchema);
