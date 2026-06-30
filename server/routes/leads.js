const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Project = require('../models/Project');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/leads
// @desc    Get all leads with optional filters
router.get('/', protect, async (req, res) => {
  const { status, leadType, search } = req.query;
  const query = {};

  if (status) {
    query.status = status;
  }
  if (leadType) {
    query.leadType = leadType;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    const leads = await Lead.find(query)
      .populate('project', 'name code location')
      .populate('assignedTo', 'name role')
      .populate('history.assignedTo', 'name role')
      .populate('history.updatedBy', 'name role')
      .sort({ updatedAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/leads/phone/:phone
// @desc    Check for existing lead by phone
router.get('/phone/:phone', protect, async (req, res) => {
  try {
    const lead = await Lead.findOne({ phone: req.params.phone })
      .populate('project', 'name code')
      .populate('assignedTo', 'name role');
    if (lead) {
      return res.json(lead);
    }
    res.json(null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/leads
// @desc    Create a new lead (or reopen existing if duplicate phone)
router.post('/', protect, async (req, res) => {
  const { leadType, name, phone, address, bankLoan, leadSource, activeAd, projectLocation, project, assignedTo, leadCost } = req.body;

  try {
    // 1. Phone number tracking for reopening existing leads
    let lead = await Lead.findOne({ phone });

    let defaultStatus = 'New';
    if (leadType === 'Direct Visit') {
      defaultStatus = 'Site Visit Follow-up';
    } else if (assignedTo && assignedTo.toString().trim() !== '') {
      defaultStatus = 'Assigned';
    }

    if (lead) {
      const oldStatus = lead.status;
      // Reopen existing lead
      lead.leadType = leadType;
      lead.name = name;
      lead.address = address;
      lead.bankLoan = bankLoan || 'No';
      lead.project = project;
      lead.assignedTo = (assignedTo && assignedTo.toString().trim() !== '') ? assignedTo : undefined;
      lead.status = defaultStatus; // reset/set status on reopen
      lead.isClosed = false;
      lead.isReopened = true;
      lead.leadCost = Number(leadCost) || 0;
      
      if (leadType === 'Lead') {
        lead.leadSource = leadSource || '';
        lead.activeAd = activeAd || { name: '', link: '' };
        lead.projectLocation = '';
      } else {
        lead.projectLocation = projectLocation || '';
        lead.leadSource = 'Direct Visit';
        lead.activeAd = { name: '', link: '' };
      }

      lead.history.push({
        status: defaultStatus,
        assignedTo: (assignedTo && assignedTo.toString().trim() !== '') ? assignedTo : undefined,
        updatedBy: req.user._id,
        timestamp: new Date(),
        note: `Lead Reopened (Previous status: ${oldStatus}). Details updated.`
      });

      await lead.save();

      await AuditLog.create({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'Reopen Lead',
        description: `Reopened lead: ${name} (${phone}) and reassigned`
      });

      const populated = await Lead.findById(lead._id)
        .populate('project', 'name code')
        .populate('assignedTo', 'name role');

      return res.json({ message: 'Existing lead reopened and updated', lead: populated });
    }

    // Create brand new lead
    lead = new Lead({
      leadType,
      name,
      phone,
      address,
      bankLoan: bankLoan || 'No',
      project,
      assignedTo: (assignedTo && assignedTo.toString().trim() !== '') ? assignedTo : undefined,
      status: defaultStatus,
      leadCost: Number(leadCost) || 0
    });

    if (leadType === 'Lead') {
      lead.leadSource = leadSource || '';
      lead.activeAd = activeAd || { name: '', link: '' };
    } else {
      lead.projectLocation = projectLocation || '';
      lead.leadSource = 'Direct Visit';
    }

    lead.history.push({
      status: defaultStatus,
      assignedTo: (assignedTo && assignedTo.toString().trim() !== '') ? assignedTo : undefined,
      updatedBy: req.user._id,
      timestamp: new Date(),
      note: 'Initial Lead Creation'
    });

    await lead.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Create Lead',
      description: `Created new ${leadType}: ${name} (${phone})`
    });

    const populated = await Lead.findById(lead._id)
      .populate('project', 'name code')
      .populate('assignedTo', 'name role');

    res.status(201).json({ message: 'Lead created successfully', lead: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead details (status, assignment)
router.put('/:id', protect, async (req, res) => {
  const { status, assignedTo, name, address, bankLoan, leadSource, activeAd, projectLocation, project, bookingInfo, followUpInfo, isClosed, closeRemarks, isRevert } = req.body;

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const prevStatus = lead.status;
    const prevAssigned = lead.assignedTo?.toString();

    // Check if status or assigned executive changed
    let statusChanged = status && status !== lead.status;
    let assignmentChanged = assignedTo && assignedTo !== prevAssigned;

    if (statusChanged) {
      const LEAD_STATUSES = [
        'New',
        'Assigned',
        'Contacted',
        'Follow-Up',
        'Site Visit',
        'Site Visit Follow-up',
        'Qualified',
        'Negotiation',
        'Booking',
        'Won',
        'Lost'
      ];
      const currentIndex = LEAD_STATUSES.indexOf(lead.status);
      const newIndex = LEAD_STATUSES.indexOf(status);
      if (!isRevert && currentIndex !== -1 && newIndex !== -1 && newIndex < currentIndex) {
        return res.status(400).json({ message: 'Cannot move backward to a previous stage' });
      }
      lead.status = status;
    }
    if (assignedTo !== undefined) {
      lead.assignedTo = (assignedTo && assignedTo.toString().trim() !== '') ? assignedTo : undefined;
    }
    if (name) lead.name = name;
    if (address) lead.address = address;
    if (bankLoan) lead.bankLoan = bankLoan;
    if (project) lead.project = project;

    if (followUpInfo !== undefined) lead.followUpInfo = followUpInfo;
    if (isClosed !== undefined) {
      if (lead.isClosed === true && isClosed === false) {
        lead.isReopened = true;
      }
      lead.isClosed = isClosed;
    }
    if (closeRemarks !== undefined) lead.closeRemarks = closeRemarks;

    if (status === 'Booking' && bookingInfo) {
      lead.bookingInfo = bookingInfo;
      // Mark selected units as booked in the project
      if (bookingInfo.selectedUnits && bookingInfo.selectedUnits.length > 0) {
        const Project = require('../models/Project');
        const proj = await Project.findById(lead.project);
        if (proj) {
          bookingInfo.selectedUnits.forEach(unitId => {
            const unit = proj.units.find(u => u.unitId === unitId);
            if (unit) {
              unit.status = 'Booked';
              unit.customerName = lead.name;
              unit.customerPhone = lead.phone;
              unit.leadName = lead.name;
            }
          });
          await proj.save();
        }
      }
    }

    if (status === 'Won') {
      if (lead.bookingInfo && lead.bookingInfo.selectedUnits && lead.bookingInfo.selectedUnits.length > 0) {
        const Project = require('../models/Project');
        const proj = await Project.findById(lead.project);
        if (proj) {
          lead.bookingInfo.selectedUnits.forEach(unitId => {
            const unit = proj.units.find(u => u.unitId === unitId);
            if (unit) {
              unit.status = 'Sold Out';
            }
          });
          await proj.save();
        }
      }
    }
    
    if (lead.leadType === 'Lead') {
      if (leadSource) lead.leadSource = leadSource;
      if (activeAd) lead.activeAd = activeAd;
    } else {
      if (projectLocation) lead.projectLocation = projectLocation;
    }

    const followUpLogged = followUpInfo && (followUpInfo.nextFollowUpDate || followUpInfo.remarks);

    if (statusChanged || assignmentChanged || followUpLogged) {
      let note = `Updated: ${statusChanged ? 'status to ' + lead.status : ''} ${assignmentChanged ? 'assignment updated' : ''}`;
      if (followUpLogged) {
        const followDateStr = followUpInfo.nextFollowUpDate ? new Date(followUpInfo.nextFollowUpDate).toLocaleString() : '';
        note = `Follow-up Scheduled: ${followDateStr}. Remarks: ${followUpInfo.remarks || 'No remarks'}`;
      } else if (closeRemarks) {
        note = `Remarks (${lead.status}): ${closeRemarks}`;
      }

      lead.history.push({
        status: lead.status,
        assignedTo: lead.assignedTo,
        updatedBy: req.user._id,
        timestamp: new Date(),
        note: note
      });
    }

    await lead.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Update Lead',
      description: `Updated lead ${lead.name} (${lead.phone}). Status: ${lead.status}`
    });

    const populated = await Lead.findById(lead._id)
      .populate('project', 'name code location')
      .populate('assignedTo', 'name role')
      .populate('history.assignedTo', 'name role')
      .populate('history.updatedBy', 'name role');

    res.json({ message: 'Lead updated successfully', lead: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/leads/target-stats/:month
// @desc    Get aggregated lead counts for targets page by source
router.get('/target-stats/:month', protect, async (req, res) => {
  const { month } = req.params; // format: "YYYY-MM"
  try {
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    // Find last day of month
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const endDate = new Date(year, monthNum, 1);

    // Aggregate ACTUAL leads count per source
    const actualStats = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: "$leadSource",
          count: { $sum: 1 }
        }
      }
    ]);

    // Aggregate Site Visit Conversions (Booking status) per source
    const conversionStats = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          status: 'Booking'
        }
      },
      {
        $group: {
          _id: "$leadSource",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      actual: actualStats,
      conversions: conversionStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
