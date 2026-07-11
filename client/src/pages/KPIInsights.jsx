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
  Compass,
  FileText,
  CheckCircle,
  Key,
  AlertCircle,
  Filter
} from 'lucide-react';

const SOURCE_TYPES = [
  'Paper Ad',
  'Railway station Hoardings (Rental)',
  'Local TV',
  'FM Radio',
  'Airport Advertisement - Tuticorin',
  'Hydrogen Balloon',
  'Notice distribution',
  'Unipole',
  'LED board behind park',
  'Pearl Bliss Tuticorin Project',
  'Satellite Channel',
  '99acres',
  'Housing.com',
  'Facebook',
  'Instagram',
  'Youtube',
  'Real Estate',
  'Magicbricks',
  'Website',
  'Direct',
  'Old Customer',
  'Reference',
  'Flexboard/Banner',
  'Stall'
];

const getCoordinatesForPercent = (percent) => {
  const x = Math.cos(2 * Math.PI * (percent - 0.25));
  const y = Math.sin(2 * Math.PI * (percent - 0.25));
  return [x, y];
};

const getExcelStyles = (titleBg, monthBg, headerBg, execBg) => {
  return `
    <style>
      table { border-collapse: collapse; }
      td, th { border: 1px solid #000000; padding: 6px 8px; font-family: 'Segoe UI', Calibri, sans-serif; font-size: 10pt; color: #000000; }
      th, .table-headers th { font-weight: bold; background-color: ${headerBg || '#FCE4D6'}; color: #000000; border: 1px solid #000000; text-align: center; }
      .title-row { font-size: 11pt; font-weight: bold; color: #000000; background-color: ${titleBg || '#FCE4D6'}; text-align: center; }
      .month-header { height: 22px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: ${monthBg || '#DDEBF7'}; border: 1px solid #000000; text-align: center; text-transform: uppercase; }
      .exec-banner { background-color: ${execBg || '#DDEBF7'}; font-weight: bold; text-align: left; }
      .bg-header-blue { background-color: #5B9BD5 !important; color: #000000 !important; font-weight: bold; text-align: center; }
      .bg-header-green { background-color: #C6E0B4 !important; color: #000000 !important; font-weight: bold; text-align: center; }
      .bg-black-row { background-color: #D9D9D9 !important; color: #000000 !important; }
      .bg-orange-pct { background-color: #F8CBAD !important; color: #000000 !important; font-weight: bold; text-align: center; }
      
      .font-bold { font-weight: bold; color: #000000; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
    </style>
  `;
};

const getExcelHeader = (titleText, monthTitle, totalColumns, themeColor, logoPath) => {
    const safeCols = Math.max(4, totalColumns);
    const logoCols = 3;
    const textCols = safeCols - logoCols;
    return `
      <tr style="height: 80px;">
        <td colspan="${logoCols}" class="title-row" style="border: 1px solid #000000; border-right: none; vertical-align:middle; text-align:center; height: 80px;">
          <img src="${logoPath}" width="200" height="70" style="vertical-align: middle;" />
        </td>
        <td colspan="${textCols}" class="title-row" style="border: 1px solid #000000; border-left: none; vertical-align:middle; text-align:left; padding-left: 20px; font-size: 14pt; font-weight: bold; color: #000000; height: 80px;">
          ${titleText}
        </td>
      </tr>
      ${monthTitle ? `
      <tr>
        <td colspan="${safeCols}" class="month-header" style="height: 22px; vertical-align: middle; font-size: 10pt; font-weight: bold; border: 1px solid #000000; text-align: center; text-transform: uppercase;">
          ${monthTitle}
        </td>
      </tr>` : ''}
      <tr><td colspan="${safeCols}" style="border:none; height: 15px;"></td></tr>
    `;
  };

