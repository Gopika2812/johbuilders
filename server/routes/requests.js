const express = require('express');
const router = express.Router();
const ApprovalRequest = require('../models/ApprovalRequest');
const CRDFlow = require('../models/CRDFlow');
const AuditLog = require('../models/AuditLog');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

// @route   GET /api/requests
// @desc    Get all pending requests (Superadmin only typically)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const requests = await ApprovalRequest.find({ status: 'Pending' })
      .populate('referenceId')
      .populate('requestedBy', 'name email role')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/requests
// @desc    Create a new approval request
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { type, referenceId, narration } = req.body;
    
    // Check if pending request already exists for this reference
    const existingReq = await ApprovalRequest.findOne({ 
      type, 
      referenceId, 
      status: 'Pending',
      requestedBy: req.user._id 
    });

    if (existingReq) {
      return res.status(400).json({ message: 'A pending request already exists for this item.' });
    }

    const newReq = new ApprovalRequest({
      type,
      referenceId,
      requestedBy: req.user._id,
      narration
    });

    await newReq.save();
    res.status(201).json(newReq);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/requests/:id/approve
// @desc    Approve a request
// @access  Private
router.put('/:id/approve', protect, async (req, res) => {
  try {
    const approvalReq = await ApprovalRequest.findById(req.params.id);
    if (!approvalReq) return res.status(404).json({ message: 'Request not found' });

    approvalReq.status = 'Approved';
    await approvalReq.save();

    if (approvalReq.type === 'CRD_CANCELLATION') {
      const crdFlow = await CRDFlow.findById(approvalReq.referenceId);
      if (crdFlow) {
        crdFlow.status = 'Cancelled';
        crdFlow.history.push({
          action: 'Cancellation Approved',
          notes: `SuperAdmin approved cancellation. Original narration: ${approvalReq.narration}`,
          user: req.user.name,
          date: Date.now()
        });
        await crdFlow.save();

        await AuditLog.create({
          action: 'CRD Flow Cancelled',
          user: req.user._id,
          userName: req.user.name,
          userRole: req.user.role,
          description: `CRD Flow for lead ${crdFlow.lead} cancelled. Narration: ${approvalReq.narration}`,
          metadata: { referenceId: approvalReq.referenceId }
        });
      }
    } else if (approvalReq.type === 'LEAD_REREGISTRATION') {
      const lead = await Lead.findById(approvalReq.referenceId);
      if (lead) {
        lead.assignedTo = approvalReq.requestedBy;
        lead.status = 'New';
        lead.isClosed = false;
        lead.history = lead.history || [];
        lead.history.push({
          action: 'Reassigned via SuperAdmin Approval',
          notes: `Reassigned to new executive. Original narration: ${approvalReq.narration}`,
          user: req.user.name,
          date: Date.now()
        });
        await lead.save();

        await AuditLog.create({
          action: 'Lead Re-registration Approved',
          user: req.user._id,
          userName: req.user.name,
          userRole: req.user.role,
          description: `Lead ${lead.name} reassigned due to duplicate registration request.`,
          metadata: { referenceId: approvalReq.referenceId }
        });
      }
    }

    res.json(approvalReq);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/requests/:id/reject
// @desc    Reject a request
// @access  Private
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const approvalReq = await ApprovalRequest.findById(req.params.id);
    if (!approvalReq) return res.status(404).json({ message: 'Request not found' });

    approvalReq.status = 'Rejected';
    await approvalReq.save();

    if (approvalReq.type === 'CRD_CANCELLATION') {
      const crdFlow = await CRDFlow.findById(approvalReq.referenceId);
      if (crdFlow) {
        crdFlow.status = 'Active'; // Revert back to active
        crdFlow.history.push({
          action: 'Cancellation Rejected',
          notes: `SuperAdmin rejected the cancellation request.`,
          user: req.user.name,
          date: Date.now()
        });
        await crdFlow.save();
      }
    } else if (approvalReq.type === 'LEAD_REREGISTRATION') {
      const lead = await Lead.findById(approvalReq.referenceId);
      if (lead) {
        lead.history = lead.history || [];
        lead.history.push({
          action: 'Reassignment Rejected',
          notes: `SuperAdmin rejected the re-registration request from another executive.`,
          user: req.user.name,
          date: Date.now()
        });
        await lead.save();
      }
    }

    res.json(approvalReq);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
