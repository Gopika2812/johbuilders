const express = require('express');
const router = express.Router();
const RolePermission = require('../models/RolePermission');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const defaultPages = [
  { pageId: 'dashboard', pageName: 'Dashboard' },
  { pageId: 'projects', pageName: 'Project Master' },
  { pageId: 'leads', pageName: 'Leads Phase' },
  { pageId: 'employees', pageName: 'Employees' },
  { pageId: 'finance', pageName: 'Finance & Accounts' },
  { pageId: 'access_control', pageName: 'Access Control' },
  { pageId: 'settings', pageName: 'Settings' }
];

const defaultRoles = ['Superadmin', 'Crd team', 'sales person', 'ped team', 'accounts team'];

// @route   GET /api/role-permissions
// @desc    Get permissions configuration for all roles
router.get('/', protect, async (req, res) => {
  try {
    let configs = await RolePermission.find({});
    
    // Seed default permissions for any missing default roles
    for (let role of defaultRoles) {
      let config = configs.find(c => c.role.toLowerCase() === role.toLowerCase());
      if (!config) {
        const permissions = defaultPages.map(page => ({
          pageId: page.pageId,
          pageName: page.pageName,
          canView: role.toLowerCase() === 'superadmin' || page.pageId === 'dashboard',
          canEdit: role.toLowerCase() === 'superadmin'
        }));
        
        config = new RolePermission({ role, permissions });
        await config.save();
        configs.push(config);
      }
    }

    res.json(configs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/role-permissions
// @desc    Save permissions configuration for a specific role or create new role
router.post('/', protect, authorize('Superadmin'), async (req, res) => {
  const { role, permissions } = req.body;
  try {
    if (!role || !role.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const trimmedRole = role.trim();
    let config = await RolePermission.findOne({ 
      role: { $regex: new RegExp(`^${trimmedRole}$`, 'i') } 
    });

    const permsToSave = (permissions && permissions.length > 0) 
      ? permissions 
      : defaultPages.map(page => ({
          pageId: page.pageId,
          pageName: page.pageName,
          canView: trimmedRole.toLowerCase() === 'superadmin' || page.pageId === 'dashboard',
          canEdit: trimmedRole.toLowerCase() === 'superadmin'
        }));

    if (config) {
      config.role = trimmedRole;
      config.permissions = permsToSave;
      await config.save();
    } else {
      config = new RolePermission({ 
        role: trimmedRole, 
        permissions: permsToSave 
      });
      await config.save();
    }

    if (req.user) {
      await AuditLog.create({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'Configure Role',
        description: `Created or updated permissions for role: ${trimmedRole}`
      });
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/role-permissions/:role
// @desc    Delete custom role
router.delete('/:role', protect, authorize('Superadmin'), async (req, res) => {
  try {
    const roleName = decodeURIComponent(req.params.role);
    if (defaultRoles.some(r => r.toLowerCase() === roleName.toLowerCase())) {
      return res.status(400).json({ message: 'System default roles cannot be deleted' });
    }

    // Check if any employees are assigned to this role
    const assignedCount = await User.countDocuments({ role: { $regex: new RegExp(`^${roleName}$`, 'i') } });
    if (assignedCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role "${roleName}" because ${assignedCount} employee(s) are currently assigned to it.` 
      });
    }

    await RolePermission.findOneAndDelete({ role: { $regex: new RegExp(`^${roleName}$`, 'i') } });

    if (req.user) {
      await AuditLog.create({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'Delete Role',
        description: `Deleted custom role: ${roleName}`
      });
    }

    res.json({ message: `Role "${roleName}" deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

