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
    if (status.includes(',')) {
      query.status = { $in: status.split(',') };
    } else {
      query.status = status;
    }
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

  // Restrict to assigned leads for Sales Executives and Site Engineers (non-Admin/non-Manager)
  if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
    query.assignedTo = req.user._id;
  }

  try {
    const leads = await Lead.find(query)
      .populate('project', 'name code location units')
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
      .populate('history.assignedTo', 'name role')
      .populate('history.updatedBy', 'name role')
      .sort({ updatedAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/leads/today-assigned
// @desc    Get leads assigned today that are still in Assigned/New status
router.get('/today-assigned', protect, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let query = {};
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager' && req.user.role !== 'Super Admin') {
      query.assignedTo = req.user._id;
    }

    query.status = { $in: ['New', 'Assigned'] };

    query.$or = [
      { createdAt: { $gte: todayStart, $lte: todayEnd }, assignedTo: { $exists: true, $ne: null } },
      { 
        history: { 
          $elemMatch: { 
            status: 'Assigned',
            timestamp: { $gte: todayStart, $lte: todayEnd }
          }
        } 
      }
    ];

    const leads = await Lead.find(query)
      .populate('project', 'name code')
      .populate('assignedTo', 'name role')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/leads/due-followups
// @desc    Get leads that have follow-ups due
router.get('/due-followups', protect, async (req, res) => {
  try {
    let query = {
      isClosed: false,
      'followUpInfo.nextFollowUpDate': { $lte: new Date() }
    };

    if (req.user.role !== 'Admin' && req.user.role !== 'Manager' && req.user.role !== 'Super Admin') {
      query.assignedTo = req.user._id;
    }

    const leads = await Lead.find(query)
      .populate('project', 'name code')
      .populate('assignedTo', 'name role')
      .sort({ 'followUpInfo.nextFollowUpDate': -1 });

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
      defaultStatus = 'Site Visit';
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
      if (assignedTo && assignedTo.toString().trim() !== '') {
        lead.assignedBy = req.user._id;
      }
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
        lead.projectLocation = '';
        lead.leadSource = leadSource || 'Direct Visit';
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
        .populate('project', 'name code location units')
        .populate('assignedTo', 'name role')
        .populate('assignedBy', 'name role');

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
      assignedBy: (assignedTo && assignedTo.toString().trim() !== '') ? req.user._id : undefined,
      status: defaultStatus,
      leadCost: Number(leadCost) || 0
    });

    if (leadType === 'Lead') {
      lead.leadSource = leadSource || '';
      lead.activeAd = activeAd || { name: '', link: '' };
    } else {
      lead.projectLocation = '';
      lead.leadSource = leadSource || 'Direct Visit';
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
      .populate('project', 'name code location units')
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role');

    res.status(201).json({ message: 'Lead created successfully', lead: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead details (status, assignment)
router.put('/:id', protect, async (req, res) => {
  const { status, assignedTo, name, phone, leadType, leadCost, address, bankLoan, leadSource, activeAd, projectLocation, project, bookingInfo, followUpInfo, isClosed, closeRemarks, isRevert } = req.body;

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
        'Follow-Up',
        'Site Visit',
        'Hot List',
        'Negotiation',
        'Booking',
        'Future Follow-up',
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
      const prevAssigned = lead.assignedTo?.toString();
      if (assignedTo && assignedTo !== prevAssigned) {
        lead.assignedBy = req.user._id;
      }
      lead.assignedTo = (assignedTo && assignedTo.toString().trim() !== '') ? assignedTo : undefined;
    }
    if (name) lead.name = name;
    if (phone) lead.phone = phone;
    if (leadType) lead.leadType = leadType;
    if (leadCost !== undefined) lead.leadCost = Number(leadCost) || 0;
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
    
    if (leadSource) lead.leadSource = leadSource;
    if (lead.leadType === 'Lead') {
      if (activeAd) lead.activeAd = activeAd;
    } else {
      lead.projectLocation = '';
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

    let auditAction = 'Update Lead';
    let auditDescription = `Updated lead ${lead.name} (${lead.phone}). Status: ${lead.status === 'Qualified' ? 'Hot List' : lead.status}`;

    if (statusChanged) {
      const displayStatus = lead.status === 'Qualified' ? 'Hot List' : lead.status;
      auditAction = `Lead Stage: ${displayStatus}`;
      auditDescription = `Lead ${lead.name} (${lead.phone}) transitioned from stage ${prevStatus === 'Qualified' ? 'Hot List' : prevStatus} to ${displayStatus}`;
      if (lead.status === 'Booking' && bookingInfo) {
        auditAction = 'Unit Booked';
        auditDescription = `Booked unit(s) ${bookingInfo.selectedUnits?.join(', ')} for customer ${lead.name} (${lead.phone})`;
      } else if (lead.status === 'Won') {
        auditAction = 'Handover Completed';
        auditDescription = `Successfully completed key handover (Won) for customer ${lead.name} (${lead.phone})`;
      }
    } else if (assignmentChanged) {
      auditAction = 'Reassign Lead';
      auditDescription = `Reassigned lead ${lead.name} (${lead.phone}) to executive ID ${lead.assignedTo || 'Unassigned'}`;
    } else if (followUpLogged) {
      auditAction = 'Schedule Follow-up';
      const followDateStr = followUpInfo.nextFollowUpDate ? new Date(followUpInfo.nextFollowUpDate).toLocaleString() : '';
      auditDescription = `Scheduled follow-up for lead ${lead.name} (${lead.phone}) on ${followDateStr}. Remarks: ${followUpInfo.remarks || 'None'}`;
    }

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: auditAction,
      description: auditDescription
    });

    const populated = await Lead.findById(lead._id)
      .populate('project', 'name code location units')
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role')
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

// @route   DELETE /api/leads/:id
// @desc    Delete a lead
router.delete('/:id', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const Project = require('../models/Project');
    const CRDFlow = require('../models/CRDFlow');
    const Quotation = require('../models/Quotation');

    // 1. Release any booked units in projects associated with this lead
    const projectsWithLead = await Project.find({ 'units.customerPhone': lead.phone });
    for (const proj of projectsWithLead) {
      let isModified = false;
      proj.units.forEach(unit => {
        if (unit.customerPhone === lead.phone) {
          unit.status = 'New';
          unit.customerName = '';
          unit.customerPhone = '';
          unit.leadName = '';
          isModified = true;
        }
      });
      if (isModified) {
        await proj.save();
      }
    }

    // 2. Delete related CRDFlows
    await CRDFlow.deleteMany({ lead: lead._id });

    // 3. Delete related Quotations
    await Quotation.deleteMany({ lead: lead._id });

    // 4. Finally delete the lead itself
    await Lead.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Delete Lead',
      description: `Deleted lead: ${lead.name} (${lead.phone}) and all associated records.`
    });

    res.json({ message: 'Lead and associated records deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
