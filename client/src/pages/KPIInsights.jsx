import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  TrendingUp, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Target,
  User,
  FolderOpen,
  BarChart3,
  Percent,
  TrendingDown,
  Building,
  Users,
  Compass
} from 'lucide-react';

const getCoordinatesForPercent = (percent) => {
  const x = Math.cos(2 * Math.PI * (percent - 0.25));
  const y = Math.sin(2 * Math.PI * (percent - 0.25));
  return [x, y];
};

// 🔵 REUSABLE MATTE PIE CHART
const ObservedPieChart = ({ dataArray, valueKey, labelKey, colorPalette, isCount }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  const total = dataArray.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 italic text-xs">
        No data logged
      </div>
    );
  }

  let accumulatedPercent = 0;
  const cx = 80;
  const cy = 80;
  const r = 70;

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 justify-center w-full">
      <div className="relative w-48 h-48 shrink-0">
        <svg 
          className={`w-full h-full opacity-0 ${isVisible ? 'animate-chart-wheel' : ''}`} 
          viewBox="0 0 160 160"
        >
          {dataArray.map((item, index) => {
            const val = item[valueKey] || 0;
            const percent = val / total;
            if (percent === 0) return null;

            const [startX, startY] = getCoordinatesForPercent(accumulatedPercent);
            const startAngle = 2 * Math.PI * (accumulatedPercent - 0.25);
            const endAngle = 2 * Math.PI * (accumulatedPercent + percent - 0.25);
            const midAngle = startAngle + (endAngle - startAngle) / 2;

            accumulatedPercent += percent;
            const [endX, endY] = getCoordinatesForPercent(accumulatedPercent);

            const x1 = cx + startX * r;
            const y1 = cy + startY * r;
            const x2 = cx + endX * r;
            const y2 = cy + endY * r;

            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = percent === 1
              ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
              : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            const labelRadius = r * 0.55;
            const labelX = cx + Math.cos(midAngle) * labelRadius;
            const labelY = cy + Math.sin(midAngle) * labelRadius;

            const color = colorPalette[index % colorPalette.length];
            const percentageText = `${(percent * 100).toFixed(0)}%`;
            const labelText = item[labelKey];

            return (
              <g key={index} className="group cursor-pointer">
                <path
                  d={pathData}
                  fill={color}
                  className={`chart-path-hover origin-center ${isVisible ? 'animate-chart-segment' : ''}`}
                  style={{ 
                    transformOrigin: '80px 80px',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <title>{`${labelText}: ${(percent * 100).toFixed(1)}% (${isCount ? val : '₹' + Math.round(val).toLocaleString()})`}</title>
                </path>
                {percent > 0.05 && (
                  <g className="pointer-events-none select-none text-[8px] font-bold text-white">
                    <text x={labelX} y={labelY - 1} textAnchor="middle" fill="white" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}>
                      {labelText.length > 7 ? labelText.slice(0, 6) + '..' : labelText}
                    </text>
                    <text x={labelX} y={labelY + 7} textAnchor="middle" fill="white" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}>
                      {percentageText}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="space-y-1.5 text-left flex-1 max-h-36 overflow-y-auto pr-2 w-full border-t border-gray-100 pt-3">
        {dataArray.map((item, index) => {
          const val = item[valueKey] || 0;
          const percentage = (val / total) * 100;
          const color = colorPalette[index % colorPalette.length];
          return (
            <div key={index} className="flex items-center justify-between text-[10px] gap-2 border-b border-gray-50 pb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                <span className="font-bold text-gray-700 truncate uppercase" title={item[labelKey]}>{item[labelKey]}</span>
              </div>
              <div className="text-right text-gray-500 font-bold shrink-0">
                <span className="text-gray-800 font-extrabold mr-1">{percentage.toFixed(1)}%</span>
                <span>({isCount ? `${val}` : `₹${Math.round(val).toLocaleString()}`})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 📊 REUSABLE MATTE BAR CHART
const ObservedBarChart = ({ dataArray, xKey, yKey, barColor, isPercent = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  const maxValue = Math.max(...dataArray.map(item => item[yKey] || 0), 10);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 text-left">
      <style>{`
        @keyframes growHeight {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .animate-bar-grow {
          animation: growHeight 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          transform-origin: bottom;
        }
        .bar-hover {
          transition: filter 0.3s, opacity 0.3s;
        }
        .bar-hover:hover {
          filter: brightness(1.08) drop-shadow(0 4px 6px rgba(0,0,0,0.15));
          opacity: 0.95;
        }
      `}</style>
      <div className="h-48 w-full flex items-end gap-3 pt-4 border-b border-l border-gray-150 px-2 relative">
        {dataArray.map((item, index) => {
          const val = item[yKey] || 0;
          const heightPercent = (val / maxValue) * 85; // cap at 85% height to leave room for labels

          return (
            <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip value */}
              <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-200 z-20 pointer-events-none whitespace-nowrap">
                {isPercent ? `${val.toFixed(1)}%` : val.toLocaleString()}
              </div>

              {/* Bar segment */}
              <div 
                className={`w-full rounded-t-lg bar-hover ${isVisible ? 'animate-bar-grow' : ''}`}
                style={{ 
                  height: `${heightPercent}%`, 
                  backgroundColor: barColor,
                  animationDelay: `${index * 0.1}s`
                }}
              ></div>

              {/* Label */}
              <div className="text-[9px] font-bold text-gray-550 truncate max-w-full text-center mt-1 uppercase w-full">
                {item[xKey]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const KPIInsights = () => {
  const { token } = useAuth();
  
  // Date filters - default to current month
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  });

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    cards: {
      enquiries: { total: 0, contacted: 0, followup: 0, closed: 0 },
      siteVisits: { total: 0, siteVisit: 0, followup: 0, closed: 0 },
      hotList: 0,
      conversion: { count: 0, value: 0 },
      inventory: { totalProjects: 0, totalUnits: 0, availableUnits: 0, bookedUnits: 0, handoverUnits: 0 }
    },
    insights: {
      totalMarketingSpend: 0,
      totalLeadCost: 0,
      costPerEnquiry: 0,
      siteVisitConversionRate: 0,
      bookingConversionRate: 0,
      handoverRate: 0
    },
    sourceStats: {},
    userStats: {},
    projectStats: {},
    stageStats: {},
    users: [],
    projects: []
  });

  useEffect(() => {
    fetchInsightsData();
  }, [fromDate, toDate, selectedUser, selectedProject]);

  const fetchInsightsData = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/dashboard/stats?fromDate=${fromDate}&toDate=${toDate}`;
      if (selectedUser) url += `&userId=${selectedUser}`;
      if (selectedProject) url += `&projectId=${selectedProject}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (monthVal) => {
    if (!monthVal) return;
    const [year, month] = monthVal.split('-');
    const firstDay = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);
    setFromDate(firstDay);
    setToDate(lastDay);
  };

  const primaryColors = [
    '#4A7C59', // Matte Sage Green
    '#68809A', // Matte Slate Blue
    '#D98A6C', // Matte Terracotta Orange
    '#C77B82', // Matte Dusty Rose
    '#9B8AA9', // Matte Lavender
    '#DFBA84', // Matte Soft Mustard Yellow
    '#7CA5A9', // Matte Seafoam Teal
    '#8E9AAF', // Matte Slate Grey
    '#F4B2A8'  // Matte Soft Peach
  ];

  return (
    <div className="space-y-8 w-full mx-auto text-left animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#0e623a]" />
            <span>KPI Insights & Conversions</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Analyze conversions, pipeline efficiency, marketing spend ratios, and performance metrics
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">
          {/* User Select */}
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-gray-700 font-bold"
            >
              <option value="">All Users</option>
              {(stats.users || []).map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Project Select */}
          <div className="flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-gray-700 font-bold"
            >
              <option value="">All Projects</option>
              {(stats.projects || []).map(p => (
                <option key={p._id} value={p._id}>{p.code || p.name}</option>
              ))}
            </select>
          </div>

          <div className="border-l border-gray-200 h-5"></div>

          {/* Month Picker */}
          <div className="flex items-center gap-1 text-xs text-gray-550 font-bold">
            <Calendar className="w-3.5 h-3.5 text-[#0e623a]" />
            <span>Month:</span>
          </div>
          <input
            type="month"
            onChange={(e) => handleMonthChange(e.target.value)}
            className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-700 font-bold"
          />

          {/* Date Picker */}
          <div className="flex items-center gap-1 text-xs text-gray-500 font-bold">
            <span>Range:</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-700 font-bold"
          />
          <span className="text-xs text-gray-400 font-bold">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-700 font-bold"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-gray-400 italic">
          Fetching conversion matrices and chart metrics...
        </div>
      ) : (
        <div className="space-y-8">
          {/* 🟢 TOP ANALYTICAL SUMMARY CARD GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Enquiry Spend KPI */}
            <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Marketing Investment</span>
              <h3 className="text-2xl font-black text-gray-800 mt-1">₹{Math.round(stats.insights?.totalMarketingSpend || 0).toLocaleString()}</h3>
              <p className="text-[9px] text-[#0e623a] font-bold mt-2">Combined Spent Budget</p>
            </div>

            {/* Cost Per Enquiry */}
            <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cost Per Enquiry (CPE)</span>
              <h3 className="text-2xl font-black text-[#0e623a] mt-1">₹{Math.round(stats.insights?.costPerEnquiry || 0).toLocaleString()}</h3>
              <p className="text-[9px] text-gray-550 font-bold mt-2">Lead Cost / Total Enquiries</p>
            </div>

            {/* Booking Stage Conversions */}
            <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Bookings Count</span>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.cards.conversion.count} Converted</h3>
              <p className="text-[9px] text-[#0e623a] font-bold mt-2">Value: ₹{Math.round(stats.cards.conversion.value).toLocaleString()}</p>
            </div>

            {/* Handover Rate */}
            <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Registration / Handover Rate</span>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{(stats.insights?.handoverRate || 0).toFixed(1)}%</h3>
              <p className="text-[9px] text-gray-550 font-bold mt-2">{stats.cards.inventory.handoverUnits} of {stats.cards.inventory.totalUnits} Units</p>
            </div>
          </div>

          {/* 🟢 COMPARATIVE CHART ROWS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Pipeline Conversion Rates (Site Visit Rate vs Booking Rate vs Handover Rate) */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#0e623a]" />
                <span>Conversion Pipeline Stage Efficiency (%)</span>
              </h3>
              <ObservedBarChart 
                dataArray={[
                  { stage: 'Site Visit Rate', rate: stats.insights?.siteVisitConversionRate || 0 },
                  { stage: 'Booking Rate', rate: stats.insights?.bookingConversionRate || 0 },
                  { stage: 'Registration Rate', rate: stats.insights?.handoverRate || 0 }
                ]}
                xKey="stage"
                yKey="rate"
                barColor="#68809A" // Matte Slate Blue
                isPercent={true}
              />
              <p className="text-[10px] text-gray-400 italic">
                Tracks conversion ratios across pipeline stages: Site Visit Conversion Rate, Booking Rate relative to total enquiries, and Final Registration (Handover) Rate.
              </p>
            </div>

            {/* Chart 2: Spent Budget Distribution Pie */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#0e623a]" />
                <span>Spent Budget Distribution by Campaign Source</span>
              </h3>
              <div className="flex justify-center py-2">
                <ObservedPieChart 
                  dataArray={Object.keys(stats.sourceStats || {}).map(src => ({
                    source: src,
                    spent: stats.sourceStats[src].spent || 0
                  }))}
                  valueKey="spent"
                  labelKey="source"
                  colorPalette={primaryColors}
                />
              </div>
            </div>

            {/* Chart 3: Enquiries Breakdown Pie */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0e623a]" />
                <span>Total Enquiries Breakdown</span>
              </h3>
              <div className="flex justify-center py-2">
                <ObservedPieChart 
                  dataArray={[
                    { label: 'Follow-Up (Active)', count: stats.cards.enquiries.followup },
                    { label: 'Contacted Closed (Lost)', count: stats.cards.enquiries.closed }
                  ]}
                  valueKey="count"
                  labelKey="label"
                  colorPalette={['#4A7C59', '#C77B82']} // Matte Sage, Matte Rose
                  isCount={true}
                />
              </div>
            </div>

            {/* Chart 4: Site Visits Breakdown Pie */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#0e623a]" />
                <span>Site Visit Engagements Breakdown</span>
              </h3>
              <div className="flex justify-center py-2">
                <ObservedPieChart 
                  dataArray={[
                    { label: 'Visits Conducted', count: stats.cards.siteVisits.siteVisit },
                    { label: 'Follow-up Visits', count: stats.cards.siteVisits.followup },
                    { label: 'Site Visit Closed (Lost)', count: stats.cards.siteVisits.closed }
                  ]}
                  valueKey="count"
                  labelKey="label"
                  colorPalette={['#68809A', '#DFBA84', '#C77B82']} // Matte Slate, Matte Yellow, Matte Rose
                  isCount={true}
                />
              </div>
            </div>

          </div>

          {/* 🟢 DETAIL METRICS DATAGRID */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3">
              KPI Conversions Detailed Metrics DataGrid
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-4">METRIC TYPE</th>
                    <th className="p-4 text-center">ENQUIRY COUNT</th>
                    <th className="p-4 text-center">SITE VISIT COUNT</th>
                    <th className="p-4 text-right">CONVERSION RATIO</th>
                    <th className="p-4 text-right">BOOKING VALUATION NET</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans font-semibold text-gray-700">
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">Enquiries Pipeline Stage</td>
                    <td className="p-4 text-center">{stats.cards.enquiries.total} leads</td>
                    <td className="p-4 text-center">—</td>
                    <td className="p-4 text-right text-gray-400">Baseline</td>
                    <td className="p-4 text-right">—</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">Site Visits Pipeline Stage</td>
                    <td className="p-4 text-center">—</td>
                    <td className="p-4 text-center">{stats.cards.siteVisits.total} visits</td>
                    <td className="p-4 text-right">{(stats.insights?.siteVisitConversionRate || 0).toFixed(1)}%</td>
                    <td className="p-4 text-right">—</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">Bookings / site conversions</td>
                    <td className="p-4 text-center">{stats.cards.conversion.count} leads</td>
                    <td className="p-4 text-center">—</td>
                    <td className="p-4 text-right">{(stats.insights?.bookingConversionRate || 0).toFixed(1)}%</td>
                    <td className="p-4 text-right text-[#0e623a] font-extrabold">₹{Math.round(stats.cards.conversion.value).toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">Registration / Handovers</td>
                    <td className="p-4 text-center">{stats.cards.inventory.handoverUnits} units</td>
                    <td className="p-4 text-center">—</td>
                    <td className="p-4 text-right">{(stats.insights?.handoverRate || 0).toFixed(1)}%</td>
                    <td className="p-4 text-right">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default KPIInsights;
