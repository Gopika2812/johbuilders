const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const { protect, authorize } = require('../middleware/auth');

// GET settings (can be accessed by any authenticated user for rendering)
router.get('/', protect, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ key: 'global' });
    if (!settings) {
      // Create default settings if they don't exist
      settings = new SystemSettings({
        key: 'global',
        stageColors: {
          'Booking': '#0a4c2c'
        }
      });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching settings' });
  }
});

// PUT settings (restricted to Admin/Manager)
router.put('/', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ key: 'global' });
    if (!settings) {
      settings = new SystemSettings({ key: 'global' });
    }
    
    // Update stage colors
    if (req.body.stageColors) {
      settings.stageColors = req.body.stageColors;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating settings' });
  }
});

module.exports = router;
