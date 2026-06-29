const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
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
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if this is the first user
    const isFirstUser = (await User.countDocuments({})) === 0;

    const user = await User.create({
      name,
      email,
      password,
      role: isFirstUser ? 'Admin' : 'Sales Executive',
      isApproved: isFirstUser ? true : false
    });

    // Create an audit log
    await AuditLog.create({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'Register',
      description: `Registered user ${user.name} (${user.email}). ${isFirstUser ? 'First user auto-promoted to Admin.' : 'Awaiting approval.'}`
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
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

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
