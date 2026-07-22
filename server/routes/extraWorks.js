const express = require('express');
const router = express.Router();
const CRDFlow = require('../models/CRDFlow');
const Project = require('../models/Project');
const Lead = require('../models/Lead');
const { protect, authorize, checkPermission } = require('../middleware/auth');

router.param('flowId', async (req, res, next, id) => {
  if (req.user && req.user.role === 'Superadmin') {
    return next();
  }
  try {
    const flow = await CRDFlow.findById(id).populate('lead');
    if (!flow) {
      return res.status(404).json({ message: 'CRD Flow not found' });
    }
    if (!req.user) {
      return next();
    }
    const lead = flow.lead;
    const isAssigned = lead ? (lead.assignedTo?.toString() === req.user._id.toString()) : false;
    
    const Quotation = require('../models/Quotation');
    const quotation = await Quotation.findOne({ lead: flow.lead?._id }, 'crdPerson');
    const isCrdPerson = quotation && quotation.crdPerson ? (quotation.crdPerson.toString() === req.user._id.toString()) : false;
    
    const { getMergedPermissions } = require('../utils/permissionHelper');
    const userPermissions = await getMergedPermissions(req.user);
    const hasExtraWorksPermission = userPermissions.some(p => 
      ['extra_works', 'extra_works_crd', 'extra_works_ped', 'extra_works_accounts'].includes(p.pageId)
    );

    if (!isAssigned && !isCrdPerson && !hasExtraWorksPermission) {
      return res.status(403).json({ message: 'You are not authorized to view or modify this construction flow' });
    }
    next();
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/extra-works
// @desc    Get all CRD flows that have extra works
router.get('/', protect, checkPermission('extra_works', 'view'), async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'Superadmin') {
      const { getMergedPermissions } = require('../utils/permissionHelper');
      const userPermissions = await getMergedPermissions(req.user);
      const hasGlobalExtraWorksPermission = userPermissions.some(p => 
        ['extra_works', 'extra_works_crd', 'extra_works_ped', 'extra_works_accounts'].includes(p.pageId) && (p.canView || p.canEdit)
      );

      if (!hasGlobalExtraWorksPermission) {
        const userLeads = await Lead.find({ assignedTo: req.user._id }, '_id');
        const leadIds = userLeads.map(l => l._id);
        
        const Quotation = require('../models/Quotation');
        const userQuotations = await Quotation.find({ crdPerson: req.user._id }, 'lead');
        const quotationLeadIds = userQuotations.map(q => q.lead);
        
        const authorizedLeadIds = [...new Set([...leadIds, ...quotationLeadIds])];
        query = { lead: { $in: authorizedLeadIds } };
      }
    }

    const flows = await CRDFlow.find(query)
      .populate('project')
      .populate('lead')
      .lean();
    
    // We can filter flows that have extraWorks in any stage
    const flowsWithExtraWorks = flows.filter(flow => {
      // Exclude cancelled flows or flows with cancelled/lost leads
      if (flow.status === 'Cancelled' || flow.status === 'Returned') return false;
      if (flow.lead && ['Lost', 'Cancelled'].includes(flow.lead.status)) return false;

      return flow.stages.some(stage => stage.extraWorks && stage.extraWorks.length > 0);
    });

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
router.put('/:flowId/:stageIdx/:workId/send-to-ped', protect, checkPermission('extra_works_crd', 'edit'), async (req, res) => {

  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

      if (extraWork.status !== 'Pending' && extraWork.status !== 'Returned to CRD') {
        return res.status(400).json({ message: 'Work must be Pending or Returned to CRD first' });
      }

    extraWork.status = 'Sent to PED';
    extraWork.sentToPedDate = new Date();

    flow.history.push({
      action: 'Sent to PED',
      notes: `Forwarded extra work: ${extraWork.name} to PED team for pricing`,
      user: 'Superadmin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/price
// @desc    PED team saves the price for an extra work
router.put('/:flowId/:stageIdx/:workId/price', protect, checkPermission('extra_works_ped', 'edit'), async (req, res) => {

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
      user: 'Superadmin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/send
// @desc    Send priced extra work to CRD (from PED) or customer (from CRD)
router.put('/:flowId/:stageIdx/:workId/send', protect, async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    const { getMergedPermissions } = require('../utils/permissionHelper');
    const permissions = req.user.role === 'Superadmin' ? [] : await getMergedPermissions(req.user);

    if (extraWork.status === 'PED Approved') {
      // Must have PED edit permission or be Superadmin
      const hasPedPermission = req.user.role === 'Superadmin' || permissions.some(p => p.pageId === 'extra_works_ped' && p.canEdit);
      if (!hasPedPermission) {
        return res.status(403).json({ message: `Access denied. User '${req.user.name}' does not have edit permission for 'extra_works_ped'.` });
      }

      extraWork.status = 'Returned to CRD';

      flow.history.push({
        action: 'Returned to CRD',
        notes: `Returned extra work: ${extraWork.name} to CRD team after pricing`,
        user: req.user ? req.user.name : 'Superadmin'
      });
    } else if (extraWork.status === 'Returned to CRD') {
      // Must have CRD edit permission or be Superadmin
      const hasCrdPermission = req.user.role === 'Superadmin' || permissions.some(p => p.pageId === 'extra_works_crd' && p.canEdit);
      if (!hasCrdPermission) {
        return res.status(403).json({ message: `Access denied. User '${req.user.name}' does not have edit permission for 'extra_works_crd'.` });
      }

      extraWork.status = 'Sent to Customer';

      flow.history.push({
        action: 'Sent Extra Work to Customer',
        notes: `Sent extra work: ${extraWork.name} to customer for approval`,
        user: req.user ? req.user.name : 'Superadmin'
      });
    } else {
      return res.status(400).json({ message: `Invalid transition for send action. Current status is '${extraWork.status}'.` });
    }

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/send-to-accounts
// @desc    CRD team sends Client Approved work to Accounts team
router.put('/:flowId/:stageIdx/:workId/send-to-accounts', protect, checkPermission('extra_works_crd', 'edit'), async (req, res) => {

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
      user: 'Superadmin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/add-to-crd
// @desc    Accounts Team adds the Client Approved extra work to the flow/stage and creates WO
router.put('/:flowId/:stageIdx/:workId/add-to-crd', protect, checkPermission('extra_works_accounts', 'edit'), async (req, res) => {

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
      user: 'Superadmin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/send-to-ped-execution
// @desc    CRD team sends work order to PED team for execution
router.put('/:flowId/:stageIdx/:workId/send-to-ped-execution', protect, checkPermission('extra_works_crd', 'edit'), async (req, res) => {

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
      user: 'Superadmin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/update-status
// @desc    Update execution status (Start Work, In Progress, Completed)
router.put('/:flowId/:stageIdx/:workId/update-status', protect, checkPermission('extra_works_ped', 'edit'), async (req, res) => {

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
    if (status === 'Completed') {
      extraWork.completedDate = new Date();
    }

    flow.history.push({
      action: `Status Updated to ${status}`,
      notes: `Extra work: ${extraWork.name} status updated to ${status}`,
      user: 'Superadmin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/extra-works/:flowId/add
// @desc    Superadmin adds a new extra work directly
router.post('/:flowId/add', protect, checkPermission('extra_works_crd', 'edit'), async (req, res) => {

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
      action: 'Superadmin Added Extra Work',
      notes: `Added extra works: ${addedNames.join(', ')} to Stage ${stage.name}`,
      user: req.user ? req.user.name : 'Superadmin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/extra-works/:flowId/:stageIdx/:workId/cancel
// @desc    Superadmin cancels an extra work request
router.put('/:flowId/:stageIdx/:workId/cancel', protect, authorize('Superadmin', 'Superadmin'), async (req, res) => {
  const { flowId, stageIdx, workId } = req.params;

  try {
    const flow = await CRDFlow.findById(flowId);
    if (!flow) return res.status(404).json({ message: 'CRD Flow not found' });

    const stage = flow.stages[stageIdx];
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const extraWork = stage.extraWorks.id(workId);
    if (!extraWork) return res.status(404).json({ message: 'Extra work not found' });

    extraWork.status = 'Cancelled by Superadmin';

    flow.history.push({
      action: 'Superadmin Cancelled Extra Work',
      notes: `Cancelled extra work: ${extraWork.name}`,
      user: req.user ? req.user.name : 'Superadmin'
    });

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
