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
  const { status, leadType, search, crdView } = req.query;
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

  const userRoleNorm = (req.user?.role || '').toLowerCase().replace(/[\s_-]+/g, '');
  const isSuperAdminUser = userRoleNorm === 'superadmin' || userRoleNorm === 'admin';

  // Restrict to assigned leads for non-Superadmin users
  if (!isSuperAdminUser) {
    if (crdView === 'true') {
      const Quotation = require('../models/Quotation');
      const userQuotations = await Quotation.find({
        $or: [
          { crdPerson: req.user._id },
          { pedPerson: req.user._id },
          { accountsPerson: req.user._id }
        ]
      }, 'lead').lean();
      const leadIds = userQuotations.map(q => q.lead?.toString()).filter(Boolean);
      
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { _id: { $in: leadIds } }
        ];
        delete query.$or;
      } else {
        query._id = { $in: leadIds };
      }
    } else {
      query.assignedTo = req.user._id;
    }
  }

  try {
    const leads = await Lead.find(query)
      .populate('project', 'name code location units')
      .populate('assignedTo', 'name role phone mobile phoneNumber')
      .populate('assignedBy', 'name role phone mobile phoneNumber')
      .populate('history.assignedTo', 'name role phone mobile phoneNumber')
      .populate('history.updatedBy', 'name role phone mobile phoneNumber')
      .sort({ updatedAt: -1 })
      .lean();
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

    let query = {
      assignedTo: req.user._id,
      status: { $in: ['New', 'Assigned'] }
    };

    query.$or = [
      { createdAt: { $gte: todayStart, $lte: todayEnd } },
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
      .populate('assignedTo', 'name role phone mobile phoneNumber')
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
      assignedTo: req.user._id,
      isClosed: false,
      status: { $nin: ['Booking', 'Won', 'Booked', 'Lost'] },
      'followUpInfo.nextFollowUpDate': { $lte: new Date() }
    };

    const leads = await Lead.find(query)
      .populate('project', 'name code')
      .populate('assignedTo', 'name role phone mobile phoneNumber')
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
    const leads = await Lead.find({ phone: req.params.phone })
      .sort({ createdAt: -1 })
      .populate('project', 'name code')
      .populate('assignedTo', 'name role');
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/leads
// @desc    Create a new lead (or reopen existing if duplicate phone)
router.post('/', protect, async (req, res) => {
  const { leadType, name, phone, address, profession, email, location, bankLoan, bankLoanPercentage, leadSource, activeAd, projectLocation, project, assignedTo, leadCost, followUpInfo, leadCategory, creationDate } = req.body;

  try {
    let targetCreatedAt = undefined;
    if (creationDate) {
      const parsedDate = new Date(creationDate + 'T12:00:00.000Z');
      const minAllowed = new Date();
      minAllowed.setDate(minAllowed.getDate() - 6);
      minAllowed.setHours(0, 0, 0, 0);
      const maxAllowed = new Date();
      maxAllowed.setHours(23, 59, 59, 999);
      if (parsedDate >= minAllowed && parsedDate <= maxAllowed) {
        targetCreatedAt = parsedDate;
      }
    }

    if (leadType === 'Direct Visit') {
      if (!followUpInfo || !followUpInfo.remarks || !followUpInfo.remarks.trim()) {
        return res.status(400).json({ message: 'Notes (Narration) is required for Direct Visit.' });
      }
    }

    // 1. Phone number tracking for duplicate checks / reopening
    let existingLeads = await Lead.find({ phone }).populate('assignedTo', 'name').sort({ createdAt: -1 });

    let finalAssignedTo = assignedTo;
    // Retain previously assigned executive if customer exists
    if (existingLeads.length > 0) {
      const lastAssignedLead = existingLeads.find(l => l.assignedTo);
      if (lastAssignedLead) {
        finalAssignedTo = lastAssignedLead.assignedTo._id;
      }
    }

    let defaultStatus = 'New';
    if (leadType === 'Direct Visit') {
      defaultStatus = 'Site Visit';
    } else if (finalAssignedTo && finalAssignedTo.toString().trim() !== '') {
      defaultStatus = 'Assigned';
    }

    let lead = existingLeads.find(l => l.project.toString() === project.toString());

    if (lead) {
      // Check if lead is in an allowed status (Lost, Cancelled, Booking, Won)
      const allowedStatuses = ['Lost', 'Cancelled', 'Booking', 'Won'];
      let isAllowedToReopen = allowedStatuses.includes(lead.status);

      if (lead.status === 'Won') {
        const CRDFlow = require('../models/CrdFlow');
        const flows = await CRDFlow.find({ lead: lead._id });
        let isHandover = true;
        if (flows && flows.length > 0) {
          isHandover = flows.some(flow => flow.stages && flow.stages.some(s => s.name.toLowerCase().includes('handover') && s.isCompleted));
        }
        isAllowedToReopen = isHandover;
      }

      if (!isAllowedToReopen) {
        const assignedName = lead.assignedTo ? lead.assignedTo.name : 'someone';
        return res.status(400).json({ 
          message: `This lead is currently assigned to ${assignedName} and is in '${lead.status}' stage for this project. You can only register with this number again for the same project if the lead is Lost, Cancelled, or Booked.`,
          existingLead: lead
        });
      }

      const oldStatus = lead.status;
      // Reopen existing lead
      lead.leadType = leadType;
      lead.name = name;
      lead.profession = profession || lead.profession;
      lead.email = email || lead.email;
      lead.location = location || lead.location;
      lead.address = address || '';
      lead.bankLoan = bankLoan || 'No';
      lead.bankLoanPercentage = Number(bankLoanPercentage) || 0;
      lead.project = project;
      if (targetCreatedAt) {
        lead.createdAt = targetCreatedAt;
      }
      if (finalAssignedTo && finalAssignedTo.toString().trim() !== '') {
        lead.assignedBy = req.user._id;
      }
      lead.assignedTo = (finalAssignedTo && finalAssignedTo.toString().trim() !== '') ? finalAssignedTo : undefined;
      lead.status = defaultStatus; // reset/set status on reopen
      lead.isClosed = false;
      lead.isReopened = true;
      lead.leadCost = Number(leadCost) || 0;
      if (leadCategory) lead.leadCategory = leadCategory;
      
      if (leadType === 'Lead') {
        lead.leadSource = leadSource || '';
        lead.activeAd = activeAd || { name: '', link: '' };
        lead.projectLocation = '';
      } else {
        lead.projectLocation = '';
        lead.leadSource = leadSource || 'Direct Visit';
        lead.activeAd = { name: '', link: '' };
        if (followUpInfo) {
          lead.followUpInfo = followUpInfo;
        }
      }

      lead.history.push({
        status: defaultStatus,
        assignedTo: (finalAssignedTo && finalAssignedTo.toString().trim() !== '') ? finalAssignedTo : undefined,
        updatedBy: req.user._id,
        timestamp: targetCreatedAt || new Date(),
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
        .populate('assignedTo', 'name role phone mobile phoneNumber')
        .populate('assignedBy', 'name role phone mobile phoneNumber');

      return res.json({ message: 'Existing lead reopened and updated', lead: populated });
    }

    // Create brand new lead
    lead = new Lead({
      leadType,
      name,
      profession: profession || '',
      email: email || '',
      location: location || '',
      phone,
      address,
      bankLoan: bankLoan || 'No',
      bankLoanPercentage: Number(bankLoanPercentage) || 0,
      project,
      assignedTo: (finalAssignedTo && finalAssignedTo.toString().trim() !== '') ? finalAssignedTo : undefined,
      assignedBy: (finalAssignedTo && finalAssignedTo.toString().trim() !== '') ? req.user._id : undefined,
      status: defaultStatus,
      leadCost: Number(leadCost) || 0,
      leadCategory: leadCategory || 'Cold',
      createdAt: targetCreatedAt || undefined
    });

    if (leadType === 'Lead') {
      lead.leadSource = leadSource || '';
      lead.activeAd = activeAd || { name: '', link: '' };
      if (followUpInfo) {
        lead.followUpInfo = followUpInfo;
      }
    } else {
      lead.projectLocation = '';
      lead.leadSource = leadSource || 'Direct Visit';
      if (followUpInfo) {
        lead.followUpInfo = followUpInfo;
      }
    }

    lead.history.push({
      status: defaultStatus,
      assignedTo: (finalAssignedTo && finalAssignedTo.toString().trim() !== '') ? finalAssignedTo : undefined,
      updatedBy: req.user._id,
      timestamp: new Date(),
      note: (followUpInfo && followUpInfo.remarks) ? `Initial Lead Creation: ${followUpInfo.remarks}` : 'Initial Lead Creation'
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
      .populate('assignedTo', 'name role phone mobile phoneNumber')
      .populate('assignedBy', 'name role phone mobile phoneNumber');

    res.status(201).json({ message: 'Lead created successfully', lead: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead details (status, assignment)
router.put('/:id', protect, async (req, res) => {
  const { status, assignedTo, name, phone, leadType, leadCost, address, profession, email, location, bankLoan, bankLoanPercentage, leadSource, activeAd, projectLocation, project, bookingInfo, followUpInfo, isClosed, closeRemarks, isRevert, leadCategory } = req.body;

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

    if (!isRevert) {
      if (followUpInfo !== undefined) {
        if (!followUpInfo.remarks || !followUpInfo.remarks.trim()) {
          return res.status(400).json({ message: 'Follow-up remarks/notes are required.' });
        }
      }
      if (statusChanged && !['Booking', 'Won'].includes(status)) {
        if (!followUpInfo) {
          if (!closeRemarks || !closeRemarks.trim()) {
            return res.status(400).json({ message: 'Transition / closing remarks are required.' });
          }
        }
      }
    }

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
      const userRoleNorm = (req.user?.role || '').toLowerCase().replace(/[\s_-]+/g, '');
      const isSuperAdminUser = userRoleNorm === 'superadmin' || userRoleNorm === 'admin';
      if (!isRevert && !isSuperAdminUser && currentIndex !== -1 && newIndex !== -1 && newIndex < currentIndex) {
        return res.status(400).json({ message: 'Cannot move backward to a previous stage' });
      }
      lead.status = status;
    }

    const userRoleNorm = (req.user?.role || '').toLowerCase().replace(/[\s_-]+/g, '');
    const isSuperAdminUser = userRoleNorm === 'superadmin' || userRoleNorm === 'admin';
    const isLeadAssigned = Boolean(lead.assignedTo) || (lead.status && lead.status !== 'New');
    const canEditLockedFields = !isLeadAssigned || isSuperAdminUser;

    if (canEditLockedFields && assignedTo !== undefined) {
      const prevAssigned = lead.assignedTo?.toString();
      if (assignedTo && assignedTo !== prevAssigned) {
        lead.assignedBy = req.user._id;
      }
      lead.assignedTo = (assignedTo && assignedTo.toString().trim() !== '') ? assignedTo : undefined;
    }
    if (name) lead.name = name;
    if (canEditLockedFields && phone) lead.phone = phone;
    if (leadType) lead.leadType = leadType;
    if (leadCost !== undefined) lead.leadCost = Number(leadCost) || 0;
    if (address) lead.address = address;
    if (profession) lead.profession = profession;
    if (email) lead.email = email;
    if (location) lead.location = location;
    if (bankLoan) lead.bankLoan = bankLoan;
    if (bankLoanPercentage !== undefined) lead.bankLoanPercentage = Number(bankLoanPercentage) || 0;
    if (canEditLockedFields && project) lead.project = project;
    if (leadCategory) lead.leadCategory = leadCategory;

    if (followUpInfo !== undefined) lead.followUpInfo = followUpInfo;
    if (isClosed !== undefined) {
      if (lead.isClosed === true && isClosed === false) {
        lead.isReopened = true;
      }
      lead.isClosed = isClosed;
    }
    if (closeRemarks !== undefined) lead.closeRemarks = closeRemarks;

    if (bookingInfo !== undefined) {
      lead.bookingInfo = bookingInfo;
    }

    if (status === 'Booking' && bookingInfo) {
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
    
    if (canEditLockedFields && leadSource) lead.leadSource = leadSource;
    if (lead.leadType === 'Lead') {
      if (canEditLockedFields && activeAd) lead.activeAd = activeAd;
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
      .populate('assignedTo', 'name role phone mobile phoneNumber')
      .populate('assignedBy', 'name role phone mobile phoneNumber')
      .populate('history.assignedTo', 'name role phone mobile phoneNumber')
      .populate('history.updatedBy', 'name role phone mobile phoneNumber');

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
router.delete('/:id', protect, authorize('Superadmin'), async (req, res) => {
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

// @route   POST /api/leads/bulk-import
// @desc    Bulk import leads from Excel/CSV array data
router.post('/bulk-import', protect, async (req, res) => {
  const { leadsData } = req.body;
  if (!Array.isArray(leadsData) || leadsData.length === 0) {
    return res.status(400).json({ message: 'No lead data provided for import.' });
  }

  try {
    const projects = await Project.find().lean();
    const users = await User.find().lean();

    let createdCount = 0;
    let updatedCount = 0;
    let errors = [];

    for (let i = 0; i < leadsData.length; i++) {
      const item = leadsData[i];
      const rowNum = i + 1;

      const rawDate = item.registrationDate || item['Registration Date'] || item.date || item.Date;
      const rawProjectCode = item.projectCode || item['Project code'] || item.project || item.Project;
      const rawCustomerName = item.customerName || item['Lead/ Customer name'] || item['Lead/Customer name'] || item['Customer Name'] || item.name || item.Name;
      const rawPhone = item.phone || item['Phone number'] || item.Phone;
      const rawLeadSource = item.leadSource || item['Lead source'] || item.source || item.Source;
      const rawAssignedExecutive = item.assignedExecutive || item['Assigned executive'] || item.assignedTo || item.Executive;

      if (!rawCustomerName || !rawPhone) {
        errors.push(`Row ${rowNum}: Customer Name and Phone Number are required.`);
        continue;
      }

      let cleanPhone = String(rawPhone).trim().replace(/\s+/g, '');
      if (!cleanPhone.startsWith('+')) {
        const digits = cleanPhone.replace(/\D/g, '');
        cleanPhone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
      }

      let matchedProject = null;
      if (rawProjectCode) {
        const pCodeStr = String(rawProjectCode).trim().toLowerCase();
        matchedProject = projects.find(p => 
          (p.code && p.code.toLowerCase() === pCodeStr) || 
          (p.name && p.name.toLowerCase() === pCodeStr)
        );
      }
      if (!matchedProject && projects.length > 0) {
        matchedProject = projects[0];
      }

      if (!matchedProject) {
        errors.push(`Row ${rowNum} (${rawCustomerName}): Project '${rawProjectCode}' not found.`);
        continue;
      }

      let matchedUser = null;
      if (rawAssignedExecutive) {
        const execStr = String(rawAssignedExecutive).trim().toLowerCase();
        matchedUser = users.find(u => 
          u.name && u.name.toLowerCase().includes(execStr)
        );
      }

      let parsedCreatedAt = new Date();
      if (rawDate) {
        const dStr = String(rawDate).trim();
        let day, month, year;
        if (dStr.includes('.')) {
          const parts = dStr.split('.');
          if (parts.length === 3) {
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            year = parseInt(parts[2], 10);
          }
        } else if (dStr.includes('/')) {
          const parts = dStr.split('/');
          if (parts.length === 3) {
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            year = parseInt(parts[2], 10);
          }
        } else if (dStr.includes('-')) {
          const parts = dStr.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            day = parseInt(parts[2], 10);
          } else if (parts.length === 3) {
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            year = parseInt(parts[2], 10);
          }
        }

        if (year && month !== undefined && !isNaN(day)) {
          parsedCreatedAt = new Date(Date.UTC(year, month, day, 12, 0, 0));
        } else {
          const dObj = new Date(dStr);
          if (!isNaN(dObj.getTime())) {
            parsedCreatedAt = dObj;
          }
        }
      }

      const defaultStatus = matchedUser ? 'Assigned' : 'New';

      let existingLead = await Lead.findOne({ phone: cleanPhone, project: matchedProject._id });

      if (existingLead) {
        existingLead.name = String(rawCustomerName).trim();
        if (rawLeadSource) existingLead.leadSource = String(rawLeadSource).trim();
        if (matchedUser) {
          existingLead.assignedTo = matchedUser._id;
          existingLead.assignedBy = req.user._id;
        }
        existingLead.createdAt = parsedCreatedAt;
        existingLead.isClosed = false;
        await existingLead.save();
        updatedCount++;
      } else {
        const newLead = new Lead({
          leadType: 'Lead',
          name: String(rawCustomerName).trim(),
          phone: cleanPhone,
          project: matchedProject._id,
          leadSource: rawLeadSource ? String(rawLeadSource).trim() : 'Bulk Import',
          assignedTo: matchedUser ? matchedUser._id : undefined,
          assignedBy: matchedUser ? req.user._id : undefined,
          status: defaultStatus,
          createdAt: parsedCreatedAt,
          history: [{
            status: defaultStatus,
            assignedTo: matchedUser ? matchedUser._id : undefined,
            updatedBy: req.user._id,
            timestamp: parsedCreatedAt,
            note: 'Bulk imported from Excel'
          }]
        });
        await newLead.save();
        createdCount++;
      }
    }

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Bulk Import Leads',
      description: `Bulk imported ${createdCount + updatedCount} leads (${createdCount} created, ${updatedCount} updated).`
    });

    res.json({
      message: `Bulk import completed successfully! ${createdCount} lead(s) created, ${updatedCount} updated.`,
      createdCount,
      updatedCount,
      errors
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
