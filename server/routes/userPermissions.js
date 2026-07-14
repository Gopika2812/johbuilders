const express = require('express');
const router = express.Router();
const UserPermission = require('../models/UserPermission');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/user-permissions
// @desc    Get permissions configuration for all registered users
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    let configs = await UserPermission.find({});
    
    const defaultPages = [
      { pageId: 'dashboard', pageName: 'Dashboard' },
      { pageId: 'kpi_insights', pageName: 'KPI Insights' },
      { pageId: 'projects', pageName: 'Projects Directory' },
      { pageId: 'leads', pageName: 'Leads Directory' },
      { pageId: 'quotations', pageName: 'Quotation Records' },
      { pageId: 'crd_flow', pageName: 'CRD Flow' },
      { pageId: 'extra_works', pageName: 'Extra Works Flow' },
      { pageId: 'bank_loan', pageName: 'Bank Loan History' },
      { pageId: 'overall_collection', pageName: 'Overall Collection Report' },
      { pageId: 'sales_reports', pageName: 'Sales Reports' },
      { pageId: 'crd_reports', pageName: 'CRD Reports' },
      { pageId: 'customers', pageName: 'Customers' },
      { pageId: 'tasks_board', pageName: 'Tasks Board' },
      { pageId: 'employees', pageName: 'Employees' },
      { pageId: 'audit_logs', pageName: 'Audit Logs' },
      { pageId: 'finance_budget', pageName: 'Budget Planning' },
      { pageId: 'finance_lead', pageName: 'Lead Target Planning' },
      { pageId: 'finance_summary', pageName: 'Summary Planning' },
      { pageId: 'access_control', pageName: 'Access Control' },
      { pageId: 'settings', pageName: 'Settings' }
    ];

    const finalConfigs = [];
    for (let user of users) {
      let configDoc = configs.find(c => c.userId.toString() === user._id.toString());
      let config;
      if (!configDoc) {
        // Admin gets all by default, others get view-only or partial
        const permissions = defaultPages.map(page => ({
          pageId: page.pageId,
          pageName: page.pageName,
          canView: user.role === 'Admin' || page.pageId === 'dashboard',
          canEdit: user.role === 'Admin'
        }));
        
        config = { userId: user._id, userName: user.name, permissions };
      } else {
        config = configDoc.toObject();
        // Merge missing default pages into existing config
        defaultPages.forEach(dp => {
          if (!config.permissions.find(p => p.pageId === dp.pageId)) {
            config.permissions.push({
              pageId: dp.pageId,
              pageName: dp.pageName,
              canView: user.role === 'Admin',
              canEdit: user.role === 'Admin'
            });
          }
        });
      }
      finalConfigs.push(config);
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
