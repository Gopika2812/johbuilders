const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/employees
// @desc    Get all employees
router.get('/', protect, async (req, res) => {
  try {
    const { excludeSuperadmin } = req.query;
    let query = {};
    if (excludeSuperadmin === 'true') {
      query = {
        role: { $nin: ['Superadmin', 'superadmin', 'Super Admin'] },
        name: { $ne: 'Super Admin' }
      };
    }
    const employees = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/employees/:id/approve
// @desc    Approve/Reject employee access
router.put('/:id/approve', protect, authorize('Superadmin'), async (req, res) => {
  const { isApproved } = req.body;

  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.isApproved = isApproved;
    await employee.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Approve Access',
      description: `${isApproved ? 'Approved' : 'Revoked'} access for employee ${employee.name} (${employee.email})`
    });

    res.json({ message: 'Employee approval status updated', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/employees/:id/role
// @desc    Change employee role (RBAC assignment)
router.put('/:id/role', protect, authorize('Superadmin'), async (req, res) => {
  const { role } = req.body;

  if (!['Superadmin', 'Crd team', 'sales person', 'ped team', 'accounts team'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const oldRole = employee.role;
    employee.role = role;
    await employee.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Change Role',
      description: `Changed role of employee ${employee.name} from ${oldRole} to ${role}`
    });

    res.json({ message: 'Employee role updated successfully', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update full employee details (Name, Email, Phone, Role, Password, Approval)
router.put('/:id', protect, authorize('Superadmin'), async (req, res) => {
  const { name, email, phone, role, password, isApproved } = req.body;

  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update email if provided (multiple accounts can share the same email)
    if (email && email.trim()) {
      employee.email = email.trim();
    }

    // Check phone uniqueness if modified
    if (phone && phone.trim() !== '' && phone.trim() !== employee.phone) {
      const existingPhone = await User.findOne({ phone: phone.trim(), _id: { $ne: req.params.id } });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number is already used by another user' });
      }
      employee.phone = phone.trim();
    } else if (phone && phone.trim() !== '') {
      employee.phone = phone.trim();
    }

    if (name && name.trim()) {
      employee.name = name.trim();
    }
    
    if (role) {
      const validRoles = ['Superadmin', 'Crd team', 'sales person', 'ped team', 'accounts team'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role selected' });
      }
      employee.role = role;
    }

    if (typeof isApproved === 'boolean') {
      employee.isApproved = isApproved;
    }

    if (password && password.trim() !== '') {
      if (password.trim().length < 4) {
        return res.status(400).json({ message: 'Password must be at least 4 characters long' });
      }
      employee.password = password.trim();
    }

    await employee.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Update Employee Profile',
      description: `Updated employee details for ${employee.name} (${employee.email})`
    });

    const updatedUser = await User.findById(employee._id).select('-password');
    res.json({ message: 'Employee details updated successfully', employee: updatedUser });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ message: err.message || 'Server error updating employee' });
  }
});


// @route   GET /api/employees/history
// @desc    Get activity logs (Employee History)
router.get('/history', protect, async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee
router.delete('/:id', protect, authorize('Superadmin'), async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Delete Employee',
      description: `Deleted employee ${employee.name} (${employee.email})`
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
