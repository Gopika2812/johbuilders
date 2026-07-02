const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Lead = require('../models/Lead');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

// @route   GET /api/quotations
// @desc    Get all quotations
router.get('/', protect, async (req, res) => {
  try {
    const quotations = await Quotation.find({})
      .populate('project', 'name code')
      .populate('lead', 'name phone')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/quotations/:id
// @desc    Get quotation by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('project')
      .populate('lead')
      .populate('createdBy', 'name role');
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/quotations
// @desc    Create a new quotation
router.post('/', protect, async (req, res) => {
  const {
    lead: leadId,
    project: projectId,
    customerName,
    customerPhone,
    customerAddress,
    projectType,
    selectedUnits,
    pricePerSqFt,
    totalArea,
    totalValue,
    alternativePhone,
    aadharNumber,
    panNumber,
    bankLoanRequired,
    loanAmount,
    preferredBank
  } = req.body;

  try {
    const quotation = new Quotation({
      lead: leadId,
      project: projectId,
      customerName,
      customerPhone,
      customerAddress,
      projectType,
      selectedUnits,
      pricePerSqFt,
      totalArea,
      totalValue,
      alternativePhone,
      aadharNumber,
      panNumber,
      bankLoanRequired,
      loanAmount,
      preferredBank,
      createdBy: req.user._id
    });

    await quotation.save();

    // Log in Lead History
    const lead = await Lead.findById(leadId);
    if (lead) {
      lead.history.push({
        status: lead.status,
        assignedTo: lead.assignedTo,
        updatedBy: req.user._id,
        timestamp: new Date(),
        note: `Quotation Created: Valuation Rs. ${totalValue.toLocaleString()} for Unit(s): ${selectedUnits.join(', ')}`
      });
      await lead.save();
    }

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Create Quotation',
      description: `Created quotation for customer ${customerName} (${customerPhone}) on project type ${projectType}`
    });

    res.status(201).json(quotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   PUT /api/quotations/:id
// @desc    Update an existing quotation
router.put('/:id', protect, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const prevData = quotation.toObject();
    const changedFields = [];
    const fieldsToTrack = [
      'customerName', 'customerPhone', 'customerAddress', 'projectType', 
      'selectedUnits', 'pricePerSqFt', 'totalArea', 'totalValue', 
      'alternativePhone', 'aadharNumber', 'panNumber', 'bankLoanRequired', 
      'loanAmount', 'preferredBank'
    ];

    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined) {
        let prevVal = prevData[field];
        let newVal = req.body[field];

        if (Array.isArray(prevVal) && Array.isArray(newVal)) {
          if (JSON.stringify([...prevVal].sort()) !== JSON.stringify([...newVal].sort())) {
            changedFields.push({
              field,
              prev: prevVal.join(', '),
              next: newVal.join(', ')
            });
          }
        } else if (prevVal !== newVal && String(prevVal) !== String(newVal)) {
          changedFields.push({
            field,
            prev: prevVal === undefined || prevVal === null ? 'N/A' : String(prevVal),
            next: newVal === undefined || newVal === null ? 'N/A' : String(newVal)
          });
        }
      }
    });

    Object.assign(quotation, req.body);
    await quotation.save();

    // Log in Lead History
    const lead = await Lead.findById(quotation.lead);
    if (lead) {
      lead.history.push({
        status: lead.status,
        assignedTo: lead.assignedTo,
        updatedBy: req.user._id,
        timestamp: new Date(),
        note: `Quotation Updated: Valuation Rs. ${quotation.totalValue.toLocaleString()} for Unit(s): ${quotation.selectedUnits.join(', ')}`
      });
      await lead.save();
    }

    let auditDescription = `Updated quotation for customer ${quotation.customerName} (${quotation.customerPhone})`;
    if (changedFields.length > 0) {
      auditDescription += `. Changes: ${changedFields.map(f => `${f.field}: "${f.prev}" → "${f.next}"`).join('; ')}`;
    }

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Update Quotation',
      description: auditDescription,
      metadata: changedFields.length > 0 ? { changedFields } : null
    });

    res.json(quotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE /api/quotations/:id
// @desc    Delete a quotation
router.delete('/:id', protect, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Log in Lead History
    const lead = await Lead.findById(quotation.lead);
    if (lead) {
      lead.history.push({
        status: lead.status,
        assignedTo: lead.assignedTo,
        updatedBy: req.user._id,
        timestamp: new Date(),
        note: `Quotation Deleted: Valuation Rs. ${quotation.totalValue.toLocaleString()} for Unit(s): ${quotation.selectedUnits.join(', ')}`
      });
      await lead.save();
    }

    await quotation.deleteOne();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Delete Quotation',
      description: `Deleted quotation ${req.params.id} for customer ${quotation.customerName}`
    });

    res.json({ message: 'Quotation deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/quotations/summary-stats/:month
// @desc    Get aggregated stats for overall sales target, houses sold, plots sold for this and last month
router.get('/summary-stats/:month', protect, async (req, res) => {
  const { month } = req.params; // format: "YYYY-MM"
  try {
    const getStatsForMonth = async (targetMonth) => {
      const startDate = new Date(`${targetMonth}-01T00:00:00.000Z`);
      const year = parseInt(targetMonth.split('-')[0]);
      const monthNum = parseInt(targetMonth.split('-')[1]);
      const endDate = new Date(year, monthNum, 1);

      // Find all quotations created in this range
      const quotations = await Quotation.find({
        createdAt: { $gte: startDate, $lt: endDate }
      }).populate('lead');

      // Filter only those whose lead status is 'Booking'
      const bookingQuotations = quotations.filter(q => q.lead && q.lead.status === 'Booking');

      let salesValue = 0; // In rupees
      let villasCount = 0; // count of Flat/Villa units
      let plotsCount = 0;  // count of Plot units

      bookingQuotations.forEach(q => {
        salesValue += q.totalValue || 0;
        const unitCount = q.selectedUnits?.length || 1;
        if (q.projectType === 'Plot') {
          plotsCount += unitCount;
        } else {
          villasCount += unitCount;
        }
      });

      // Sales target in Crores (1 Crore = 10,000,000)
      const salesInCrores = salesValue / 10000000;

      return {
        salesValue: parseFloat(salesInCrores.toFixed(4)),
        villasCount,
        plotsCount
      };
    };

    const currentStats = await getStatsForMonth(month);

    // Calculate last month string YYYY-MM
    const currentYear = parseInt(month.split('-')[0]);
    const currentMonthNum = parseInt(month.split('-')[1]);
    let prevYear = currentYear;
    let prevMonthNum = currentMonthNum - 1;
    if (prevMonthNum === 0) {
      prevMonthNum = 12;
      prevYear -= 1;
    }
    const prevMonthStr = `${prevYear}-${prevMonthNum.toString().padStart(2, '0')}`;
    const lastMonthStats = await getStatsForMonth(prevMonthStr);

    res.json({
      current: currentStats,
      lastMonth: lastMonthStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
