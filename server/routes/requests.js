const express = require('express');
const router = express.Router();
const ApprovalRequest = require('../models/ApprovalRequest');
const CRDFlow = require('../models/CRDFlow');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

// @route   GET /api/requests
// @desc    Get all pending requests (Super Admin only typically)
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
    }

    res.json(approvalReq);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
