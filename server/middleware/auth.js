const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'merun_glacier_secret_key_12345');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Access denied. Account is pending approval.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token validation failed' });
  }
};

const protectCustomer = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'merun_glacier_secret_key_12345');
    if (decoded.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customers only.' });
    }

    const CRDFlow = require('../models/CRDFlow');
    const flow = await CRDFlow.findById(decoded.id);
    
    if (!flow) {
      return res.status(401).json({ message: 'Customer flow not found' });
    }

    req.customerFlow = flow;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token validation failed' });
  }
};

// Check if user has specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Role '${req.user ? req.user.role : 'Guest'}' is unauthorized.` });
    }
    next();
  };
};

const { getMergedPermissions } = require('../utils/permissionHelper');
const checkPermission = (pageId, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Superadmin bypasses all checks
      if (req.user.role === 'Superadmin') {
        return next();
      }
      
      const roleStr = (req.user.role || '').toLowerCase();
      const deptStr = (req.user.department || '').toLowerCase();

      // Role/department shortcuts for extra_works modules
      if (pageId === 'extra_works_ped' || pageId === 'extra_works') {
        if (roleStr.includes('ped') || deptStr.includes('ped')) return next();
      }
      if (pageId === 'extra_works_crd' || pageId === 'extra_works') {
        if (roleStr.includes('crd') || deptStr.includes('crd')) return next();
      }
      if (pageId === 'extra_works_accounts' || pageId === 'extra_works') {
        if (roleStr.includes('account') || deptStr.includes('account')) return next();
      }

      const permissions = await getMergedPermissions(req.user);
      
      const permission = permissions.find(p => p.pageId === pageId || (pageId.startsWith('extra_works') && p.pageId === 'extra_works'));
      if (!permission) {
        return res.status(403).json({ message: `Access denied. Module '${pageId}' is not configured for user '${req.user.name}'.` });
      }
      
      if (action === 'view' && !permission.canView) {
        return res.status(403).json({ message: `Access denied. User '${req.user.name}' does not have view permission for '${pageId}'.` });
      }
      
      if (action === 'edit' && !permission.canEdit) {
        return res.status(403).json({ message: `Access denied. User '${req.user.name}' does not have edit permission for '${pageId}'.` });
      }
      
      next();
    } catch (err) {
      return res.status(500).json({ message: 'Internal authorization validation error: ' + err.message });
    }
  };
};

module.exports = { protect, protectCustomer, authorize, checkPermission };
