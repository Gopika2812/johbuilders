const express = require('express');
const router = express.Router();
const { protectCustomer } = require('../middleware/auth');
const CRDFlow = require('../models/CRDFlow');

// @route   GET /api/customer/my-flow
// @desc    Get the logged-in customer's CRD flow
router.get('/my-flow', protectCustomer, async (req, res) => {
  try {
    const flow = await CRDFlow.findById(req.customerFlow._id)
      .populate('project', 'name location projectType code extraWorkCatalog')
      .populate('lead', 'name phone email');
      
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/customer/my-quotation
// @desc    Get the logged-in customer's quotation
router.get('/my-quotation', protectCustomer, async (req, res) => {
  try {
    const Quotation = require('../models/Quotation');
    const quotation = await Quotation.findOne({ lead: req.customerFlow.lead._id })
      .populate('project');
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/customer/extra-work
// @desc    Customer request for extra work
router.post('/extra-work', protectCustomer, async (req, res) => {
  const { stageIndex, name, amount } = req.body;
  try {
    const flow = req.customerFlow;
    
    if (!flow.stages[stageIndex]) {
      return res.status(404).json({ message: 'Stage not found' });
    }

    flow.stages[stageIndex].extraWorks.push({
      name,
      amount: Number(amount)
    });

    // We can push to history for tracking
    flow.history.push({
      action: 'Customer Requested Extra Work',
      notes: `Requested '${name}' for Rs. ${amount} at stage ${flow.stages[stageIndex].name}`,
      user: 'Customer'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/customer/bulk-extra-work
// @desc    Customer request for multiple extra works at once
router.post('/bulk-extra-work', protectCustomer, async (req, res) => {
  const { items } = req.body;
  try {
    const flow = req.customerFlow;
    let totalAmountAdded = 0;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be an array' });
    }

    for (const item of items) {
      const { stageIndex, name, category, unit, quantity, rate, amount } = item;
      
      if (!flow.stages[stageIndex]) continue;

      flow.stages[stageIndex].extraWorks.push({
        name,
        category: category || 'General',
        unit: unit || 'Unit',
        quantity: Number(quantity) || 1,
        rate: Number(rate) || 0,
        amount: Number(amount) || 0,
        status: 'Pending'
      });
      
      totalAmountAdded += Number(amount) || 0;
    }

    flow.history.push({
      action: 'Customer Bulk Requested Extra Works',
      notes: `Requested ${items.length} item(s) totaling Rs. ${totalAmountAdded}`,
      user: 'Customer'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/customer/complaint
// @desc    Customer raises a complaint
router.post('/complaint', protectCustomer, async (req, res) => {
  const { description } = req.body;
  try {
    const flow = req.customerFlow;
    
    if (!flow.complaints) {
      flow.complaints = [];
    }

    flow.complaints.push({
      description,
      status: 'Pending',
      reportedAt: Date.now()
    });

    flow.history.push({
      action: 'Customer Raised Complaint',
      notes: description,
      user: 'Customer'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/customer/extra-work/:stageIdx/:workId/approve
// @desc    Customer agrees with priced extra work
router.post('/extra-work/:stageIdx/:workId/approve', protectCustomer, async (req, res) => {
  const { stageIdx, workId } = req.params;
  try {
    const flow = req.customerFlow;
    
    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    if (extraWork.status !== 'Sent to Customer') {
      return res.status(400).json({ message: 'Work not ready for approval' });
    }

    extraWork.status = 'Client Approved';
    extraWork.customerApprovalDate = new Date();

    flow.history.push({
      action: 'Customer Approved Extra Work',
      notes: `Approved extra work: ${extraWork.name} for Rs. ${extraWork.amount}`,
      user: 'Customer'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/customer/extra-work/:stageIdx/:workId/remove
// @desc    Customer removes (rejects) priced extra work
router.post('/extra-work/:stageIdx/:workId/remove', protectCustomer, async (req, res) => {
  const { stageIdx, workId } = req.params;
  try {
    const flow = req.customerFlow;
    
    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    extraWork.status = 'Removed by Client';

    flow.history.push({
      action: 'Customer Removed Extra Work',
      notes: `Removed extra work: ${extraWork.name} (was Rs. ${extraWork.amount})`,
      user: 'Customer'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
