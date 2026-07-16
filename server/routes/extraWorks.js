const express = require('express');
const router = express.Router();
const CRDFlow = require('../models/CRDFlow');
const Project = require('../models/Project');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/extra-works
// @desc    Get all CRD flows that have extra works
router.get('/', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
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

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/send-to-ped
// @desc    CRD team sends pending work to PED team
router.put('/:flowId/:stageIdx/:workId/send-to-ped', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    if (extraWork.status !== 'Pending') {
      return res.status(400).json({ message: 'Work must be Pending first' });
    }

    extraWork.status = 'Sent to PED';
    extraWork.sentToPedDate = new Date();

    flow.history.push({
      action: 'Sent to PED',
      notes: `Forwarded extra work: ${extraWork.name} to PED team for pricing`,
      user: 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/price
// @desc    PED team saves the price for an extra work
router.put('/:flowId/:stageIdx/:workId/price', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
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

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/return-to-crd
// @desc    PED team sends priced extra work back to CRD
router.put('/:flowId/:stageIdx/:workId/return-to-crd', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
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

    extraWork.status = 'Returned to CRD';

    flow.history.push({
      action: 'Returned to CRD',
      notes: `Returned extra work: ${extraWork.name} to CRD team after pricing`,
      user: 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/send
// @desc    CRD team sends priced extra work to customer
router.put('/:flowId/:stageIdx/:workId/send', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    if (extraWork.status !== 'Returned to CRD') {
      return res.status(400).json({ message: 'Work must be Returned to CRD first' });
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
// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/send-to-accounts
// @desc    CRD team sends Client Approved work to Accounts team
router.put('/:flowId/:stageIdx/:workId/send-to-accounts', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
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

    extraWork.status = 'Sent to Accounts';
    extraWork.sentToAccountsDate = new Date();

    flow.history.push({
      action: 'Sent to Accounts Team',
      notes: `Sent extra work: ${extraWork.name} to Accounts team for work order creation`,
      user: 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/add-to-crd
// @desc    Accounts Team adds the Client Approved extra work to the flow/stage and creates WO
router.put('/:flowId/:stageIdx/:workId/add-to-crd', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId).populate('project');
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    if (extraWork.status !== 'Sent to Accounts') {
      return res.status(400).json({ message: 'Work must be Sent to Accounts first' });
    }

    // Add amount to stage and flow
    stage.amount += extraWork.amount;
    flow.totalCurrentValue += extraWork.amount;
    flow.totalExtraWorksValue += extraWork.amount;
    flow.debtorsAmount += extraWork.amount;

    extraWork.status = 'Added to CRD';
    extraWork.crdAddedDate = new Date();

    flow.history.push({
      action: 'Work Order Created',
      notes: `Created Work Order for extra work: ${extraWork.name} (Rs. ${extraWork.amount})`,
      user: 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/send-to-ped-execution
// @desc    CRD team sends work order to PED team for execution
router.put('/:flowId/:stageIdx/:workId/send-to-ped-execution', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    if (extraWork.status !== 'Added to CRD') {
      return res.status(400).json({ message: 'Work must be Added to CRD first' });
    }

    extraWork.status = 'Execution Sent to PED';

    flow.history.push({
      action: 'Sent to PED for Execution',
      notes: `Sent extra work: ${extraWork.name} to PED team for execution`,
      user: 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/update-status
// @desc    Update execution status (Start Work, In Progress, Completed)
router.put('/:flowId/:stageIdx/:workId/update-status', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;
  const { status } = req.body;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    const validStatuses = ['Start Work', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    extraWork.status = status;

    flow.history.push({
      action: `Status Updated to ${status}`,
      notes: `Extra work: ${extraWork.name} status updated to ${status}`,
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
router.post('/:flowId/add', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
  const { flowId } = req.params;
  const { stageId, name, category, unit, quantity, rate, ewId, forUnit, works } = req.body;
  
  try {
    const flow = await CRDFlow.findById(flowId).populate('project');
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages.id(stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    let finalEwId = ewId;
    if (!finalEwId) {
      const projectCode = flow.project && flow.project.code ? flow.project.code : 'PRJ';
      const targetUnit = forUnit || (flow.unitId ? flow.unitId.split(',')[0].trim() : 'U');
      let uniqueEwIds = new Set();
      flow.stages.forEach(s => {
        if (s.extraWorks) {
          s.extraWorks.forEach(ew => {
            if (ew.ewId) uniqueEwIds.add(ew.ewId);
          });
        }
      });
      const nextGroupNum = uniqueEwIds.size + 1;
      finalEwId = `${projectCode}/${targetUnit}/${String(nextGroupNum).padStart(3, '0')}`;
    }

    let worksToAdd = [];
    if (works && Array.isArray(works)) {
      worksToAdd = works;
    } else if (name) {
      worksToAdd = [{ name, category, unit, quantity, rate }];
    }

    if (worksToAdd.length === 0) {
      return res.status(400).json({ message: 'No works provided' });
    }

    const addedNames = [];

    for (let work of worksToAdd) {
      const parsedRate = Number(work.rate) || 0;
      const parsedQty = Number(work.quantity) || 1;
      const amount = parsedQty * parsedRate;
      
      const newWork = {
        name: work.name,
        category: work.category || 'General',
        unit: work.unit || 'Unit',
        quantity: parsedQty,
        rate: parsedRate,
        amount: amount,
        status: parsedRate > 0 ? 'PED Approved' : 'Pending',
        addedAt: new Date(),
        ewId: finalEwId,
        forUnit: forUnit || undefined
      };
      
      if (parsedRate > 0) {
        newWork.pricingDate = new Date();
      }

      stage.extraWorks.push(newWork);
      addedNames.push(work.name);
    }
    
    flow.history.push({
      action: 'Admin Added Extra Work',
      notes: `Added extra works: ${addedNames.join(', ')} to Stage ${stage.name}`,
      user: req.user ? req.user.name : 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/cancel
// @desc    Admin cancels an extra work request
router.put('/:flowId/:stageIdx/:workId/cancel', protect, authorize('Admin', 'Super Admin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    extraWork.status = 'Cancelled by Admin';

    flow.history.push({
      action: 'Admin Cancelled Extra Work',
      notes: `Cancelled extra work: ${extraWork.name}`,
      user: req.user ? req.user.name : 'Admin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
