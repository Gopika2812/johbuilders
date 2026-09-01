const express = require('express');
const mongoose = require('mongoose');
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
    // 1. Build queries
    let query = {};
    let dateFilter = null;
    if (fromDate || toDate) {
      dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      query.$or = [
        { createdAt: dateFilter },
        { 'history.timestamp': dateFilter }
      ];
    }

    let matchingProjectIds = null;
    if (projectType) {
      const matchingProjects = await Project.find({ projectType: projectType }, '_id').lean();
      matchingProjectIds = matchingProjects.map(p => p._id);
      if (projectId) {
        if (matchingProjectIds.map(id => id.toString()).includes(projectId.toString())) {
          query.project = projectId;
        } else {
          query.project = new mongoose.Types.ObjectId();
        }
      } else {
        query.project = { $in: matchingProjectIds };
      }
    } else if (projectId) {
      query.project = projectId;
    }

    if (userId) query.assignedTo = userId;

    let sourceFilter = null;
    if (source) {
      const sourceArr = String(source).split(',').map(s => s.trim()).filter(Boolean);
      if (sourceArr.length === 1) {
        sourceFilter = new RegExp(`^${sourceArr[0].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');
      } else if (sourceArr.length > 1) {
        sourceFilter = {
          $in: sourceArr.map(s => new RegExp(`^${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i'))
        };
      }
      if (sourceFilter) {
        query.leadSource = sourceFilter;
      }
    }

    // Build quotations query
    let qQuery = {};
    if (dateFilter) qQuery.createdAt = dateFilter;
    if (projectType && matchingProjectIds) {
      qQuery.projectType = projectType;
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

    // Execute queries in parallel using Promise.all & .lean()
    const [
      projectsForHandover,
      leads,
      userLeads,
      budgetPlans,
      allUsers,
      dbProjects
    ] = await Promise.all([
      Project.find({}, 'units').lean(),
      Lead.find(query).populate('project', 'name code').populate('assignedTo', 'name role').lean(),
      (userId || sourceFilter) ? Lead.find(userId && sourceFilter ? { assignedTo: userId, leadSource: sourceFilter } : (userId ? { assignedTo: userId } : { leadSource: sourceFilter }), '_id').lean() : Promise.resolve([]),
      BudgetPlan.find(budgetQuery).lean(),
      User.find({ role: { $nin: ['Superadmin', 'superadmin', 'Super Admin'] }, name: { $ne: 'Super Admin' } }, 'name role').lean(),
      Project.find({}, 'name code projectType').lean()
    ]);

    if (userId || sourceFilter) {
      const leadIds = userLeads.map(ul => ul._id);
      qQuery.lead = { $in: leadIds };
    }

    const quotations = await Quotation.find(qQuery)
      .populate('lead', 'name phone status assignedTo')
      .populate('project', 'name code')
      .populate('createdBy', 'name role')
      .lean();

    // Computation variables
    const rangeStart = fromDate ? new Date(fromDate) : null;
    let rangeEnd = null;
    if (toDate) {
      rangeEnd = new Date(toDate);
      rangeEnd.setUTCHours(23, 59, 59, 999);
    }

    const inRange = (date) => {
      if (!date) return false;
      const d = new Date(date);
      if (rangeStart && d < rangeStart) return false;
      if (rangeEnd && d > rangeEnd) return false;
      return true;
    };

    let cumulativeLeads = 0;
    let liveLeadsCount = 0;
    let assignedLeadsCount = 0;
    let newLeadsCount = 0;

    let cumulativeEnquiries = 0;
    let liveEnquiries = 0;
    let contactedCount = 0;
    let followupCount = 0;
    let closedEnquiries = 0;

    let cumulativeSiteVisits = 0;
    let liveSiteVisits = 0;
    let siteVisitCount = 0;
    let siteVisitFollowupCount = 0;
    let closedSiteVisits = 0;

    let cumulativeHotList = 0;
    let liveHotList = 0;

    let cumulativeBooked = 0;
    let liveBooked = 0;

    let cumulativeHandover = 0;
    let liveHandover = 0;

    let hotListCount = 0;
    let siteConversionsCount = 0;
    let bookingValueTotal = 0;

    const sourceStats = {};
    const userStats = {};
    const projectStats = {};
    const stageStats = {};
    const projectStages = {};
    const personProjectStages = {};

    dbProjects.forEach(proj => {
      projectStages[proj.code || proj.name] = {
        totalLeads: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        booked: 0,
        handover: 0,
        lost: 0
      };
    });

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
      const status = lead.status || '';
      const srcRaw = lead.leadSource || 'Direct Visit';
      const src = getNormalizedSourceKey(srcRaw);

      const createdInRange = (fromDate || toDate) ? inRange(lead.createdAt) : true;

      let enteredAssigned = false;
      let enteredEnquiry = false;
      let enteredSiteVisit = false;
      let enteredHotList = false;
      let enteredFutureFollowup = false;
      let enteredBooked = false;
      let enteredHandover = false;
      let enteredLost = false;

      if (lead.history && lead.history.length > 0) {
        lead.history.forEach(entry => {
          if (inRange(entry.timestamp)) {
            const s = entry.status;
            if (s === 'Assigned') enteredAssigned = true;
            if (s === 'Contacted' || s === 'Follow-Up' || s === 'Followup') enteredEnquiry = true;
            if (s === 'Site Visit' || s === 'Site Visit Follow-up') enteredSiteVisit = true;
            if (s === 'Hot List') enteredHotList = true;
            if (s === 'Future Follow-up' || s === 'Future Followup' || (s && s.toLowerCase().includes('future'))) enteredFutureFollowup = true;
            if (s === 'Booking' || s === 'Booked') enteredBooked = true;
            if (s === 'Won' || s === 'Handover') enteredHandover = true;
            if (s === 'Lost' || s === 'Cancelled' || s === 'Closed') enteredLost = true;
          }
        });
      }

      if (createdInRange) {
        if (status === 'Assigned') enteredAssigned = true;
        if (status === 'Contacted' || status === 'Follow-Up' || status === 'Followup') enteredEnquiry = true;
        if (status === 'Site Visit' || status === 'Site Visit Follow-up') enteredSiteVisit = true;
        if (status === 'Hot List') enteredHotList = true;
        if (status === 'Future Follow-up' || status === 'Future Followup' || (status && status.toLowerCase().includes('future'))) enteredFutureFollowup = true;
        if (status === 'Booking' || status === 'Booked') enteredBooked = true;
        if (status === 'Won' || status === 'Handover') enteredHandover = true;
        if (status === 'Lost' || lead.isClosed) enteredLost = true;
      }

      let isLeadHandover = status === 'Won';
      if (!isLeadHandover && lead.project && lead.bookingInfo?.selectedUnits?.length > 0) {
        const projId = (lead.project._id || lead.project)?.toString();
        if (projId) {
          const proj = projectsForHandover.find(p => p._id && p._id.toString() === projId);
          if (proj) {
            isLeadHandover = lead.bookingInfo.selectedUnits.some(unitId => {
              const unit = proj.units?.find(u => u.unitId === unitId);
              return unit && unit.status === 'Sold Out';
            });
          }
        }
      }

      const isSiteConversion = (lead.leadType === 'Lead' || (lead.leadSource && lead.leadSource.toLowerCase() !== 'direct visit')) &&
        !lead.isClosed && status !== 'Lost' && status !== 'Cancelled' &&
        (status === 'Site Visit' || status === 'Site Visit Follow-up' || status === 'Booking' || status === 'Won' ||
         lead.history?.some(h => h.status === 'Site Visit' || h.status === 'Site Visit Follow-up'));

      // 1. Source Stats
      if (!sourceStats[src]) {
        sourceStats[src] = {
          budget: 0,
          spent: 0,
          count: 0,
          value: 0,
          leadCost: 0,
          leads: [],
          enquiries: 0,
          siteVisits: 0,
          hotList: 0,
          booked: 0,
          handover: 0,
          lost: 0
        };
      }
      if (!sourceStats[src].leads) {
        sourceStats[src].leads = [];
      }

      if (createdInRange) {
        sourceStats[src].count += 1;
        sourceStats[src].leadCost = (sourceStats[src].leadCost || 0) + (lead.leadCost || 0);
        sourceStats[src].leads.push({
          name: lead.name,
          phone: lead.phone,
          leadCost: lead.leadCost || 0,
          projectType: lead.project?.projectType || 'N/A',
          projectName: lead.project?.name || 'N/A'
        });
      }

      if (enteredAssigned) sourceStats[src].assigned = (sourceStats[src].assigned || 0) + 1;
      if (enteredEnquiry) sourceStats[src].enquiries = (sourceStats[src].enquiries || 0) + 1;
      if (enteredSiteVisit) sourceStats[src].siteVisits = (sourceStats[src].siteVisits || 0) + 1;
      if (enteredHotList) sourceStats[src].hotList = (sourceStats[src].hotList || 0) + 1;
      if (enteredFutureFollowup) sourceStats[src].futureFollowup = (sourceStats[src].futureFollowup || 0) + 1;
      if (enteredBooked) sourceStats[src].booked = (sourceStats[src].booked || 0) + 1;
      if (enteredHandover || (createdInRange && isLeadHandover)) sourceStats[src].handover = (sourceStats[src].handover || 0) + 1;
      if (isSiteConversion && (createdInRange || enteredSiteVisit || enteredBooked || enteredHandover)) {
        sourceStats[src].siteConversions = (sourceStats[src].siteConversions || 0) + 1;
      }
      if (enteredLost || (createdInRange && (status === 'Lost' || lead.isClosed))) sourceStats[src].lost = (sourceStats[src].lost || 0) + 1;

      // 2. Stage & Project Stats
      const displayStatus = status === 'Site Visit Follow-up' ? 'Site Visit' : (status || 'New');

      if (createdInRange) {
        if (!stageStats[displayStatus]) {
          stageStats[displayStatus] = { count: 0, value: 0 };
        }
        stageStats[displayStatus].count += 1;
      }

      if (lead.project) {
        const pCode = lead.project.code || lead.project.name;
        if (pCode) {
          if (!projectStats[pCode]) {
            projectStats[pCode] = { count: 0, value: 0, stages: {} };
          }
          if (!projectStats[pCode].stages) {
            projectStats[pCode].stages = {};
          }
          if (createdInRange) {
            projectStats[pCode].count += 1;
          }
          if (enteredAssigned) projectStats[pCode].stages['Assigned'] = (projectStats[pCode].stages['Assigned'] || 0) + 1;
          if (enteredEnquiry) projectStats[pCode].stages['Contacted'] = (projectStats[pCode].stages['Contacted'] || 0) + 1;
          if (enteredSiteVisit) projectStats[pCode].stages['Site Visit'] = (projectStats[pCode].stages['Site Visit'] || 0) + 1;
          if (enteredHotList) projectStats[pCode].stages['Hot List'] = (projectStats[pCode].stages['Hot List'] || 0) + 1;
          if (enteredFutureFollowup) projectStats[pCode].stages['Future Follow-up'] = (projectStats[pCode].stages['Future Follow-up'] || 0) + 1;
          if (enteredBooked) projectStats[pCode].stages['Booking'] = (projectStats[pCode].stages['Booking'] || 0) + 1;
          if (enteredHandover || (createdInRange && isLeadHandover)) projectStats[pCode].stages['Won'] = (projectStats[pCode].stages['Won'] || 0) + 1;
          if (enteredLost || (createdInRange && (status === 'Lost' || lead.isClosed))) projectStats[pCode].stages['Lost'] = (projectStats[pCode].stages['Lost'] || 0) + 1;
        }
      }

      // 3. Person & Project Breakdown Stages
      const uName = lead.assignedTo?.name || 'Unassigned';
      const pCodeVal = lead.project?.code || lead.project?.name || 'No Project';
      const personProjectKey = `${uName}___${pCodeVal}`;

      if (!personProjectStages[personProjectKey]) {
        personProjectStages[personProjectKey] = {
          personName: uName,
          projectName: pCodeVal,
          totalLeads: 0,
          assigned: 0,
          enquiries: 0,
          siteVisits: 0,
          hotList: 0,
          futureFollowup: 0,
          booked: 0,
          handover: 0,
          siteConversions: 0,
          lost: 0
        };
      }

      if (createdInRange) {
        personProjectStages[personProjectKey].totalLeads += 1;
      }
      if (enteredAssigned) personProjectStages[personProjectKey].assigned += 1;
      if (enteredEnquiry) personProjectStages[personProjectKey].enquiries += 1;
      if (enteredSiteVisit) personProjectStages[personProjectKey].siteVisits += 1;
      if (enteredHotList) personProjectStages[personProjectKey].hotList += 1;
      if (enteredFutureFollowup) personProjectStages[personProjectKey].futureFollowup += 1;
      if (enteredBooked) personProjectStages[personProjectKey].booked += 1;
      if (enteredHandover || (createdInRange && isLeadHandover)) personProjectStages[personProjectKey].handover += 1;
      if (isSiteConversion && (createdInRange || enteredSiteVisit || enteredBooked || enteredHandover)) {
        personProjectStages[personProjectKey].siteConversions += 1;
      }
      if (enteredLost || (createdInRange && (status === 'Lost' || lead.isClosed))) personProjectStages[personProjectKey].lost += 1;

      if (lead.project) {
        const pCodeStr = lead.project.code || lead.project.name;
        if (!projectStages[pCodeStr]) {
          projectStages[pCodeStr] = { totalLeads: 0, assigned: 0, enquiries: 0, siteVisits: 0, hotList: 0, futureFollowup: 0, booked: 0, handover: 0, lost: 0 };
        }
        if (createdInRange) {
          projectStages[pCodeStr].totalLeads += 1;
        }
        if (enteredAssigned) projectStages[pCodeStr].assigned += 1;
        if (enteredEnquiry) projectStages[pCodeStr].enquiries += 1;
        if (enteredSiteVisit) projectStages[pCodeStr].siteVisits += 1;
        if (enteredHotList) projectStages[pCodeStr].hotList += 1;
        if (enteredFutureFollowup) projectStages[pCodeStr].futureFollowup += 1;
        if (enteredBooked) projectStages[pCodeStr].booked += 1;
        if (enteredHandover || (createdInRange && isLeadHandover)) projectStages[pCodeStr].handover += 1;
        if (enteredLost || (createdInRange && (status === 'Lost' || lead.isClosed))) projectStages[pCodeStr].lost += 1;
      }

      // 4. Cumulative & Live Counters
      if (createdInRange) {
        cumulativeLeads++;
        if (status === 'Assigned') {
          assignedLeadsCount++;
        } else if (status === 'New' || !status) {
          newLeadsCount++;
        }
      }
      if (!lead.isClosed && status !== 'Lost') {
        liveLeadsCount++;
      }

      if (enteredEnquiry) cumulativeEnquiries++;
      if (enteredSiteVisit) cumulativeSiteVisits++;
      if (enteredHotList) cumulativeHotList++;
      if (enteredBooked) cumulativeBooked++;
      if (enteredHandover) cumulativeHandover++;

      if (status === 'Contacted' || status === 'Follow-Up') {
        liveEnquiries++;
        if (status === 'Contacted') contactedCount++;
        if (status === 'Follow-Up') followupCount++;
      } else if (status === 'Site Visit' || status === 'Site Visit Follow-up') {
        liveSiteVisits++;
        if (status === 'Site Visit') siteVisitCount++;
        if (status === 'Site Visit Follow-up') siteVisitFollowupCount++;
      } else if (status === 'Hot List') {
        liveHotList++;
        hotListCount++;
      } else if (status === 'Booking') {
        liveBooked++;
      } else if (status === 'Won') {
        liveHandover++;
      }

      if (status === 'Booking' || status === 'Won') {
        siteConversionsCount += 1;
      }

      if (status === 'Lost' || status === 'Closed' || lead.isClosed) {
        const hasSiteVisitHistory = lead.history?.some(h => h.status === 'Site Visit' || h.status === 'Site Visit Follow-up');
        if (hasSiteVisitHistory || status === 'Site Visit' || status === 'Site Visit Follow-up') {
          closedSiteVisits += 1;
        } else {
          closedEnquiries += 1;
        }
      }
    });

    Object.keys(sourceStats).forEach(src => {
      const statsObj = sourceStats[src];
      statsObj.leadCost = statsObj.leadCost || 0;
      statsObj.cpe = statsObj.count > 0 ? (statsObj.spent / statsObj.count) : 0;
    });

    quotations.forEach(q => {
      const val = q.totalValue || 0;
      const isBooking = q.lead && (q.lead.status === 'Booking' || q.lead.status === 'Won');

      if (isBooking) {
        bookingValueTotal += val;

        const pType = Array.isArray(q.project?.projectType) ? (q.project.projectType[0] || 'Plot') : (q.project?.projectType || 'Plot');
        layeredStats.projectTypes[pType] = (layeredStats.projectTypes[pType] || 0) + val;

        const rawStage = q.lead?.status || 'Booking';
        const stageName = rawStage === 'Site Visit Follow-up' ? 'Site Visit' : rawStage;
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

      const rawStage2 = q.lead?.status || 'Booking';
      const stage = rawStage2 === 'Site Visit Follow-up' ? 'Site Visit' : rawStage2;
      if (!stageStats[stage]) {
        stageStats[stage] = { count: 0, value: 0 };
      }
      if (isBooking) {
        stageStats[stage].value += val;
      }
    });

    // Calculate Projects & Units Inventory Stats
    const leadsWithSelectedUnits = await Lead.find({ 'bookingInfo.selectedUnits': { $exists: true, $ne: [] } });
    const crdFlowsWithUnits = await CRDFlow.find({ unitId: { $exists: true, $ne: '' } });
    const bookingDatesMap = new Map();

    leadsWithSelectedUnits.forEach(lead => {
      const projId = (lead.project?._id || lead.project)?.toString();
      const projCode = lead.project?.code;
      if (lead.bookingInfo?.selectedUnits) {
        lead.bookingInfo.selectedUnits.forEach(unitId => {
          const date = lead.bookingInfo.bookingDate || lead.createdAt || new Date();
          if (projId) bookingDatesMap.set(`${projId}_${unitId}`, date);
          if (projCode) bookingDatesMap.set(`${projCode}_${unitId}`, date);
          bookingDatesMap.set(`${unitId}`, date);
        });
      }
    });

    crdFlowsWithUnits.forEach(cf => {
      const projId = (cf.project?._id || cf.project)?.toString();
      const date = cf.createdAt || cf.updatedAt || new Date();
      if (cf.unitId) {
        if (projId && !bookingDatesMap.has(`${projId}_${cf.unitId}`)) {
          bookingDatesMap.set(`${projId}_${cf.unitId}`, date);
        }
        if (!bookingDatesMap.has(`${cf.unitId}`)) {
          bookingDatesMap.set(`${cf.unitId}`, date);
        }
      }
    });

    let projectFilter = {};
    if (projectType) {
      projectFilter.projectType = projectType;
    }
    if (projectId) {
      projectFilter._id = projectId;
    }
    // Project createdAt filter removed so that projects are always visible
    const allProjects = await Project.find(projectFilter);
    let totalProjects = allProjects.length;
    let totalUnits = 0;
    let availableUnits = 0;
    let bookedUnits = 0;
    let handoverUnits = 0;
    let cancelledUnits = 0;
    let bookedUnitsList = [];
    let handoverUnitsList = [];
    let cancelledUnitsList = [];
    let totalByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };
    let availableByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };
    let bookedByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };
    let handoverByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };
    let cancelledByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };

    let totalValueByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };
    let availableValueByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };
    let bookedValueByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };
    let handoverValueByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };

    let projectsByType = { Plot: 0, Flat: 0, Villa: 0, Unit: 0 };
    const projectUnitsStats = {};

    allProjects.forEach(p => {
      const pCode = p.code || p.name;
      projectUnitsStats[pCode] = {
        total: 0,
        available: 0,
        booked: 0,
        handover: 0,
        cancelled: 0,
        hold: 0,
        readyBuilt: 0,
        availableUnitsList: [],
        bookedUnitsList: [],
        handoverUnitsList: [],
        cancelledUnitsList: [],
        holdUnitsList: [],
        readyBuiltUnitsList: [],
        totalUnitsList: []
      };

      const types = p.projectType || [];
      if (types.includes('Plot')) projectsByType.Plot += 1;
      if (types.includes('Flat')) projectsByType.Flat += 1;
      if (types.includes('House') || types.includes('Villa')) projectsByType.Villa += 1;
      if (types.includes('Unit')) projectsByType.Unit = (projectsByType.Unit || 0) + 1;

      p.units?.forEach(u => {
        projectUnitsStats[pCode].total += 1;
        projectUnitsStats[pCode].totalUnitsList.push(u.unitId);

        const bookingDate = bookingDatesMap.get(`${p._id.toString()}_${u.unitId}`) ||
                            bookingDatesMap.get(`${pCode}_${u.unitId}`) ||
                            bookingDatesMap.get(`${u.unitId}`) ||
                            u.bookingDate ||
                            u.updatedAt ||
                            u.createdAt ||
                            p.updatedAt ||
                            p.createdAt;

        const uStatusNorm = (u.status || '').toLowerCase();
        if (uStatusNorm === 'ready built' || uStatusNorm === 'under construction' || uStatusNorm === 'build') {
          projectUnitsStats[pCode].readyBuilt += 1;
          projectUnitsStats[pCode].readyBuiltUnitsList.push(u.unitId);
        } else if (u.status === 'New' || uStatusNorm === 'available') {
          projectUnitsStats[pCode].available += 1;
          projectUnitsStats[pCode].availableUnitsList.push(u.unitId);
        } else if (u.status === 'Booked') {
          projectUnitsStats[pCode].booked += 1;
          projectUnitsStats[pCode].bookedUnitsList.push(u.unitId);
        } else if (u.status === 'Sold Out') {
          projectUnitsStats[pCode].handover += 1;
          projectUnitsStats[pCode].handoverUnitsList.push(u.unitId);
        } else if (uStatusNorm.includes('hold')) {
          projectUnitsStats[pCode].hold += 1;
          projectUnitsStats[pCode].holdUnitsList.push({
            unitId: u.unitId,
            price: u.price || 0,
            size: u.size || 0
          });
        } else {
          projectUnitsStats[pCode].available += 1;
          projectUnitsStats[pCode].availableUnitsList.push(u.unitId);
        }

        let type = 'Plot';
        const projTypes = p.projectType || [];
        if (projTypes.length === 1) {
          type = projTypes[0] === 'House' ? 'Villa' : projTypes[0];
        } else {
          const uType = u.unitType || '';
          if (uType === 'Plot') {
            type = 'Plot';
          } else if (uType === 'Flat') {
            type = 'Flat';
          } else if (uType === 'House' || uType === 'Villa') {
            type = 'Villa';
          } else if (uType.includes('BHK')) {
            if (projTypes.includes('Flat') && !projTypes.includes('House') && !projTypes.includes('Villa')) {
              type = 'Flat';
            } else if ((projTypes.includes('House') || projTypes.includes('Villa')) && !projTypes.includes('Flat')) {
              type = 'Villa';
            } else {
              type = projTypes.includes('Flat') ? 'Flat' : 'Villa';
            }
          } else {
            type = projTypes[0] === 'House' ? 'Villa' : (projTypes[0] || 'Plot');
          }
        }

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
          let dateMatches = true;
          if (fromDate || toDate) {
            if (!bookingDate || !inRange(bookingDate)) {
              dateMatches = false;
            }
          }
          if (dateMatches) {
            bookedUnits += 1;
            bookedByType[type] = (bookedByType[type] || 0) + 1;
            bookedValueByType[type] = (bookedValueByType[type] || 0) + val;
            bookedUnitsList.push({
              projectName: p.name,
              projectCode: p.code,
              unitId: u.unitId,
              unitType: type,
              size: u.size,
              price: val,
              customerName: u.customerName || 'N/A',
              customerPhone: u.customerPhone || 'N/A',
              bookingDate: bookingDate || p.updatedAt || p.createdAt
            });
          }
        } else if (u.status === 'Sold Out') {
          handoverUnits += 1;
          handoverByType[type] = (handoverByType[type] || 0) + 1;
          handoverValueByType[type] = (handoverValueByType[type] || 0) + val;
          handoverUnitsList.push({
            projectName: p.name,
            projectCode: p.code,
            unitId: u.unitId,
            unitType: type,
            size: u.size,
            price: val,
            customerName: u.customerName || 'N/A',
            customerPhone: u.customerPhone || 'N/A',
            bookingDate: bookingDate || p.updatedAt || p.createdAt
          });
        } else {
          availableUnits += 1;
          availableByType[type] = (availableByType[type] || 0) + 1;
          availableValueByType[type] = (availableValueByType[type] || 0) + val;
        }
      });
    });

    const cancelledFlows = await CRDFlow.find({ status: { $in: ['Cancelled', 'Returned'] } }).populate('project', 'name code projectType');
    cancelledFlows.forEach(cf => {
      if (cf.project) {
        const pCode = cf.project.code || cf.project.name;
        if (projectUnitsStats[pCode]) {
          projectUnitsStats[pCode].cancelled += 1;

          let cancelNarration = 'No reason provided';
          let cancelStageName = 'Unknown';
          const cancelHistory = (cf.history || []).find(h => h?.action?.includes('Cancel') || h?.action?.includes('Return'));
          if (cancelHistory) {
            cancelNarration = cancelHistory.notes || 'No reason provided';
          }
          const completedStages = (cf.stages || []).filter(s => s.isCompleted);
          if (completedStages.length > 0) {
            cancelStageName = completedStages[completedStages.length - 1].name;
          } else if (cf.stages && cf.stages.length > 0) {
            cancelStageName = cf.stages[0].name;
          }

          projectUnitsStats[pCode].cancelledUnitsList.push({
            projectName: cf.project.name,
            projectCode: cf.project.code,
            unitId: cf.unitId,
            price: cf.totalCurrentValue,
            cancelStageName,
            cancelNarration,
            date: cf.updatedAt
          });
          cancelledUnits += 1;

          const types = cf.project.projectType || [];
          let type = 'Plot';
          if (types.length === 1) type = types[0] === 'House' ? 'Villa' : types[0];
          else if (types.includes('Flat')) type = 'Flat';
          cancelledByType[type] = (cancelledByType[type] || 0) + 1;
        }
      }
    });

    // Compute stage-by-stage payments from CRD Flow
    const bookingLeads = leads.filter(l => l.status === 'Booking' || l.status === 'Won');
    const bookingLeadIds = bookingLeads.map(l => l._id);
    const crdFlows = await CRDFlow.find({ lead: { $in: bookingLeadIds }, status: { $nin: ['Cancelled', 'Returned'] } });

    let crdTotalValue = 0;
    let crdReceivedValue = 0;

    bookingLeads.forEach(lead => {
      const cf = crdFlows.find(flow => flow.lead && flow.lead.toString() === lead._id.toString());
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

    // Booked Stage leads metrics
    const bookedLeads = leads.filter(l => l.status === 'Booking');
    const bookedLeadIds = bookedLeads.map(l => l._id);
    const bookedCrdFlows = crdFlows.filter(cf => cf.lead && bookedLeadIds.map(id => id.toString()).includes(cf.lead.toString()));

    let bookedTotalValue = 0;
    let bookedReceivedValue = 0;

    bookedLeads.forEach(lead => {
      const cf = bookedCrdFlows.find(flow => flow.lead && flow.lead.toString() === lead._id.toString());
      if (cf) {
        bookedTotalValue += cf.totalCurrentValue || 0;
        cf.stages?.forEach(stage => {
          stage.payments?.forEach(p => {
            bookedReceivedValue += p.amount || 0;
          });
        });
      } else {
        const q = quotations.find(quot => quot.lead && quot.lead._id.toString() === lead._id.toString());
        if (q) {
          bookedTotalValue += q.totalValue || 0;
        }
      }
    });
    const bookedPendingValue = Math.max(0, bookedTotalValue - bookedReceivedValue);

    // Handover (Won) Stage leads metrics
    const handoverLeads = leads.filter(l => l.status === 'Won');
    const handoverLeadIds = handoverLeads.map(l => l._id);
    const handoverCrdFlows = crdFlows.filter(cf => cf.lead && handoverLeadIds.map(id => id.toString()).includes(cf.lead.toString()));

    let handoverTotalValue = 0;
    let handoverReceivedValue = 0;

    handoverLeads.forEach(lead => {
      const cf = handoverCrdFlows.find(flow => flow.lead && flow.lead.toString() === lead._id.toString());
      if (cf) {
        handoverTotalValue += cf.totalCurrentValue || 0;
        cf.stages?.forEach(stage => {
          stage.payments?.forEach(p => {
            handoverReceivedValue += p.amount || 0;
          });
        });
      } else {
        const q = quotations.find(quot => quot.lead && quot.lead._id.toString() === lead._id.toString());
        if (q) {
          handoverTotalValue += q.totalValue || 0;
        }
      }
    });
    const handoverPendingValue = Math.max(0, handoverTotalValue - handoverReceivedValue);

    // Calculate custom insights
    const totalMarketingSpend = budgetPlans.reduce((sum, plan) => sum + (plan.allocations?.reduce((s, alloc) => s + (alloc.spent || 0), 0) || 0), 0);
    const totalLeadCost = leads.reduce((sum, lead) => sum + (lead.leadCost || 0), 0);
    const costPerEnquiry = siteConversionsCount > 0 ? (totalMarketingSpend / siteConversionsCount) : 0;

    const siteVisitConversionRate = cumulativeSiteVisits > 0 ? (siteConversionsCount / cumulativeSiteVisits) * 100 : 0;
    const bookingConversionRate = cumulativeEnquiries > 0 ? (siteConversionsCount / cumulativeEnquiries) * 100 : 0;
    const handoverRate = totalUnits > 0 ? (handoverUnits / totalUnits) * 100 : 0;

    // Calculate Group-wise stats for marketing spend drill-down
    const leadGroups = await LeadGroup.find({});
    const groupStats = {};
    const processedSources = new Set();

    const findInSourceStats = (srcName) => {
      if (!srcName) return null;
      const keys = Object.keys(sourceStats);
      const matchKey = keys.find(k => k.toLowerCase() === srcName.toLowerCase());
      return matchKey ? sourceStats[matchKey] : null;
    };

    let effectiveGroups = leadGroups;
    if (!effectiveGroups || effectiveGroups.length === 0) {
      effectiveGroups = [
        {
          name: 'DIGITAL MARKETING',
          sources: ['Facebook', 'Instagram', 'Youtube']
        },
        {
          name: 'PROMOTION ACTIVITIES',
          sources: ['Paper Ad', 'Railway Station Hoardings (rental)', 'Notice Distribution', '99acres', 'Housing.com', 'Website', 'Flexboard/banner', 'Stall']
        }
      ];
    }

    effectiveGroups.forEach(g => {
      groupStats[g.name] = { budget: 0, spent: 0, value: 0, sources: [] };
      
      (g.sources || []).forEach(srcName => {
        const statsObj = findInSourceStats(srcName) || { budget: 0, spent: 0, value: 0 };
        processedSources.add(srcName.toLowerCase());

        const b = statsObj.budget || 0;
        const s = statsObj.spent || 0;
        const v = statsObj.value || 0;

        groupStats[g.name].budget += b;
        groupStats[g.name].spent += s;
        groupStats[g.name].value += v;

        groupStats[g.name].sources.push({
          source: srcName,
          budget: b,
          spent: s,
          value: v,
          leadCost: statsObj.leadCost || 0,
          cpe: statsObj.cpe || 0,
          leads: statsObj.leads || [],
          count: statsObj.count || 0,
          assigned: statsObj.assigned || 0,
          enquiries: statsObj.enquiries || 0,
          siteVisits: statsObj.siteVisits || 0,
          hotList: statsObj.hotList || 0,
          futureFollowup: statsObj.futureFollowup || 0,
          booked: statsObj.booked || 0,
          handover: statsObj.handover || 0,
          lost: statsObj.lost || 0
        });
      });
    });

    groupStats['Other / Unassigned'] = { budget: 0, spent: 0, value: 0, sources: [] };
    Object.keys(sourceStats).forEach(srcName => {
      if (!processedSources.has(srcName.toLowerCase())) {
        const statsObj = sourceStats[srcName];
        const b = statsObj.budget || 0;
        const s = statsObj.spent || 0;
        const v = statsObj.value || 0;

        groupStats['Other / Unassigned'].budget += b;
        groupStats['Other / Unassigned'].spent += s;
        groupStats['Other / Unassigned'].value += v;
        groupStats['Other / Unassigned'].sources.push({
          source: srcName,
          budget: b,
          spent: s,
          value: v,
          leadCost: statsObj.leadCost || 0,
          cpe: statsObj.cpe || 0,
          leads: statsObj.leads || [],
          count: statsObj.count || 0,
          assigned: statsObj.assigned || 0,
          enquiries: statsObj.enquiries || 0,
          siteVisits: statsObj.siteVisits || 0,
          hotList: statsObj.hotList || 0,
          futureFollowup: statsObj.futureFollowup || 0,
          booked: statsObj.booked || 0,
          handover: statsObj.handover || 0,
          lost: statsObj.lost || 0
        });
      }
    });

    if (groupStats['Other / Unassigned'].sources.length === 0) {
      delete groupStats['Other / Unassigned'];
    }

    // Calculate today's stable counts
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayQuery = {
      $or: [
        { createdAt: { $gte: todayStart, $lte: todayEnd } },
        { 'history.timestamp': { $gte: todayStart, $lte: todayEnd } }
      ]
    };

    if (query.project) todayQuery.project = query.project;
    if (query.assignedTo) todayQuery.assignedTo = query.assignedTo;
    if (query.leadSource) todayQuery.leadSource = query.leadSource;

    const todayLeads = await Lead.find(todayQuery);

    let todayLeadsCount = 0;
    let todayEnquiriesCount = 0;
    let todaySiteVisitsCount = 0;
    let todayHotListCount = 0;
    let todayBookingCount = 0;
    let todayHandoverCount = 0;

    todayLeads.forEach(lead => {
      if (lead.createdAt >= todayStart && lead.createdAt <= todayEnd) {
        todayLeadsCount++;
      }

      let hasEnquiryToday = false;
      let hasSiteVisitToday = false;
      let hasHotListToday = false;
      let hasBookingToday = false;
      let hasHandoverToday = false;

      lead.history?.forEach(entry => {
        if (entry.timestamp >= todayStart && entry.timestamp <= todayEnd) {
          const status = entry.status;
          if (status === 'Contacted' || status === 'Follow-Up') {
            hasEnquiryToday = true;
          } else if (status === 'Site Visit' || status === 'Site Visit Follow-up') {
            hasSiteVisitToday = true;
          } else if (status === 'Hot List') {
            hasHotListToday = true;
          } else if (status === 'Booking') {
            hasBookingToday = true;
          } else if (status === 'Won') {
            hasHandoverToday = true;
          }
        }
      });

      if (hasEnquiryToday) todayEnquiriesCount++;
      if (hasSiteVisitToday) todaySiteVisitsCount++;
      if (hasHotListToday) todayHotListCount++;
      if (hasBookingToday) todayBookingCount++;
      if (hasHandoverToday) todayHandoverCount++;
    });

    // Calculate CRD Flow Dashboard Stats
    const crdFlowStats = {
      stagesCount: {},
      usersCount: {},
      totalActive: 0
    };

    const allStatsCrdFlows = await CRDFlow.find({ lead: { $in: bookingLeadIds } });

    allStatsCrdFlows.forEach(flow => {
      crdFlowStats.totalActive++;

      // Find current stage
      let currentStageName = 'Unknown Stage';
      if (flow.status === 'Cancelled' || flow.status === 'Returned') {
        currentStageName = 'Cancelled';
      } else if (flow.stages && flow.stages.length > 0) {
        const pendingStage = flow.stages.find(s => !s.isCompleted);
        if (pendingStage) {
          currentStageName = pendingStage.name;
        } else {
          currentStageName = 'Completed';
        }
      } else {
        currentStageName = 'No Stages Defined';
      }

      crdFlowStats.stagesCount[currentStageName] = (crdFlowStats.stagesCount[currentStageName] || 0) + 1;

      // Find assigned user from the leads array
      const leadMatch = bookingLeads.find(l => l._id.toString() === flow.lead?.toString());
      const userName = leadMatch?.assignedTo?.name || 'Unassigned';

      crdFlowStats.usersCount[userName] = (crdFlowStats.usersCount[userName] || 0) + 1;
    });

    res.json({
      crdFlowStats,
      cards: {
        totalLeads: cumulativeLeads,
        newLeads: newLeadsCount,
        assignedLeads: assignedLeadsCount,
        liveLeads: liveLeadsCount,
        today: {
          leads: todayLeadsCount,
          enquiries: todayEnquiriesCount,
          siteVisits: todaySiteVisitsCount,
          hotList: todayHotListCount,
          booked: todayBookingCount,
          handover: todayHandoverCount
        },
        leadsList: leads
          .filter(l => {
            if (!fromDate && !toDate) return true;
            return inRange(l.createdAt) || (l.history && l.history.some(h => inRange(h.timestamp)));
          })
          .map(l => ({
            _id: l._id,
            name: l.name,
            leadSource: l.leadSource || 'Direct Visit',
            projectType: l.project?.projectType || 'N/A',
            projectName: l.project?.name || 'N/A',
            assignedTo: l.assignedTo?.name || 'Unassigned',
            status: l.status,
            isClosed: !!l.isClosed,
            createdAt: l.createdAt
          })),
        enquiries: { total: cumulativeEnquiries, live: liveEnquiries, contacted: contactedCount, followup: followupCount, closed: closedEnquiries },
        siteVisits: { total: cumulativeSiteVisits, live: liveSiteVisits, siteVisit: siteVisitCount, followup: siteVisitFollowupCount, closed: closedSiteVisits },
        hotList: { total: cumulativeHotList, live: liveHotList },
        conversion: {
          count: siteConversionsCount,
          value: crdTotalValue,
          received: crdReceivedValue,
          pending: crdPendingValue
        },
        booked: {
          total: cumulativeBooked,
          live: liveBooked,
          count: liveBooked,
          value: bookedTotalValue,
          received: bookedReceivedValue,
          pending: bookedPendingValue
        },
        handover: {
          total: cumulativeHandover,
          live: liveHandover,
          count: liveHandover,
          value: handoverTotalValue,
          received: handoverReceivedValue,
          pending: handoverPendingValue
        },
        inventory: {
          totalProjects,
          projectsByType,
          totalUnits,
          availableUnits,
          bookedUnits,
          handoverUnits,
          cancelledUnits,
          totalByType,
          availableByType,
          bookedByType,
          handoverByType,
          cancelledByType,
          totalValueByType,
          availableValueByType,
          bookedValueByType,
          handoverValueByType,
          projectUnitsStats,
          bookedUnitsList,
          handoverUnitsList
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
      projectUnitsStats,
      sourceStats,
      groupStats,
      userStats,
      projectStats,
      stageStats,
      layeredStats,
      users: allUsers,
      projects: dbProjects.map(dp => ({ _id: dp._id, name: dp.name, code: dp.code, projectType: dp.projectType }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/dashboard/lead-cost-analysis
// @desc    Get elaborate lead cost analysis cross-referencing daily leads with daily budget expenses
router.get('/lead-cost-analysis', protect, async (req, res) => {
  const { fromDate, toDate, source, projectId } = req.query;

  try {
    let leadQuery = {};
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      leadQuery.createdAt = dateFilter;
    }
    if (source) leadQuery.leadSource = source;
    if (projectId) leadQuery.project = projectId;

    const leads = await Lead.find(leadQuery).populate('project', 'name projectType').sort({ createdAt: -1 });
    const budgetPlans = await BudgetPlan.find({});

    // Build expense map: YYYY-MM-DD -> source -> amount
    const expenseMap = {};
    budgetPlans.forEach(plan => {
      plan.allocations?.forEach(alloc => {
        if (!alloc.source) return;
        // Normalize source
        const formattedSource = alloc.source.split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');

        alloc.expenses?.forEach(exp => {
          if (!exp.date) return;
          // Extract local date string (YYYY-MM-DD)
          const d = new Date(exp.date);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localDateStr = (new Date(d - tzOffset)).toISOString().split('T')[0];

          if (!expenseMap[localDateStr]) expenseMap[localDateStr] = {};
          if (!expenseMap[localDateStr][formattedSource]) expenseMap[localDateStr][formattedSource] = 0;

          expenseMap[localDateStr][formattedSource] += (exp.amount || 0);
        });
      });
    });

    // Build daily lead count map: YYYY-MM-DD -> source -> count
    const leadCountsMap = {};
    leads.forEach(lead => {
      const srcRaw = lead.leadSource || 'Direct Visit';
      const formattedSource = srcRaw.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      const d = new Date(lead.createdAt);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localDateStr = (new Date(d - tzOffset)).toISOString().split('T')[0];

      if (!leadCountsMap[localDateStr]) leadCountsMap[localDateStr] = {};
      if (!leadCountsMap[localDateStr][formattedSource]) leadCountsMap[localDateStr][formattedSource] = 0;

      leadCountsMap[localDateStr][formattedSource] += 1;
    });

    // Build final elaborate list
    const analysisList = leads.map(lead => {
      const srcRaw = lead.leadSource || 'Direct Visit';
      const formattedSource = srcRaw.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      const d = new Date(lead.createdAt);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localDateStr = (new Date(d - tzOffset)).toISOString().split('T')[0];

      const dailySpent = (expenseMap[localDateStr] && expenseMap[localDateStr][formattedSource]) ? expenseMap[localDateStr][formattedSource] : 0;
      const dailyLeads = (leadCountsMap[localDateStr] && leadCountsMap[localDateStr][formattedSource]) ? leadCountsMap[localDateStr][formattedSource] : 1;

      const costPerEnquiry = dailySpent / dailyLeads;

      return {
        _id: lead._id,
        date: localDateStr,
        exactTime: lead.createdAt,
        leadName: lead.name,
        projectName: lead.project?.name || 'N/A',
        source: formattedSource,
        dailySpent: dailySpent,
        dailyLeads: dailyLeads,
        costPerEnquiry: costPerEnquiry,
        status: lead.status
      };
    });

    res.json(analysisList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
