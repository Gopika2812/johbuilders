const express = require('express');
const router = express.Router();
const RolePermission = require('../models/RolePermission');
const { protect } = require('../middleware/auth');

// @route   GET /api/role-permissions
// @desc    Get permissions configuration for all roles
router.get('/', protect, async (req, res) => {
  try {
    let configs = await RolePermission.find({});
    
    // Seed default permissions for any missing roles
    const roles = ['Admin', 'Manager', 'Sales Executive', 'Site Engineer'];
    const defaultPages = [
      { pageId: 'dashboard', pageName: 'Dashboard' },
      { pageId: 'projects', pageName: 'Project Master' },
      { pageId: 'leads', pageName: 'Leads Phase' },
      { pageId: 'employees', pageName: 'Employees' },
      { pageId: 'finance', pageName: 'Finance & Accounts' },
      { pageId: 'access_control', pageName: 'Access Control' },
      { pageId: 'settings', pageName: 'Settings' }
    ];

    const finalConfigs = [];
    for (let role of roles) {
      let config = configs.find(c => c.role === role);
      if (!config) {
        // Admin gets all by default, others get view-only or partial
        const permissions = defaultPages.map(page => ({
          pageId: page.pageId,
          pageName: page.pageName,
          canView: role === 'Admin' || page.pageId === 'dashboard',
          canEdit: role === 'Admin'
        }));
        
        config = { role, permissions };
      }
      finalConfigs.push(config);
    }

    res.json(finalConfigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/role-permissions
// @desc    Save permissions configuration for a specific role
router.post('/', protect, async (req, res) => {
  const { role, permissions } = req.body;
  try {
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    let config = await RolePermission.findOne({ role });
    if (config) {
      config.permissions = permissions || [];
      await config.save();
    } else {
      config = new RolePermission({ role, permissions: permissions || [] });
      await config.save();
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
