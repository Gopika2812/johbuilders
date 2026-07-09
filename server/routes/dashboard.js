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
    const projectsForHandover = await Project.find({}, 'units');
    // 1. Build leads filters
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
    if (dateFilter) {
      qQuery.createdAt = dateFilter;
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
      sourceStats[src].count += 1;
      sourceStats[src].leadCost = (sourceStats[src].leadCost || 0) + (lead.leadCost || 0);
      sourceStats[src].leads.push({
        name: lead.name,
        phone: lead.phone,
        leadCost: lead.leadCost || 0,
        projectType: lead.project?.projectType || 'N/A',
        projectName: lead.project?.name || 'N/A'
      });

      let isLeadHandover = lead.status === 'Won';
      if (!isLeadHandover && lead.project && lead.bookingInfo?.selectedUnits?.length > 0) {
        const projId = lead.project._id || lead.project;
        const proj = projectsForHandover.find(p => p._id.toString() === projId.toString());
        if (proj) {
          isLeadHandover = lead.bookingInfo.selectedUnits.some(unitId => {
            const unit = proj.units?.find(u => u.unitId === unitId);
            return unit && unit.status === 'Sold Out';
          });
        }
      }

      if (status === 'Contacted' || status === 'Follow-Up') {
        sourceStats[src].enquiries = (sourceStats[src].enquiries || 0) + 1;
      } else if (status === 'Site Visit' || status === 'Site Visit Follow-up') {
        sourceStats[src].siteVisits = (sourceStats[src].siteVisits || 0) + 1;
      } else if (status === 'Hot List') {
        sourceStats[src].hotList = (sourceStats[src].hotList || 0) + 1;
      } else if (status === 'Booking') {
        sourceStats[src].booked = (sourceStats[src].booked || 0) + 1;
      }
      if (isLeadHandover) {
        sourceStats[src].handover = (sourceStats[src].handover || 0) + 1;
      }
      if (status === 'Lost' || lead.isClosed) {
        sourceStats[src].lost = (sourceStats[src].lost || 0) + 1;
      }

      const displayStatus = status === 'Site Visit Follow-up' ? 'Site Visit' : status;

      if (!stageStats[displayStatus]) {
        stageStats[displayStatus] = { count: 0, value: 0 };
      }
      stageStats[displayStatus].count += 1;

      if (lead.project) {
        const pCode = lead.project.code || lead.project.name;
        if (!projectStats[pCode]) {
          projectStats[pCode] = { count: 0, value: 0, stages: {} };
        }
        projectStats[pCode].count += 1;
        projectStats[pCode].stages[displayStatus] = (projectStats[pCode].stages[displayStatus] || 0) + 1;
      }

      // 1. Total Leads / Live Leads
      const createdInRange = inRange(lead.createdAt);
      if (createdInRange) {
        cumulativeLeads++;
      }
      if (!lead.isClosed && status !== 'Lost') {
        liveLeadsCount++;
      }

      // Check transitions in the date range
      let enteredEnquiry = false;
      let enteredSiteVisit = false;
      let enteredHotList = false;
      let enteredBooked = false;
      let enteredHandover = false;

      lead.history?.forEach(entry => {
        if (inRange(entry.timestamp)) {
          const s = entry.status;
          if (s === 'Contacted' || s === 'Follow-Up') enteredEnquiry = true;
          if (s === 'Site Visit' || s === 'Site Visit Follow-up') enteredSiteVisit = true;
          if (s === 'Hot List') enteredHotList = true;
          if (s === 'Booking') enteredBooked = true;
          if (s === 'Won') enteredHandover = true;
        }
      });

      // If lead was created in range with that status, or if status currently matches and we have no other history
      if (createdInRange) {
        if (status === 'Contacted' || status === 'Follow-Up') enteredEnquiry = true;
        if (status === 'Site Visit' || status === 'Site Visit Follow-up') enteredSiteVisit = true;
        if (status === 'Hot List') enteredHotList = true;
        if (status === 'Booking') enteredBooked = true;
        if (status === 'Won') enteredHandover = true;
      }

      if (enteredEnquiry) cumulativeEnquiries++;
      if (enteredSiteVisit) cumulativeSiteVisits++;
      if (enteredHotList) cumulativeHotList++;
      if (enteredBooked) cumulativeBooked++;
      if (enteredHandover) cumulativeHandover++;

      // Current Statuses (Live counts)
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
    let totalByType = { Plot: 0, Flat: 0, Villa: 0 };
    let availableByType = { Plot: 0, Flat: 0, Villa: 0 };
    let bookedByType = { Plot: 0, Flat: 0, Villa: 0 };
    let handoverByType = { Plot: 0, Flat: 0, Villa: 0 };
    let cancelledByType = { Plot: 0, Flat: 0, Villa: 0 };

    let totalValueByType = { Plot: 0, Flat: 0, Villa: 0 };
    let availableValueByType = { Plot: 0, Flat: 0, Villa: 0 };
    let bookedValueByType = { Plot: 0, Flat: 0, Villa: 0 };
    let handoverValueByType = { Plot: 0, Flat: 0, Villa: 0 };

    let projectsByType = { Plot: 0, Flat: 0, Villa: 0 };
    const projectUnitsStats = {};

    allProjects.forEach(p => {
      const pCode = p.code || p.name;
      projectUnitsStats[pCode] = { 
        total: 0, 
        available: 0, 
        booked: 0, 
        handover: 0,
        cancelled: 0,
        availableUnitsList: [],
        bookedUnitsList: [],
        handoverUnitsList: [],
        cancelledUnitsList: [],
        totalUnitsList: []
      };

      const types = p.projectType || [];
      if (types.includes('Plot')) projectsByType.Plot += 1;
      if (types.includes('Flat')) projectsByType.Flat += 1;
      if (types.includes('House') || types.includes('Villa')) projectsByType.Villa += 1;

      p.units?.forEach(u => {
        projectUnitsStats[pCode].total += 1;
        projectUnitsStats[pCode].totalUnitsList.push(u.unitId);
        
        if (u.status === 'New') {
          projectUnitsStats[pCode].available += 1;
          projectUnitsStats[pCode].availableUnitsList.push(u.unitId);
        } else if (u.status === 'Booked') {
          projectUnitsStats[pCode].booked += 1;
          projectUnitsStats[pCode].bookedUnitsList.push(u.unitId);
        } else if (u.status === 'Sold Out') {
          projectUnitsStats[pCode].handover += 1;
          projectUnitsStats[pCode].handoverUnitsList.push(u.unitId);
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
            customerPhone: u.customerPhone || 'N/A'
          });
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
            customerPhone: u.customerPhone || 'N/A'
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
          handover: 0,
          lost: 0
        };
      }

      personProjectStages[personProjectKey].totalLeads += 1;
      const status = lead.status;
      if (status === 'Contacted' || status === 'Follow-Up') {
        personProjectStages[personProjectKey].enquiries += 1;
      } else if (status === 'Site Visit' || status === 'Site Visit Follow-up') {
        personProjectStages[personProjectKey].siteVisits += 1;
      } else if (status === 'Hot List') {
        personProjectStages[personProjectKey].hotList += 1;
      } else if (status === 'Booking') {
        personProjectStages[personProjectKey].booked += 1;
      }
      if (isHandover) {
        personProjectStages[personProjectKey].handover += 1;
      }
      if (status === 'Lost' || lead.isClosed) {
        personProjectStages[personProjectKey].lost += 1;
      }

      if (lead.project) {
        const pCode = lead.project.code || lead.project.name;
        if (!projectStages[pCode]) {
          projectStages[pCode] = { totalLeads: 0, enquiries: 0, siteVisits: 0, hotList: 0, booked: 0, handover: 0, lost: 0 };
        }
        projectStages[pCode].totalLeads += 1;
        if (status === 'Contacted' || status === 'Follow-Up') {
          projectStages[pCode].enquiries += 1;
        } else if (status === 'Site Visit' || status === 'Site Visit Follow-up') {
          projectStages[pCode].siteVisits += 1;
        } else if (status === 'Hot List') {
          projectStages[pCode].hotList += 1;
        } else if (status === 'Booking') {
          projectStages[pCode].booked += 1;
        }
        if (isHandover) {
          projectStages[pCode].handover += 1;
        }
        if (status === 'Lost' || lead.isClosed) {
          projectStages[pCode].lost += 1;
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
    const costPerEnquiry = cumulativeEnquiries > 0 ? (totalMarketingSpend / cumulativeEnquiries) : 0;
    
    const siteVisitConversionRate = cumulativeSiteVisits > 0 ? (siteConversionsCount / cumulativeSiteVisits) * 100 : 0;
    const bookingConversionRate = cumulativeEnquiries > 0 ? (siteConversionsCount / cumulativeEnquiries) * 100 : 0;
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
        cpe: statsObj.cpe || 0,
        leads: statsObj.leads || [],
        count: statsObj.count || 0,
        enquiries: statsObj.enquiries || 0,
        siteVisits: statsObj.siteVisits || 0,
        hotList: statsObj.hotList || 0,
        booked: statsObj.booked || 0,
        handover: statsObj.handover || 0,
        lost: statsObj.lost || 0
      });
    });

    if (groupStats['Other / Unassigned'].budget === 0 && groupStats['Other / Unassigned'].spent === 0 && groupStats['Other / Unassigned'].value === 0) {
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
        liveLeads: liveLeadsCount,
        today: {
          leads: todayLeadsCount,
          enquiries: todayEnquiriesCount,
          siteVisits: todaySiteVisitsCount,
          hotList: todayHotListCount,
          booked: todayBookingCount,
          handover: todayHandoverCount
        },
        leadsList: leads.map(l => ({
          _id: l._id,
          name: l.name,
          leadSource: l.leadSource || 'Direct Visit',
          projectType: l.project?.projectType || 'N/A',
          projectName: l.project?.name || 'N/A',
          assignedTo: l.assignedTo?.name || 'Unassigned',
          status: l.status
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
