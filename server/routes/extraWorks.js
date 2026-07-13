const express = require('express');
const router = express.Router();
const CRDFlow = require('../models/CRDFlow');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/extra-works
// @desc    Get all CRD flows that have extra works
router.get('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const flows = await CRDFlow.find()
      .populate('project')
      .populate('lead')
      .lean();
    
    // We can filter flows that have extraWorks in any stage
    const flowsWithExtraWorks = flows.filter(flow => 
      flow.stages.some(stage => stage.extraWorks && stage.extraWorks.length > 0)
    );

    const Quotation = require('../models/Quotation');
    
    for (const flow of flowsWithExtraWorks) {
      if (flow.lead && flow.lead._id) {
        const quotation = await Quotation.findOne({ lead: flow.lead._id }).populate('crdPerson', 'name');
        flow.crdPersonName = quotation && quotation.crdPerson ? quotation.crdPerson.name : 'Unassigned';
      } else {
        flow.crdPersonName = 'Unassigned';
      }
    }

    res.json(flowsWithExtraWorks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/price
// @desc    PED team saves the price for an extra work
router.put('/:flowId/:stageIdx/:workId/price', protect, authorize('Admin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;
  const { rate, quantity } = req.body;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    extraWork.rate = rate;
    if (quantity) extraWork.quantity = quantity;
    extraWork.amount = rate * extraWork.quantity;
    extraWork.status = 'PED Approved';
    extraWork.pricingDate = new Date();

    flow.history.push({
      action: 'PED Priced Extra Work',
      notes: `Priced extra work: ${extraWork.name} at Rs. ${rate}`,
      user: 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/send
// @desc    Admin sends priced extra work to customer
router.put('/:flowId/:stageIdx/:workId/send', protect, authorize('Admin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    if (extraWork.status !== 'PED Approved') {
      return res.status(400).json({ message: 'Work must be PED Approved first' });
    }

    extraWork.status = 'Sent to Customer';

    flow.history.push({
      action: 'Sent Extra Work to Customer',
      notes: `Sent extra work: ${extraWork.name} to customer for approval`,
      user: 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/add-to-crd
// @desc    CRD Team adds the Client Approved extra work to the flow/stage
router.put('/:flowId/:stageIdx/:workId/add-to-crd', protect, authorize('Admin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    if (extraWork.status !== 'Client Approved') {
      return res.status(400).json({ message: 'Work must be Client Approved first' });
    }

    // Add amount to stage and flow
    stage.amount += extraWork.amount;
    flow.totalCurrentValue += extraWork.amount;
    flow.totalExtraWorksValue += extraWork.amount;
    flow.debtorsAmount += extraWork.amount;

    extraWork.status = 'Added to CRD';
    extraWork.crdAddedDate = new Date();

    flow.history.push({
      action: 'Extra Work Added to CRD',
      notes: `Added extra work: ${extraWork.name} (Rs. ${extraWork.amount}) to Stage ${stage.name}`,
      user: 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/extra-works/:flowId/add
// @desc    Admin adds a new extra work directly
router.post('/:flowId/add', protect, authorize('Admin'), async (req, res) => {
  const { flowId } = req.params;
  const { stageId, name, category, unit, quantity, rate } = req.body;
  
  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages.id(stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const parsedRate = Number(rate) || 0;
    const parsedQty = Number(quantity) || 1;
    const amount = parsedQty * parsedRate;
    
    const newWork = {
      name,
      category: category || 'General',
      unit: unit || 'Unit',
      quantity: parsedQty,
      rate: parsedRate,
      amount: amount,
      status: parsedRate > 0 ? 'PED Approved' : 'Pending',
      addedAt: new Date()
    };
    
    if (parsedRate > 0) {
      newWork.pricingDate = new Date();
    }

    stage.extraWorks.push(newWork);
    
    flow.history.push({
      action: 'Admin Added Extra Work',
      notes: `Added extra work: ${name} to Stage ${stage.name}`,
      user: 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
