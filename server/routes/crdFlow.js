const express = require('express');
const router = express.Router();
const CRDFlow = require('../models/CRDFlow');
const Lead = require('../models/Lead');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const ApprovalRequest = require('../models/ApprovalRequest');
const { protect } = require('../middleware/auth');

// @route   GET /api/crd-flow
// @desc    Get all active CRD flows
router.get('/', protect, async (req, res) => {
  try {
    let flows = await CRDFlow.find({})
      .populate('project', 'name code location')
      .populate('lead', 'name phone bankLoan')
      .sort({ updatedAt: -1 });
      
    // Filter out orphaned flows where lead was deleted
    flows = flows.filter(flow => flow.lead != null);
    
    res.json(flows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/crd-flow/booking/:leadId
// @desc    Get CRD flow for a specific booking
router.get('/booking/:leadId', protect, async (req, res) => {
  try {
    const flow = await CRDFlow.findOne({ lead: req.params.leadId })
      .populate('project')
      .populate('lead');
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/crd-flow/:id
// @desc    Get a single CRD flow by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const flow = await CRDFlow.findById(req.params.id)
      .populate('project')
      .populate('lead');
    if (!flow) return res.status(404).json({ message: 'Flow not found' });
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/crd-flow
// @desc    Initialize a CRD flow for a booking
router.post('/', protect, async (req, res) => {
  const { leadId, projectId, unitId, stages, totalOriginalValue } = req.body;

  try {
    // Check if flow already exists
    let existingFlow = await CRDFlow.findOne({ lead: leadId });
    if (existingFlow) {
      return res.status(400).json({ message: 'CRD Flow already initialized for this booking' });
    }

    const flow = new CRDFlow({
      project: projectId,
      lead: leadId,
      unitId,
      stages: stages.map(s => ({
        name: s.name,
        percentage: Number(s.percentage),
        amount: Number(s.amount),
        isCompleted: false,
        uploadedPdfs: [],
        extraWorks: [],
        payments: []
      })),
      totalOriginalValue: Number(totalOriginalValue),
      totalExtraWorksValue: 0,
      totalCurrentValue: Number(totalOriginalValue)
    });

    await flow.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Initialize CRD Flow',
      description: `Initialized construction milestone stages for unit ${unitId}`
    });

    const populated = await CRDFlow.findById(flow._id).populate('project').populate('lead');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/crd-flow/:id/stage/:stageIndex/complete
// @desc    Complete a stage & verify document uploads if required
router.put('/:id/stage/:stageIndex/complete', protect, async (req, res) => {
  const { uploadedPdfs, completionNotes } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow record not found' });

    const idx = Number(req.params.stageIndex);
    if (idx < 0 || idx >= flow.stages.length) {
      return res.status(400).json({ message: 'Invalid stage index' });
    }

    // 2nd stage requires 5 PDFs
    if (idx === 1 && (!uploadedPdfs || uploadedPdfs.length < 5)) {
      return res.status(400).json({ message: 'Agreement & Deed registration stage requires 5 PDF uploads' });
    }

    flow.stages[idx].isCompleted = true;
    flow.stages[idx].completedDate = new Date();
    if (completionNotes) {
      flow.stages[idx].completionNotes = completionNotes;
    }
    if (uploadedPdfs) {
      flow.stages[idx].uploadedPdfs = uploadedPdfs;
    }

    flow.history.push({
      action: 'Stage Completed',
      notes: `Stage "${flow.stages[idx].name}" completed. ${completionNotes ? 'Notes: ' + completionNotes : ''}`,
      user: req.user.name,
      date: Date.now()
    });

    // Check if this is the Handing Over stage
    const isHandingOver = flow.stages[idx].name.toLowerCase().includes('handing over') || 
                         flow.stages[idx].name.toLowerCase().includes('handover');
    if (isHandingOver) {
      const project = await Project.findById(flow.project);
      if (project) {
        const unitIdsToUpdate = flow.unitId.split(',').map(uid => uid.trim());
        project.units.forEach(u => {
          if (unitIdsToUpdate.includes(u.unitId)) {
            u.status = 'Sold Out';
          }
        });
        await project.save();
      }
    }

    await flow.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Complete Stage',
      description: `Completed stage ${flow.stages[idx].name} for unit ${flow.unitId}`
    });

    const populated = await CRDFlow.findById(flow._id).populate('project').populate('lead');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/crd-flow/:id/stage/:stageIndex/extra-work
// @desc    Add extra work to a stage
router.put('/:id/stage/:stageIndex/extra-work', protect, async (req, res) => {
  const { name, amount } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow record not found' });

    const idx = Number(req.params.stageIndex);
    if (idx < 0 || idx >= flow.stages.length) {
      return res.status(400).json({ message: 'Invalid stage index' });
    }

    const extraAmt = Number(amount);
    if (isNaN(extraAmt) || extraAmt <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    flow.stages[idx].extraWorks.push({ name, amount: extraAmt });

    const stagesCount = flow.stages.length - idx;
    if (stagesCount > 0) {
      let sumSplit = 0;
      for (let j = idx; j < flow.stages.length; j++) {
        let currentSplit = Math.round(extraAmt / stagesCount);
        if (j === flow.stages.length - 1) {
          currentSplit = extraAmt - sumSplit;
        } else {
          sumSplit += currentSplit;
        }
        flow.stages[j].amount += currentSplit;
      }
    }

    flow.totalExtraWorksValue += extraAmt;
    flow.totalCurrentValue += extraAmt;

    await flow.save();

    const populated = await CRDFlow.findById(flow._id).populate('project').populate('lead');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/crd-flow/:id/stage/:stageIndex/extra-work/:workId
// @desc    Revert/Delete an extra work item and deduct its split values
router.delete('/:id/stage/:stageIndex/extra-work/:workId', protect, async (req, res) => {
  try {
    const flow = await CRDFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow record not found' });

    const idx = Number(req.params.stageIndex);
    if (idx < 0 || idx >= flow.stages.length) {
      return res.status(400).json({ message: 'Invalid stage index' });
    }

    const workId = req.params.workId;
    const stage = flow.stages[idx];
    const workItem = stage.extraWorks.id(workId);
    if (!workItem) {
      return res.status(404).json({ message: 'Extra work item not found' });
    }

    const extraAmt = workItem.amount;

    // Deduct split amount from current and next stages
    const stagesCount = flow.stages.length - idx;
    if (stagesCount > 0) {
      let sumSplit = 0;
      for (let j = idx; j < flow.stages.length; j++) {
        let currentSplit = Math.round(extraAmt / stagesCount);
        if (j === flow.stages.length - 1) {
          currentSplit = extraAmt - sumSplit;
        } else {
          sumSplit += currentSplit;
        }
        flow.stages[j].amount -= currentSplit;
      }
    }

    // Remove the extra work item
    stage.extraWorks.pull(workId);

    // Deduct from total values
    flow.totalExtraWorksValue -= extraAmt;
    flow.totalCurrentValue -= extraAmt;

    await flow.save();

    const populated = await CRDFlow.findById(flow._id).populate('project').populate('lead');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/crd-flow/:id/stage/:stageIndex/payment
// @desc    Submit split payment for a stage
router.put('/:id/stage/:stageIndex/payment', protect, async (req, res) => {
  const { method, amount, details, payments } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow record not found' });

    const idx = Number(req.params.stageIndex);
    if (idx < 0 || idx >= flow.stages.length) {
      return res.status(400).json({ message: 'Invalid stage index' });
    }

    if (payments && Array.isArray(payments)) {
      payments.forEach(p => {
        flow.stages[idx].payments.push({
          method: p.method,
          amount: Number(p.amount),
          details: p.details
        });
      });
    } else {
      const payAmt = Number(amount);
      if (isNaN(payAmt) || payAmt <= 0) {
        return res.status(400).json({ message: 'Amount must be positive' });
      }
      flow.stages[idx].payments.push({
        method,
        amount: payAmt,
        details
      });
    }

    await flow.save();
    const populated = await CRDFlow.findById(flow._id).populate('project').populate('lead');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/crd-flow/:id/complaints
// @desc    Add a customer complaint
router.post('/:id/complaints', protect, async (req, res) => {
  const { description } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow record not found' });

    flow.complaints.push({ description, status: 'Pending' });
    await flow.save();

    const populated = await CRDFlow.findById(flow._id).populate('project').populate('lead');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/crd-flow/:id/complaints/:complaintId
// @desc    Update complaint status or resolve
router.put('/:id/complaints/:complaintId', protect, async (req, res) => {
  const { status } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow record not found' });

    const complaint = flow.complaints.id(req.params.complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    if (status === 'Resolved') {
      complaint.resolvedAt = Date.now();
    } else {
      complaint.resolvedAt = undefined;
    }

    await flow.save();
    const populated = await CRDFlow.findById(flow._id).populate('project').populate('lead');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/crd-flow/:id/cancel-request
// @desc    Submit a request to cancel the CRD flow
router.put('/:id/cancel-request', protect, async (req, res) => {
  const { narration } = req.body;
  if (!narration) return res.status(400).json({ message: 'Narration is required' });

  try {
    const flow = await CRDFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow record not found' });

    if (flow.status === 'Cancel Requested') {
      return res.status(400).json({ message: 'Cancellation already requested' });
    }

    flow.status = 'Cancel Requested';
    flow.history.push({
      action: 'Cancel Requested',
      notes: `Narration: ${narration}`,
      user: req.user.name,
      date: Date.now()
    });
    await flow.save();

    await ApprovalRequest.create({
      type: 'CRD_CANCELLATION',
      referenceId: flow._id,
      requestedBy: req.user._id,
      narration
    });

    const populated = await CRDFlow.findById(flow._id).populate('project').populate('lead');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/crd-flow/:id/return-payment
// @desc    Return payment for a cancelled flow, set lead to Cancelled, unit to New
router.put('/:id/return-payment', protect, async (req, res) => {
  try {
    const flow = await CRDFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow record not found' });

    if (flow.status !== 'Cancelled') {
      return res.status(400).json({ message: 'Flow must be cancelled first' });
    }

    flow.status = 'Returned';
    flow.history.push({
      action: 'Payment Returned',
      notes: 'All payments returned. Units freed up.',
      user: req.user.name,
      date: Date.now()
    });
    await flow.save();

    // Update Lead to Cancelled
    const lead = await Lead.findById(flow.lead);
    if (lead) {
      lead.status = 'Cancelled';
      lead.isClosed = true;
      lead.history.push({
        status: 'Cancelled',
        assignedTo: lead.assignedTo,
        updatedBy: req.user._id,
        timestamp: Date.now(),
        note: 'Payment returned and CRD flow cancelled.'
      });
      await lead.save();
    }

    // Update Project Units
    const project = await Project.findById(flow.project);
    if (project) {
      let updated = false;
      const unitIdsToUpdate = flow.unitId.split(',').map(uid => uid.trim());
      project.units.forEach(u => {
        if (unitIdsToUpdate.includes(u.unitId)) {
          u.status = 'New';
          u.customerName = '';
          u.customerPhone = '';
          u.leadName = '';
          u.isLocked = false;
          updated = true;
        }
      });
      if (updated) {
        await project.save();
      }
    }

    const populated = await CRDFlow.findById(flow._id).populate('project').populate('lead');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
