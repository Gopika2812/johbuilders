const express = require('express');
const router = express.Router();
const CRDFlow = require('../models/CRDFlow');
const Lead = require('../models/Lead');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

// @route   GET /api/crd-flow
// @desc    Get all active CRD flows
router.get('/', protect, async (req, res) => {
  try {
    const flows = await CRDFlow.find({})
      .populate('project', 'name code location')
      .populate('lead', 'name phone')
      .sort({ updatedAt: -1 });
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
  const { uploadedPdfs } = req.body;
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
    if (uploadedPdfs) {
      flow.stages[idx].uploadedPdfs = uploadedPdfs;
    }

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
    flow.totalExtraWorksValue += extraAmt;
    flow.totalCurrentValue += extraAmt;

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

module.exports = router;
