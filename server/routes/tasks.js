const express = require('express');
const router = express.Router();
const CRDFlow = require('../models/CRDFlow');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/tasks
// @desc    Get all complaints/tasks
// @access  Private (Staff/Admin)
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
            ...complaint.toObject()
          });
        });
      }
    });

    // If user is not Admin/Superadmin, filter to only their tasks
    if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
      allTasks = allTasks.filter(t => t.assignedTo?.toString() === req.user._id.toString());
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
// @access  Private Admin
router.put('/:flowId/:complaintId/assign', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
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

// @route   PUT /api/tasks/:flowId/:complaintId/status
// @desc    Update task status
// @access  Private (Staff/Admin)
router.put('/:flowId/:complaintId/status', protect, async (req, res) => {
  const { status } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.flowId);
    if (!flow) return res.status(404).json({ message: 'Flow not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Authorization check
    if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
      if (complaint.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
    }

    complaint.status = status;
    if (status === 'Completed' || status === 'Resolved') {
      complaint.resolvedAt = Date.now();
    }

    flow.history.push({
      action: 'Complaint Status Updated',
      notes: `Status changed to ${status}`,
      user: req.user.name
    });

    await flow.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
