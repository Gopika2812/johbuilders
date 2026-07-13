const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Only one settings document should ever exist, but we use a key to ensure uniqueness
  key: {
    type: String,
    default: 'global',
    unique: true
  },
  stageColors: {
    type: Map,
    of: String,
    default: {
      'Booking': '#0a4c2c', // The dark green default
    }
  },
  stageTextColors: {
    type: Map,
    of: String,
    default: {
      'Booking': '#ffffff', // The default white text
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
