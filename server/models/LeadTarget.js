const mongoose = require('mongoose');

const LeadTargetSchema = new mongoose.Schema({
  month: {
    type: String, // e.g. "2026-06"
    required: true,
    unique: true
  },
  targets: [{
    source: String,
    target: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('LeadTarget', LeadTargetSchema);
