import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Target, 
  Search, 
  Calendar, 
  Folder, 
  FolderOpen,
  Save, 
  TrendingUp, 
  CheckCircle 
} from 'lucide-react';

const LeadTargetPlanning = () => {
  const { token } = useAuth();
  
  // Date and filter states
  const [selectedMonth, setSelectedMonth] = useState('2026-06'); // Format: YYYY-MM
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data states
  const [leadGroups, setLeadGroups] = useState([]);
  const [targets, setTargets] = useState({});
  const [actualStats, setActualStats] = useState({});
  const [conversionStats, setConversionStats] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [selectedMonth]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Lead Groups
      const groupsRes = await fetch(`${API_URL}/lead-groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let activeGroups = [];
      if (groupsRes.ok) {
        activeGroups = await groupsRes.json();
        setLeadGroups(activeGroups);
      }

      // 2. Fetch Lead Targets
      const targetsRes = await fetch(`${API_URL}/lead-targets/${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const newTargets = {};
      activeGroups.forEach(group => {
        group.sources?.forEach(src => {
          newTargets[src] = 0;
        });
      });

      if (targetsRes.ok) {
        const targetData = await targetsRes.json();
        if (targetData && targetData.targets) {
          targetData.targets.forEach(t => {
            newTargets[t.source] = t.target || 0;
          });
        }
      }
      setTargets(newTargets);

      // 3. Fetch Actual statistics and conversions from backend
      const statsRes = await fetch(`${API_URL}/leads/target-stats/${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        
        // Map actual statistics array to object keys
        const newActual = {};
        const newConversions = {};
        
        statsData.actual?.forEach(item => {
          newActual[item._id] = item.count || 0;
        });
        
        statsData.conversions?.forEach(item => {
          newConversions[item._id] = item.count || 0;
        });

        setActualStats(newActual);
        setConversionStats(newConversions);
      }

    } catch (err) {
      console.error('Error loading target planning matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarget = (source, value) => {
    const numVal = Number(value) || 0;
    setTargets(prev => ({
      ...prev,
      [source]: numVal
    }));
  };

  const handleSavePlan = async () => {
    const targetsArray = Object.keys(targets).map(sourceName => ({
      source: sourceName,
      target: targets[sourceName]
    }));

    try {
      const response = await fetch(`${API_URL}/lead-targets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          targets: targetsArray
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save lead targets configuration.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving targets.');
    }
  };

  const toggleGroupCollapse = (groupName) => {
    setCollapsedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName) 
        : [...prev, groupName]
    );
  };

  // Helper to calculate totals for a specific group
  const calculateGroupTotals = (group) => {
    let totalTarget = 0;
    let totalActual = 0;
    let totalConversions = 0;
    
    group.sources?.forEach(src => {
      totalTarget += targets[src] || 0;
      totalActual += actualStats[src] || 0;
      totalConversions += conversionStats[src] || 0;
    });

    return { totalTarget, totalActual, totalConversions };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left animate-fadeIn">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-black-100 shadow-sm rounded-3xl">
        <div>
          <h2 className="text-xl font-extrabold text-black-800 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#0e623a]" />
            <span>Lead Target Planning</span>
          </h2>
          {/* <p className="text-xs text-black-500 mt-1">Define target leads and compare against achieved bookings count for the selected period</p> */}
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Target Plan Saved!
            </span>
          )}
          <button
            onClick={handleSavePlan}
            className="px-5 py-2.5 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Target Plan</span>
          </button>
        </div>
      </div>

      {/* Main Target Sheet */}
      <div className="bg-white border border-black-100 rounded-3xl shadow-sm p-6 space-y-6">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black-100 pb-4">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute left-3 top-3 text-black-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search lead source type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-black-50 border border-black-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-black-700"
            />
          </div>

          {/* Month selector */}
          <div className="relative w-full sm:max-w-xs flex items-center gap-2 justify-end">
            <span className="text-xs font-bold text-black-455 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-black-400" />
              <span>Month:</span>
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs bg-black-50 border border-black-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-black-700 font-bold"
            />
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="py-20 text-center text-black-500 italic">
            Loading target planning sheet...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black-50 border-b border-black-150 font-bold text-black-500 uppercase tracking-wider text-[11px]">
                  <th className="p-4 w-16">S.NO.</th>
                  <th className="p-4">LEAD SOURCE</th>
                  <th className="p-4 w-44 text-right">TARGET</th>
                  <th className="p-4 w-44 text-right">ACTUAL</th>
                  <th className="p-4 w-52 text-right">SITE VISIT CONVERSIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black-100 font-sans">
                {leadGroups.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-black-400 italic">
                      No lead groups configured. Configure lead source groups in Settings first.
                    </td>
                  </tr>
                ) : (
                  leadGroups.map((group) => {
                    const visibleSources = group.sources?.filter(src => 
                      src.toLowerCase().includes(searchQuery.toLowerCase())
                    ) || [];

                    if (searchQuery && visibleSources.length === 0) return null;

                    const { totalTarget, totalActual, totalConversions } = calculateGroupTotals(group);

                    return (
                      <React.Fragment key={group._id}>
                        {/* Parent Group Row */}
                        <tr 
                          onClick={() => toggleGroupCollapse(group.name)}
                          className="bg-black-50/70 border-y border-black-150 font-bold text-black-800 cursor-pointer hover:bg-black-100/80 transition select-none"
                          title="Click to collapse/expand lead sources"
                        >
                          <td className="p-4 text-center">
                            {collapsedGroups.includes(group.name) ? (
                              <Folder className="w-4 h-4 text-amber-500 mx-auto" />
                            ) : (
                              <FolderOpen className="w-4 h-4 text-amber-500 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 uppercase tracking-wider text-xs font-extrabold flex items-center gap-2">
                            <span>{group.name}</span>
                            {/* <span className="text-[10px] text-black-400 font-normal">
                              ({collapsedGroups.includes(group.name) ? 'click to expand' : 'click to collapse'})
                            </span> */}
                          </td>
                          <td className="p-4 text-right font-extrabold text-[#0e623a] text-sm">
                            {totalTarget.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-bold text-black-800 text-sm">
                            {totalActual.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-extrabold text-emerald-700 text-sm">
                            {totalConversions.toLocaleString()}
                          </td>
                        </tr>

                        {/* Child Rows for Lead Sources */}
                        {!collapsedGroups.includes(group.name) && visibleSources.map((src, index) => {
                          const targetVal = targets[src] || 0;
                          const actualVal = actualStats[src] || 0;
                          const convVal = conversionStats[src] || 0;

                          return (
                            <tr key={src} className="hover:bg-emerald-50/5 transition align-middle">
                              <td className="p-4 text-center text-black-400 font-semibold">
                                {index + 1}
                              </td>
                              <td className="p-4 font-semibold text-black-700 pl-8 uppercase">
                                ↳ {src}
                              </td>
                              <td className="p-4 text-right">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={targetVal || ''}
                                  onChange={(e) => handleUpdateTarget(src, e.target.value)}
                                  className="px-3 py-1.5 bg-black-50 border border-black-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-right w-36 mx-auto inline-block"
                                />
                              </td>
                              <td className="p-4 text-right font-bold text-black-700">
                                {actualVal > 0 ? (
                                  <span className="text-black-800 font-bold">{actualVal}</span>
                                ) : (
                                  <span className="text-black-400">0</span>
                                )}
                              </td>
                              <td className="p-4 text-right font-extrabold text-emerald-600">
                                {convVal > 0 ? (
                                  <span className="text-emerald-700 font-extrabold">{convVal}</span>
                                ) : (
                                  <span className="text-black-400">0</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadTargetPlanning;
