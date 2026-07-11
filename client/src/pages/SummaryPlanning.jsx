import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Layers, 
  Calendar, 
  Save, 
  TrendingUp, 
  BarChart3,
  Building2
} from 'lucide-react';

const SummaryPlanning = () => {
  const { token } = useAuth();
  
  // Date and filter states
  const [selectedMonth, setSelectedMonth] = useState('2026-06'); // Format: YYYY-MM
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePhase, setActivePhase] = useState('phase1'); // 'phase1' | 'phase2' | 'phase3'

  // Phase 1: User-defined targets
  const [salesTarget, setSalesTarget] = useState(0);
  const [villasTarget, setVillasTarget] = useState(0);
  const [plotsTarget, setPlotsTarget] = useState(0);

  // Phase 1: Dynamically aggregated stats
  const [achievedStats, setAchievedStats] = useState({ salesValue: 0, villasCount: 0, plotsCount: 0 });
  const [lastMonthStats, setLastMonthStats] = useState({ salesValue: 0, villasCount: 0, plotsCount: 0 });

  // Phase 2: Project targets state
  const [projectTargetsState, setProjectTargetsState] = useState({});
  const [projectStats, setProjectStats] = useState({});

  // Phase 3: Marketing targets state
  // Format: { [name]: value }
  const [marketingTargetsState, setMarketingTargetsState] = useState({});
  const [marketingStats, setMarketingStats] = useState({ groups: {}, static: {} });

  useEffect(() => {
    fetchInitialData();
  }, [selectedMonth]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch User Targets Config
      const targetsRes = await fetch(`${API_URL}/summary-plans/${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let targetData = {};
      if (targetsRes.ok) {
        targetData = await targetsRes.json();
        setSalesTarget(targetData.salesTarget || 0);
        setVillasTarget(targetData.villasTarget || targetData.housesTarget || 0);
        setPlotsTarget(targetData.plotsTarget || 0);
      }

      // 2. Fetch Aggregated actual achievements for Phase 1
      const statsRes = await fetch(`${API_URL}/quotations/summary-stats/${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAchievedStats({
          salesValue: statsData.current?.salesValue || 0,
          villasCount: statsData.current?.villasCount || statsData.current?.housesCount || 0,
          plotsCount: statsData.current?.plotsCount || 0
        });
        setLastMonthStats({
          salesValue: statsData.lastMonth?.salesValue || 0,
          villasCount: statsData.lastMonth?.villasCount || statsData.lastMonth?.housesCount || 0,
          plotsCount: statsData.lastMonth?.plotsCount || 0
        });
      }

      // 3. Fetch Phase 2 Project Wise Stats
      const pStatsRes = await fetch(`${API_URL}/summary-plans/project-stats/${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let fetchedStats = {};
      if (pStatsRes.ok) {
        fetchedStats = await pStatsRes.json();
        setProjectStats(fetchedStats);
      }

      // 4. Fetch Phase 3 Marketing Stats
      const mStatsRes = await fetch(`${API_URL}/summary-plans/marketing-stats/${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let fetchedMStats = { groups: {}, static: {} };
      if (mStatsRes.ok) {
        fetchedMStats = await mStatsRes.json();
        setMarketingStats(fetchedMStats);
      }

      // Map Phase 2 Targets
      const targetMap = {};
      Object.keys(fetchedStats).forEach(projId => {
        targetMap[projId] = { enquiries: 0, hotlist: 0, sitevisits: 0, booked: 0, value: 0 };
      });
      if (targetData && targetData.projectTargets) {
        targetData.projectTargets.forEach(pt => {
          targetMap[pt.projectId] = {
            enquiries: pt.enquiriesTarget || 0,
            hotlist: pt.hotlistTarget || 0,
            sitevisits: pt.sitevisitsTarget || 0,
            booked: pt.bookedTarget || 0,
            value: pt.valueTarget || 0
          };
        });
      }
      setProjectTargetsState(targetMap);

      // Map Phase 3 Targets
      const mTargetMap = {};
      // Populate defaults for all lead groups + static rows
      Object.keys(fetchedMStats.groups || {}).forEach(name => {
        mTargetMap[name] = 0;
      });
      mTargetMap['LEADS GENERATED'] = 0;
      mTargetMap['SITE VISIT CONVERSIONS'] = 0;

      if (targetData && targetData.marketingTargets) {
        targetData.marketingTargets.forEach(mt => {
          mTargetMap[mt.name] = mt.target || 0;
        });
      }
      setMarketingTargetsState(mTargetMap);

    } catch (err) {
      console.error('Error loading summary stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProjectTarget = (projId, field, value) => {
    const numVal = Number(value) || 0;
    setProjectTargetsState(prev => ({
      ...prev,
      [projId]: {
        ...prev[projId],
        [field]: numVal
      }
    }));
  };

  const handleUpdateMarketingTarget = (name, value) => {
    const numVal = Number(value) || 0;
    setMarketingTargetsState(prev => ({
      ...prev,
      [name]: numVal
    }));
  };

  const handleSavePlan = async () => {
    // Format Phase 2 Project Targets Array
    const pTargetsArray = Object.keys(projectTargetsState).map(projId => ({
      projectId: projId,
      enquiriesTarget: Number(projectTargetsState[projId].enquiries) || 0,
      hotlistTarget: Number(projectTargetsState[projId].hotlist) || 0,
      sitevisitsTarget: Number(projectTargetsState[projId].sitevisits) || 0,
      bookedTarget: Number(projectTargetsState[projId].booked) || 0,
      valueTarget: Number(projectTargetsState[projId].value) || 0
    }));

    // Format Phase 3 Marketing Targets Array
    const mTargetsArray = Object.keys(marketingTargetsState).map(name => ({
      name: name,
      target: Number(marketingTargetsState[name]) || 0
    }));

    try {
      const response = await fetch(`${API_URL}/summary-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          salesTarget: Number(salesTarget),
          villasTarget: Number(villasTarget),
          plotsTarget: Number(plotsTarget),
          projectTargets: pTargetsArray,
          marketingTargets: mTargetsArray
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save summary targets.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving targets.');
    }
  };

  const calculatePercentage = (actual, target) => {
    if (!target || target <= 0) return '0%';
    const pct = (actual / target) * 100;
    return `${pct.toFixed(1)}%`;
  };

  // Helper to compile Phase 3 rows structure
  const getMarketingRows = () => {
    const rows = [];
    let sNo = 1;

    // 1. Lead groups (dynamic)
    Object.keys(marketingStats.groups || {}).forEach(name => {
      const statsObj = marketingStats.groups[name];
      const targetVal = marketingTargetsState[name] || 0;
      rows.push({
        sNo: sNo++,
        name: name,
        target: targetVal,
        actual: statsObj.actual,
        w1: statsObj.w1,
        w2: statsObj.w2,
        w3: statsObj.w3,
        w4: statsObj.w4,
        isFloat: false
      });
    });

    // 2. Leads Generated (static)
    const lgTarget = marketingTargetsState['LEADS GENERATED'] || 0;
    const lgStats = marketingStats.static?.leadsGenerated || { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 };
    rows.push({
      sNo: sNo++,
      name: 'LEADS GENERATED',
      target: lgTarget,
      actual: lgStats.actual,
      w1: lgStats.w1,
      w2: lgStats.w2,
      w3: lgStats.w3,
      w4: lgStats.w4,
      isFloat: false
    });

    // 3. Site Visit Conversions (static)
    const svcTarget = marketingTargetsState['SITE VISIT CONVERSIONS'] || 0;
    const svcStats = marketingStats.static?.conversions || { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 };
    rows.push({
      sNo: sNo++,
      name: 'SITE VISIT CONVERSIONS',
      target: svcTarget,
      actual: svcStats.actual,
      w1: svcStats.w1,
      w2: svcStats.w2,
      w3: svcStats.w3,
      w4: svcStats.w4,
      isFloat: false
    });

    return rows;
  };

  // Calculate arithmetic average of row percentage achievements
  const calculateOverallPerformance = (rows) => {
    if (rows.length === 0) return '0.00%';
    let totalPct = 0;
    rows.forEach(r => {
      if (r.target && r.target > 0) {
        totalPct += (r.actual / r.target) * 100;
      }
    });
    const avg = totalPct / rows.length;
    return `${avg.toFixed(2)}%`;
  };

  const marketingRows = getMarketingRows();
  const overallPerformance = calculateOverallPerformance(marketingRows);

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left animate-fadeIn font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-black-100 shadow-sm rounded-3xl">
        <div>
          <h2 className="text-xl font-extrabold text-black-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#0e623a]" />
            <span>Summary Planning</span>
          </h2>
          {/* <p className="text-xs text-black-500 mt-1">Manage corporate parameters, turnover projections, and project wise weekly actuals</p> */}
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Summary Targets Saved!
            </span>
          )}
          <button
            onClick={handleSavePlan}
            className="px-5 py-2.5 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Summary Plan</span>
          </button>
        </div>
      </div>

      {/* Top Phase Navigation Tabs */}
      <div className="flex border-b border-black-200 bg-white p-1 rounded-t-2xl shadow-sm">
        <button
          type="button"
          onClick={() => setActivePhase('phase1')}
          className={`py-3.5 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activePhase === 'phase1'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-black-550 hover:text-black-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Phase 1: Turnover Plan</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePhase('phase2')}
          className={`py-3.5 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activePhase === 'phase2'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-black-550 hover:text-black-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Phase 2: Project Wise Plan</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePhase('phase3')}
          className={`py-3.5 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activePhase === 'phase3'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-black-550 hover:text-black-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Phase 3: Marketing Plan</span>
        </button>
      </div>

      {activePhase === 'phase1' ? (
        /* Phase 1: Turnover Plan */
        <div className="bg-white border border-black-100 rounded-b-3xl shadow-sm p-6 space-y-6 animate-fadeIn font-sans">
          <div className="flex justify-end border-b border-black-100 pb-4">
            <div className="relative w-full sm:max-w-xs flex items-center gap-2 justify-end">
              <span className="text-xs font-bold text-black-455 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-black-400" />
                <span>Planning Month:</span>
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs bg-black-50 border border-black-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-black-700 font-bold"
              />
            </div>
          </div>

          <h3 className="text-sm font-extrabold text-black-800 uppercase tracking-wide">Total Sales Projection</h3>

          {loading ? (
            <div className="py-20 text-center text-black-500 italic">
              Loading sales summary planner...
            </div>
          ) : (
            <div className="overflow-x-auto border border-black-150 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black-50 border-b border-black-200 font-bold text-black-500 uppercase tracking-wider text-[11px]">
                    <th className="p-4 w-16 text-center">S.NO.</th>
                    <th className="p-4">TOTAL SALES PROJECTION</th>
                    <th className="p-4 w-44 text-right">TOTAL TARGET</th>
                    <th className="p-4 w-28">UNIT</th>
                    <th className="p-4 w-36 text-right">ACHIEVED</th>
                    <th className="p-4 w-36 text-right">BALANCE</th>
                    <th className="p-4 w-44 text-right">LAST MONTH ACHIEVED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black-100 font-sans text-xs">
                  <tr className="hover:bg-black-50 transition align-middle">
                    <td className="p-4 text-center font-bold text-black-400">1</td>
                    <td className="p-4 font-bold text-black-750">Overall Sales Target</td>
                    <td className="p-4 text-right">
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        value={salesTarget || ''}
                        onChange={(e) => setSalesTarget(Number(e.target.value) || 0)}
                        className="px-3 py-1.5 bg-black-50 border border-black-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-right w-36 mx-auto inline-block"
                      />
                    </td>
                    <td className="p-4 text-black-500 font-semibold">Crores</td>
                    <td className="p-4 text-right font-extrabold text-black-800">
                      {achievedStats.salesValue.toFixed(4)}
                    </td>
                    <td className="p-4 text-right font-extrabold text-[#0e623a]">
                      {(salesTarget - achievedStats.salesValue).toFixed(4)}
                    </td>
                    <td className="p-4 text-right font-bold text-black-500">
                      {lastMonthStats.salesValue.toFixed(4)}
                    </td>
                  </tr>

                  <tr className="hover:bg-black-50 transition align-middle">
                    <td className="p-4 text-center font-bold text-black-400">2</td>
                    <td className="p-4 font-bold text-black-750">Total Villas to be Sold</td>
                    <td className="p-4 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={villasTarget || ''}
                        onChange={(e) => setVillasTarget(Number(e.target.value) || 0)}
                        className="px-3 py-1.5 bg-black-55 border border-black-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-right w-36 mx-auto inline-block"
                      />
                    </td>
                    <td className="p-4 text-black-500 font-semibold">Units</td>
                    <td className="p-4 text-right font-extrabold text-black-800">
                      {achievedStats.villasCount}
                    </td>
                    <td className="p-4 text-right font-extrabold text-[#0e623a]">
                      {villasTarget - achievedStats.villasCount}
                    </td>
                    <td className="p-4 text-right font-bold text-black-500">
                      {lastMonthStats.villasCount}
                    </td>
                  </tr>

                  <tr className="hover:bg-black-50 transition align-middle">
                    <td className="p-4 text-center font-bold text-black-400">3</td>
                    <td className="p-4 font-bold text-black-750">Total Plots to be Sold</td>
                    <td className="p-4 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={plotsTarget || ''}
                        onChange={(e) => setPlotsTarget(Number(e.target.value) || 0)}
                        className="px-3 py-1.5 bg-black-50 border border-black-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-right w-36 mx-auto inline-block"
                      />
                    </td>
                    <td className="p-4 text-black-500 font-semibold">Units</td>
                    <td className="p-4 text-right font-extrabold text-black-800">
                      {achievedStats.plotsCount}
                    </td>
                    <td className="p-4 text-right font-extrabold text-[#0e623a]">
                      {plotsTarget - achievedStats.plotsCount}
                    </td>
                    <td className="p-4 text-right font-bold text-black-500">
                      {lastMonthStats.plotsCount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activePhase === 'phase2' ? (
        /* Phase 2: Project Wise Plan */
        <div className="bg-white border border-black-100 rounded-b-3xl shadow-sm p-6 space-y-6 animate-fadeIn font-sans">
          <div className="flex justify-end border-b border-black-100 pb-4">
            <div className="relative w-full sm:max-w-xs flex items-center gap-2 justify-end">
              <span className="text-xs font-bold text-black-455 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-black-400" />
                <span>Planning Month:</span>
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs bg-black-50 border border-black-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-black-700 font-bold"
              />
            </div>
          </div>

          <h3 className="text-sm font-extrabold text-black-800 uppercase tracking-wide">Project Wise Parameter Report</h3>

          {loading ? (
            <div className="py-20 text-center text-black-500 italic">
              Loading project planning data...
            </div>
          ) : (
            <div className="overflow-x-auto border border-black-150 rounded-2xl">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-black-50 border-b border-black-200 font-bold text-black-500 uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-14 text-center">S.NO.</th>
                    <th className="p-3 w-28">PROJECT</th>
                    <th className="p-3">DESCRIPTION</th>
                    <th className="p-3 w-32 text-right">TARGET</th>
                    <th className="p-3 w-28 text-right">ACTUAL</th>
                    <th className="p-3 w-28 text-right">% ACHIEVED</th>
                    <th className="p-3 w-24 text-right">1ST WK ACTUAL</th>
                    <th className="p-3 w-24 text-right">2ND WK ACTUAL</th>
                    <th className="p-3 w-24 text-right">3RD WK ACTUAL</th>
                    <th className="p-3 w-24 text-right">4TH WK ACTUAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black-100 font-sans">
                  {Object.keys(projectStats).length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-12 text-center text-black-400 italic text-xs">
                        No projects found. Add projects in Project Master first.
                      </td>
                    </tr>
                  ) : (
                    Object.keys(projectStats).map((projId, index) => {
                      const proj = projectStats[projId];
                      const targets = projectTargetsState[projId] || { enquiries: 0, hotlist: 0, sitevisits: 0, booked: 0, value: 0 };
                      
                      const rows = [
                        {
                          field: 'enquiries',
                          label: 'Total Enquiries',
                          target: targets.enquiries,
                          actual: proj.enquiries.actual,
                          w1: proj.enquiries.w1,
                          w2: proj.enquiries.w2,
                          w3: proj.enquiries.w3,
                          w4: proj.enquiries.w4
                        },
                        {
                          field: 'sitevisits',
                          label: 'Site Visits',
                          target: targets.sitevisits,
                          actual: proj.sitevisits.actual,
                          w1: proj.sitevisits.w1,
                          w2: proj.sitevisits.w2,
                          w3: proj.sitevisits.w3,
                          w4: proj.sitevisits.w4
                        },
                        {
                          field: 'booked',
                          label: 'Booked Units',
                          target: targets.booked,
                          actual: proj.bookedUnits.actual,
                          w1: proj.bookedUnits.w1,
                          w2: proj.bookedUnits.w2,
                          w3: proj.bookedUnits.w3,
                          w4: proj.bookedUnits.w4
                        },
                        {
                          field: 'value',
                          label: 'Booking Value (Cr)',
                          target: targets.value,
                          actual: proj.bookingValue.actual,
                          w1: proj.bookingValue.w1,
                          w2: proj.bookingValue.w2,
                          w3: proj.bookingValue.w3,
                          w4: proj.bookingValue.w4,
                          isFloat: true
                        }
                      ];

                      return (
                        <React.Fragment key={projId}>
                          {rows.map((row, rIndex) => (
                            <tr key={row.field} className="hover:bg-black-50/50 transition">
                              {rIndex === 0 && (
                                <>
                                  <td rowSpan="4" className="p-3 text-center align-middle font-bold text-black-400 border-r border-black-100">
                                    {index + 1}
                                  </td>
                                  <td rowSpan="4" className="p-3 font-extrabold text-black-800 align-middle border-r border-black-100 uppercase tracking-wide">
                                    {proj.code || proj.name}
                                  </td>
                                </>
                              )}
                              <td className="p-3 font-semibold text-black-750 text-left pl-4">
                                {row.label}
                              </td>
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  placeholder="0"
                                  step={row.isFloat ? '0.01' : '1'}
                                  value={row.target || ''}
                                  onChange={(e) => handleUpdateProjectTarget(projId, row.field, e.target.value)}
                                  className="px-2.5 py-1.5 bg-black-50 border border-black-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-[12px] font-bold text-right w-24 inline-block"
                                />
                              </td>
                              <td className="p-3 text-right font-extrabold text-black-800">
                                {row.isFloat ? row.actual.toFixed(4) : row.actual}
                              </td>
                              <td className="p-3 text-right font-bold text-[#0e623a]">
                                {calculatePercentage(row.actual, row.target)}
                              </td>
                              <td className="p-3 text-right text-black-500 font-semibold">
                                {row.isFloat ? row.w1.toFixed(4) : row.w1}
                              </td>
                              <td className="p-3 text-right text-black-500 font-semibold">
                                {row.isFloat ? row.w2.toFixed(4) : row.w2}
                              </td>
                              <td className="p-3 text-right text-black-500 font-semibold">
                                {row.isFloat ? row.w3.toFixed(4) : row.w3}
                              </td>
                              <td className="p-3 text-right text-black-500 font-semibold">
                                {row.isFloat ? row.w4.toFixed(4) : row.w4}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Phase 3: Marketing Plan */
        <div className="bg-white border border-black-100 rounded-b-3xl shadow-sm p-6 space-y-6 animate-fadeIn font-sans">
          <div className="flex justify-end border-b border-black-100 pb-4">
            <div className="relative w-full sm:max-w-xs flex items-center gap-2 justify-end">
              <span className="text-xs font-bold text-black-455 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-black-400" />
                <span>Planning Month:</span>
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs bg-black-50 border border-black-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-black-700 font-bold"
              />
            </div>
          </div>

          <h3 className="text-sm font-extrabold text-black-800 uppercase tracking-wide">JB Marketing Parameter Report</h3>

          {loading ? (
            <div className="py-20 text-center text-black-500 italic">
              Loading marketing planning data...
            </div>
          ) : (
            <div className="overflow-x-auto border border-black-150 rounded-2xl">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-black-50 border-b border-black-200 font-bold text-black-500 uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-14 text-center">S.NO.</th>
                    <th className="p-3">DESCRIPTION</th>
                    <th className="p-3 w-36 text-right">BUDGET/ TARGET</th>
                    <th className="p-3 w-36 text-right">ACTUAL</th>
                    <th className="p-3 w-28 text-right">% ACHIEVED</th>
                    <th className="p-3 w-28 text-right">1ST WEEK ACTUAL</th>
                    <th className="p-3 w-28 text-right">2ND WEEK ACTUAL</th>
                    <th className="p-3 w-28 text-right">3RD WEEK ACTUAL</th>
                    <th className="p-3 w-28 text-right">4TH WEEK ACTUAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black-100 font-sans">
                  {marketingRows.map((row, index) => (
                    <tr key={row.name} className="hover:bg-black-50 transition align-middle">
                      <td className="p-3 text-center font-bold text-black-400">
                        {row.sNo}
                      </td>
                      <td className="p-3 font-bold text-black-750 uppercase">
                        {row.name}
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          placeholder="0"
                          value={row.target || ''}
                          onChange={(e) => handleUpdateMarketingTarget(row.name, e.target.value)}
                          className="px-2.5 py-1.5 bg-black-50 border border-black-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-[12px] font-bold text-right w-28 inline-block"
                        />
                      </td>
                      <td className="p-3 text-right font-extrabold text-black-800">
                        {row.isFloat ? row.actual.toFixed(4) : row.actual}
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#0e623a]">
                        {calculatePercentage(row.actual, row.target)}
                      </td>
                      <td className="p-3 text-right text-black-500 font-semibold">
                        {row.isFloat ? row.w1.toFixed(4) : row.w1}
                      </td>
                      <td className="p-3 text-right text-black-500 font-semibold">
                        {row.isFloat ? row.w2.toFixed(4) : row.w2}
                      </td>
                      <td className="p-3 text-right text-black-500 font-semibold">
                        {row.isFloat ? row.w3.toFixed(4) : row.w3}
                      </td>
                      <td className="p-3 text-right text-black-500 font-semibold">
                        {row.isFloat ? row.w4.toFixed(4) : row.w4}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Overall Performance Metric Panel */}
              <div className="bg-emerald-50/20 border-t border-black-150 p-4 flex items-center justify-center rounded-b-2xl font-bold text-xs text-black-700">
                <span>Overall Performance Metric: </span>
                <span className="text-[#0e623a] text-sm font-extrabold ml-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                  {overallPerformance}
                </span>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryPlanning;
