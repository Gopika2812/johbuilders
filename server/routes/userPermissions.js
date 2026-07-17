const express = require('express');
const router = express.Router();
const UserPermission = require('../models/UserPermission');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getMergedPermissions } = require('../utils/permissionHelper');

// @route   GET /api/user-permissions
// @desc    Get permissions configuration for all registered users
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    const finalConfigs = [];
    for (let user of users) {
      const permissions = await getMergedPermissions(user);
      finalConfigs.push({
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        permissions
      });
    }

    res.json(finalConfigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/user-permissions
// @desc    Save permissions configuration for a specific user
router.post('/', protect, async (req, res) => {
  const { userId, userName, permissions } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    let config = await UserPermission.findOne({ userId });
    if (config) {
      config.permissions = permissions || [];
      if (userName) config.userName = userName;
      await config.save();
    } else {
      config = new UserPermission({ 
        userId, 
        userName: userName || 'Unknown User', 
        permissions: permissions || [] 
      });
      await config.save();
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
