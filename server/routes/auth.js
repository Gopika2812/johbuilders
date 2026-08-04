const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { getMergedPermissions } = require('../utils/permissionHelper');
const { protect } = require('../middleware/auth');

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'merun_glacier_secret_key_12345', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'A user is already registered with this phone number' });
    }

    // Check if this is the first user
    const isFirstUser = (await User.countDocuments({})) === 0;

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: isFirstUser ? 'Superadmin' : 'sales person',
      isApproved: isFirstUser ? true : false
    });

    // Create an audit log
    await AuditLog.create({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'Register',
      description: `Registered user ${user.name} (${user.email}, ${user.phone}). ${isFirstUser ? 'First user auto-promoted to Superadmin.' : 'Awaiting approval.'}`
    });

    const permissions = await getMergedPermissions(user);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id),
      permissions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ 
      $or: [
        { name: name },
        { email: name },
        { phone: name }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid name/email/phone or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid name/email/phone or password' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account is pending administrator approval.' });
    }

    // Log the successful login
    await AuditLog.create({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'Login',
      description: `User logged in successfully`
    });

    const permissions = await getMergedPermissions(user);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id),
      permissions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const permissions = await getMergedPermissions(req.user);
    
    res.json({
      ...req.user.toObject(),
      permissions
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching user details' });
  }
});

// @route   POST /api/auth/customer-login
// @desc    Authenticate customer portal user
router.post('/customer-login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const CRDFlow = require('../models/CRDFlow');
    const flow = await CRDFlow.findOne({ 
      'credentials.username': username, 
      'credentials.password': password 
    });

    if (!flow) {
      return res.status(401).json({ message: 'Invalid portal credentials' });
    }

    const token = jwt.sign(
      { id: flow._id, role: 'customer' }, 
      process.env.JWT_SECRET || 'merun_glacier_secret_key_12345', 
      { expiresIn: '30d' }
    );

    res.json({ 
      token, 
      flowId: flow._id, 
      username: username,
      role: 'customer' 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Reset user password using username, email, or registered phone number
router.post('/forgot-password', async (req, res) => {
  const { identifier, phone, newPassword } = req.body;

  try {
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Username, Email, or Phone number is required' });
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ message: 'New password must be at least 4 characters long' });
    }

    const cleanId = identifier.trim();

    // Find user by name, email, or phone
    let query = {
      $or: [
        { name: new RegExp(`^${cleanId}$`, 'i') },
        { email: cleanId.toLowerCase() },
        { phone: cleanId }
      ]
    };

    // If phone verification is also provided, enforce matching phone number
    if (phone && phone.trim()) {
      query = {
        $and: [
          { $or: [{ name: new RegExp(`^${cleanId}$`, 'i') }, { email: cleanId.toLowerCase() }, { phone: cleanId }] },
          { phone: phone.trim() }
        ]
      };
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ message: 'No account found matching the provided details.' });
    }

    user.password = newPassword.trim();
    await user.save();

    await AuditLog.create({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'Password Reset',
      description: `Reset password for user account: ${user.name} (${user.email})`
    });

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: err.message || 'Server error resetting password' });
  }
});

module.exports = router;
