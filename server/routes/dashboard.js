const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const Project = require('../models/Project');
const BudgetPlan = require('../models/BudgetPlan');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get aggregate stats for dashboard insights with date range, user and project filtering
router.get('/stats', protect, async (req, res) => {
  const { fromDate, toDate, userId, projectId } = req.query;
  try {
    // 1. Build leads filters
    let query = {};
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    if (projectId) {
      query.project = projectId;
    }
    if (userId) {
      query.assignedTo = userId;
    }

    const leads = await Lead.find(query).populate('project').populate('assignedTo');

    // 2. Build quotations filters
    let qQuery = {};
    if (fromDate || toDate) {
      qQuery.createdAt = query.createdAt;
    }
    if (projectId) {
      qQuery.project = projectId;
    }
    if (userId) {
      const userLeads = await Lead.find({ assignedTo: userId });
      const leadIds = userLeads.map(ul => ul._id);
      qQuery.lead = { $in: leadIds };
    }

    const quotations = await Quotation.find(qQuery).populate('lead').populate('project').populate('createdBy');

    // 3. Fetch budget plans
    const budgetPlans = await BudgetPlan.find({});

    // Fetch lists for filters
    const allUsers = await User.find({}, 'name role');
    const dbProjects = await Project.find({}, 'name code');

    // Computation variables
    let totalEnquiries = 0;
    let contactedCount = 0;
    let followupCount = 0;
    let closedEnquiries = 0;

    let totalSiteVisits = 0;
    let siteVisitCount = 0;
    let siteVisitFollowupCount = 0;
    let closedSiteVisits = 0;

    let hotListCount = 0;
    let siteConversionsCount = 0;
    let bookingValueTotal = 0;

    const sourceStats = {};
    const userStats = {};
    const projectStats = {};
    const stageStats = {};

    // Concentric Layered Stats
    const layeredStats = {
      projectTypes: {}, 
      stages: {},       
      sources: {}       
    };

    // Seed sources
    budgetPlans.forEach(plan => {
      plan.allocations?.forEach(alloc => {
        if (!sourceStats[alloc.source]) {
          sourceStats[alloc.source] = { budget: 0, spent: 0, count: 0, value: 0 };
        }
        sourceStats[alloc.source].budget += alloc.budget || 0;
        sourceStats[alloc.source].spent += alloc.spent || 0;
      });
    });

    leads.forEach(lead => {
      const status = lead.status;
      const src = lead.leadSource || 'Direct Visit';

      if (!sourceStats[src]) {
        sourceStats[src] = { budget: 0, spent: 0, count: 0, value: 0 };
      }
      sourceStats[src].count += 1;

      if (!stageStats[status]) {
        stageStats[status] = { count: 0, value: 0 };
      }
      stageStats[status].count += 1;

      if (lead.project) {
        const pCode = lead.project.code || lead.project.name;
        if (!projectStats[pCode]) {
          projectStats[pCode] = { count: 0, value: 0, stages: {} };
        }
        projectStats[pCode].count += 1;
        projectStats[pCode].stages[status] = (projectStats[pCode].stages[status] || 0) + 1;
      }

      if (status === 'Contacted' || status === 'Follow-Up') {
        totalEnquiries += 1;
        if (status === 'Contacted') contactedCount += 1;
        if (status === 'Follow-Up') followupCount += 1;
      }

      if (status === 'Site Visit' || status === 'Site Visit Follow-up') {
        totalSiteVisits += 1;
        if (status === 'Site Visit') siteVisitCount += 1;
        if (status === 'Site Visit Follow-up') siteVisitFollowupCount += 1;
      }

      if (status === 'Lost' || status === 'Closed' || lead.isClosed) {
        const hasSiteVisitHistory = lead.history?.some(h => h.status === 'Site Visit' || h.status === 'Site Visit Follow-up');
        if (hasSiteVisitHistory || status === 'Site Visit' || status === 'Site Visit Follow-up') {
          closedSiteVisits += 1;
        } else {
          closedEnquiries += 1;
        }
      }

      if (status === 'Qualified') {
        hotListCount += 1;
      }
      if (status === 'Booking' || status === 'Won') {
        siteConversionsCount += 1;
      }
    });

    quotations.forEach(q => {
      const val = q.totalValue || 0;
      const isBooking = q.lead && (q.lead.status === 'Booking' || q.lead.status === 'Won');

      if (isBooking) {
        bookingValueTotal += val;

        const pType = q.project?.projectType || 'Plot';
        layeredStats.projectTypes[pType] = (layeredStats.projectTypes[pType] || 0) + val;

        const stageName = q.lead?.status || 'Booking';
        layeredStats.stages[stageName] = (layeredStats.stages[stageName] || 0) + val;

        const src = q.lead?.leadSource || 'Direct Visit';
        layeredStats.sources[src] = (layeredStats.sources[src] || 0) + val;
      }

      const src = q.lead?.leadSource || 'Direct Visit';
      if (!sourceStats[src]) {
        sourceStats[src] = { budget: 0, spent: 0, count: 0, value: 0 };
      }
      if (isBooking) {
        sourceStats[src].value += val;
      }

      if (q.createdBy) {
        const uName = q.createdBy.name;
        if (!userStats[uName]) {
          userStats[uName] = { count: 0, value: 0 };
        }
        userStats[uName].count += 1;
        if (isBooking) {
          userStats[uName].value += val;
        }
      }

      if (q.project) {
        const pCode = q.project.code || q.project.name;
        if (!projectStats[pCode]) {
          projectStats[pCode] = { count: 0, value: 0, stages: {} };
        }
        if (isBooking) {
          projectStats[pCode].value += val;
        }
      }

      const stage = q.lead?.status || 'Booking';
      if (!stageStats[stage]) {
        stageStats[stage] = { count: 0, value: 0 };
      }
      if (isBooking) {
        stageStats[stage].value += val;
      }
    });

    // Calculate Projects & Units Inventory Stats
    const allProjects = await Project.find({});
    let totalProjects = allProjects.length;
    let totalUnits = 0;
    let availableUnits = 0;
    let bookedUnits = 0;
    let handoverUnits = 0;

    allProjects.forEach(p => {
      p.units?.forEach(u => {
        totalUnits += 1;
        if (u.status === 'New') {
          availableUnits += 1;
        } else if (u.status === 'Booked') {
          bookedUnits += 1;
        } else if (u.status === 'Sold Out') {
          handoverUnits += 1;
        } else {
          availableUnits += 1;
        }
      });
    });

    // Calculate custom insights
    const totalMarketingSpend = budgetPlans.reduce((sum, plan) => sum + (plan.allocations?.reduce((s, alloc) => s + (alloc.spent || 0), 0) || 0), 0);
    const totalLeadCost = leads.reduce((sum, lead) => sum + (lead.leadCost || 0), 0);
    const costPerEnquiry = totalEnquiries > 0 ? (totalLeadCost / totalEnquiries) : 0;
    
    const siteVisitConversionRate = totalSiteVisits > 0 ? (siteConversionsCount / totalSiteVisits) * 100 : 0;
    const bookingConversionRate = totalEnquiries > 0 ? (siteConversionsCount / totalEnquiries) * 100 : 0;
    const handoverRate = totalUnits > 0 ? (handoverUnits / totalUnits) * 100 : 0;

    res.json({
      cards: {
        enquiries: { total: totalEnquiries, contacted: contactedCount, followup: followupCount, closed: closedEnquiries },
        siteVisits: { total: totalSiteVisits, siteVisit: siteVisitCount, followup: siteVisitFollowupCount, closed: closedSiteVisits },
        hotList: hotListCount,
        conversion: { count: siteConversionsCount, value: bookingValueTotal },
        inventory: {
          totalProjects,
          totalUnits,
          availableUnits,
          bookedUnits,
          handoverUnits
        }
      },
      insights: {
        totalMarketingSpend,
        totalLeadCost,
        costPerEnquiry,
        siteVisitConversionRate,
        bookingConversionRate,
        handoverRate
      },
      sourceStats,
      userStats,
      projectStats,
      stageStats,
      layeredStats,
      users: allUsers,
      projects: dbProjects.map(dp => ({ _id: dp._id, name: dp.name, code: dp.code }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
