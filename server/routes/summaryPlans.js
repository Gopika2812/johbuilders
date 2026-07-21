const express = require('express');
const router = express.Router();
const SummaryPlan = require('../models/SummaryPlan');
const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const Project = require('../models/Project');
const LeadGroup = require('../models/LeadGroup');
const { protect } = require('../middleware/auth');

// Helper to get week bucket (1 to 4)
const getWeekBucket = (date) => {
  const day = new Date(date).getUTCDate();
  if (day <= 7) return 'w1';
  if (day <= 14) return 'w2';
  if (day <= 21) return 'w3';
  return 'w4';
};

// @route   GET /api/summary-plans/project-stats/:month
// @desc    Get weekly and monthly stats for Phase 2 Project Wise Plan
router.get('/project-stats/:month', protect, async (req, res) => {
  const { month } = req.params; // format: "YYYY-MM"
  try {
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(year, monthNum, 1);

    const projects = await Project.find({});
    const stats = {};
    for (let proj of projects) {
      stats[proj._id] = {
        name: proj.name,
        code: proj.code,
        enquiries: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
        hotlist: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
        sitevisits: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
        bookedUnits: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
        bookingValue: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 }
      };
    }

    const leads = await Lead.find({
      createdAt: { $gte: startDate, $lt: endDate }
    });

    leads.forEach(lead => {
      const projId = lead.project?.toString();
      if (!projId || !stats[projId]) return;

      const week = getWeekBucket(lead.createdAt);
      const status = lead.status;

      // 1. Total Enquiries means total leads, so we unconditionally count every lead
      stats[projId].enquiries.actual += 1;
      stats[projId].enquiries[week] += 1;

      // 1.5. Hot Leads means leads that have leadCategory as 'Hot'
      if (lead.leadCategory === 'Hot') {
        stats[projId].hotlist.actual += 1;
        stats[projId].hotlist[week] += 1;
      }

      // 2. Site visits means leads that are in 'Site Visit' or 'Site Visit Follow-up' status
      if (status === 'Site Visit' || status === 'Site Visit Follow-up') {
        stats[projId].sitevisits.actual += 1;
        stats[projId].sitevisits[week] += 1;
      }

      // 3. Booked units means leads in 'Booking' stage
      if (status === 'Booking') {
        stats[projId].bookedUnits.actual += 1;
        stats[projId].bookedUnits[week] += 1;
      }
    });

    const quotations = await Quotation.find({
      createdAt: { $gte: startDate, $lt: endDate }
    }).populate('lead');

    quotations.forEach(q => {
      if (!q.project) return;
      const projId = q.project.toString();
      if (!stats[projId]) return;

      if (q.lead && q.lead.status === 'Booking') {
        const week = getWeekBucket(q.createdAt);
        const valInCr = (q.totalValue || 0) / 10000000;
        stats[projId].bookingValue.actual += valInCr;
        stats[projId].bookingValue[week] += valInCr;
      }
    });

    for (let key in stats) {
      stats[key].bookingValue.actual = parseFloat(stats[key].bookingValue.actual.toFixed(4));
      stats[key].bookingValue.w1 = parseFloat(stats[key].bookingValue.w1.toFixed(4));
      stats[key].bookingValue.w2 = parseFloat(stats[key].bookingValue.w2.toFixed(4));
      stats[key].bookingValue.w3 = parseFloat(stats[key].bookingValue.w3.toFixed(4));
      stats[key].bookingValue.w4 = parseFloat(stats[key].bookingValue.w4.toFixed(4));
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/summary-plans/marketing-stats/:month
// @desc    Get weekly and monthly stats for Phase 3 Marketing Plan
router.get('/marketing-stats/:month', protect, async (req, res) => {
  const { month } = req.params;
  try {
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(year, monthNum, 1);

    const groups = await LeadGroup.find({});

    const groupStats = {};
    groups.forEach(g => {
      groupStats[g.name] = {
        actual: 0,
        w1: 0,
        w2: 0,
        w3: 0,
        w4: 0,
        sources: g.sources || []
      };
    });

    const staticStats = {
      leadsGenerated: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
      conversions: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 }
    };

    const leads = await Lead.find({
      createdAt: { $gte: startDate, $lt: endDate }
    });

    leads.forEach(lead => {
      const week = getWeekBucket(lead.createdAt);
      // 2. LEADS GENERATED means total lead count (unconditional)
      staticStats.leadsGenerated.actual += 1;
      staticStats.leadsGenerated[week] += 1;
    });

    // 3. SITE VISIT CONVERSIONS means leads of type 'Lead' that transitioned to 'Site Visit' status during the selected month
    const conversionLeads = await Lead.find({
      leadType: 'Lead',
      history: {
        $elemMatch: {
          status: 'Site Visit',
          timestamp: { $gte: startDate, $lt: endDate }
        }
      }
    });

    conversionLeads.forEach(lead => {
      const match = lead.history.find(h =>
        h.status === 'Site Visit' &&
        h.timestamp >= startDate &&
        h.timestamp < endDate
      );
      if (match) {
        const week = getWeekBucket(match.timestamp);
        staticStats.conversions.actual += 1;
        staticStats.conversions[week] += 1;
      }
    });

    const quotations = await Quotation.find({
      createdAt: { $gte: startDate, $lt: endDate }
    }).populate('lead');

    quotations.forEach(q => {
      if (!q.lead || q.lead.status !== 'Booking') return;

      const leadSource = q.lead.leadSource;
      const week = getWeekBucket(q.createdAt);
      const val = q.totalValue || 0; // value in rupees

      // 1. Group Stats (Booking value in Cr by source group)
      for (let gName in groupStats) {
        if (groupStats[gName].sources.includes(leadSource)) {
          groupStats[gName].actual += val;
          groupStats[gName][week] += val;
          break;
        }
      }
    });

    // No division by Crores for Marketing Plan; send exact Rupee values
    res.json({
      groups: groupStats,
      static: staticStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/summary-plans/:month
// @desc    Get summary target settings for a specific month
router.get('/:month', protect, async (req, res) => {
  try {
    let plan = await SummaryPlan.findOne({ month: req.params.month });
    if (!plan) {
      plan = {
        month: req.params.month,
        salesTarget: 0,
        villasTarget: 0,
        plotsTarget: 0,
        projectTargets: [],
        marketingTargets: []
      };
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/summary-plans
// @desc    Save or update monthly summary targets
router.post('/', protect, async (req, res) => {
  const { month, salesTarget, housesTarget, villasTarget, plotsTarget, projectTargets, marketingTargets } = req.body;
  try {
    if (!month) {
      return res.status(400).json({ message: 'Month string is required' });
    }

    let plan = await SummaryPlan.findOne({ month });
    const targetVillas = villasTarget !== undefined ? villasTarget : housesTarget;
    if (plan) {
      if (salesTarget !== undefined) plan.salesTarget = Number(salesTarget) || 0;
      if (targetVillas !== undefined) plan.villasTarget = Number(targetVillas) || 0;
      if (plotsTarget !== undefined) plan.plotsTarget = Number(plotsTarget) || 0;
      if (projectTargets !== undefined) plan.projectTargets = projectTargets || [];
      if (marketingTargets !== undefined) plan.marketingTargets = marketingTargets || [];
      await plan.save();
    } else {
      plan = new SummaryPlan({
        month,
        salesTarget: Number(salesTarget) || 0,
        villasTarget: Number(targetVillas) || 0,
        plotsTarget: Number(plotsTarget) || 0,
        projectTargets: projectTargets || [],
        marketingTargets: marketingTargets || []
      });
      await plan.save();
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
