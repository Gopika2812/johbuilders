const mongoose = require('mongoose');

const LeadGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  sources: {
    type: [String],
    default: []
  },
  budget: {
    type: Number,
    default: 0
  },
  spent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeadGroup', LeadGroupSchema);
