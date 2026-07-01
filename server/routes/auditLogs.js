const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

// @route   GET /api/audit-logs
// @desc    Get all audit logs with pagination, sorting, search, action, and date filters
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', action = '', fromDate, toDate } = req.query;

    const query = {};

    // Action filter
    if (action) {
      query.action = action;
    }

    // Text search (search in userName, description, or action)
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filters
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    const totalLogs = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    // Get unique list of actions for filter dropdown
    const uniqueActions = await AuditLog.distinct('action');

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalLogs / limitNum),
        totalLogs
      },
      uniqueActions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
