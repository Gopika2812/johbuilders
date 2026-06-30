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
  CheckCircle
} from 'lucide-react';

const getCoordinatesForPercent = (percent) => {
  const x = Math.cos(2 * Math.PI * (percent - 0.25));
  const y = Math.sin(2 * Math.PI * (percent - 0.25));
  return [x, y];
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
          className={`w-full h-full opacity-100 ${isVisible ? 'animate-chart-wheel' : ''}`} 
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

        {hoveredItem && (
          <div 
            className="absolute bg-gray-950/95 text-white text-[10px] font-bold px-2 py-1 rounded-xl shadow-lg border border-gray-800 pointer-events-none z-50 transition-all duration-75 whitespace-nowrap"
            style={{ 
              left: `${mousePos.x}px`, 
              top: `${mousePos.y}px`
            }}
          >
            <div className="text-[9px] text-gray-400 font-extrabold uppercase">{hoveredItem[labelKey]}</div>
            <div className="text-white mt-0.5">
              {((hoveredItem[valueKey] / total) * 100).toFixed(1)}% 
              <span className="text-gray-300 ml-1">
                ({isCount ? hoveredItem[valueKey] : '₹' + Math.round(hoveredItem[valueKey]).toLocaleString()})
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-left flex-1 max-h-36 overflow-y-auto pr-2 w-full border-t border-gray-100 pt-3">
        {dataArray.map((item, index) => {
          const val = item[valueKey] || 0;
          const percentage = (val / total) * 100;
          const color = colorPalette[index % colorPalette.length];
          return (
            <div 
              key={index} 
              className={`flex items-center justify-between text-[10px] gap-2 border-b border-gray-50 pb-0.5 ${onSegmentClick ? 'cursor-pointer hover:bg-gray-50/50 px-1.5 py-0.5 rounded transition' : ''}`}
              onClick={() => onSegmentClick && onSegmentClick(item)}
            >
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
  const { token, user } = useAuth();
  
  // Date filters - default to current month
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    const lastDayVal = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(lastDayVal).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

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
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeCpeDrillDown, setActiveCpeDrillDown] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);



  const [stats, setStats] = useState({
    cards: {
      enquiries: { total: 0, contacted: 0, followup: 0, closed: 0 },
      siteVisits: { total: 0, siteVisit: 0, followup: 0, closed: 0 },
      hotList: 0,
      conversion: { count: 0, value: 0, received: 0, pending: 0 },
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
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; width: 100%; }
            td, th { border: 1px solid #000000; padding: 6px; text-align: center; font-size: 11px; }
            .title-header { background-color: #F8CBAD; font-weight: bold; font-size: 14px; height: 30px; text-transform: uppercase; }
            .month-header { background-color: #D9E1F2; font-weight: bold; font-size: 12px; height: 25px; text-transform: uppercase; }
            .exec-banner { background-color: #B4C6E7; font-weight: bold; font-size: 11px; height: 22px; color: #000000; text-align: center; }
            .table-headers { background-color: #E2EFDA; font-weight: bold; }
            .bold-cell { font-weight: bold; }
            .text-left { text-align: left; }
          </style>
        </head>
        <body>
          <table>
            <!-- Title Header -->
            <tr>
              <td colspan="10" class="title-header">${titleText}</td>
            </tr>
            <!-- Month Header -->
            <tr>
              <td colspan="10" class="month-header">${monthTitle}</td>
            </tr>
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
            <th>Enquirydate</th>
            <th>LeadName</th>
            <th>ContactNumber</th>
            <th>AssignedTo</th>
            <th>EnquiryMode</th>
            <th>Project</th>
            <th>Place</th>
            <th>LeadStatus</th>
            <th>SalesExecutiveRemarks</th>
          </tr>
        `;

        // Lead rows
        groupedByExec[execName].forEach(lead => {
          const dateStr = new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.');
          const phoneStr = lead.phone || '';
          const sourceStr = lead.leadSource || '';
          const projectStr = lead.project?.code || '';
          const placeStr = lead.address ? lead.address.split(',')[0] : '';
          const statusStr = (lead.status || '').toLowerCase().replace('-', '');
          const remarksStr = lead.followUpInfo?.remarks || lead.closeRemarks || '';

          html += `
            <tr>
              <td>${globalSNo++}</td>
              <td>${dateStr}</td>
              <td class="text-left">${lead.name || ''}</td>
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
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; width: 100%; }
            td, th { border: 1px solid #000000; padding: 6px; text-align: center; font-size: 11px; }
            .title-header { background-color: #F8CBAD; font-weight: bold; font-size: 14px; height: 30px; text-transform: uppercase; }
            .month-header { background-color: #D9E1F2; font-weight: bold; font-size: 12px; height: 25px; text-transform: uppercase; }
            .exec-banner { background-color: #B4C6E7; font-weight: bold; font-size: 11px; height: 22px; color: #000000; text-align: center; }
            .table-headers { background-color: #E2EFDA; font-weight: bold; }
            .text-left { text-align: left; }
          </style>
        </head>
        <body>
          <table>
            <!-- Title Header -->
            <tr>
              <td colspan="9" class="title-header">${titleText}</td>
            </tr>
            <!-- Month Header -->
            <tr>
              <td colspan="9" class="month-header">${monthTitle}</td>
            </tr>
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
        groupedByExec[execName].forEach(lead => {
          const dateStr = new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.');
          const phoneStr = lead.phone || '';
          const placeStr = lead.address ? lead.address.split(',')[0] : '';
          const visitedBy = execName;
          
          // Enquiry Status column is completed/followup (or lead.status lowercase)
          const statusStr = lead.status === 'Site Visit Follow-up' ? 'followup' : 'completed';
          const remarksStr = lead.followUpInfo?.remarks || lead.closeRemarks || '';
          const sourceStr = lead.leadSource || '';

          html += `
            <tr>
              <td>${globalSNo++}</td>
              <td>${dateStr}</td>
              <td class="text-left">${lead.name || ''}</td>
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
        // 1. Must be hot list stage (Qualified or Negotiation)
        const isHotList = lead.status === 'Qualified' || lead.status === 'Negotiation';
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
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; width: 100%; }
            td, th { border: 1px solid #000000; padding: 6px; text-align: center; font-size: 11px; }
            .title-header { background-color: #F8CBAD; font-weight: bold; font-size: 14px; height: 30px; text-transform: uppercase; }
            .month-header { background-color: #D9E1F2; font-weight: bold; font-size: 12px; height: 25px; text-transform: uppercase; }
            .exec-banner { background-color: #B4C6E7; font-weight: bold; font-size: 11px; height: 22px; color: #000000; text-align: center; }
            .table-headers { background-color: #E2EFDA; font-weight: bold; }
            .text-left { text-align: left; }
          </style>
        </head>
        <body>
          <table>
            <!-- Title Header -->
            <tr>
              <td colspan="7" class="title-header">${titleText}</td>
            </tr>
            <!-- Month Header -->
            <tr>
              <td colspan="7" class="month-header">${monthTitle}</td>
            </tr>
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
        groupedByExec[execName].forEach(lead => {
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

          html += `
            <tr>
              <td>${globalSNo++}</td>
              <td class="text-left">${nameStr}</td>
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
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; width: 100%; }
            td, th { border: 1px solid #000000; padding: 6px; text-align: center; font-size: 11px; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <!-- Title Header -->
            <tr>
              <td colspan="8" style="background-color: #385723; color: white; font-weight: bold; font-size: 14px; height: 30px; text-align: center; text-transform: uppercase;">${titleText}</td>
            </tr>
            <!-- Month Header -->
            <tr>
              <td colspan="8" style="background-color: #A9D08E; font-weight: bold; font-size: 12px; height: 25px; text-align: center; text-transform: uppercase;">${monthTitle}</td>
            </tr>
            <!-- Table Headers -->
            <tr style="background-color: #C6E0B4; font-weight: bold;">
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

        html += `
          <tr>
            <td>${index + 1}</td>
            <td>${dateStr}</td>
            <td class="text-left">${custName}</td>
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
      const hTarget = targetData.housesTarget || 0;
      const pTarget = targetData.plotsTarget || 0;

      const currentAchieved = statsData.current || { salesValue: 0, housesCount: 0, plotsCount: 0 };
      const lastMonthAchieved = statsData.lastMonth || { salesValue: 0, housesCount: 0, plotsCount: 0 };

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

      // Build HTML Template
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; }
            td, th { border: 1px solid #000000; padding: 6px; text-align: center; font-size: 10px; }
            .bg-header-green { background-color: #A9D08E; font-weight: bold; }
            .bg-accent-green { background-color: #C6E0B4; font-weight: bold; }
            .bg-title-blue { background-color: #5B9BD5; font-weight: bold; color: white; font-size: 12px; }
            .bg-banner-blue { background-color: #2F5597; font-weight: bold; color: white; font-size: 11px; }
            .bg-header-blue { background-color: #BDD7EE; font-weight: bold; }
            .bg-total-banner { background-color: #F8CBAD; font-weight: bold; font-size: 11px; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <!-- PHASE 1: Turnover Plan Table -->
            <thead>
              <tr class="bg-header-green">
                <th style="width: 50px;">S.No</th>
                <th style="width: 250px;">TOTAL SALES PROJECTION ${dateForMonth.getFullYear() - 1} - ${dateForMonth.getFullYear().toString().substring(2)}</th>
                <th style="width: 100px;">TOTAL</th>
                <th style="width: 80px;">UNIT</th>
                <th style="width: 100px;">ACHIEVED</th>
                <th style="width: 100px;">BALANCE</th>
                <th style="width: 130px;">LAST MONTH ACHIEVED</th>
                <th colspan="3" style="background-color: #70AD47; color: white; font-size: 14px; font-weight: bold; vertical-align: middle; text-align: center;">
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
                <td colspan="2" class="font-bold" style="background-color: #E2EFDA;">DATE:</td>
                <td style="background-color: #E2EFDA;">${todayFormatted}</td>
              </tr>
              <tr>
                <td>2</td>
                <td class="text-left font-bold">Total Houses to be Sold</td>
                <td class="text-right font-bold">${hTarget}</td>
                <td>Units</td>
                <td class="text-right">${currentAchieved.housesCount}</td>
                <td class="text-right">${Math.max(0, hTarget - currentAchieved.housesCount)}</td>
                <td class="text-right">${lastMonthAchieved.housesCount}</td>
                <td colspan="3" style="border: none; background-color: #ffffff;"></td>
              </tr>
              <tr>
                <td>3</td>
                <td class="text-left font-bold">Total Plots to be Sold</td>
                <td class="text-right font-bold">${pTarget}</td>
                <td>Units</td>
                <td class="text-right">${currentAchieved.plotsCount}</td>
                <td class="text-right">${Math.max(0, pTarget - currentAchieved.plotsCount)}</td>
                <td class="text-right">${lastMonthAchieved.plotsCount}</td>
                <td colspan="3" style="border: none; background-color: #ffffff;"></td>
              </tr>

              <!-- Spacing row -->
              <tr><td colspan="10" style="border: none; height: 15px;"></td></tr>

              <!-- PHASE 2: Project wise Report Headers -->
              <tr class="bg-header-blue">
                <th>S.NO.</th>
                <th>PROJECT</th>
                <th>DESCRIPTION</th>
                <th>TARGET</th>
                <th>ACTUAL</th>
                <th>% ACHIEVED</th>
                <th>1st Week Actual</th>
                <th>2nd Week Actual</th>
                <th>3rd Week Actual</th>
                <th>4th Week Actual</th>
              </tr>
      `;

      // Aggregate Phase 2 percentage counters
      let pTotalPct = 0;
      let pTotalRows = 0;

      // Render Phase 2 rows grouped by project
      const projKeys = Object.keys(projectStatsData);
      projKeys.forEach((projId, index) => {
        const proj = projectStatsData[projId];
        const targets = projectTargetsMap[projId] || { enquiries: 0, hotlist: 0, sitevisits: 0, booked: 0, value: 0 };

        const rows = [
          { label: 'Total Enquiries', target: targets.enquiries, actual: proj.enquiries.actual, w1: proj.enquiries.w1, w2: proj.enquiries.w2, w3: proj.enquiries.w3, w4: proj.enquiries.w4 },
          { label: 'Hot list', target: targets.hotlist, actual: proj.hotlist.actual, w1: proj.hotlist.w1, w2: proj.hotlist.w2, w3: proj.hotlist.w3, w4: proj.hotlist.w4 },
          { label: 'Site Visits', target: targets.sitevisits, actual: proj.sitevisits.actual, w1: proj.sitevisits.w1, w2: proj.sitevisits.w2, w3: proj.sitevisits.w3, w4: proj.sitevisits.w4 },
          { label: 'Booked Units', target: targets.booked, actual: proj.bookedUnits.actual, w1: proj.bookedUnits.w1, w2: proj.bookedUnits.w2, w3: proj.bookedUnits.w3, w4: proj.bookedUnits.w4 },
          { label: 'Booking Value', target: targets.value, actual: proj.bookingValue.actual, w1: proj.bookingValue.w1, w2: proj.bookingValue.w2, w3: proj.bookingValue.w3, w4: proj.bookingValue.w4, isFloat: true }
        ];

        rows.forEach((row, rIdx) => {
          const pctText = getPct(row.actual, row.target);
          pTotalPct += getPctVal(row.actual, row.target);
          pTotalRows += 1;

          html += `
            <tr>
              ${rIdx === 0 ? `<td rowspan="5" style="vertical-align: middle;">${index + 1}</td><td rowspan="5" class="font-bold" style="vertical-align: middle;">${proj.code || proj.name}</td>` : ''}
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
            <tr class="bg-total-banner">
              <td colspan="5" class="text-right">OVERALL AVERAGE ACHIEVED:</td>
              <td colspan="5" style="background-color: #F8CBAD; color: #C55A11;">${projectPerformanceText}</td>
            </tr>

            <!-- Spacing row -->
            <tr><td colspan="10" style="border: none; height: 15px;"></td></tr>

            <!-- PHASE 3: Marketing Plan Table -->
            <tr>
              <td colspan="10" style="background-color: #2F5597; color: white; font-weight: bold; font-size: 12px; height: 26px;">JB MARKETING PARAMETER REPORT</td>
            </tr>
            <tr>
              <td colspan="10" style="background-color: #BDD7EE; font-weight: bold; font-size: 11px; height: 22px;">MONTH OF ${monthNames[dateForMonth.getMonth()].toUpperCase()} ${dateForMonth.getFullYear()}</td>
            </tr>
            <tr class="bg-header-blue font-bold">
              <th>S.NO.</th>
              <th colspan="2">DESCRIPTION</th>
              <th>BUDGET/ TARGET</th>
              <th>ACTUAL</th>
              <th>% ACHIEVED</th>
              <th>1st Week Actual</th>
              <th>2nd Week Actual</th>
              <th>3rd Week Actual</th>
              <th>4th Week Actual</th>
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
            <tr class="bg-total-banner">
              <td colspan="5" class="text-right">OVERALL AVERAGE ACHIEVED:</td>
              <td colspan="5" style="background-color: #F8CBAD; color: #C55A11;">${marketingPerformanceText}</td>
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
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; width: 100%; }
            td, th { border: 1px solid #000000; padding: 6px; text-align: center; font-size: 11px; }
            .title-header { background-color: #2F5597; color: white; font-weight: bold; font-size: 14px; height: 30px; text-transform: uppercase; }
            .month-header { background-color: #D9E1F2; font-weight: bold; font-size: 12px; height: 25px; text-transform: uppercase; }
            .group-banner { background-color: #B4C6E7; font-weight: bold; font-size: 11px; height: 22px; color: #000000; text-align: left; padding-left: 10px; }
            .subtotal-row { background-color: #F2F2F2; font-weight: bold; }
            .total-row { background-color: #F8CBAD; font-weight: bold; font-size: 12px; height: 25px; }
            .table-headers { background-color: #D9E1F2; font-weight: bold; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <!-- Title Header -->
            <tr>
              <td colspan="7" class="title-header">${titleText}</td>
            </tr>
            <!-- Month Header -->
            <tr>
              <td colspan="7" class="month-header">${monthTitle}</td>
            </tr>
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
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; width: 100%; }
            td, th { border: 1px solid #000000; padding: 6px; text-align: center; font-size: 11px; }
            .title-header { background-color: #D9E1F2; font-weight: bold; font-size: 13px; height: 28px; }
            .month-header { background-color: #F2F2F2; font-weight: bold; font-size: 11px; height: 22px; text-transform: uppercase; }
            .table-headers { background-color: #E2EFDA; font-weight: bold; }
            .total-row { background-color: #D9D9D9; font-weight: bold; height: 24px; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <!-- Title Header -->
            <tr>
              <td colspan="5" class="title-header">JB - LEAD SOURCES PERFORMANCE REPORT</td>
            </tr>
            <!-- Month Header -->
            <tr>
              <td colspan="5" class="month-header">${monthTitle}</td>
            </tr>
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
        // 1. Must be in Won (Registration/Handover) stage
        const isWon = lead.status === 'Won';
        if (!isWon) return false;

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

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; width: 100%; }
            td, th { border: 1px solid #000000; padding: 6px; text-align: center; font-size: 11px; }
            .title-header { background-color: #D9E1F2; font-weight: bold; font-size: 14px; height: 30px; text-transform: uppercase; }
            .month-header { background-color: #E2EFDA; font-weight: bold; font-size: 12px; height: 25px; text-transform: uppercase; }
            .project-banner { background-color: #E2EFDA; font-weight: bold; font-size: 11px; height: 22px; color: #000000; text-align: center; }
            .table-headers { background-color: #D9D9D9; font-weight: bold; }
            .pending-header { background-color: #F8CBAD; font-weight: bold; font-size: 12px; height: 26px; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <!-- Title Header -->
            <tr>
              <td colspan="8" style="background-color: #B4C6E7; font-weight: bold; font-size: 14px; height: 30px; text-align: center; text-transform: uppercase;">${titleText}</td>
            </tr>
            <!-- Month Header -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Adv Date</th>
              <th>Project</th>
              <th>Plot No</th>
              <th>Customer Name</th>
              <th>House</th>
              <th>Remarks</th>
              <th>Comments / Action notes</th>
            </tr>
      `;

      // Group leads by Project Code
      const groupedByProj = {};
      filtered.forEach(lead => {
        const projCode = lead.project?.code || 'UNASSIGNED';
        if (!groupedByProj[projCode]) groupedByProj[projCode] = [];
        groupedByProj[projCode].push(lead);
      });

      let globalSNo = 1;

      Object.keys(groupedByProj).forEach(projCode => {
        // Project group banner row
        html += `
          <tr>
            <td colspan="8" style="background-color: #E2EFDA; font-weight: bold; text-align: center; font-size: 11px; height: 22px;">${projCode.toUpperCase()}</td>
          </tr>
        `;

        // Lead rows
        groupedByProj[projCode].forEach(lead => {
          const advDate = lead.bookingInfo?.bookingDate 
            ? new Date(lead.bookingInfo.bookingDate).toLocaleDateString('en-GB').replace(/\//g, '.')
            : '';
            
          const plotNo = lead.bookingInfo?.selectedUnits?.join(' & ') || '';
          const custName = lead.name || '';
          
          // House: mapping projectType to Land/House/Flat
          const typeRaw = (lead.project?.projectType || '').toLowerCase();
          let houseType = 'Land';
          if (typeRaw.includes('villa') || typeRaw.includes('house') || typeRaw.includes('individual')) {
            houseType = 'House';
          } else if (typeRaw.includes('apartment') || typeRaw.includes('flat')) {
            houseType = 'Flat';
          }

          const remarksStr = lead.followUpInfo?.remarks || '';
          const commentsStr = lead.closeRemarks || '';

          html += `
            <tr>
              <td>${globalSNo++}</td>
              <td>${advDate}</td>
              <td>${projCode}</td>
              <td>${plotNo}</td>
              <td class="text-left">${custName}</td>
              <td>${houseType}</td>
              <td>${remarksStr}</td>
              <td class="text-left">${commentsStr}</td>
            </tr>
          `;
        });
      });

      // RENDER REGISTRATION PENDING HEADER
      html += `
        <tr>
          <td colspan="8" class="pending-header" style="background-color: #F8CBAD; text-transform: uppercase;">REGISTRATION PENDING</td>
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
          {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
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
          )}

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
              <div className="mt-2 space-y-0.5 text-[9px] font-bold uppercase">
                <div className="text-gray-500">Total: ₹{Math.round(stats.cards.conversion.value || 0).toLocaleString()}</div>
                <div className="text-emerald-700">Received: ₹{Math.round(stats.cards.conversion.received || 0).toLocaleString()}</div>
                <div className="text-rose-700">Pending: ₹{Math.round(stats.cards.conversion.pending || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Handover Rate */}
            <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Registration / Handover Rate</span>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{(stats.insights?.handoverRate || 0).toFixed(1)}%</h3>
              <p className="text-[9px] text-gray-550 font-bold mt-2">{stats.cards.inventory.handoverUnits} of {stats.cards.inventory.totalUnits} Units</p>
            </div>
          </div>

          {/* 🟢 DYNAMIC DRILL-DOWN MARKETING PIE CHARTS GRID */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#0e623a]" />
                  <span>Marketing Performance: {selectedGroup ? `Drilled down: ${selectedGroup}` : 'Spend & Revenue returns by Group'}</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Click any group slice/item to drill down into detailed source breakdown</p>
              </div>
              {selectedGroup && (
                <button 
                  onClick={() => setSelectedGroup(null)}
                  className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Groups
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart 1: Budget Allocation (Planned) */}
              <div className="space-y-3 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-left">1. Budget Allocation (Planned)</span>
                {(() => {
                  const budgetData = selectedGroup
                    ? (stats.groupStats?.[selectedGroup]?.sources || []).filter(s => s.budget > 0)
                    : Object.keys(stats.groupStats || {}).map(gName => ({
                        groupName: gName,
                        budget: stats.groupStats[gName].budget || 0
                      })).filter(g => g.budget > 0);
                  return (
                    <ObservedPieChart 
                      dataArray={budgetData}
                      valueKey="budget"
                      labelKey={selectedGroup ? "source" : "groupName"}
                      colorPalette={primaryColors}
                      onSegmentClick={!selectedGroup ? (item) => setSelectedGroup(item.groupName) : null}
                    />
                  );
                })()}
              </div>

              {/* Chart 2: Spent Allocation (Actual) */}
              <div className="space-y-3 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-left">2. Spent Allocation (Actual)</span>
                {(() => {
                  const spendData = selectedGroup
                    ? (stats.groupStats?.[selectedGroup]?.sources || []).filter(s => s.spent > 0)
                    : Object.keys(stats.groupStats || {}).map(gName => ({
                        groupName: gName,
                        spent: stats.groupStats[gName].spent || 0
                      })).filter(g => g.spent > 0);
                  return (
                    <ObservedPieChart 
                      dataArray={spendData}
                      valueKey="spent"
                      labelKey={selectedGroup ? "source" : "groupName"}
                      colorPalette={primaryColors}
                      onSegmentClick={!selectedGroup ? (item) => setSelectedGroup(item.groupName) : null}
                    />
                  );
                })()}
              </div>

              {/* Chart 3: Project Value Generated (Revenue) */}
              <div className="space-y-3 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-left">3. Lead Valuation Generated (Revenue)</span>
                {(() => {
                  const valueData = selectedGroup
                    ? (stats.groupStats?.[selectedGroup]?.sources || []).filter(s => s.value > 0)
                    : Object.keys(stats.groupStats || {}).map(gName => ({
                        groupName: gName,
                        value: stats.groupStats[gName].value || 0
                      })).filter(g => g.value > 0);
                  return (
                    <ObservedPieChart 
                      dataArray={valueData}
                      valueKey="value"
                      labelKey={selectedGroup ? "source" : "groupName"}
                      colorPalette={primaryColors}
                      onSegmentClick={!selectedGroup ? (item) => setSelectedGroup(item.groupName) : null}
                    />
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 🟢 COMPARATIVE CHART ROWS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Pipeline Conversion Rates */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#0e623a]" />
                <span>Conversion Stage Efficiency (%)</span>
              </h3>
              <ObservedBarChart 
                dataArray={[
                  { stage: 'Site Visit', rate: stats.insights?.siteVisitConversionRate || 0 },
                  { stage: 'Booking', rate: stats.insights?.bookingConversionRate || 0 },
                  { stage: 'Registration', rate: stats.insights?.handoverRate || 0 }
                ]}
                xKey="stage"
                yKey="rate"
                barColor="#68809A" // Matte Slate Blue
                isPercent={true}
              />
              <p className="text-[9px] text-gray-400 italic">
                Site Visit, Booking, and Handover rates.
              </p>
            </div>

            {/* Chart 2: Cost Per Enquiry (CPE) by Campaign Source */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#0e623a]" />
                <span>Cost Per Enquiry (CPE) by Source (₹)</span>
              </h3>
              <ObservedBarChart 
                dataArray={Object.keys(stats.sourceStats || {}).map(src => ({
                  source: src,
                  cpe: stats.sourceStats[src].cpe || 0
                })).filter(item => item.cpe > 0)}
                xKey="source"
                yKey="cpe"
                barColor="#DFBA84" // Matte Yellow
              />
              <p className="text-[9px] text-gray-400 italic">
                Average cost spent to acquire a single enquiry from each campaign source type.
              </p>
            </div>

            {/* Chart 2.5: Lead Source Cost Distribution Pie */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4 text-left">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#0e623a]" />
                <span>Enquiry Cost Distribution by Source</span>
              </h3>
              <div className="flex justify-center py-2">
                <ObservedPieChart 
                  dataArray={Object.keys(stats.sourceStats || {}).map(src => ({
                    source: src,
                    leadCost: stats.sourceStats[src].leadCost || 0,
                    leads: stats.sourceStats[src].leads || []
                  })).filter(item => item.leadCost > 0)}
                  valueKey="leadCost"
                  labelKey="source"
                  colorPalette={['#4A7C59', '#68809A', '#DFBA84', '#C77B82', '#8E7C93', '#7C9390', '#93847C']}
                  isCount={false}
                  onSegmentClick={(item) => setActiveCpeDrillDown(item)}
                />
              </div>
              <p className="text-[9px] text-gray-400 italic">
                Slices show total spent by source. Click any source segment or list item to drill down into lead names, their costs, and project details.
              </p>
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
                <span>Site Visit Engagements</span>
              </h3>
              <div className="flex justify-center py-2">
                <ObservedPieChart 
                  dataArray={[
                    { label: 'Visits Conducted', count: stats.cards.siteVisits.siteVisit },
                    { label: 'Follow-up Visits', count: stats.cards.siteVisits.followup },
                    { label: 'Site Visit Closed', count: stats.cards.siteVisits.closed }
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
                    <td className="p-4 text-right text-gray-800 font-bold">
                      <div>Total: ₹{Math.round(stats.cards.conversion.value || 0).toLocaleString()}</div>
                      <div className="text-emerald-700 text-[10px]">Recv: ₹{Math.round(stats.cards.conversion.received || 0).toLocaleString()}</div>
                      <div className="text-rose-700 text-[10px]">Pend: ₹{Math.round(stats.cards.conversion.pending || 0).toLocaleString()}</div>
                    </td>
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

      {/* 🔐 MODAL: CPE Source Drilldown Details */}
      {activeCpeDrillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-150">
            <div className="bg-[#0e623a] p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-[9px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Source Drilldown</span>
                <h3 className="text-sm font-black mt-1 uppercase">Campaign Source: {activeCpeDrillDown.source}</h3>
              </div>
              <button 
                onClick={() => setActiveCpeDrillDown(null)}
                className="text-white hover:text-gray-200 font-extrabold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-left">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl text-xs font-bold text-gray-700">
                <span>Total Enquiries Cost:</span>
                <span className="text-[#0e623a] text-sm font-black">₹ {Math.round(activeCpeDrillDown.leadCost).toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Acquired Enquiries List</span>
                {activeCpeDrillDown.leads?.length === 0 ? (
                  <div className="p-6 bg-gray-50 rounded-xl text-center text-xs text-gray-400 italic">
                    No individual lead entries recorded for this source.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 border rounded-2xl overflow-hidden bg-white">
                    {activeCpeDrillDown.leads.map((lead, idx) => (
                      <div key={idx} className="p-3.5 flex justify-between items-start hover:bg-gray-50 transition text-xs">
                        <div className="space-y-0.5 text-left">
                          <span className="font-extrabold text-gray-800 block">{lead.name}</span>
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">{lead.projectName} ({lead.projectType})</span>
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

            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => setActiveCpeDrillDown(null)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Export Speed Dial */}
      <div className="fixed right-6 bottom-24 z-40 flex flex-col items-end gap-3 no-print">
        {/* Menu Items */}
        {exportMenuOpen && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-fadeIn">
            {/* Enquiry Sheet Export */}
            <button
              onClick={() => {
                handleExportEnquiriesExcel();
                setExportMenuOpen(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-emerald-500/50"
            >
              <FileText className="w-4 h-4" />
              <span>Export Enquiry Sheet</span>
            </button>

            {/* Site Visit Sheet Export */}
            <button
              onClick={() => {
                handleExportSiteVisitsExcel();
                setExportMenuOpen(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-blue-500/50"
            >
              <Compass className="w-4 h-4" />
              <span>Export Site Visit Sheet</span>
            </button>

            {/* Hot List Sheet Export */}
            <button
              onClick={() => {
                handleExportHotListExcel();
                setExportMenuOpen(false);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-orange-500/50"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Export Hot List Sheet</span>
            </button>

            {/* Bookings Sheet Export */}
            <button
              onClick={() => {
                handleExportBookingsExcel();
                setExportMenuOpen(false);
              }}
              className="bg-[#385723] hover:bg-[#2c441c] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-emerald-700/50"
            >
              <Building className="w-4 h-4" />
              <span>Export Bookings Sheet</span>
            </button>

            {/* Summary of Report Export */}
            <button
              onClick={() => {
                handleExportSummaryReport();
                setExportMenuOpen(false);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-indigo-500/50"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Summary of Report</span>
            </button>

            {/* Marketing Performance Report Export */}
            <button
              onClick={() => {
                handleExportMarketingReport();
                setExportMenuOpen(false);
              }}
              className="bg-[#2f5597] hover:bg-[#254378] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-blue-600/50"
            >
              <Target className="w-4 h-4" />
              <span>Marketing Performance Report</span>
            </button>

            {/* Lead Sources Report Export */}
            <button
              onClick={() => {
                handleExportLeadSourcesExcel();
                setExportMenuOpen(false);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-teal-500/50"
            >
              <Users className="w-4 h-4" />
              <span>Lead Sources Report</span>
            </button>

            {/* Registration Report Export */}
            <button
              onClick={() => {
                handleExportRegistrationReport();
                setExportMenuOpen(false);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition cursor-pointer text-[10px] font-bold uppercase tracking-wider border border-purple-500/50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Registration Report</span>
            </button>
          </div>
        )}

        {/* Main Floating Toggle Button */}
        <button
          onClick={() => setExportMenuOpen(!exportMenuOpen)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-emerald-600/50"
          title="Export Reports Menu"
        >
          <FileText className="w-5 h-5 text-white" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide">
            {exportMenuOpen ? 'Close Menu' : 'Export Reports'}
          </span>
        </button>
      </div>

    </div>
  );
};

export default KPIInsights;
