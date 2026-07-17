const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/employees
// @desc    Get all employees
router.get('/', protect, async (req, res) => {
  try {
    const employees = await User.find({}).select('-password').sort({ createdAt: -1 });
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

module.exports = router;
