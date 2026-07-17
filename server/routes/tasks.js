const express = require('express');
const router = express.Router();
const CRDFlow = require('../models/CRDFlow');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/tasks
// @desc    Get all complaints/tasks
// @access  Private (Staff/Superadmin)
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let flows = await CRDFlow.find().populate('lead').populate('project');
    
    let allTasks = [];
    flows.forEach(flow => {
      if (flow.complaints && flow.complaints.length > 0) {
        flow.complaints.forEach(complaint => {
          allTasks.push({
            flowId: flow._id,
            complaintId: complaint._id,
            customerName: flow.lead?.name || 'Unknown',
            customerPhone: flow.lead?.phone || 'Unknown',
            projectName: flow.project?.name || 'Unknown',
            unitId: flow.unitId,
            history: flow.history ? flow.history.filter(h => h.notes && h.notes.includes(complaint.token)) : [],
            ...complaint.toObject()
          });
        });
      }
    });

    // If user is not Superadmin/Superadmin, filter to only their tasks
    // Note: For complaints dashboard, all users with permission see complaints based on status,
    // so we might not want to hard-filter by assignedTo here if they need to see team queues.
    // However, keeping existing assignedTo filter for specific execution workers.
    // Actually, CRD and PED teams need to see all complaints in their queues.
    // We'll leave it returning all tasks to frontend and let frontend filter by role/status
    // if the user has `extra_works_crd` or `extra_works_ped` permission.
    // To not break existing stuff, if they don't have CRD/PED role, filter by assignedTo.
    if (req.user.role !== 'Superadmin' && req.user.role !== 'Superadmin') {
      const perms = req.user.permissions || [];
      const hasTeamView = perms.some(p => ['extra_works_crd', 'extra_works_ped', 'extra_works_client'].includes(p.pageId));
      if (!hasTeamView) {
        allTasks = allTasks.filter(t => t.assignedTo?.toString() === req.user._id.toString());
      }
    }

    // Filter by date if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      allTasks = allTasks.filter(t => {
        const d = new Date(t.reportedAt);
        return d >= start && d <= end;
      });
    }

    // Sort by most recent first
    allTasks.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

    res.json(allTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tasks/:flowId/:complaintId/assign
// @desc    Assign task to staff and set risk level
// @access  Private Superadmin
router.put('/:flowId/:complaintId/assign', protect, authorize('Superadmin', 'Superadmin'), async (req, res) => {
  const { assignedTo, riskLevel } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const user = await User.findById(assignedTo);
    if (!user) return res.status(404).json({ message: 'Assigned User not found' });

    complaint.assignedTo = user._id;
    complaint.assignedPersonName = user.name;
    complaint.riskLevel = riskLevel;

    flow.history.push({
      action: 'Complaint Assigned',
      notes: `Complaint assigned to ${user.name} with ${riskLevel} risk`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tasks/:flowId/:complaintId/send-to-ped
// @desc    CRD sends a complaint to the PED team for pricing
// @access  Private
router.put('/:flowId/:complaintId/send-to-ped', protect, async (req, res) => {
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'Sent to PED';
    complaint.sentToPedAt = Date.now();

    flow.history.push({
      action: 'Sent to PED Team',
      notes: `Complaint ${complaint.token} sent to PED team for pricing`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tasks/:flowId/:complaintId/ped-price
// @desc    PED updates price and returns to CRD
// @access  Private
router.put('/:flowId/:complaintId/ped-price', protect, async (req, res) => {
  const { pedPrice } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.pedPrice = Number(pedPrice) || 0;
    complaint.status = 'Returned to CRD';
    complaint.clientNotes = '';
    complaint.pricingDate = Date.now();

    flow.history.push({
      action: 'PED Pricing Updated',
      notes: `PED team updated price (Rs. ${pedPrice}) for complaint ${complaint.token}`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tasks/:flowId/:complaintId/send-to-customer
// @desc    CRD sends priced complaint to customer for approval
// @access  Private
router.put('/:flowId/:complaintId/send-to-customer', protect, async (req, res) => {
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'Sent to Customer';
    complaint.customerSentDate = Date.now();

    flow.history.push({
      action: 'Sent to Customer',
      notes: `Complaint ${complaint.token} sent to customer for review/approval`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tasks/:flowId/:complaintId/client-decision
// @desc    Client approves or rejects the complaint
// @access  Private
router.put('/:flowId/:complaintId/client-decision', protect, async (req, res) => {
  const { decision } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (decision === 'Approved') {
      complaint.status = 'Client Approved';
    } else if (decision === 'Rejected') {
      complaint.status = 'Rejected';
    } else {
      return res.status(400).json({ message: 'Invalid decision' });
    }
    
    complaint.customerApprovalDate = Date.now();

    flow.history.push({
      action: `Client Decision: ${decision}`,
      notes: `Complaint ${complaint.token} was ${decision.toLowerCase()} by client`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tasks/:flowId/:complaintId/send-to-ped-execution
// @desc    CRD sends approved complaint to PED for execution
// @access  Private
router.put('/:flowId/:complaintId/send-to-ped-execution', protect, async (req, res) => {
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'Execution Sent to PED';
    complaint.executionSentDate = Date.now();

    flow.history.push({
      action: 'Execution Sent to PED',
      notes: `Complaint ${complaint.token} sent to PED for execution`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tasks/:flowId/:complaintId/status
// @desc    Update execution status (Start Work, In Progress, Completed)
// @access  Private
router.put('/:flowId/:complaintId/status', protect, async (req, res) => {
  const { status } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    if (status === 'Completed' || status === 'Resolved') {
      complaint.resolvedAt = Date.now();
    }

    flow.history.push({
      action: 'Execution Status Updated',
      notes: `Complaint ${complaint.token} status changed to ${status}`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tasks/:flowId/:complaintId/send-to-customer-completed
// @desc    CRD sends completed work to Customer
// @access  Private
router.put('/:flowId/:complaintId/send-to-customer-completed', protect, async (req, res) => {
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'Sent to Client (Completed)';

    flow.history.push({
      action: 'Completed Work Sent to Client',
      notes: `Completed complaint ${complaint.token} sent to client for feedback`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tasks/:flowId/:complaintId/feedback
// @desc    Client submits feedback on completed complaint
// @access  Private
router.put('/:flowId/:complaintId/feedback', protect, async (req, res) => {
  const { rating, feedback } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'Feedback Received';
    complaint.clientRating = Number(rating);
    complaint.clientFeedback = feedback;
    complaint.feedbackDate = Date.now();

    flow.history.push({
      action: 'Client Feedback Received',
      notes: `Client provided a ${rating}-star rating for complaint ${complaint.token}`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
