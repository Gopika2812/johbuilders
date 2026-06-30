const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const Project = require('../models/Project');
const BudgetPlan = require('../models/BudgetPlan');
const User = require('../models/User');
const CRDFlow = require('../models/CRDFlow');
const LeadGroup = require('../models/LeadGroup');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get aggregate stats for dashboard insights with date range, user and project filtering
router.get('/stats', protect, async (req, res) => {
  const { fromDate, toDate, userId, projectId, projectType, source } = req.query;
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
    
    if (projectType) {
      const matchingProjects = await Project.find({ projectType: projectType });
      const matchingProjectIds = matchingProjects.map(p => p._id);
      
      if (projectId) {
        if (matchingProjectIds.map(id => id.toString()).includes(projectId.toString())) {
          query.project = projectId;
        } else {
          query.project = new mongoose.Types.ObjectId(); // matches nothing
        }
      } else {
        query.project = { $in: matchingProjectIds };
      }
    } else if (projectId) {
      query.project = projectId;
    }

    if (userId) {
      query.assignedTo = userId;
    }

    if (source) {
      query.leadSource = source;
    }

    const leads = await Lead.find(query).populate('project').populate('assignedTo');

    // 2. Build quotations filters
    let qQuery = {};
    if (fromDate || toDate) {
      qQuery.createdAt = query.createdAt;
    }
    
    if (projectType) {
      qQuery.projectType = projectType;
      const matchingProjects = await Project.find({ projectType: projectType });
      const matchingProjectIds = matchingProjects.map(p => p._id);
      
      if (projectId) {
        if (matchingProjectIds.map(id => id.toString()).includes(projectId.toString())) {
          qQuery.project = projectId;
        } else {
          qQuery.project = new mongoose.Types.ObjectId();
        }
      } else {
        qQuery.project = { $in: matchingProjectIds };
      }
    } else if (projectId) {
      qQuery.project = projectId;
    }

    if (userId || source) {
      let leadFilter = {};
      if (userId) leadFilter.assignedTo = userId;
      if (source) leadFilter.leadSource = source;
      const userLeads = await Lead.find(leadFilter);
      const leadIds = userLeads.map(ul => ul._id);
      qQuery.lead = { $in: leadIds };
    }

    const quotations = await Quotation.find(qQuery).populate('lead').populate('project').populate('createdBy');

    // 3. Fetch budget plans
    let budgetQuery = {};
    if (fromDate || toDate) {
      const startMonth = fromDate ? fromDate.substring(0, 7) : null;
      const endMonth = toDate ? toDate.substring(0, 7) : null;
      if (startMonth && endMonth) {
        budgetQuery.month = { $gte: startMonth, $lte: endMonth };
      } else if (startMonth) {
        budgetQuery.month = { $gte: startMonth };
      } else if (endMonth) {
        budgetQuery.month = { $lte: endMonth };
      }
    }
    const budgetPlans = await BudgetPlan.find(budgetQuery);
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
        if (!alloc.source) return;
        // Format to Title Case e.g. "LOCAL TV" -> "Local TV", "PAPER AD" -> "Paper Ad"
        const formattedSource = alloc.source.split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');

        if (!sourceStats[formattedSource]) {
          sourceStats[formattedSource] = { budget: 0, spent: 0, count: 0, value: 0 };
        }
        sourceStats[formattedSource].budget += alloc.budget || 0;
        sourceStats[formattedSource].spent += alloc.spent || 0;
      });
    });

    const getNormalizedSourceKey = (src) => {
      const keys = Object.keys(sourceStats);
      const match = keys.find(k => k.toLowerCase() === src.toLowerCase());
      return match || src;
    };

    leads.forEach(lead => {
      const status = lead.status;
      const srcRaw = lead.leadSource || 'Direct Visit';
      const src = getNormalizedSourceKey(srcRaw);

      if (!sourceStats[src]) {
        sourceStats[src] = { budget: 0, spent: 0, count: 0, value: 0, leadCost: 0 };
      }
      sourceStats[src].count += 1;
      sourceStats[src].leadCost = (sourceStats[src].leadCost || 0) + (lead.leadCost || 0);

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

    Object.keys(sourceStats).forEach(src => {
      const statsObj = sourceStats[src];
      statsObj.leadCost = statsObj.leadCost || 0;
      statsObj.cpe = statsObj.count > 0 ? (statsObj.leadCost / statsObj.count) : 0;
    });

    quotations.forEach(q => {
      const val = q.totalValue || 0;
      const isBooking = q.lead && (q.lead.status === 'Booking' || q.lead.status === 'Won');

      if (isBooking) {
        bookingValueTotal += val;

        const pType = Array.isArray(q.project?.projectType) ? (q.project.projectType[0] || 'Plot') : (q.project?.projectType || 'Plot');
        layeredStats.projectTypes[pType] = (layeredStats.projectTypes[pType] || 0) + val;

        const stageName = q.lead?.status || 'Booking';
        layeredStats.stages[stageName] = (layeredStats.stages[stageName] || 0) + val;

        const src = q.lead?.leadSource || 'Direct Visit';
        layeredStats.sources[src] = (layeredStats.sources[src] || 0) + val;
      }

      const srcRaw = q.lead?.leadSource || 'Direct Visit';
      const src = getNormalizedSourceKey(srcRaw);
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
    let projectFilter = {};
    if (projectType) {
      projectFilter.projectType = projectType;
    }
    if (projectId) {
      projectFilter._id = projectId;
    }
    if (fromDate || toDate) {
      projectFilter.createdAt = {};
      if (fromDate) projectFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        projectFilter.createdAt.$lte = end;
      }
    }
    const allProjects = await Project.find(projectFilter);
    let totalProjects = allProjects.length;
    let totalUnits = 0;
    let availableUnits = 0;
    let bookedUnits = 0;
    let handoverUnits = 0;
    let totalByType = { Plot: 0, Flat: 0, House: 0 };
    let availableByType = { Plot: 0, Flat: 0, House: 0 };
    let bookedByType = { Plot: 0, Flat: 0, House: 0 };
    let handoverByType = { Plot: 0, Flat: 0, House: 0 };

    let totalValueByType = { Plot: 0, Flat: 0, House: 0 };
    let availableValueByType = { Plot: 0, Flat: 0, House: 0 };
    let bookedValueByType = { Plot: 0, Flat: 0, House: 0 };
    let handoverValueByType = { Plot: 0, Flat: 0, House: 0 };

    let projectsByType = { Plot: 0, Flat: 0, House: 0 };

    allProjects.forEach(p => {
      const types = p.projectType || [];
      if (types.includes('Plot')) projectsByType.Plot += 1;
      if (types.includes('Flat')) projectsByType.Flat += 1;
      if (types.includes('House')) projectsByType.House += 1;

      p.units?.forEach(u => {
        const type = u.unitType || 'Plot';
        if (projectType && type !== projectType) return;
        const val = u.price || 0;

        totalUnits += 1;
        totalByType[type] = (totalByType[type] || 0) + 1;
        totalValueByType[type] = (totalValueByType[type] || 0) + val;

        if (u.status === 'New') {
          availableUnits += 1;
          availableByType[type] = (availableByType[type] || 0) + 1;
          availableValueByType[type] = (availableValueByType[type] || 0) + val;
        } else if (u.status === 'Booked') {
          bookedUnits += 1;
          bookedByType[type] = (bookedByType[type] || 0) + 1;
          bookedValueByType[type] = (bookedValueByType[type] || 0) + val;
        } else if (u.status === 'Sold Out') {
          handoverUnits += 1;
          handoverByType[type] = (handoverByType[type] || 0) + 1;
          handoverValueByType[type] = (handoverValueByType[type] || 0) + val;
        } else {
          availableUnits += 1;
          availableByType[type] = (availableByType[type] || 0) + 1;
          availableValueByType[type] = (availableValueByType[type] || 0) + val;
        }
      });
    });

    // Calculate project-based stages breakdown
    const projectStages = {};
    allProjects.forEach(proj => {
      projectStages[proj.code || proj.name] = {
        totalLeads: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        booked: 0,
        handover: 0
      };
    });

    // Calculate person-wise project-wise stages breakdown
    const personProjectStages = {};

    leads.forEach(lead => {
      const uName = lead.assignedTo?.name || 'Unassigned';
      const pCode = lead.project?.code || lead.project?.name || 'No Project';
      const personProjectKey = `${uName}___${pCode}`;

      // Check if lead corresponds to a handed over unit (status is Won, or unit is Sold Out in project)
      let isHandover = lead.status === 'Won';
      if (!isHandover && lead.project && lead.bookingInfo?.selectedUnits?.length > 0) {
        const projId = lead.project._id || lead.project;
        const proj = allProjects.find(p => p._id.toString() === projId.toString());
        if (proj) {
          isHandover = lead.bookingInfo.selectedUnits.some(unitId => {
            const unit = proj.units?.find(u => u.unitId === unitId);
            return unit && unit.status === 'Sold Out';
          });
        }
      }

      if (!personProjectStages[personProjectKey]) {
        personProjectStages[personProjectKey] = {
          personName: uName,
          projectName: pCode,
          totalLeads: 0,
          enquiries: 0,
          siteVisits: 0,
          hotList: 0,
          booked: 0,
          handover: 0
        };
      }

      personProjectStages[personProjectKey].totalLeads += 1;
      const status = lead.status;
      if (status === 'Contacted' || status === 'Follow-Up') {
        personProjectStages[personProjectKey].enquiries += 1;
      } else if (status === 'Site Visit' || status === 'Site Visit Follow-up') {
        personProjectStages[personProjectKey].siteVisits += 1;
      } else if (status === 'Qualified') {
        personProjectStages[personProjectKey].hotList += 1;
      } else if (status === 'Booking') {
        personProjectStages[personProjectKey].booked += 1;
      }
      if (isHandover) {
        personProjectStages[personProjectKey].handover += 1;
      }

      if (lead.project) {
        const pCode = lead.project.code || lead.project.name;
        if (!projectStages[pCode]) {
          projectStages[pCode] = { totalLeads: 0, enquiries: 0, siteVisits: 0, hotList: 0, booked: 0, handover: 0 };
        }
        projectStages[pCode].totalLeads += 1;
        if (status === 'Contacted' || status === 'Follow-Up') {
          projectStages[pCode].enquiries += 1;
        } else if (status === 'Site Visit' || status === 'Site Visit Follow-up') {
          projectStages[pCode].siteVisits += 1;
        } else if (status === 'Qualified') {
          projectStages[pCode].hotList += 1;
        } else if (status === 'Booking') {
          projectStages[pCode].booked += 1;
        }
        if (isHandover) {
          projectStages[pCode].handover += 1;
        }
      }
    });

    // Compute stage-by-stage payments from CRD Flow
    const bookingLeads = leads.filter(l => l.status === 'Booking' || l.status === 'Won');
    const bookingLeadIds = bookingLeads.map(l => l._id);
    const crdFlows = await CRDFlow.find({ lead: { $in: bookingLeadIds } });

    let crdTotalValue = 0;
    let crdReceivedValue = 0;

    bookingLeads.forEach(lead => {
      const cf = crdFlows.find(flow => flow.lead.toString() === lead._id.toString());
      if (cf) {
        crdTotalValue += cf.totalCurrentValue || 0;
        cf.stages?.forEach(stage => {
          stage.payments?.forEach(p => {
            crdReceivedValue += p.amount || 0;
          });
        });
      } else {
        const q = quotations.find(quot => quot.lead && quot.lead._id.toString() === lead._id.toString());
        if (q) {
          crdTotalValue += q.totalValue || 0;
        }
      }
    });

    const crdPendingValue = Math.max(0, crdTotalValue - crdReceivedValue);

    // Calculate custom insights
    const totalMarketingSpend = budgetPlans.reduce((sum, plan) => sum + (plan.allocations?.reduce((s, alloc) => s + (alloc.spent || 0), 0) || 0), 0);
    const totalLeadCost = leads.reduce((sum, lead) => sum + (lead.leadCost || 0), 0);
    const costPerEnquiry = totalEnquiries > 0 ? (totalLeadCost / totalEnquiries) : 0;
    
    const siteVisitConversionRate = totalSiteVisits > 0 ? (siteConversionsCount / totalSiteVisits) * 100 : 0;
    const bookingConversionRate = totalEnquiries > 0 ? (siteConversionsCount / totalEnquiries) * 100 : 0;
    const handoverRate = totalUnits > 0 ? (handoverUnits / totalUnits) * 100 : 0;

    // Calculate Group-wise stats for marketing spend drill-down
    const leadGroups = await LeadGroup.find({});
    const groupStats = {};

    leadGroups.forEach(g => {
      groupStats[g.name] = { budget: 0, spent: 0, value: 0, sources: [] };
    });
    groupStats['Other / Unassigned'] = { budget: 0, spent: 0, value: 0, sources: [] };

    Object.keys(sourceStats).forEach(srcName => {
      const statsObj = sourceStats[srcName];
      
      const matchingGroup = leadGroups.find(g => 
        g.sources?.some(s => s.toLowerCase() === srcName.toLowerCase())
      );

      const groupName = matchingGroup ? matchingGroup.name : 'Other / Unassigned';
      
      groupStats[groupName].budget += statsObj.budget || 0;
      groupStats[groupName].spent += statsObj.spent || 0;
      groupStats[groupName].value += statsObj.value || 0;
      groupStats[groupName].sources.push({
        source: srcName,
        budget: statsObj.budget || 0,
        spent: statsObj.spent || 0,
        value: statsObj.value || 0,
        leadCost: statsObj.leadCost || 0,
        cpe: statsObj.cpe || 0
      });
    });

    if (groupStats['Other / Unassigned'].budget === 0 && groupStats['Other / Unassigned'].spent === 0 && groupStats['Other / Unassigned'].value === 0) {
      delete groupStats['Other / Unassigned'];
    }

    res.json({
      cards: {
        totalLeads: leads.length,
        enquiries: { total: totalEnquiries, contacted: contactedCount, followup: followupCount, closed: closedEnquiries },
        siteVisits: { total: totalSiteVisits, siteVisit: siteVisitCount, followup: siteVisitFollowupCount, closed: closedSiteVisits },
        hotList: hotListCount,
        conversion: { 
          count: siteConversionsCount, 
          value: crdTotalValue,
          received: crdReceivedValue,
          pending: crdPendingValue
        },
        inventory: {
          totalProjects,
          totalUnits,
          availableUnits,
          bookedUnits,
          handoverUnits,
          totalByType,
          availableByType,
          bookedByType,
          handoverByType,
          totalValueByType,
          availableValueByType,
          bookedValueByType,
          handoverValueByType,
          projectsByType
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
      projectStages,
      personProjectStages,
      sourceStats,
      groupStats,
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
