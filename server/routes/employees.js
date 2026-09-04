const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const defaultRoles = ['Superadmin', 'Crd team', 'sales person', 'ped team', 'accounts team'];

// @route   GET /api/employees/roles
// @desc    Get all available roles (default + custom from RolePermission + existing Users)
router.get('/roles', protect, async (req, res) => {
  try {
    const roleDocs = await RolePermission.find({}).select('role');
    const userRoles = await User.distinct('role');
    
    const roleSet = new Set([...defaultRoles]);
    roleDocs.forEach(d => { if (d.role) roleSet.add(d.role); });
    userRoles.forEach(r => { if (r) roleSet.add(r); });

    res.json(Array.from(roleSet));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// @route   POST /api/employees
// @desc    Add a new employee (Superadmin only)
router.post('/', protect, authorize('Superadmin'), async (req, res) => {
  const { name, email, phone, role, department, password, isApproved } = req.body;

  try {
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!password || password.trim().length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters long' });
    }

    const trimmedPhone = phone.trim();
    const existingPhone = await User.findOne({ phone: trimmedPhone });
    if (existingPhone) {
      return res.status(400).json({ message: 'An employee with this phone number already exists' });
    }

    const newEmployee = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: trimmedPhone,
      password: password.trim(),
      role: role && role.trim() ? role.trim() : 'sales person',
      department: department && department.trim() ? department.trim() : 'General',
      isApproved: isApproved !== undefined ? isApproved : true
    });

    await newEmployee.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Create Employee',
      description: `Created new employee ${newEmployee.name} (${newEmployee.email}, ${newEmployee.phone}) with role "${newEmployee.role}" in department "${newEmployee.department}"`
    });

    const createdUser = await User.findById(newEmployee._id).select('-password');
    res.status(201).json({ message: 'Employee added successfully', employee: createdUser });
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ message: err.message || 'Server error creating employee' });
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

  if (!role || !role.trim()) {
    return res.status(400).json({ message: 'Role cannot be empty' });
  }

  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const oldRole = employee.role;
    employee.role = role.trim();
    await employee.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Change Role',
      description: `Changed role of employee ${employee.name} from ${oldRole} to ${role.trim()}`
    });

    res.json({ message: 'Employee role updated successfully', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update full employee details (Name, Email, Phone, Role, Password, Approval)
router.put('/:id', protect, authorize('Superadmin'), async (req, res) => {
  const { name, email, phone, role, department, password, isApproved } = req.body;

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
    
    if (role && role.trim()) {
      employee.role = role.trim();
    }

    if (department !== undefined) {
      employee.department = department.trim();
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
      description: `Updated employee details for ${employee.name} (${employee.email}) - Dept: ${employee.department}`
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