// 🔵 REUSABLE MATTE PIE CHART
const ObservedPieChart = ({ dataArray, valueKey, labelKey, colorPalette, isCount, onSegmentClick }) => {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
      <div className="flex items-center justify-center h-48 text-black-400 italic text-xs">
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
          className={`w-full h-full opacity-100 ${isVisible ? 'animate-chart-wheel' : ''}`} 
          viewBox="0 0 160 160"
        >
          {dataArray.map((item, index) => {
            const val = item[valueKey] || 0;
            const percent = val / total;
            if (percent === 0) return null;

            const [startX, startY] = getCoordinatesForPercent(accumulatedPercent);
            const actualPercent = percent === 1 ? 0.9999 : percent;
            const startAngle = 2 * Math.PI * (accumulatedPercent - 0.25);
            const endAngle = 2 * Math.PI * (accumulatedPercent + actualPercent - 0.25);
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
              <g key={index} className="group cursor-pointer" onClick={() => onSegmentClick && onSegmentClick(item)}>
                <path
                  d={pathData}
                  fill={color}
                  className={`chart-path-hover origin-center ${isVisible ? 'animate-chart-segment' : ''}`}
                  style={{ 
                    transformOrigin: '80px 80px',
                    animationDelay: `${index * 0.1}s`
                  }}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                    setMousePos({
                      x: e.clientX - rect.left + 10,
                      y: e.clientY - rect.top - 40
                    });
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                />
                {percent > 0.05 && (
                  <g className="pointer-events-none select-none text-[9px] font-bold text-white">
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

        {hoveredItem && (
          <div 
            className="absolute bg-black-950/95 text-white text-[11px] font-bold px-2 py-1 rounded-xl shadow-lg border border-black-800 pointer-events-none z-50 transition-all duration-75 whitespace-nowrap"
            style={{ 
              left: `${mousePos.x}px`, 
              top: `${mousePos.y}px`
            }}
          >
            <div className="text-[10px] text-black-400 font-extrabold uppercase">{hoveredItem[labelKey]}</div>
            <div className="text-white mt-0.5">
              {((hoveredItem[valueKey] / total) * 100).toFixed(1)}% 
              <span className="text-black-300 ml-1">
                ({isCount ? hoveredItem[valueKey] : '₹' + Math.round(hoveredItem[valueKey]).toLocaleString()})
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-left flex-1 max-h-36 overflow-y-auto pr-2 w-full border-t border-black-100 pt-3">
        {dataArray.map((item, index) => {
          const val = item[valueKey] || 0;
          const percentage = (val / total) * 100;
          const color = colorPalette[index % colorPalette.length];
          return (
            <div 
              key={index} 
              className={`flex items-center justify-between text-[11px] gap-2 border-b border-black-50 pb-0.5 ${onSegmentClick ? 'cursor-pointer hover:bg-black-50/50 px-1.5 py-0.5 rounded transition' : ''}`}
              onClick={() => onSegmentClick && onSegmentClick(item)}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                <span className="font-bold text-black-700 truncate uppercase" title={item[labelKey]}>{item[labelKey]}</span>
              </div>
              <div className="text-right text-black-500 font-bold shrink-0">
                <span className="text-black-800 font-extrabold mr-1">{percentage.toFixed(1)}%</span>
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
      <div className="h-48 w-full flex items-end gap-3 pt-4 border-b border-l border-black-150 px-2 relative">
        {dataArray.map((item, index) => {
          const val = item[yKey] || 0;
          const heightPercent = (val / maxValue) * 85; // cap at 85% height to leave room for labels

          return (
            <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip value */}
              <div className="absolute bottom-full mb-1 bg-black-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-200 z-20 pointer-events-none whitespace-nowrap">
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
              <div className="text-[10px] font-bold text-black-550 truncate max-w-full text-center mt-1 uppercase w-full">
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
  const { token, user } = useAuth();
  const logoPath = window.location.origin + "/jb_logo.jpg";
  
  // Date filters - default to current month
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [selectedUser, setSelectedUser] = useState(() => {
    const isPrivileged = user?.role === 'Super Admin' || user?.role === 'Admin';
    return isPrivileged ? '' : (user?._id || '');
  });
  
  useEffect(() => {
    if (user && user.role !== 'Super Admin' && user.role !== 'Admin') {
      setSelectedUser(user._id);
    }
  }, [user]);

  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeCpeDrillDown, setActiveCpeDrillDown] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [crdMenuOpen, setCrdMenuOpen] = useState(false);
  const [leadCostAnalysisData, setLeadCostAnalysisData] = useState([]);



  const [stats, setStats] = useState({
    cards: {
      enquiries: { total: 0, contacted: 0, followup: 0, closed: 0 },
      siteVisits: { total: 0, siteVisit: 0, followup: 0, closed: 0 },
      hotList: 0,
      conversion: { count: 0, value: 0, received: 0, pending: 0 },
      booked: { count: 0, value: 0, received: 0, pending: 0 },
      handover: { count: 0, value: 0, received: 0, pending: 0 },
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
    groupStats: {},
    userStats: {},
    projectStats: {},
    stageStats: {},
    users: [],
    projects: []
  });

  useEffect(() => {
    setSelectedGroup(null);
    fetchInsightsData();
    fetchLeadCostAnalysisData();
  }, [fromDate, toDate, selectedUser, selectedProject, selectedSource]);

  const fetchLeadCostAnalysisData = async () => {
    try {
      let url = `${API_URL}/dashboard/lead-cost-analysis?fromDate=${fromDate}&toDate=${toDate}`;
      if (selectedProject) url += `&projectId=${selectedProject}`;
      if (selectedSource) url += `&source=${encodeURIComponent(selectedSource)}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeadCostAnalysisData(data);
      }
    } catch (err) {
      console.error('Error fetching lead cost analysis:', err);
    }
  };

  const fetchInsightsData = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/dashboard/stats?fromDate=${fromDate}&toDate=${toDate}`;
      if (selectedUser) url += `&userId=${selectedUser}`;
      if (selectedProject) url += `&projectId=${selectedProject}`;
      if (selectedSource) url += `&source=${encodeURIComponent(selectedSource)}`;
      
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

  const handleExportLeadCostAnalysis = async () => {
    try {
      if (leadCostAnalysisData.length === 0) {
        alert('No data to export for Lead Cost Analysis.');
        return;
      }

      setLoading(true);
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const titleText = `DAILY LEAD COST ANALYSIS - ${monthNames[dateForMonth.getMonth()]} ${dateForMonth.getFullYear()}`;

      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#0f766e", "#ccfbf1", "#115e59", "#99f6e4")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 7, "#0f766e", logoPath)}
            <tr class="table-headers">
              <th>S.No</th>
              <th>Date</th>
              <th>Lead Name</th>
              <th>Project Name</th>
              <th>Campaign Source</th>
              <th>Daily Spent (₹)</th>
              <th>Total Leads Today</th>
              <th>Cost per Enquiry (₹)</th>
            </tr>
      `;

      let totalSpent = 0;
      leadCostAnalysisData.forEach((row, index) => {
        totalSpent += row.dailySpent;
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';
        const dStr = new Date(row.exactTime).toLocaleDateString('en-GB').replace(/\//g, '.');

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${dStr}</td>
            <td class="text-left font-bold">${row.leadName}</td>
            <td>${row.projectName}</td>
            <td class="text-left">${row.source}</td>
            <td class="text-right">₹${Math.round(row.dailySpent).toLocaleString()}</td>
            <td class="text-center">${row.dailyLeads}</td>
            <td class="text-right font-bold text-[#0e623a]">₹${Math.round(row.costPerEnquiry).toLocaleString()}</td>
          </tr>
        `;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JB_DAILY_LEAD_COST_ANALYSIS_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error exporting lead cost analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleExportEnquiriesExcel = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load lead details for export');
        return;
      }
      const data = await res.json();

      // Apply active dashboard filters
      const filtered = data.filter(lead => {
        // 1. Must be enquiry (Contacted or Follow-Up)
        const isEnquiry = lead.status === 'Contacted' || lead.status === 'Follow-Up';
        if (!isEnquiry) return false;

        // 2. Project filter
        if (selectedProject && (lead.project?._id || lead.project) !== selectedProject) return false;

        // 3. User/Executive filter
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;

        // 4. Date range filter
        const createdAt = new Date(lead.createdAt);
        if (fromDate && createdAt < new Date(fromDate)) return false;
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (createdAt > end) return false;
        }

        return true;
      });

      if (filtered.length === 0) {
        alert('No enquiry records found for the selected filters.');
        return;
      }

      // Generate the styled HTML sheet
      const projectTitle = selectedProject 
        ? (stats.projects.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';
      const titleText = projectTitle 
        ? `JB - ${projectTitle.toUpperCase()} MARKETING ENQUIRY SHEET`
        : `JB - MARKETING ENQUIRY SHEET`;
        
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#FCE4D6", "#DDEBF7", "#FCE4D6", "#DDEBF7")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 10, "#16a34a", logoPath)}
      `;

      // Group leads by assigned executive to insert executive banner row (as seen in screenshot: "Veni" blue banner stretching across!)
      const groupedByExec = {};
      filtered.forEach(lead => {
        const execName = lead.assignedTo?.name || 'UNASSIGNED';
        if (!groupedByExec[execName]) groupedByExec[execName] = [];
        groupedByExec[execName].push(lead);
      });

      let globalSNo = 1;

      Object.keys(groupedByExec).forEach(execName => {
        // Executive banner row
        html += `
          <tr>
            <td colspan="10" class="exec-banner">${execName.toUpperCase()}</td>
          </tr>
          <!-- Table Headers -->
          <tr class="table-headers">
            <th>S.No</th>
            <th>Enquiry date</th>
            <th>Lead Name</th>
            <th>Contact Number</th>
            <th>Assigned To</th>
            <th>Enquiry Mode</th>
            <th>Project</th>
            <th>Place</th>
            <th>Lead Status</th>
            <th>Sales Executive Remarks</th>
          </tr>
        `;

        // Lead rows
        groupedByExec[execName].forEach((lead, idx) => {
          const dateStr = new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.');
          const phoneStr = lead.phone || '';
          const sourceStr = lead.leadSource || '';
          const projectStr = lead.project?.code || '';
          const placeStr = lead.address ? lead.address.split(',')[0] : '';
          const statusStr = (lead.status || '').toLowerCase().replace('-', '');
          const remarksStr = lead.followUpInfo?.remarks || lead.closeRemarks || '';
          const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';

          html += `
            <tr ${rowClass}>
              <td>${globalSNo++}</td>
              <td>${dateStr}</td>
              <td class="text-left bold-label">${lead.name || ''}</td>
              <td>${phoneStr}</td>
              <td>${execName.toUpperCase()}</td>
              <td>${sourceStr}</td>
              <td>${projectStr}</td>
              <td>${placeStr}</td>
              <td>${statusStr}</td>
              <td class="text-left">${remarksStr}</td>
            </tr>
          `;
        });
      });

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileCode = projectTitle ? projectTitle : 'ALL_PROJECTS';
      a.download = `JB_${fileCode}_ENQUIRY_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting enquiry sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSiteVisitsExcel = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load lead details for export');
        return;
      }
      const data = await res.json();

      // Apply active dashboard filters
      const filtered = data.filter(lead => {
        // 1. Must be site visit stage (Site Visit or Site Visit Follow-up)
        const isSiteVisit = lead.status === 'Site Visit' || lead.status === 'Site Visit Follow-up';
        if (!isSiteVisit) return false;

        // 2. Project filter
        if (selectedProject && (lead.project?._id || lead.project) !== selectedProject) return false;

        // 3. User/Executive filter
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;

        // 4. Date range filter
        const createdAt = new Date(lead.createdAt);
        if (fromDate && createdAt < new Date(fromDate)) return false;
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (createdAt > end) return false;
        }

        return true;
      });

      if (filtered.length === 0) {
        alert('No site visit records found for the selected filters.');
        return;
      }

      // Generate the styled HTML sheet
      const projectTitle = selectedProject 
        ? (stats.projects.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';
      const titleText = projectTitle 
        ? `JB - ${projectTitle.toUpperCase()} SITE VISIT REPORT`
        : `JB - SITE VISIT REPORT`;
        
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#FF99CC", "#F8CBAD", "#FF99CC", "#00B0F0")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 9, "#2563eb", logoPath)}
      `;

      // Group leads by assigned executive
      const groupedByExec = {};
      filtered.forEach(lead => {
        const execName = lead.assignedTo?.name || 'UNASSIGNED';
        if (!groupedByExec[execName]) groupedByExec[execName] = [];
        groupedByExec[execName].push(lead);
      });

      let globalSNo = 1;

      Object.keys(groupedByExec).forEach(execName => {
        // Executive banner row
        html += `
          <tr>
            <td colspan="9" class="exec-banner">${execName.toUpperCase()}</td>
          </tr>
          <!-- Table Headers -->
          <tr class="table-headers">
            <th>S.No.</th>
            <th>Enquiry date</th>
            <th>Name</th>
            <th>Contact</th>
            <th>Site Visited By</th>
            <th>Place</th>
            <th>Enquiry Status</th>
            <th>Remarks</th>
            <th>Enquiry mode</th>
          </tr>
        `;

        // Lead rows
        groupedByExec[execName].forEach((lead, idx) => {
          const dateStr = new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.');
          const phoneStr = lead.phone || '';
          const placeStr = lead.address ? lead.address.split(',')[0] : '';
          const visitedBy = execName;
          
          // Enquiry Status column is completed/followup (or lead.status lowercase)
          const statusStr = lead.status === 'Site Visit Follow-up' ? 'followup' : 'completed';
          const remarksStr = lead.followUpInfo?.remarks || lead.closeRemarks || '';
          const sourceStr = lead.leadSource || '';
          const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';

          html += `
            <tr ${rowClass}>
              <td>${globalSNo++}</td>
              <td>${dateStr}</td>
              <td class="text-left bold-label">${lead.name || ''}</td>
              <td>${phoneStr}</td>
              <td>${visitedBy}</td>
              <td>${placeStr}</td>
              <td>${statusStr}</td>
              <td class="text-left">${remarksStr}</td>
              <td>${sourceStr}</td>
            </tr>
          `;
        });
      });

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileCode = projectTitle ? projectTitle : 'ALL_PROJECTS';
      a.download = `JB_${fileCode}_SITE_VISIT_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting site visit report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportHotListExcel = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load lead details for export');
        return;
      }
      const data = await res.json();

      // Apply active dashboard filters
      const filtered = data.filter(lead => {
        // 1. Must be hot category
        const isHotList = lead.leadCategory === 'Hot' && !lead.isClosed;
        if (!isHotList) return false;

        // 2. Project filter
        if (selectedProject && (lead.project?._id || lead.project) !== selectedProject) return false;

        // 3. User/Executive filter
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;

        // 4. Date range filter
        const createdAt = new Date(lead.createdAt);
        if (fromDate && createdAt < new Date(fromDate)) return false;
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (createdAt > end) return false;
        }

        return true;
      });

      if (filtered.length === 0) {
        alert('No hot list records found for the selected filters.');
        return;
      }

      // Generate the styled HTML sheet
      const projectTitle = selectedProject 
        ? (stats.projects.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';
      const titleText = projectTitle 
        ? `JB - ${projectTitle.toUpperCase()} MARKETING HOT LIST`
        : `JB - MARKETING HOT LIST`;
        
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#F8CBAD", "#E6B8B7", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 7, "#ea580c", logoPath)}
      `;

      // Group leads by assigned executive
      const groupedByExec = {};
      filtered.forEach(lead => {
        const execName = lead.assignedTo?.name || 'UNASSIGNED';
        if (!groupedByExec[execName]) groupedByExec[execName] = [];
        groupedByExec[execName].push(lead);
      });

      let globalSNo = 1;

      Object.keys(groupedByExec).forEach(execName => {
        // Executive banner row
        html += `
          <tr>
            <td colspan="7" class="exec-banner">${execName.toUpperCase()}</td>
          </tr>
          <!-- Table Headers -->
          <tr class="table-headers">
            <th>S.No</th>
            <th>Customer Name</th>
            <th>Contact Number</th>
            <th>Followup By</th>
            <th>Last Called Date</th>
            <th>Follow up Date</th>
            <th>Remarks</th>
          </tr>
        `;

        // Lead rows
        groupedByExec[execName].forEach((lead, idx) => {
          const nameStr = lead.name || '';
          const phoneStr = lead.phone || '';
          const followBy = execName;
          
          // Last Called Date: either lead.updatedAt or latest follow-up date
          const lastCalledStr = lead.updatedAt 
            ? new Date(lead.updatedAt).toLocaleDateString('en-GB').replace(/\//g, '.') 
            : new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.');
            
          const followUpDateStr = lead.followUpInfo?.nextFollowUpDate 
            ? new Date(lead.followUpInfo.nextFollowUpDate).toLocaleDateString('en-GB').replace(/\//g, '.') 
            : '';
            
          const remarksStr = lead.followUpInfo?.remarks || lead.closeRemarks || '';
          const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';

          html += `
            <tr ${rowClass}>
              <td>${globalSNo++}</td>
              <td class="text-left bold-label">${nameStr}</td>
              <td>${phoneStr}</td>
              <td>${followBy}</td>
              <td>${lastCalledStr}</td>
              <td>${followUpDateStr}</td>
              <td class="text-left">${remarksStr}</td>
            </tr>
          `;
        });
      });

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileCode = projectTitle ? projectTitle : 'ALL_PROJECTS';
      a.download = `JB_${fileCode}_HOT_LIST_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting hot list report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBookingsExcel = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load lead details for export');
        return;
      }
      const data = await res.json();

      // Apply active dashboard filters
      const filtered = data.filter(lead => {
        // 1. Must be booking stage (Booking or Won)
        const isBooking = lead.status === 'Booking' || lead.status === 'Won';
        if (!isBooking) return false;

        // 2. Project filter
        if (selectedProject && (lead.project?._id || lead.project) !== selectedProject) return false;

        // 3. User/Executive filter
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;

        // 4. Date range filter
        const createdAt = new Date(lead.createdAt);
        if (fromDate && createdAt < new Date(fromDate)) return false;
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (createdAt > end) return false;
        }

        return true;
      });

      if (filtered.length === 0) {
        alert('No booking records found for the selected filters.');
        return;
      }

      // Generate the styled HTML sheet
      const projectTitle = selectedProject 
        ? (stats.projects.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';
      const titleText = projectTitle 
        ? `JB - ${projectTitle.toUpperCase()} UNIT BOOKING DETAILS`
        : `JB - UNIT BOOKING DETAILS`;
        
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#92D050", "#C6E0B4", "#92D050", "#C6E0B4")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 8, "#15803d", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S.NO.</th>
              <th>BOOKING DATE</th>
              <th>CUSTOMER NAME</th>
              <th>CONTACT NO.</th>
              <th>Attended by</th>
              <th>PROJECT</th>
              <th>UNIT NO.</th>
              <th>UNIT VALUE</th>
            </tr>
      `;

      // Lead rows sequentially without exec banner groupings
      filtered.forEach((lead, index) => {
        const bDate = lead.bookingInfo?.bookingDate 
          ? new Date(lead.bookingInfo.bookingDate) 
          : new Date(lead.createdAt);
          
        const dateStr = bDate.toLocaleDateString('en-GB').replace(/\//g, '.');
        const custName = lead.name || '';
        const phoneStr = lead.phone || '';
        const attendedBy = lead.assignedTo?.name || 'UNASSIGNED';
        const projectStr = lead.project?.code || '';
        const unitNo = lead.bookingInfo?.selectedUnits?.join(', ') || '';
        const unitValStr = lead.leadCost ? lead.leadCost.toLocaleString() : '0';
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${dateStr}</td>
            <td class="text-left bold-label">${custName}</td>
            <td>${phoneStr}</td>
            <td>${attendedBy}</td>
            <td>${projectStr}</td>
            <td>${unitNo}</td>
            <td class="text-right">${unitValStr}</td>
          </tr>
        `;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileCode = projectTitle ? projectTitle : 'ALL_PROJECTS';
      a.download = `JB_${fileCode}_UNIT_BOOKING_DETAILS_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting bookings report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSummaryReport = async () => {
    try {
      setLoading(true);
      const activeMonthStr = fromDate.substring(0, 7);

      // Fetch all required data points in parallel for the active month
      const [targetsRes, statsRes, pStatsRes, mStatsRes] = await Promise.all([
        fetch(`${API_URL}/summary-plans/${activeMonthStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/quotations/summary-stats/${activeMonthStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/summary-plans/project-stats/${activeMonthStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/summary-plans/marketing-stats/${activeMonthStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!targetsRes.ok || !statsRes.ok || !pStatsRes.ok || !mStatsRes.ok) {
        alert('Failed to load summary stats for export');
        return;
      }

      const targetData = await targetsRes.json();
      const statsData = await statsRes.json();
      const projectStatsData = await pStatsRes.json();
      const marketingStatsData = await mStatsRes.json();

      // Parse states matching SummaryPlanning.jsx logic
      const sTarget = targetData.salesTarget || 0;
      const hTarget = targetData.villasTarget || targetData.housesTarget || 0;
      const pTarget = targetData.plotsTarget || 0;

      const currentAchieved = {
        salesValue: statsData.current?.salesValue || 0,
        villasCount: statsData.current?.villasCount || statsData.current?.housesCount || 0,
        plotsCount: statsData.current?.plotsCount || 0
      };
      const lastMonthAchieved = {
        salesValue: statsData.lastMonth?.salesValue || 0,
        villasCount: statsData.lastMonth?.villasCount || statsData.lastMonth?.housesCount || 0,
        plotsCount: statsData.lastMonth?.plotsCount || 0
      };

      // Project wise targets map
      const projectTargetsMap = {};
      Object.keys(projectStatsData).forEach(projId => {
        projectTargetsMap[projId] = { enquiries: 0, hotlist: 0, sitevisits: 0, booked: 0, value: 0 };
      });
      if (targetData.projectTargets) {
        targetData.projectTargets.forEach(pt => {
          projectTargetsMap[pt.projectId] = {
            enquiries: pt.enquiriesTarget || 0,
            hotlist: pt.hotlistTarget || 0,
            sitevisits: pt.sitevisitsTarget || 0,
            booked: pt.bookedTarget || 0,
            value: pt.valueTarget || 0
          };
        });
      }

      // Marketing targets map
      const marketingTargetsMap = {};
      Object.keys(marketingStatsData.groups || {}).forEach(name => {
        marketingTargetsMap[name] = 0;
      });
      marketingTargetsMap['LEADS GENERATED'] = 0;
      marketingTargetsMap['SITE VISIT CONVERSIONS'] = 0;

      if (targetData.marketingTargets) {
        targetData.marketingTargets.forEach(mt => {
          marketingTargetsMap[mt.name] = mt.target || 0;
        });
      }

      // Format date headers
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const shortYear = dateForMonth.getFullYear().toString().substring(2);
      const shortMonthHeader = `${monthNames[dateForMonth.getMonth()].substring(0, 3)}-${shortYear}`;
      const todayFormatted = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');

      // Helper to compute percentage text
      const getPct = (act, tgt) => {
        if (!tgt || tgt <= 0) return '0.00%';
        return `${((act / tgt) * 100).toFixed(2)}%`;
      };

      const getPctVal = (act, tgt) => {
        if (!tgt || tgt <= 0) return 0;
        return (act / tgt) * 100;
      };

      // Compile Marketing rows
      const marketingRowsList = [];
      let mSNo = 1;
      Object.keys(marketingStatsData.groups || {}).forEach(name => {
        const statsObj = marketingStatsData.groups[name];
        const targetVal = marketingTargetsMap[name] || 0;
        marketingRowsList.push({
          sNo: mSNo++,
          name: name,
          target: targetVal,
          actual: statsObj.actual,
          w1: statsObj.w1,
          w2: statsObj.w2,
          w3: statsObj.w3,
          w4: statsObj.w4,
          isFloat: true
        });
      });

      const lgTarget = marketingTargetsMap['LEADS GENERATED'] || 0;
      const lgStats = marketingStatsData.static?.leadsGenerated || { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 };
      marketingRowsList.push({
        sNo: mSNo++,
        name: 'LEADS GENERATED',
        target: lgTarget,
        actual: lgStats.actual,
        w1: lgStats.w1,
        w2: lgStats.w2,
        w3: lgStats.w3,
        w4: lgStats.w4,
        isFloat: false
      });

      const svcTarget = marketingTargetsMap['SITE VISIT CONVERSIONS'] || 0;
      const svcStats = marketingStatsData.static?.conversions || { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 };
      marketingRowsList.push({
        sNo: mSNo++,
        name: 'SITE VISIT CONVERSIONS',
        target: svcTarget,
        actual: svcStats.actual,
        w1: svcStats.w1,
        w2: svcStats.w2,
        w3: svcStats.w3,
        w4: svcStats.w4,
        isFloat: false
      });

      let mTotalPct = 0;
      marketingRowsList.forEach(r => {
        if (r.target && r.target > 0) mTotalPct += (r.actual / r.target) * 100;
      });
      const marketingPerformanceText = `${(mTotalPct / marketingRowsList.length).toFixed(2)}%`;
      const projKeys = Object.keys(projectStatsData);
      const firstProjId = projKeys[0];
      const firstProj = projectStatsData[firstProjId];
      const projCode = firstProj ? (firstProj.code || firstProj.name || 'JMD') : 'JMD';

      // Build HTML Template
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#002060", "#d9e1f2", "#002060", "#b4c6e7")}
        </head>
        <body>
          <table>
            <thead>
              <tr style="height: 80px;">
                <td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: center; vertical-align: middle;">
                  <img src="${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" />
                  SALES PARAMETER REPORT
                </td>
              </tr>
              <tr>
                <th class="bg-header-green" style="width: 50px;">S.No</th>
                <th class="bg-header-green" style="width: 250px;">TOTAL SALES PROJECTION ${dateForMonth.getFullYear() - 1} - ${dateForMonth.getFullYear().toString().substring(2)}</th>
                <th class="bg-header-green" style="width: 180px;">TOTAL</th>
                <th class="bg-header-green" style="width: 80px;">UNIT</th>
                <th class="bg-header-green" style="width: 100px;">ACHIEVED</th>
                <th class="bg-header-green" style="width: 100px;">BALANCE</th>
                <th class="bg-header-green" style="width: 130px;">LAST MONTH ACHIEVED</th>
                <th colspan="3" rowspan="3" class="bg-header-green font-bold" style="font-size: 11pt; vertical-align: middle; text-align: center;">
                  ${shortMonthHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td class="text-left font-bold">Overall Sales Target</td>
                <td class="text-right font-bold">${sTarget}</td>
                <td>Crores</td>
                <td class="text-right">${currentAchieved.salesValue.toFixed(2)}</td>
                <td class="text-right">${Math.max(0, sTarget - currentAchieved.salesValue).toFixed(2)}</td>
                <td class="text-right">${lastMonthAchieved.salesValue.toFixed(2)}</td>
              </tr>
              <tr>
                <td>2</td>
                <td class="text-left font-bold">Total Houses to be Sold</td>
                <td class="text-right font-bold">${hTarget}</td>
                <td>Units</td>
                <td class="text-right">${currentAchieved.villasCount}</td>
                <td class="text-right">${Math.max(0, hTarget - currentAchieved.villasCount)}</td>
                <td class="text-right">${lastMonthAchieved.villasCount}</td>
              </tr>
              <tr>
                <td>3</td>
                <td class="text-left font-bold">Total Plots to be Sold</td>
                <td class="text-right font-bold">${pTarget}</td>
                <td>Units</td>
                <td class="text-right">${currentAchieved.plotsCount}</td>
                <td class="text-right">${Math.max(0, pTarget - currentAchieved.plotsCount)}</td>
                <td class="text-right">${lastMonthAchieved.plotsCount}</td>
                <td colspan="2" class="font-bold bg-header-green" style="font-size: 10pt;">DATE:</td>
                <td class="bg-header-green" style="font-size: 10pt;">${todayFormatted}</td>
              </tr>

              <!-- Spacing row -->
              <tr><td colspan="10" style="border: none; height: 15px;"></td></tr>

              <!-- PHASE 2: Project wise Report Headers -->
              <tr>
                <th class="bg-header-blue">S.NO.</th>
                <th class="bg-header-blue">PROJECT</th>
                <th class="bg-header-blue">DESCRIPTION</th>
                <th class="bg-header-blue">TARGET</th>
                <th class="bg-header-blue">ACTUAL</th>
                <th class="bg-header-blue">% ACHIEVED</th>
                <th class="bg-header-blue">1st Week Actual</th>
                <th class="bg-header-blue">2nd Week Actual</th>
                <th class="bg-header-blue">3rd Week Actual</th>
                <th class="bg-header-blue">4th Week Actual</th>
              </tr>
      `;

      // Aggregate Phase 2 percentage counters
      let pTotalPct = 0;
      let pTotalRows = 0;

      // Render Phase 2 rows grouped by project
      projKeys.forEach((projId, index) => {
        const proj = projectStatsData[projId];
        const targets = projectTargetsMap[projId] || { enquiries: 0, hotlist: 0, sitevisits: 0, booked: 0, value: 0 };

        const rows = [
          { label: 'Total Enquiries', target: targets.enquiries, actual: proj.enquiries.actual, w1: proj.enquiries.w1, w2: proj.enquiries.w2, w3: proj.enquiries.w3, w4: proj.enquiries.w4 },
          { label: 'Site Visits', target: proj.sitevisits.target || targets.sitevisits, actual: proj.sitevisits.actual, w1: proj.sitevisits.w1, w2: proj.sitevisits.w2, w3: proj.sitevisits.w3, w4: proj.sitevisits.w4 },
          { label: 'Booked Units', target: targets.booked, actual: proj.bookedUnits.actual, w1: proj.bookedUnits.w1, w2: proj.bookedUnits.w2, w3: proj.bookedUnits.w3, w4: proj.bookedUnits.w4 },
          { label: 'Booking Value', target: targets.value, actual: proj.bookingValue.actual, w1: proj.bookingValue.w1, w2: proj.bookingValue.w2, w3: proj.bookingValue.w3, w4: proj.bookingValue.w4, isFloat: true }
        ];

        rows.forEach((row, rIdx) => {
          const pctText = getPct(row.actual, row.target);
          pTotalPct += getPctVal(row.actual, row.target);
          pTotalRows += 1;

          html += `
            <tr>
              ${rIdx === 0 ? `<td rowspan="4" style="vertical-align: middle;">${index + 1}</td><td rowspan="4" class="font-bold" style="vertical-align: middle;">${proj.code || proj.name}</td>` : ''}
              <td class="text-left">${row.label}</td>
              <td class="text-right">${row.target}${row.isFloat ? ' Cr' : ''}</td>
              <td class="text-right">${row.isFloat ? row.actual.toFixed(2) : row.actual}</td>
              <td class="font-bold">${pctText}</td>
              <td class="text-right">${row.isFloat ? row.w1.toFixed(2) : row.w1}</td>
              <td class="text-right">${row.isFloat ? row.w2.toFixed(2) : row.w2}</td>
              <td class="text-right">${row.isFloat ? row.w3.toFixed(2) : row.w3}</td>
              <td class="text-right">${row.isFloat ? row.w4.toFixed(2) : row.w4}</td>
            </tr>
          `;
        });
      });

      const projectPerformanceText = pTotalRows > 0 ? `${(pTotalPct / pTotalRows).toFixed(2)}%` : '0.00%';

      html += `
            <!-- Phase 2 Overall Average achieved -->
            <tr>
              <td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td>
              <td class="bg-orange-pct" style="font-size: 10pt; font-weight: bold; border: 1px solid #000000; text-align: center; vertical-align: middle;">${projectPerformanceText}</td>
              <td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td>
            </tr>

            <!-- Spacing row -->
            <tr><td colspan="10" style="border: none; height: 15px;"></td></tr>

            <!-- PHASE 3: Marketing Plan Table -->
            <tr style="height: 80px;">
              <td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: center; vertical-align: middle;">
                <img src="${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" />
                JB MARKETING PARAMETER REPORT
              </td>
            </tr>
            <tr style="height: 22px;">
              <td colspan="10" class="bg-header-green font-bold" style="font-size: 10pt; height: 22px; text-align: center; vertical-align: middle; text-transform: uppercase;">MONTH OF ${monthNames[dateForMonth.getMonth()].toUpperCase()} ${dateForMonth.getFullYear()}</td>
            </tr>
            <tr>
              <th class="bg-header-blue">S.NO.</th>
              <th colspan="2" class="bg-header-blue">DESCRIPTION</th>
              <th class="bg-header-blue">BUDGET/ TARGET</th>
              <th class="bg-header-blue">ACTUAL</th>
              <th class="bg-header-blue">% ACHIEVED</th>
              <th class="bg-header-blue">1st Week Actual</th>
              <th class="bg-header-blue">2nd Week Actual</th>
              <th class="bg-header-blue">3rd Week Actual</th>
              <th class="bg-header-blue">4th Week Actual</th>
            </tr>
      `;

      marketingRowsList.forEach((row) => {
        const pctText = getPct(row.actual, row.target);
        html += `
          <tr>
            <td>${row.sNo}</td>
            <td colspan="2" class="text-left font-bold">${row.name}</td>
            <td class="text-right">${row.isFloat ? '₹ ' : ''}${row.target.toLocaleString()}</td>
            <td class="text-right">${row.isFloat ? '₹ ' : ''}${row.isFloat ? row.actual.toFixed(2) : row.actual}</td>
            <td class="font-bold">${pctText}</td>
            <td class="text-right">${row.isFloat ? '₹ ' : ''}${row.isFloat ? row.w1.toFixed(2) : row.w1}</td>
            <td class="text-right">${row.isFloat ? '₹ ' : ''}${row.isFloat ? row.w2.toFixed(2) : row.w2}</td>
            <td class="text-right">${row.isFloat ? '₹ ' : ''}${row.isFloat ? row.w3.toFixed(2) : row.w3}</td>
            <td class="text-right">${row.isFloat ? '₹ ' : ''}${row.isFloat ? row.w4.toFixed(2) : row.w4}</td>
          </tr>
        `;
      });

      html += `
            <tr>
              <td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td>
              <td class="bg-orange-pct" style="font-size: 10pt; font-weight: bold; border: 1px solid #000000; text-align: center; vertical-align: middle;">${marketingPerformanceText}</td>
              <td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td>
            </tr>
          </tbody>
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JB_SUMMARY_OF_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting summary report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarketingReport = async () => {
    try {
      setLoading(true);
      
      const groupData = stats.groupStats || {};

      if (Object.keys(groupData).length === 0) {
        alert('No marketing spend data found for the selected filters.');
        return;
      }

      // Generate the styled HTML sheet
      const projectTitle = selectedProject 
        ? (stats.projects.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';
      const titleText = projectTitle 
        ? `JB - ${projectTitle.toUpperCase()} MARKETING PERFORMANCE REPORT`
        : `JB - MARKETING PERFORMANCE REPORT`;
        
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 7, "#1d4ed8", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S.No</th>
              <th>Lead Source Group</th>
              <th>Source Type</th>
              <th>Planned Budget</th>
              <th>Actual Spent</th>
              <th>% Spent vs Budget</th>
              <th>Turnover Value (Revenue)</th>
            </tr>
      `;

      let globalSNo = 1;
      let totalBudget = 0;
      let totalSpent = 0;
      let totalRevenue = 0;

      Object.keys(groupData).forEach(groupName => {
        const groupObj = groupData[groupName];
        const sourcesList = groupObj.sources || [];

        // Group Header banner row
        html += `
          <tr>
            <td colspan="7" class="group-banner">${groupName.toUpperCase()}</td>
          </tr>
        `;

        // Sources rows
        sourcesList.forEach(src => {
          const budgetVal = src.budget || 0;
          const spentVal = src.spent || 0;
          const revenueVal = src.value || 0;
          const pctSpent = budgetVal > 0 ? `${((spentVal / budgetVal) * 100).toFixed(1)}%` : '0.0%';

          totalBudget += budgetVal;
          totalSpent += spentVal;
          totalRevenue += revenueVal;

          html += `
            <tr>
              <td>${globalSNo++}</td>
              <td class="text-left font-semibold" style="color: #555555;">${groupName}</td>
              <td class="text-left font-bold">${src.source}</td>
              <td class="text-right">₹ ${budgetVal.toLocaleString()}</td>
              <td class="text-right">₹ ${spentVal.toLocaleString()}</td>
              <td>${pctSpent}</td>
              <td class="text-right">₹ ${revenueVal.toLocaleString()}</td>
            </tr>
          `;
        });

        // Group Subtotal Row
        const groupBudget = groupObj.budget || 0;
        const groupSpent = groupObj.spent || 0;
        const groupValue = groupObj.value || 0;
        const groupPct = groupBudget > 0 ? `${((groupSpent / groupBudget) * 100).toFixed(1)}%` : '0.0%';

        html += `
          <tr class="subtotal-row">
            <td></td>
            <td colspan="2" class="text-left">SUBTOTAL: ${groupName.toUpperCase()}</td>
            <td class="text-right">₹ ${groupBudget.toLocaleString()}</td>
            <td class="text-right">₹ ${groupSpent.toLocaleString()}</td>
            <td>${groupPct}</td>
            <td class="text-right">₹ ${groupValue.toLocaleString()}</td>
          </tr>
        `;
      });

      // Global Grand Total Row
      const grandPct = totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0.0%';
      html += `
        <tr class="total-row">
          <td></td>
          <td colspan="2" class="text-left">GRAND TOTAL</td>
          <td class="text-right">₹ ${totalBudget.toLocaleString()}</td>
          <td class="text-right">₹ ${totalSpent.toLocaleString()}</td>
          <td>${grandPct}</td>
          <td class="text-right">₹ ${totalRevenue.toLocaleString()}</td>
        </tr>
      `;

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileCode = projectTitle ? projectTitle : 'ALL_PROJECTS';
      a.download = `JB_${fileCode}_MARKETING_RETURNS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting marketing returns report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLeadSourcesExcel = async () => {
    try {
      setLoading(true);
      
      const activeMonthStr = fromDate.substring(0, 7);

      // Fetch groups, targets and stats for the selected month in parallel
      const [groupsRes, targetsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/lead-groups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/lead-targets/${activeMonthStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/leads/target-stats/${activeMonthStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!groupsRes.ok || !targetsRes.ok || !statsRes.ok) {
        alert('Failed to load lead sources data for export');
        return;
      }

      const activeGroups = await groupsRes.json();
      const targetData = await targetsRes.json();
      const statsData = await statsRes.json();

      // Parse targets
      const targetMap = {};
      activeGroups.forEach(group => {
        group.sources?.forEach(src => {
          targetMap[src] = 0;
        });
      });
      if (targetData && targetData.targets) {
        targetData.targets.forEach(t => {
          targetMap[t.source] = t.target || 0;
        });
      }

      // Parse actual stats
      const actualMap = {};
      const convMap = {};
      statsData.actual?.forEach(item => {
        actualMap[item._id] = item.count || 0;
      });
      statsData.conversions?.forEach(item => {
        convMap[item._id] = item.count || 0;
      });

      // Format date headers
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;

      // Build HTML Template
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader("JB - LEAD SOURCES PERFORMANCE REPORT", monthTitle, 5, "#0d9488", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S.No</th>
              <th>LEAD SOURCE</th>
              <th>TARGET</th>
              <th>ACTUAL</th>
              <th>SITE VISIT CONVERSIONS</th>
            </tr>
      `;

      let globalSNo = 1;
      let totalTarget = 0;
      let totalActual = 0;
      let totalConversions = 0;

      // Iterate through all sources in order
      activeGroups.forEach(group => {
        group.sources?.forEach(src => {
          const targetVal = targetMap[src] || 0;
          const actualVal = actualMap[src] || 0;
          const convVal = convMap[src] || 0;

          totalTarget += targetVal;
          totalActual += actualVal;
          totalConversions += convVal;

          html += `
            <tr>
              <td>${globalSNo++}</td>
              <td class="text-left font-bold" style="text-transform: capitalize;">${src}</td>
              <td>${targetVal || ''}</td>
              <td>${actualVal || ''}</td>
              <td>${convVal || ''}</td>
            </tr>
          `;
        });
      });

      // Render Total row
      html += `
        <tr class="total-row">
          <td colspan="2">TOTAL</td>
          <td>${totalTarget}</td>
          <td>${totalActual}</td>
          <td>${totalConversions}</td>
        </tr>
      `;

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JB_LEAD_SOURCES_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting lead sources report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportRegistrationReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load CRD flows details for export');
        return;
      }
      const data = await res.json();

      // Apply active dashboard filters
      const filtered = data.filter(flow => {
        const lead = flow.lead;
        if (!lead) return false;

        // Project filter
        if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return false;

        // User/Executive filter
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;

        // Date range filter
        const createdAt = new Date(flow.createdAt);
        if (fromDate && createdAt < new Date(fromDate)) return false;
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (createdAt > end) return false;
        }

        return true;
      });

      if (filtered.length === 0) {
        alert('No registration records found for the selected filters.');
        return;
      }

      // Generate the styled HTML sheet
      const projectTitle = selectedProject 
        ? (stats.projects.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';
      const titleText = projectTitle 
        ? `${projectTitle.toUpperCase()} REGISTRATION THIS MONTH TARGET`
        : `REGISTRATION THIS MONTH TARGET`;
        
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;

      // Separate Completed Registration (Agreement Stage) and Pending Registration
      const registeredFlows = [];
      const pendingFlows = [];

      filtered.forEach(flow => {
        const stages = flow.stages || [];
        const agreementStage = stages.find(s => s.name.toLowerCase().includes('agreement')) || (stages.length > 1 ? stages[1] : null);
        
        let isRegistered = false;
        if (agreementStage) {
          const stageTotal = agreementStage.amount || 0;
          const stagePaid = agreementStage.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
          if (agreementStage.isCompleted || (stageTotal > 0 && stagePaid >= stageTotal)) {
            isRegistered = true;
          }
        }
        
        if (isRegistered) {
          registeredFlows.push(flow);
        } else {
          pendingFlows.push(flow);
        }
      });

      // Group Registered leads by Project Code
      const groupedRegistered = {};
      registeredFlows.forEach(flow => {
        const projCode = flow.project?.code || 'UNASSIGNED';
        if (!groupedRegistered[projCode]) groupedRegistered[projCode] = [];
        groupedRegistered[projCode].push(flow);
      });

      // Group Pending leads by Project Code
      const groupedPending = {};
      pendingFlows.forEach(flow => {
        const projCode = flow.project?.code || 'UNASSIGNED';
        if (!groupedPending[projCode]) groupedPending[projCode] = [];
        groupedPending[projCode].push(flow);
      });

      // Helper function to build rows for a given grouped structure
      const buildRowsHtml = (groupedData) => {
        let rowsHtml = '';
        let localSNo = 1;

        Object.keys(groupedData).forEach(projCode => {
          // Project group banner row
          rowsHtml += `
            <tr>
              <td colspan="7" class="group-banner">${projCode.toUpperCase()}</td>
            </tr>
          `;

          // Lead rows
          groupedData[projCode].forEach((flow, idx) => {
            const lead = flow.lead || {};
            const advDate = lead.bookingInfo?.bookingDate 
              ? new Date(lead.bookingInfo.bookingDate).toLocaleDateString('en-GB').replace(/\//g, '.')
              : '';
              
            const plotNo = flow.unitId || lead.bookingInfo?.selectedUnits?.join(' & ') || '';
            const custName = lead.name || '';
            
            // Mapping projectType to Plots/Villa/Flat
            const typeRaw = (flow.project?.projectType || '').toLowerCase();
            let houseType = 'Plots';
            if (typeRaw.includes('villa') || typeRaw.includes('house') || typeRaw.includes('individual')) {
              houseType = 'Villa';
            } else if (typeRaw.includes('apartment') || typeRaw.includes('flat')) {
              houseType = 'Flat';
            }

            const commentsStr = lead.closeRemarks || '';
            const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';

            rowsHtml += `
              <tr ${rowClass}>
                <td>${localSNo++}</td>
                <td>${advDate}</td>
                <td>${projCode}</td>
                <td>${plotNo}</td>
                <td class="text-left bold-label">${custName}</td>
                <td>${houseType}</td>
                <td class="text-left">${commentsStr}</td>
              </tr>
            `;
          });
        });
        return rowsHtml;
      };

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 7, "#7c3aed", logoPath)}
            
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Adv Date</th>
              <th>Project</th>
              <th>Plot No</th>
              <th>Customer Name</th>
              <th>Project Type</th>
              <th>Comments / Action notes</th>
            </tr>
            
            <!-- REGISTERED STAGE LEADS (REGISTRATION THIS MONTH TARGET) -->
            ${buildRowsHtml(groupedRegistered)}

            <!-- REGISTRATION PENDING HEADER -->
            <tr>
              <td colspan="7" class="section-banner">REGISTRATION PENDING</td>
            </tr>
            <tr class="table-headers">
              <th>S No</th>
              <th>Adv Date</th>
              <th>Project</th>
              <th>Plot No</th>
              <th>Customer Name</th>
              <th>Project Type</th>
              <th>Comments / Action notes</th>
            </tr>

            <!-- PENDING STAGE LEADS (REGISTRATION PENDING) -->
            ${buildRowsHtml(groupedPending)}
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileCode = projectTitle ? projectTitle : 'ALL_PROJECTS';
      a.download = `JB_${fileCode}_REGISTRATION_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting registration report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportKeyHandoverReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load CRD flows details for export');
        return;
      }
      const data = await res.json();

      // Apply active dashboard filters
      const filtered = data.filter(flow => {
        const lead = flow.lead;
        if (!lead) return false;

        // Project filter
        if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return false;

        // User/Executive filter
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;

        // Date range filter
        const createdAt = new Date(flow.createdAt);
        if (fromDate && createdAt < new Date(fromDate)) return false;
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (createdAt > end) return false;
        }

        return true;
      });

      if (filtered.length === 0) {
        alert('No CRD Flow records found for the selected filters.');
        return;
      }

      // Separate completed handover flows and pending handover flows
      // Handover is completed if the stage containing "Handing Over" or the last stage isCompleted === true.
      const completedFlows = [];
      const pendingFlows = [];

      filtered.forEach(flow => {
        const stages = flow.stages || [];
        const handoverStage = stages.find(s => s.name.toLowerCase().includes('handing over') || s.name.toLowerCase().includes('handover')) || stages[stages.length - 1];
        
        if (handoverStage && handoverStage.isCompleted) {
          completedFlows.push(flow);
        } else {
          pendingFlows.push(flow);
        }
      });

      const projectTitle = selectedProject 
        ? (stats.projects.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';

      // Format date headers
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader("KEY HANDOVER THIS MONTH TARGET", monthTitle, 6, "#7c3aed", logoPath)}
            <tr class="table-headers">
              <th>S No</th>
              <th>Adv Date</th>
              <th>Project</th>
              <th>Plot No</th>
              <th>Customer Name</th>
              <th>Villa Status</th>
            </tr>
      `;

      // Render Completed Handover rows
      completedFlows.forEach((flow, index) => {
        const lead = flow.lead || {};
        const advDate = lead.bookingInfo?.bookingDate 
          ? new Date(lead.bookingInfo.bookingDate).toLocaleDateString('en-GB').replace(/\//g, '.')
          : '';
        const projCode = flow.project?.code || 'UNASSIGNED';
        const plotNo = flow.unitId || '';
        const custName = lead.name || '';
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';
        
        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${advDate}</td>
            <td>${projCode}</td>
            <td>${plotNo}</td>
            <td class="text-left bold-label">${custName}</td>
            <td>Completed</td>
          </tr>
        `;
      });

      // Render Key Handover Pending Header
      html += `
        <tr>
          <td colspan="6" class="section-banner">Key Handover Pending</td>
        </tr>
        <tr class="table-headers">
          <th>SI No</th>
          <th>Adv Date</th>
          <th>Project code</th>
          <th>Plot No</th>
          <th>Name</th>
          <th>Villa Status</th>
        </tr>
      `;

      // Render Pending Handover rows
      pendingFlows.forEach((flow, index) => {
        const lead = flow.lead || {};
        const advDate = lead.bookingInfo?.bookingDate 
          ? new Date(lead.bookingInfo.bookingDate).toLocaleDateString('en-GB').replace(/\//g, '.')
          : '';
        const projCode = flow.project?.code || 'UNASSIGNED';
        const plotNo = flow.unitId || '';
        const custName = lead.name || '';
        
        // Property type (House/Villa -> Villa, Flat/Apartment -> Flat, Land/Plot -> Land)
        const typeRaw = (flow.project?.projectType || '').toLowerCase();
        let houseStatus = 'Villa';
        if (typeRaw.includes('villa') || typeRaw.includes('house') || typeRaw.includes('individual')) {
          houseStatus = 'Villa';
        } else if (typeRaw.includes('apartment') || typeRaw.includes('flat')) {
          houseStatus = 'Flat';
        } else {
          houseStatus = 'Land';
        }
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${advDate}</td>
            <td>${projCode}</td>
            <td>${plotNo}</td>
            <td class="text-left bold-label">${custName}</td>
            <td>${houseStatus}</td>
          </tr>
        `;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileCode = projectTitle ? projectTitle : 'ALL_PROJECTS';
      a.download = `JB_${fileCode}_KEY_HANDOVER_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting key handover report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCollectionReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load CRD flows details for export');
        return;
      }
      const data = await res.json();

      // Collect all payments across all flows
      const paymentsList = [];

      data.forEach(flow => {
        const lead = flow.lead;
        if (!lead) return;

        // Apply filters at flow level
        if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return;
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return;

        const stages = flow.stages || [];
        let leadTotalPaidAllTime = 0;
        const dailyPayments = {};

        stages.forEach(stage => {
          const payments = stage.payments || [];
          payments.forEach(pay => {
            leadTotalPaidAllTime += (pay.amount || 0);

            const payDate = new Date(pay.date);

            // Apply date filters at payment date level
            if (fromDate && payDate < new Date(fromDate)) return;
            if (toDate) {
              const end = new Date(toDate);
              end.setHours(23, 59, 59, 999);
              if (payDate > end) return;
            }

            const dateStr = payDate.toDateString();
            if (!dailyPayments[dateStr]) {
              dailyPayments[dateStr] = {
                date: payDate,
                amount: 0
              };
            }
            dailyPayments[dateStr].amount += (pay.amount || 0);
          });
        });

        const totalValue = flow.totalCurrentValue || 0;
        const pendingValue = totalValue - leadTotalPaidAllTime;

        Object.values(dailyPayments).forEach(group => {
          paymentsList.push({
            customerName: lead.name || '',
            projectCode: flow.project?.code || 'UNASSIGNED',
            plotNo: flow.unitId || '',
            date: group.date,
            totalAmount: totalValue,
            pendingAmount: pendingValue,
            amount: group.amount
          });
        });
      });

      if (paymentsList.length === 0) {
        alert('No collections found for the selected filters.');
        return;
      }

      // Sort payments by date ascending
      paymentsList.sort((a, b) => a.date - b.date);

      // Generate the styled HTML sheet
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthName = monthNames[dateForMonth.getMonth()];
      const titleText = `COLLECTION REPORT - ${monthName}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            <col width="60" />
            <col width="120" />
            <col width="250" />
            <col width="150" />
            <col width="100" />
            <col width="180" />
            <col width="180" />
            <col width="180" />
            ${getExcelHeader(titleText, "", 8, "#7c3aed", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Project</th>
              <th>Unit</th>
              <th>Total Amount</th>
              <th>Pending Amount</th>
              <th>Received Amount</th>
            </tr>
      `;

      let totalAmount = 0;

      paymentsList.forEach((pay, index) => {
        const dateStr = pay.date.toLocaleDateString('en-GB').replace(/\//g, '.');
        totalAmount += pay.amount;
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td class="text-center">${index + 1}</td>
            <td class="text-center">${dateStr}</td>
            <td class="text-left bold-label">${pay.customerName}</td>
            <td class="text-center">${pay.projectCode}</td>
            <td class="text-center">${pay.plotNo}</td>
            <td class="text-right">₹ ${pay.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">₹ ${pay.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">₹ ${pay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      });

      // Total Row
      html += `
        <tr class="subtotal-row">
          <td colspan="7" class="text-right">TOTAL</td>
          <td class="text-right">₹ ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JB_COLLECTION_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting collection report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBankLoanReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load CRD flows details for export');
        return;
      }
      const data = await res.json();

      const loanList = [];

      data.forEach(flow => {
        const lead = flow.lead;
        if (!lead) return;

        // Apply filters
        if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return;
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return;

        const stages = flow.stages || [];
        stages.forEach(stage => {
          const payments = stage.payments || [];
          payments.forEach(pay => {
            if (pay.method !== 'Bank Loan') return;

            const payDate = new Date(pay.date);

            // Apply date filters at payment date level
            if (fromDate && payDate < new Date(fromDate)) return;
            if (toDate) {
              const end = new Date(toDate);
              end.setHours(23, 59, 59, 999);
              if (payDate > end) return;
            }

            loanList.push({
              customerName: lead.name || '',
              projectCode: flow.project?.code || 'UNASSIGNED',
              plotNo: flow.unitId || '',
              stageName: stage.name || '',
              bankName: pay.details?.preferredBank || pay.details?.bankName || 'UNSPECIFIED',
              amount: pay.amount || 0,
              date: payDate
            });
          });
        });
      });

      if (loanList.length === 0) {
        alert('No bank loan collection records found for the selected filters.');
        return;
      }

      // Sort by date ascending
      loanList.sort((a, b) => a.date - b.date);

      // Generate the styled HTML sheet
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const titleText = `BANK LOAN CUSTOMERS REPORT - ${monthNames[dateForMonth.getMonth()]} ${dateForMonth.getFullYear()}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 8, "#7c3aed", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Customer Name</th>
              <th>PROJECT</th>
              <th>PLOT NO</th>
              <th>Payment Stage</th>
              <th>Bank Name</th>
              <th>Loan Value</th>
              <th>Date</th>
            </tr>
      `;

      let totalLoan = 0;

      loanList.forEach((loan, index) => {
        const dateStr = loan.date.toLocaleDateString('en-GB').replace(/\//g, '.');
        totalLoan += loan.amount;
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td class="text-left bold-label">${loan.customerName}</td>
            <td>${loan.projectCode}</td>
            <td>${loan.plotNo}</td>
            <td class="text-left">${loan.stageName}</td>
            <td>${loan.bankName}</td>
            <td class="text-right">₹ ${loan.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${dateStr}</td>
          </tr>
        `;
      });

      // Total Row
      html += `
        <tr class="subtotal-row">
          <td colspan="6" class="text-right">TOTAL LOAN RECEIVED</td>
          <td class="text-right">₹ ${totalLoan.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td></td>
        </tr>
      `;

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JB_BANK_LOAN_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting bank loan report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExtraWorksReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load CRD flows details for export');
        return;
      }
      const data = await res.json();

      const extraWorksList = [];

      data.forEach(flow => {
        const lead = flow.lead;
        if (!lead) return;

        // Apply active dashboard filters
        if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return;
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return;

        const stages = flow.stages || [];
        stages.forEach(stage => {
          const extras = stage.extraWorks || [];
          extras.forEach(ew => {
            const addedDate = new Date(ew.addedAt || flow.createdAt);

            // Apply date filters at extra work added date level
            if (fromDate && addedDate < new Date(fromDate)) return;
            if (toDate) {
              const end = new Date(toDate);
              end.setHours(23, 59, 59, 999);
              if (addedDate > end) return;
            }

            extraWorksList.push({
              projectCode: flow.project?.code || 'UNASSIGNED',
              projectType: flow.project?.projectType || 'Land',
              customerName: lead.name || '',
              contactNumber: lead.phone || '',
              extraWorkName: ew.name || '',
              value: ew.amount || 0,
              status: stage.isCompleted ? 'Completed' : 'Pending',
              addedAt: addedDate
            });
          });
        });
      });

      if (extraWorksList.length === 0) {
        alert('No extra works records found for the selected filters.');
        return;
      }

      // Sort by date ascending
      extraWorksList.sort((a, b) => a.addedAt - b.addedAt);

      // Generate the styled HTML sheet
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const titleText = `EXTRA WORKS REPORT - ${monthNames[dateForMonth.getMonth()]} ${dateForMonth.getFullYear()}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 7, "#7c3aed", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Project Type</th>
              <th>Customer Name</th>
              <th>Contact Number</th>
              <th>Extra Work</th>
              <th>Value of Work</th>
              <th>Status</th>
            </tr>
      `;

      let totalValue = 0;

      extraWorksList.forEach((ew, index) => {
        totalValue += ew.value;
        const phoneStr = ew.contactNumber ? `'${ew.contactNumber}` : '';
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${ew.projectType} (${ew.projectCode})</td>
            <td class="text-left bold-label">${ew.customerName}</td>
            <td>${phoneStr}</td>
            <td class="text-left">${ew.extraWorkName}</td>
            <td class="text-right">₹ ${ew.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="font-weight: bold; color: ${ew.status === 'Completed' ? '#16a34a' : '#ea580c'}">${ew.status}</td>
          </tr>
        `;
      });

      // Total Row
      html += `
        <tr class="subtotal-row">
          <td colspan="5" class="text-right">TOTAL VALUE OF EXTRA WORKS</td>
          <td class="text-right">₹ ${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td></td>
        </tr>
      `;

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JB_EXTRA_WORKS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting extra works report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportComplaintsReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load CRD flows details for export');
        return;
      }
      const data = await res.json();

      const complaintsList = [];

      data.forEach(flow => {
        const lead = flow.lead;
        if (!lead) return;

        // Apply active dashboard filters
        if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return;
        if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return;

        const complaints = flow.complaints || [];
        complaints.forEach(comp => {
          const compDate = new Date(comp.reportedAt);

          // Apply date filters at complaint reported date level
          if (fromDate && compDate < new Date(fromDate)) return;
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (compDate > end) return;
          }

          complaintsList.push({
            reportedDate: compDate,
            customerName: lead.name || '',
            projectType: flow.project?.projectType || 'Land',
            projectCode: flow.project?.code || 'UNASSIGNED',
            unitId: flow.unitId || '',
            description: comp.description || '',
            status: comp.status || 'Pending'
          });
        });
      });

      if (complaintsList.length === 0) {
        alert('No complaints found matching the active filters to export.');
        return;
      }

      // Sort by reported date ascending
      complaintsList.sort((a, b) => a.reportedDate - b.reportedDate);

      // Generate styled HTML sheet
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const titleText = `CUSTOMER COMPLAINTS REPORT - ${monthNames[dateForMonth.getMonth()]} ${dateForMonth.getFullYear()}`;

      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 7, "#7c3aed", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Reported Date</th>
              <th>Customer Name</th>
              <th>Project Type</th>
              <th>Unit / Flat / Plot No</th>
              <th>Complaint</th>
              <th>Status</th>
            </tr>
      `;

      complaintsList.forEach((comp, index) => {
        const dateStr = comp.reportedDate.toLocaleDateString('en-GB').replace(/\//g, '.');
        let statusColor = '#ea580c'; // Orange
        if (comp.status === 'Resolved') statusColor = '#16a34a'; // Green
        else if (comp.status === 'In Progress') statusColor = '#2563eb'; // Blue
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${dateStr}</td>
            <td class="text-left bold-label">${comp.customerName}</td>
            <td>${comp.projectType} (${comp.projectCode})</td>
            <td>${comp.unitId}</td>
            <td class="text-left">${comp.description}</td>
            <td style="font-weight: bold; color: ${statusColor};">${comp.status}</td>
          </tr>
        `;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JB_COMPLAINTS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting customer complaints report');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (monthVal) => {
    if (!monthVal) return;
    const [yearStr, monthStr] = monthVal.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDayVal = new Date(year, month, 0).getDate();
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayVal).padStart(2, '0')}`;
    setFromDate(firstDay);
    setToDate(lastDay);
  };
  const filteredSourceStats = Object.entries(stats.sourceStats || {}).reduce((acc, [src, data]) => {
    if (selectedSource && src.toLowerCase() !== selectedSource.toLowerCase()) return acc;
    acc[src] = data;
    return acc;
  }, {});

  const overallTotalLeads = Object.values(filteredSourceStats).reduce((sum, d) => sum + (d.count || 0), 0);
  const overallTotalSpent = Object.values(filteredSourceStats).reduce((sum, d) => sum + (d.spent || 0), 0);
  const overallCostPerLead = overallTotalLeads > 0 ? (overallTotalSpent / overallTotalLeads) : 0;

  const getSourcesData = () => {
    const budgetData = [];
    const spentData = [];
    const networthData = [];

    Object.keys(filteredSourceStats).forEach(src => {
      const s = filteredSourceStats[src];
      if (s.budget > 0) budgetData.push({ source: src, budget: s.budget });
      if (s.spent > 0) spentData.push({ source: src, spent: s.spent });
      if (s.value > 0) networthData.push({ source: src, networth: s.value });
    });

    return { budgetData, spentData, networthData };
  };

  const { budgetData, spentData, networthData } = getSourcesData();

  const primaryColors = [
    '#FFD23F', // Pastel Yellow
    '#A4DE3B', // Pastel Lime Green
    '#E882C7', // Pastel Pink
    '#8C9ECB', // Pastel Purple-blue
    '#FF8C61', // Pastel Orange
    '#62C3A5', // Pastel Teal
    '#4DD0E1', // Pastel Cyan
    '#BA68C8', // Pastel Purple
    '#FFD54F', // Pastel Amber
    '#81C784'  // Pastel Light Green
  ];

  return (
    <div className="space-y-8 w-full mx-auto text-left animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 border-b border-black-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-black-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#0e623a]" />
            <span>KPI Insights & Conversions</span>
          </h1>
         
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-black-150 shadow-xs">
          {/* User Select */}
          {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-black-400" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-black-50 border border-black-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-black-700 font-bold"
              >
                <option value="">All Users</option>
                {(stats.users || []).map(u => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Project Select */}
          <div className="flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5 text-black-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-black-50 border border-black-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-black-700 font-bold"
            >
              <option value="">All Projects</option>
              {(stats.projects || []).map(p => (
                <option key={p._id} value={p._id}>{p.code || p.name}</option>
              ))}
            </select>
          </div>

          {/* Source Select */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-black-400" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-black-50 border border-black-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-black-700 font-bold max-w-[150px]"
            >
              <option value="">All Sources</option>
              {SOURCE_TYPES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          <div className="border-l border-black-200 h-5"></div>

          
         

          {/* Date Picker */}
          <div className="flex items-center gap-1 text-xs text-black-500 font-bold">
            <span>Range:</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1.5 text-xs bg-black-50 border border-black-200 rounded-lg focus:outline-none text-black-700 font-bold"
          />
          <span className="text-xs text-black-400 font-bold">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1.5 text-xs bg-black-50 border border-black-200 rounded-lg focus:outline-none text-black-700 font-bold"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-black-400 italic">
          Fetching conversion matrices and chart metrics...
        </div>
      ) : (
        <div className="space-y-8">
          {/* 🟢 TOP ANALYTICAL SUMMARY CARD GRID */}
          {/* 🟢 TOP ANALYTICAL SUMMARY CARD GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Enquiry Spend KPI */}
            <div className="bg-white border border-black-150 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
              <span className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Marketing Investment</span>
              <h3 className="text-2xl font-black text-black-800 mt-1">₹{Math.round(stats.insights?.totalMarketingSpend || 0).toLocaleString()}</h3>
              <div className="mt-3 pt-3 border-t border-black-100 grid grid-cols-2 gap-2 text-left">
                <div>
                  <span className="text-[10px] text-black-400 font-bold uppercase block">Overall Leads</span>
                  <span className="text-sm font-black text-black-700">{overallTotalLeads}</span>
                </div>
                <div>
                  <span className="text-[10px] text-black-400 font-bold uppercase block">Cost Per Lead</span>
                  <span className="text-sm font-black text-[#0e623a]">₹{Math.round(overallCostPerLead).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Cost Per Enquiry */}
            <div className="bg-white border border-black-150 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
              <span className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Cost Per converted  Lead</span>
              <h3 className="text-2xl font-black text-[#0e623a] mt-1">₹{Math.round(stats.insights?.costPerEnquiry || 0).toLocaleString()}</h3>
        
            </div>

            {/* Booking Stage Conversions */}
            <div className="bg-white border border-black-150 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
              <span className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Total Bookings Count</span>
              <h3 className="text-2xl font-black text-black-800 mt-1">{stats.cards.conversion.count} Converted</h3>
              
            </div>


          </div>

          {/* 🟢 DAILY LEAD COST ANALYSIS ELABORATE TABLE */}
          <div className="bg-white border border-black-150 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black-100 pb-3">
              <h3 className="text-sm font-extrabold text-black-800 uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0e623a]" />
                <span>Daily Lead Cost Analysis Report</span>
              </h3>
              <div className="flex items-center gap-3">
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="px-3 py-2 bg-black-50 border border-black-200 rounded-xl text-xs font-bold text-black-700 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                >
                  <option value="">All Lead Sources</option>
                  {SOURCE_TYPES.map(src => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
                <button
                  onClick={handleExportLeadCostAnalysis}
                  className="px-4 py-2 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition flex items-center gap-2 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
            
            

            <div className="space-y-6 pt-2">
              {Object.keys(filteredSourceStats).length === 0 ? (
                <div className="p-8 text-center text-black-400 italic font-medium border border-dashed rounded-xl">
                  No source stats found for the selected filters.
                </div>
              ) : (
                Object.entries(filteredSourceStats)
                  .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
                  .map(([source, data], index) => {
                  const costPerLead = data.count > 0 ? (data.spent / data.count) : 0;
                  return (
                    <div key={index} className="bg-white border border-black-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                      {/* Row 1: Source, Budget, Spent, Cost per Lead */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5 pb-5 border-b border-black-100">
                        <div>
                          <span className="text-[11px] text-black-400 font-bold uppercase block">Lead Source</span>
                          <h4 className="text-xl font-black text-black-800 uppercase tracking-wider">{source}</h4>
                        </div>
                        <div className="text-center sm:text-left">
                          <span className="text-[11px] text-black-400 font-bold uppercase block">Budget</span>
                          <span className="text-xl font-bold text-black-800">₹{Math.round(data.budget || 0).toLocaleString()}</span>
                        </div>
                        <div className="text-center sm:text-left">
                          <span className="text-[11px] text-black-400 font-bold uppercase block">Spent</span>
                          <span className="text-xl font-bold text-rose-600">₹{Math.round(data.spent || 0).toLocaleString()}</span>
                        </div>
                        <div className="text-center sm:text-left">
                          <span className="text-[11px] text-black-400 font-bold uppercase block">Cost / Lead</span>
                          <span className="text-xl font-black text-[#0e623a]">₹{Math.round(costPerLead).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Row 2: 5 Metric Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-black-50 rounded-xl p-4 border border-black-100 text-center">
                          <span className="text-[11px] font-extrabold text-black-500 uppercase block mb-1">Lead Count</span>
                          <span className="text-2xl font-black text-black-800">{data.count || 0}</span>
                        </div>
                        <div className="bg-black-50 rounded-xl p-4 border border-black-100 text-center">
                          <span className="text-[11px] font-extrabold text-black-500 uppercase block mb-1">Lost Count</span>
                          <span className="text-2xl font-black text-red-500">{data.lost || 0}</span>
                        </div>
                        <div className="bg-black-50 rounded-xl p-4 border border-black-100 text-center">
                          <span className="text-[11px] font-extrabold text-black-500 uppercase block mb-1">Followup Count</span>
                          <span className="text-2xl font-black text-blue-600">{data.enquiries || 0}</span>
                        </div>
                        <div className="bg-black-50 rounded-xl p-4 border border-black-100 text-center">
                          <span className="text-[11px] font-extrabold text-black-500 uppercase block mb-1">Site Visit Count</span>
                          <span className="text-2xl font-black text-purple-600">{data.siteVisits || 0}</span>
                        </div>
                        <div className="bg-black-50 rounded-xl p-4 border border-black-100 text-center">
                          <span className="text-[11px] font-extrabold text-black-500 uppercase block mb-1">Booked Count</span>
                          <span className="text-2xl font-black text-[#0e623a]">{data.booked || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 🟢 COMPARISON PIE CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Budget Allocation Sources */}
            <div className="bg-white border border-black-150 rounded-3xl p-6 shadow-sm space-y-4 text-center">
              <h3 className="text-sm font-extrabold text-black-800 uppercase tracking-wide text-left">
                Budget Allocation Sources
              </h3>
              <ObservedPieChart 
                dataArray={budgetData}
                valueKey="budget"
                labelKey="source"
                colorPalette={primaryColors}
              />
            </div>

            {/* Chart 2: Spent Marketing Sources */}
            <div className="bg-white border border-black-150 rounded-3xl p-6 shadow-sm space-y-4 text-center">
              <h3 className="text-sm font-extrabold text-black-800 uppercase tracking-wide text-left">
                Spent Marketing Sources
              </h3>
              <ObservedPieChart 
                dataArray={spentData}
                valueKey="spent"
                labelKey="source"
                colorPalette={primaryColors}
              />
            </div>

            {/* Chart 3: Incoming Networth Value */}
            <div className="bg-white border border-black-150 rounded-3xl p-6 shadow-sm space-y-4 text-center">
              <h3 className="text-sm font-extrabold text-black-800 uppercase tracking-wide text-left">
                Incoming Networth Value
              </h3>
              <ObservedPieChart 
                dataArray={networthData}
                valueKey="networth"
                labelKey="source"
                colorPalette={primaryColors}
              />
            </div>

          </div>



          {/* 🟢 DETAIL METRICS DATAGRID */}
          <div className="bg-white border border-black-150 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-black-800 uppercase tracking-wide border-b border-black-100 pb-3">
              KPI Conversions Detailed Metrics DataGrid
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black-50 border-b border-black-150 font-bold text-black-500 uppercase tracking-wider text-[11px]">
                    <th className="p-4">METRIC TYPE</th>
                    <th className="p-4 text-center">ENQUIRY COUNT</th>
                    <th className="p-4 text-center">SITE VISIT COUNT</th>
                    <th className="p-4 text-right">CONVERSION RATIO</th>

                  </tr>
                </thead>
                <tbody className="divide-y divide-black-100 font-sans font-semibold text-black-700">
                  <tr className="hover:bg-black-50/50">
                    <td className="p-4 font-bold text-black-900">Enquiries Pipeline Stage</td>
                    <td className="p-4 text-center">{stats.cards.enquiries.total} leads</td>
                    <td className="p-4 text-center">—</td>
                    <td className="p-4 text-right text-black-400">Baseline</td>

                  </tr>
                  <tr className="hover:bg-black-50/50">
                    <td className="p-4 font-bold text-black-900">Site Visits Pipeline Stage</td>
                    <td className="p-4 text-center">—</td>
                    <td className="p-4 text-center">{stats.cards.siteVisits.total} visits</td>
                    <td className="p-4 text-right">{(stats.insights?.siteVisitConversionRate || 0).toFixed(1)}%</td>

                  </tr>
                  <tr className="hover:bg-black-50/50">
                    <td className="p-4 font-bold text-black-900">Booked</td>
                    <td className="p-4 text-center">{stats.cards.conversion.count} leads</td>
                    <td className="p-4 text-center">—</td>
                    <td className="p-4 text-right">{(stats.insights?.bookingConversionRate || 0).toFixed(1)}%</td>

                  </tr>
                 
                </tbody>
              </table>
            </div>
          </div>



        </div>
      )}

      {/* 🔐 MODAL: CPE Source Drilldown Details */}
      {activeCpeDrillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-black-150">
            <div className="bg-[#0e623a] p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Source Drilldown</span>
                <h3 className="text-sm font-black mt-1 uppercase">Campaign Source: {activeCpeDrillDown.source}</h3>
              </div>
              <button 
                onClick={() => setActiveCpeDrillDown(null)}
                className="text-white hover:text-black-200 font-extrabold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-left">
              <div className="flex justify-between items-center bg-black-50 p-3 rounded-xl text-xs font-bold text-black-700">
                <span>Total Enquiries Cost:</span>
                <span className="text-[#0e623a] text-sm font-black">₹ {Math.round(activeCpeDrillDown.leadCost).toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Acquired Enquiries List</span>
                {activeCpeDrillDown.leads?.length === 0 ? (
                  <div className="p-6 bg-black-50 rounded-xl text-center text-xs text-black-400 italic">
                    No individual lead entries recorded for this source.
                  </div>
                ) : (
                  <div className="divide-y divide-black-100 border rounded-2xl overflow-hidden bg-white">
                    {activeCpeDrillDown.leads.map((lead, idx) => (
                      <div key={idx} className="p-3.5 flex justify-between items-start hover:bg-black-50 transition text-xs">
                        <div className="space-y-0.5 text-left">
                          <span className="font-extrabold text-black-800 block">{lead.name}</span>
                          <span className="text-[11px] text-black-400 block font-semibold uppercase">{lead.projectName} ({lead.projectType})</span>
                        </div>
                        <span className="font-bold text-[#0e623a] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded shrink-0">
                          ₹ {lead.leadCost.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-black-50 border-t flex justify-end">
              <button
                onClick={() => setActiveCpeDrillDown(null)}
                className="px-5 py-2.5 bg-black-200 hover:bg-black-300 text-black-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default KPIInsights;
