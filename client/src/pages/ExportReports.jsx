import React, { useState, useEffect, useRef } from 'react';
import XLSX from 'xlsx-js-style';
import { htmlToStyledSheet } from '../utils/htmlToSheet';
import { exportHtmlSheetsToExcel } from '../utils/excelExporter';
import { LOGO_BASE64 } from '../utils/logoBase64';
import { formatUnitWithLabel } from '../utils/formatUtils';
import { useAuth, API_URL } from '../context/AuthContext';
import DateRangeFilter from '../components/DateRangeFilter';
import { TrendingUp, Download, Calendar, MapPin,   DollarSign, 
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
  Loader2
} from 'lucide-react';

const getCoordinatesForPercent = (percent) => {
  const x = Math.cos(2 * Math.PI * (percent - 0.25));
  const y = Math.sin(2 * Math.PI * (percent - 0.25));
  return [x, y];
};

const getExcelStyles = (titleBg, monthBg, headerBg, execBg) => {
  return `
    <style>
      table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
      td, th { border: 1px solid #CBD5E1; padding: 8px 12px; font-size: 9.5pt; color: #1E293B; }
      th, .table-headers th { font-weight: bold; background-color: #0F5233 !important; color: #FFFFFF !important; border: 1px solid #0D4329 !important; text-align: center; height: 34px; font-size: 10pt; vertical-align: middle; }
      .title-row { font-size: 14pt; font-weight: bold; color: #FFFFFF !important; background-color: #0F5233 !important; text-align: center; border: 1px solid #0D4329 !important; height: 65px; vertical-align: middle; }
      .month-header { height: 28px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: #E6F4EA !important; color: #0F5233 !important; border: 1px solid #C3E6CB !important; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
      .exec-banner { background-color: #E6F4EA !important; font-weight: bold; text-align: left; color: #0F5233 !important; border: 1px solid #CBD5E1; }
      .logo-cell { background-color: #FFFFFF !important; border: 1px solid #CBD5E1; text-align: center; vertical-align: middle; padding: 4px 8px; }
      .bg-header-blue { background-color: #0F5233 !important; color: #FFFFFF !important; font-weight: bold; text-align: center; border: 1px solid #0D4329 !important; }
      .bg-header-green { background-color: #0F5233 !important; color: #FFFFFF !important; font-weight: bold; text-align: center; border: 1px solid #0D4329 !important; }
      .bg-black-row { background-color: #F8FAFC !important; color: #64748B !important; border: 1px solid #E2E8F0 !important; }
      .bg-orange-pct { background-color: #D1E7DD !important; color: #0F5233 !important; font-weight: bold; text-align: center; border: 1px solid #A3CFBB !important; }
      .bg-light-green { background-color: #F8FAF8 !important; color: #1E293B !important; border: 1px solid #CBD5E1 !important; }
      
      .font-bold { font-weight: bold; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
    </style>
  `;
};

const getExcelHeader = (titleText, monthTitle, totalColumns, themeColor) => {
    const safeCols = Math.max(3, totalColumns);
    const webLogo = LOGO_BASE64;
    return `
      <tr style="height: 60px;">
        <td colspan="2" bgcolor="#FFFFFF" class="logo-cell" style="background-color: #FFFFFF; padding: 4px 8px; text-align: center; vertical-align: middle; border: 1px solid #CBD5E1; height: 60px; width: 140px;">
          ${webLogo ? `<img src="${webLogo}" style="max-height: 48px; max-width: 130px; width: auto; height: 48px; object-fit: contain; display: block; margin: 0 auto;" alt="JOHN BUILDWELL" />` : `<div style="color: #0F5233; font-size: 11pt; font-weight: bold; text-align: center;">JOHN BUILDWELL</div>`}
        </td>
        <td colspan="${safeCols - 2}" class="title-row text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329; border-left: none; vertical-align:middle; text-align:center; font-size: 14pt; font-weight: bold; height: 60px; letter-spacing: 0.5px;">
          ${titleText}
        </td>
      </tr>
      ${monthTitle ? `
      <tr>
        <td colspan="${safeCols}" class="month-header" style="height: 28px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: #E6F4EA; color: #0F5233; border: 1px solid #C3E6CB; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
          ${monthTitle}
        </td>
      </tr>` : ''}
      <tr><td colspan="${safeCols}" style="border:none; height: 12px; background-color: transparent;"></td></tr>
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

const ExportReports = () => {
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
    const year = d.getFullYear();
    const month = d.getMonth();
    const lastD = new Date(year, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`;
  });

  const [selectedUser, setSelectedUser] = useState(() => {
    const isPrivileged = user?.role === 'Superadmin' || user?.role === 'Superadmin';
    return isPrivileged ? '' : (user?._id || '');
  });
  
  useEffect(() => {
    if (user && user.role !== 'Superadmin' && user.role !== 'Superadmin') {
      setSelectedUser(user._id);
    }
  }, [user]);

  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportLoadingText, setReportLoadingText] = useState('Generating Report Preview...');
  const fileCode = 'ALL_PROJECTS';
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewFilename, setPreviewFilename] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSheets, setPreviewSheets] = useState([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

  const fetchInsightsPromiseRef = useRef(null);

  const handlePreview = (html, filename) => {
    if (window.__isDownloadingAll) {
      window.__capturedHtml = html;
      return;
    }
    setPreviewSheets([]);
    setPreviewHtml(html);
    setPreviewFilename(filename);
    setPreviewModalOpen(true);
  };

  const downloadFromPreview = async () => {
    const sheetsToExport = (previewSheets && previewSheets.length > 0)
      ? previewSheets
      : [{ name: (previewFilename || 'Report').replace(/\.(xls|xlsx)$/i, ''), html: previewHtml }];

    await exportHtmlSheetsToExcel(sheetsToExport, previewFilename);
    setPreviewModalOpen(false);
  };
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeCpeDrillDown, setActiveCpeDrillDown] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [crdMenuOpen, setCrdMenuOpen] = useState(false);

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

  const fetchInsightsData = async (from = fromDate, to = toDate, user = selectedUser, proj = selectedProject) => {
    setLoading(true);
    try {
      let url = `${API_URL}/dashboard/stats?fromDate=${from}&toDate=${to}`;
      if (user) url += `&userId=${user}`;
      if (proj) url += `&projectId=${proj}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        return data;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    setSelectedGroup(null);
    const p = fetchInsightsData(fromDate, toDate, selectedUser, selectedProject);
    fetchInsightsPromiseRef.current = p;
  }, [fromDate, toDate, selectedUser, selectedProject]);

  const ensureStats = async () => {
    if (loading && fetchInsightsPromiseRef.current) {
      const data = await fetchInsightsPromiseRef.current;
      if (data) return data;
    }
    if (!stats || !stats.projects || stats.projects.length === 0 || !stats.groupStats || Object.keys(stats.groupStats).length === 0) {
      const data = await fetchInsightsData(fromDate, toDate, selectedUser, selectedProject);
      if (data) return data;
    }
    return stats;
  };

  const formatLeadStatusForReport = (lead) => {
    if (!lead) return 'followup';
    const status = lead.status || '';
    if (status === 'Future Follow-up' || status === 'Future Followup') {
      return 'future followup';
    }
    if (status === 'Lost' || status === 'Closed' || lead.isClosed) {
      return 'lost';
    }
    if (status === 'Follow-Up' || status === 'Followup') {
      return 'followup';
    }
    if (status === 'Site Visit Follow-up') {
      return 'site visit followup';
    }
    if (status === 'Site Visit') {
      return 'site visit';
    }
    if (status === 'Won' || status === 'Booked') {
      return 'booked';
    }
    if (status === 'Booking') {
      return 'booking';
    }
    if (status === 'Negotiation') {
      return 'negotiation';
    }
    if (status === 'Contacted') {
      return 'contacted';
    }
    if (status === 'New' || status === 'New Lead') {
      return 'new lead';
    }
    return status.toLowerCase().replace(/[\-_]+/g, ' ');
  };

  const getFormattedLeadRemarks = (lead, defaultEmpty = '') => {
    if (!lead) return defaultEmpty;
    const isLostOrClosed = lead.status === 'Lost' || lead.status === 'Closed' || lead.isClosed;
    let remarks = '';
    if (isLostOrClosed) {
      remarks = (lead.closeRemarks && lead.closeRemarks.trim()) 
        ? lead.closeRemarks 
        : (lead.followUpInfo?.remarks || '');
    } else {
      remarks = (lead.followUpInfo?.remarks && lead.followUpInfo.remarks.trim()) 
        ? lead.followUpInfo.remarks 
        : (lead.closeRemarks || '');
    }
    return remarks || defaultEmpty;
  };

  const handleExportEnquiriesExcel = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Fetching enquiry records for selected period...');
      const currentStats = providedStats || await ensureStats();
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
        // 1. Must be enquiry (New, Assigned, Contacted, Follow-Up, Future Follow-up) or closed at this stage
        const isClosed = lead.status === 'Lost' || lead.status === 'Closed' || lead.isClosed;
        const hasSiteVisitHistory = lead.history?.some(h => h.status === 'Site Visit' || h.status === 'Site Visit Follow-up') || (lead.closeRemarks && lead.closeRemarks.includes('[Lost at Site Visit'));
        const activeEnquiryStatuses = ['New', 'Assigned', 'Contacted', 'Follow-Up', 'Future Follow-up'];
        const isEnquiry = activeEnquiryStatuses.includes(lead.status) || (isClosed && !hasSiteVisitHistory);
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
      const projectList = currentStats?.projects || stats.projects || [];
      const projectTitle = selectedProject 
        ? (projectList.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';
      const titleText = projectTitle 
        ? `JB - ${projectTitle.toUpperCase()} MARKETING ENQUIRY SHEET`
        : `JB - MARKETING ENQUIRY SHEET`;
        
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      // Build HTML
      const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]}- ${dateForMonth.getFullYear()}`;
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 10, "#0F5233")}
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

      // Group leads by assigned executive to insert executive banner row (as seen in screenshot: "Veni" blue banner stretching across!)
      const groupedByExec = {};
      filtered.forEach(lead => {
        const execName = lead.assignedTo?.name || 'UNASSIGNED';
        if (!groupedByExec[execName]) groupedByExec[execName] = [];
        groupedByExec[execName].push(lead);
      });

      let globalSNo = 1;

      Object.keys(groupedByExec).forEach(execName => {
        const leadsList = groupedByExec[execName];
        // Sort chronologically by date (1st to 31st)
        leadsList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Executive banner row
        html += `
          <tr>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner text-red"><span style="color: red; font-weight: bold;">${execName}</span></td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
          </tr>
        `;

        // Lead rows
        leadsList.forEach((lead, idx) => {
          const dateStr = new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.');
          const phoneStr = lead.phone || '&nbsp;';
          const sourceStr = lead.leadSource || '&nbsp;';
          const projectStr = lead.project?.name || lead.project?.code || 'Potheri';
          const locationStr = lead.address || lead.location || '&nbsp;';
          const statusStr = formatLeadStatusForReport(lead);
          const remarksStr = getFormattedLeadRemarks(lead, '&nbsp;');

          html += `
            <tr>
              <td>${globalSNo++}</td>
              <td>${dateStr}</td>
              <td class="text-left font-bold">${lead.name || '&nbsp;'}</td>
              <td>${phoneStr}</td>
              <td>${execName}</td>
              <td>${sourceStr}</td>
              <td>${projectStr}</td>
              <td>${locationStr}</td>
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
      handlePreview(html, `JB_${fileCode}_MARKETING_ENQUIRY_SHEET_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting enquiries');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportSiteVisitsExcel = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Fetching site visit records for selected period...');
      const currentStats = providedStats || await ensureStats();
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
        // 1. Must have conducted a site visit at any point (current status or history)
        const hasSiteVisitHistory = lead.history?.some(h => 
          h.status === 'Site Visit' || 
          h.status === 'Site Visit Follow-up' || 
          (h.stageName && h.stageName.toLowerCase().includes('site visit'))
        );
        const isSiteVisit = 
          lead.status === 'Site Visit' || 
          lead.status === 'Site Visit Follow-up' || 
          Boolean(lead.siteVisitDate) || 
          hasSiteVisitHistory || 
          (lead.closeRemarks && lead.closeRemarks.toLowerCase().includes('site visit'));

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
      const projectList = currentStats?.projects || stats.projects || [];
      const projectTitle = selectedProject 
        ? (projectList.find(p => p._id === selectedProject)?.code || 'PROJECT')
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 10, "#0F5233")}
          <!-- Table Headers -->
          <tr class="table-headers">
            <th>S.No</th>
            <th>SiteVisitDate</th>
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

      // Group leads by assigned executive
      const groupedByExec = {};
      filtered.forEach(lead => {
        const execName = lead.assignedTo?.name || 'UNASSIGNED';
        if (!groupedByExec[execName]) groupedByExec[execName] = [];
        groupedByExec[execName].push(lead);
      });

      let globalSNo = 1;

      Object.keys(groupedByExec).forEach(execName => {
        const leadsList = groupedByExec[execName];
        // Sort chronologically by date
        leadsList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Executive banner row
        html += `
          <tr>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner text-red"><span style="color: red; font-weight: bold;">${execName}</span></td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
          </tr>
        `;

        // Lead rows
        leadsList.forEach(lead => {
          // Check for specific site visit date or use createdAt as fallback
          let siteVisitDate = lead.siteVisitDate;
          if (!siteVisitDate && lead.history) {
            const svEntry = lead.history.find(h => h.status === 'Site Visit' || h.status === 'Site Visit Follow-up');
            if (svEntry) siteVisitDate = svEntry.timestamp;
          }
          const dateStr = siteVisitDate 
            ? new Date(siteVisitDate).toLocaleDateString('en-GB').replace(/\//g, '.')
            : new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.');

          const phoneStr = lead.phone || '&nbsp;';
          const sourceStr = lead.leadSource || '&nbsp;';
          const projectStr = lead.project?.name || lead.project?.code || 'Potheri';
          const locationStr = lead.address || lead.location || '&nbsp;';
          const statusStr = formatLeadStatusForReport(lead);
          const remarksStr = getFormattedLeadRemarks(lead, '&nbsp;');

          html += `
            <tr>
              <td>${globalSNo++}</td>
              <td>${dateStr}</td>
              <td class="text-left font-bold">${lead.name || '&nbsp;'}</td>
              <td>${phoneStr}</td>
              <td>${execName}</td>
              <td>${sourceStr}</td>
              <td>${projectStr}</td>
              <td>${locationStr}</td>
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
      handlePreview(html, `JB_${fileCode}_SITE_VISIT_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting site visits');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportHotListExcel = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Fetching hot list records for selected period...');
      const currentStats = providedStats || await ensureStats();
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
      const projectList = currentStats?.projects || stats.projects || [];
      const projectTitle = selectedProject 
        ? (projectList.find(p => p._id === selectedProject)?.code || 'PROJECT')
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 10, "#0F5233")}
          <!-- Table Headers -->
          <tr class="table-headers">
            <th>S.No</th>
            <th>EnquiryDate</th>
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

      // Group leads by assigned executive
      const groupedByExec = {};
      filtered.forEach(lead => {
        const execName = lead.assignedTo?.name || 'UNASSIGNED';
        if (!groupedByExec[execName]) groupedByExec[execName] = [];
        groupedByExec[execName].push(lead);
      });

      let globalSNo = 1;

      Object.keys(groupedByExec).forEach(execName => {
        const leadsList = groupedByExec[execName];
        // Sort chronologically by date
        leadsList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Executive banner row
        html += `
          <tr>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner text-red"><span style="color: red; font-weight: bold;">${execName}</span></td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
            <td class="exec-banner">&nbsp;</td>
          </tr>
        `;

        // Lead rows
        leadsList.forEach(lead => {
          const dateStr = new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.');
          const phoneStr = lead.phone || '&nbsp;';
          const sourceStr = lead.leadSource || '&nbsp;';
          const projectStr = lead.project?.name || lead.project?.code || 'Potheri';
          const locationStr = lead.address || lead.location || '&nbsp;';
          const statusStr = formatLeadStatusForReport(lead);
          const remarksStr = getFormattedLeadRemarks(lead, '&nbsp;');

          html += `
            <tr>
              <td>${globalSNo++}</td>
              <td>${dateStr}</td>
              <td class="text-left font-bold">${lead.name || '&nbsp;'}</td>
              <td>${phoneStr}</td>
              <td>${execName}</td>
              <td>${sourceStr}</td>
              <td>${projectStr}</td>
              <td>${locationStr}</td>
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
      handlePreview(html, `JB_${fileCode}_HOT_LIST_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting hot list');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportBookingsExcel = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Fetching booking details for selected period...');
      const currentStats = providedStats || await ensureStats();
      const res = await fetch(`${API_URL}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const quotRes = await fetch(`${API_URL}/quotations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load lead details for export');
        return;
      }
      const data = await res.json();
      let allQuotations = [];
      if (quotRes.ok) {
        allQuotations = await quotRes.json();
      }

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
      const projectList = currentStats?.projects || stats.projects || [];
      const projectTitle = selectedProject 
        ? (projectList.find(p => p._id === selectedProject)?.code || 'PROJECT')
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 9, "#0F5233")}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S.NO.</th>
              <th>BOOKED DATE</th>
              <th>CUSTOMER NAME</th>
              <th>CONTACT NO.</th>
              <th>Attended by</th>
              <th>ENQUIRY MODE</th>
              <th>PROJECT</th>
              <th>UNIT NO.</th>
              <th>UNIT VALUE</th>
            </tr>
      `;

      // Sort chronologically by booked/created date (1st to 31st)
      filtered.sort((a, b) => {
        const dA = a.bookingInfo?.bookingDate ? new Date(a.bookingInfo.bookingDate) : new Date(a.createdAt);
        const dB = b.bookingInfo?.bookingDate ? new Date(b.bookingInfo.bookingDate) : new Date(b.createdAt);
        return dA - dB;
      });

      // Lead rows sequentially without exec banner groupings
      filtered.forEach((lead, index) => {
        const bDate = lead.bookingInfo?.bookingDate 
          ? new Date(lead.bookingInfo.bookingDate) 
          : new Date(lead.createdAt);
          
        const dateStr = bDate.toLocaleDateString('en-GB').replace(/\//g, '.');
        const custName = lead.name || '';
        const phoneStr = lead.phone || '';
        const attendedBy = lead.assignedTo?.name || 'UNASSIGNED';
        const enquiryMode = lead.leadSource || 'Direct Visit';
        const projectStr = lead.project?.code || '';
        const unitNo = lead.bookingInfo?.selectedUnits?.join(', ') || '';
        
        const leadQuots = allQuotations.filter(q => (q.lead?._id || q.lead) === lead._id);
        const finalQuot = leadQuots[leadQuots.length - 1];
        const unitValue = finalQuot ? finalQuot.totalValue : (lead.leadCost || 0);
        
        const unitValStr = unitValue.toLocaleString();
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td class="text-center">${dateStr}</td>
            <td class="text-left bold-label">${custName}</td>
            <td>${phoneStr}</td>
            <td>${attendedBy}</td>
            <td class="text-left">${enquiryMode}</td>
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
      handlePreview(html, `JB_${fileCode}_UNIT_BOOKING_DETAILS_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting bookings report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportSummaryReport = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Fetching abstract and summary plan data...');
      const currentStats = providedStats || await ensureStats();
      const activeMonthStr = fromDate.substring(0, 7);

      // Fetch all required data points in parallel for the active month
      const [targetsRes, statsRes, pStatsRes, mStatsRes, bPlanRes] = await Promise.all([
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
        }),
        fetch(`${API_URL}/budget-plans/${activeMonthStr}`, {
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
      const budgetPlanData = bPlanRes.ok ? await bPlanRes.json() : null;

      // Smart week bucket recalculation helper
      const parseWeekBucketClient = (dateInput, description = '') => {
        const descStr = (description || '').toLowerCase();
        if (descStr.includes('1st week') || descStr.includes('1st wk') || descStr.includes('week 1') || descStr.includes('wk 1') || descStr.includes('week1')) return 'w1';
        if (descStr.includes('2nd week') || descStr.includes('2nd wk') || descStr.includes('week 2') || descStr.includes('wk 2') || descStr.includes('week2')) return 'w2';
        if (descStr.includes('3rd week') || descStr.includes('3rd wk') || descStr.includes('week 3') || descStr.includes('wk 3') || descStr.includes('week3')) return 'w3';
        if (descStr.includes('4th week') || descStr.includes('4th wk') || descStr.includes('week 4') || descStr.includes('wk 4') || descStr.includes('week4')) return 'w4';

        const d = new Date(dateInput);
        const dayOfMonth = d.getDate() || d.getUTCDate();
        if (dayOfMonth <= 8) return 'w1';
        if (dayOfMonth <= 15) return 'w2';
        if (dayOfMonth <= 22) return 'w3';
        return 'w4';
      };

      if (budgetPlanData && budgetPlanData.allocations) {
        Object.keys(marketingStatsData.groups || {}).forEach(gName => {
          if (marketingStatsData.groups[gName]) {
            marketingStatsData.groups[gName].actual = 0;
            marketingStatsData.groups[gName].w1 = 0;
            marketingStatsData.groups[gName].w2 = 0;
            marketingStatsData.groups[gName].w3 = 0;
            marketingStatsData.groups[gName].w4 = 0;
          }
        });

        budgetPlanData.allocations.forEach(alloc => {
          const groupName = alloc.groupName;
          const allocSrc = alloc.source;

          for (let gName in marketingStatsData.groups) {
            const srcMatch = allocSrc && marketingStatsData.groups[gName].sources?.some(s => s.toLowerCase() === allocSrc.toLowerCase());
            const groupMatch = groupName && gName.toLowerCase() === groupName.toLowerCase();
            if (srcMatch || groupMatch) {
              if (alloc.expenses && alloc.expenses.length > 0) {
                alloc.expenses.forEach(exp => {
                  const amt = exp.amount || 0;
                  const week = parseWeekBucketClient(exp.date, exp.description);
                  marketingStatsData.groups[gName].actual += amt;
                  marketingStatsData.groups[gName][week] += amt;
                });
              } else if (alloc.spent > 0) {
                const amt = alloc.spent;
                marketingStatsData.groups[gName].actual += amt;
                marketingStatsData.groups[gName].w4 += amt;
              }
              break;
            }
          }
        });
      }

      // Parse states matching SummaryPlanning.jsx logic
      const sTarget = targetData.salesTarget || 0;
      const hTarget = targetData.villasTarget || targetData.housesTarget || 0;
      const pTarget = targetData.plotsTarget || 0;

      const currentAchieved = {
        salesValue: statsData.current?.salesValue || 0,
        flatsCount: statsData.current?.flatsCount || 0,
        villasCount: statsData.current?.villasCount || statsData.current?.housesCount || 0,
        plotsCount: statsData.current?.plotsCount || 0
      };
      const lastMonthAchieved = {
        salesValue: statsData.lastMonth?.salesValue || 0,
        flatsCount: statsData.lastMonth?.flatsCount || 0,
        villasCount: statsData.lastMonth?.villasCount || statsData.lastMonth?.housesCount || 0,
        plotsCount: statsData.lastMonth?.plotsCount || 0
      };

      const projectList = currentStats?.projects || stats.projects || [];
      const selectedProjObj = projectList.find(p => p._id === selectedProject);
      const isPlotComposition = selectedProjObj 
        ? (Array.isArray(selectedProjObj.projectType) 
            ? selectedProjObj.projectType.some(t => String(t).toLowerCase().includes('plot')) 
            : String(selectedProjObj.projectType || '').toLowerCase().includes('plot'))
        : (
            projectList.some(p => {
              const pTypes = Array.isArray(p.projectType) ? p.projectType : [p.projectType];
              return pTypes.some(t => String(t).toLowerCase().includes('plot'));
            }) || currentAchieved.plotsCount > 0 || pTarget > 0
          );

      const row2Title = isPlotComposition ? 'Total Plots to be Sold' : 'Total Units to be Sold';
      const row2Unit = isPlotComposition ? 'Plots' : 'Units';
      const row2Target = isPlotComposition ? (pTarget || hTarget) : hTarget;
      const row2AchievedCurrent = isPlotComposition 
        ? (currentAchieved.plotsCount || (currentAchieved.flatsCount + currentAchieved.villasCount) || 0)
        : ((currentAchieved.flatsCount || 0) + (currentAchieved.villasCount || 0) || currentAchieved.plotsCount || 0);
      const row2AchievedLastMonth = isPlotComposition
        ? (lastMonthAchieved.plotsCount || (lastMonthAchieved.flatsCount + lastMonthAchieved.villasCount) || 0)
        : ((lastMonthAchieved.flatsCount || 0) + (lastMonthAchieved.villasCount || 0) || lastMonthAchieved.plotsCount || 0);

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
        marketingTargetsMap[name] = marketingStatsData.groups[name]?.budget || 0;
      });
      marketingTargetsMap['LEADS GENERATED'] = 0;
      marketingTargetsMap['SITE VISIT CONVERSIONS'] = 0;

      if (targetData.marketingTargets) {
        targetData.marketingTargets.forEach(mt => {
          if (mt.target !== undefined && mt.target !== null && mt.target > 0) {
            marketingTargetsMap[mt.name] = mt.target;
          }
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
        if (name.toLowerCase() === 'direct') return; // Filter out direct
        const statsObj = marketingStatsData.groups[name];
        const targetVal = marketingTargetsMap[name] || 0;
        marketingRowsList.push({
          sNo: mSNo++,
          name: name.toUpperCase(),
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            <!-- PHASE 1: Turnover Plan Table -->
              <tr style="height: 65px;">
                <td colspan="2" bgcolor="#FFFFFF" class="logo-cell" style="background-color: #FFFFFF; padding: 4px 8px; text-align: center; vertical-align: middle; border: 1px solid #CBD5E1; height: 65px; width: 150px;">
                  <img src="${LOGO_BASE64}" style="max-height: 55px; max-width: 100%; width: auto; height: 55px; object-fit: contain; display: block; margin: 0 auto;" alt="JOHN BUILDWELL" />
                </td>
                <td colspan="8" bgcolor="#0F5233" class="bg-header-blue font-bold" style="background-color: #0F5233; color: #FFFFFF; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #0D4329; height: 65px; letter-spacing: 0.5px;">
                  JB SALES PARAMETER REPORT
                </td>
              </tr>
              <tr>
                <th bgcolor="#0F5233" class="bg-header-green font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; width: 50px; border: 1px solid #0D4329;">S.No</th>
                <th colspan="2" bgcolor="#0F5233" class="bg-header-green font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; width: 250px; border: 1px solid #0D4329;">TOTAL SALES PROJECTION ${dateForMonth.getFullYear() - 1} - ${dateForMonth.getFullYear().toString().substring(2)}</th>
                <th bgcolor="#0F5233" class="bg-header-green font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; width: 120px; border: 1px solid #0D4329;">TOTAL</th>
                <th bgcolor="#0F5233" class="bg-header-green font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; width: 80px; border: 1px solid #0D4329;">UNIT</th>
                <th bgcolor="#0F5233" class="bg-header-green font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; width: 100px; border: 1px solid #0D4329;">ACHIEVED</th>
                <th bgcolor="#0F5233" class="bg-header-green font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; width: 140px; border: 1px solid #0D4329;">LAST MONTH ACHIEVED</th>
                <th colspan="3" rowspan="2" bgcolor="#0F5233" class="bg-header-green font-bold" style="background-color: #0F5233; color: #FFFFFF; font-size: 12pt; vertical-align: middle; text-align: center; text-transform: uppercase; border: 1px solid #0D4329;">
                  ${shortMonthHeader.toUpperCase()}
                </th>
              </tr>
              <tr>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF;">1</td>
                <td colspan="2" class="text-left font-bold" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">Overall Sales Target</td>
                <td class="text-center font-bold" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #0F5233;">${sTarget}</td>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF;">Crores</td>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">${currentAchieved.salesValue.toFixed(2)}</td>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">${lastMonthAchieved.salesValue.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF;">2</td>
                <td colspan="2" class="text-left font-bold" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">Total Units to be Sold</td>
                <td class="text-center font-bold" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #0F5233;">${hTarget}</td>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF;">Units</td>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">${(currentAchieved.flatsCount || 0) + (currentAchieved.villasCount || 0)}</td>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">${(lastMonthAchieved.flatsCount || 0) + (lastMonthAchieved.villasCount || 0)}</td>
              </tr>
              <tr>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF;">3</td>
                <td colspan="2" class="text-left font-bold" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">Total Plots to be Sold</td>
                <td class="text-center font-bold" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #0F5233;">${pTarget}</td>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF;">Plots</td>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">${currentAchieved.plotsCount || 0}</td>
                <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">${lastMonthAchieved.plotsCount || 0}</td>
                <td colspan="1" bgcolor="#E6F4EA" class="font-bold text-center" style="background-color: #E6F4EA; color: #0F5233; font-size: 10pt; font-weight: bold; border: 1px solid #CBD5E1;">DATE:</td>
                <td colspan="2" bgcolor="#E6F4EA" class="text-center" style="background-color: #E6F4EA; color: #0F5233; font-size: 10pt; font-weight: bold; border: 1px solid #CBD5E1;">${todayFormatted}</td>
              </tr>

              <!-- Spacing row -->
              <tr><td colspan="10" style="border: none; height: 15px;"></td></tr>

              <!-- PHASE 2: Project wise Report Headers -->
              <tr>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">S.NO.</th>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">PROJECT</th>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">DESCRIPTION</th>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">TARGET</th>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">ACTUAL</th>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">% ACHIEVED</th>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">1st Week Actual</th>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">2nd Week Actual</th>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">3rd Week Actual</th>
                <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">4th Week Actual</th>
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
          { label: 'Hot list', target: targets.hotlist, actual: proj.hotlist.actual, w1: proj.hotlist.w1, w2: proj.hotlist.w2, w3: proj.hotlist.w3, w4: proj.hotlist.w4 },
          { label: 'Site Visits', target: targets.sitevisits, actual: proj.sitevisits.actual, w1: proj.sitevisits.w1, w2: proj.sitevisits.w2, w3: proj.sitevisits.w3, w4: proj.sitevisits.w4 },
          { label: 'Booked Units', target: targets.booked, actual: proj.bookedUnits.actual, w1: proj.bookedUnits.w1, w2: proj.bookedUnits.w2, w3: proj.bookedUnits.w3, w4: proj.bookedUnits.w4 },
          { label: 'Booking Value', target: targets.value, actual: proj.bookingValue.actual, w1: proj.bookingValue.w1, w2: proj.bookingValue.w2, w3: proj.bookingValue.w3, w4: proj.bookingValue.w4, isFloat: true }
        ];

        let projTotalPct = 0;
        let projTotalRows = 0;

        rows.forEach((row, rIdx) => {
          const pctText = getPct(row.actual, row.target);
          projTotalPct += getPctVal(row.actual, row.target);
          projTotalRows += 1;

          html += `
            <tr>
              <td bgcolor="#F8FAF8" class="bg-light-green text-center" style="background-color: #F8FAF8; color: #1E293B; vertical-align: middle; border: 1px solid #CBD5E1;">${rIdx + 1}</td>
              ${rIdx === 0 ? `<td rowspan="5" bgcolor="#E6F4EA" class="bg-light-green font-bold text-center" style="background-color: #E6F4EA; color: #0F5233; font-weight: bold; vertical-align: middle; border: 1px solid #CBD5E1;">${proj.code || proj.name}</td>` : ''}
              <td bgcolor="#F8FAF8" class="text-left bg-light-green" style="background-color: #F8FAF8; color: #1E293B; border: 1px solid #CBD5E1;">${row.label}</td>
              <td bgcolor="#F8FAF8" class="text-center bg-light-green" style="background-color: #F8FAF8; color: #1E293B; border: 1px solid #CBD5E1;">${row.target}${row.isFloat ? ' Cr' : ''}</td>
              <td bgcolor="#F8FAF8" class="text-center bg-light-green" style="background-color: #F8FAF8; color: #1E293B; border: 1px solid #CBD5E1;">${row.isFloat ? row.actual.toFixed(2) : row.actual}</td>
              <td class="font-bold text-center" style="background-color: #FFFFFF; color: #0F5233; font-weight: bold; border: 1px solid #CBD5E1;">${pctText}</td>
              <td bgcolor="#F8FAF8" class="text-center bg-light-green" style="background-color: #F8FAF8; color: #1E293B; border: 1px solid #CBD5E1;">${row.isFloat ? row.w1.toFixed(2) : row.w1}</td>
              <td bgcolor="#F8FAF8" class="text-center bg-light-green" style="background-color: #F8FAF8; color: #1E293B; border: 1px solid #CBD5E1;">${row.isFloat ? row.w2.toFixed(2) : row.w2}</td>
              <td bgcolor="#F8FAF8" class="text-center bg-light-green" style="background-color: #F8FAF8; color: #1E293B; border: 1px solid #CBD5E1;">${row.isFloat ? row.w3.toFixed(2) : row.w3}</td>
              <td bgcolor="#F8FAF8" class="text-center bg-light-green" style="background-color: #F8FAF8; color: #1E293B; border: 1px solid #CBD5E1;">${row.isFloat ? row.w4.toFixed(2) : row.w4}</td>
            </tr>
          `;
        });

        const projPerformanceText = projTotalRows > 0 ? `${(projTotalPct / projTotalRows).toFixed(2)}%` : '0.00%';

        html += `
            <tr class="bg-black-row">
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#D1E7DD" class="bg-orange-pct" style="background-color: #D1E7DD; color: #0F5233; font-size: 10pt; font-weight: bold; border: 1px solid #A3CFBB; text-align: center; vertical-align: middle;">${projPerformanceText}</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
            </tr>
        `;
      });

      html += `
            <!-- Spacing row -->
            <tr><td colspan="10" style="border: none; height: 15px;"></td></tr>

            <!-- PHASE 3: Marketing Plan Table -->
            <tr style="height: 65px;">
              <td colspan="2" bgcolor="#FFFFFF" class="logo-cell" style="background-color: #FFFFFF; padding: 4px 8px; text-align: center; vertical-align: middle; border: 1px solid #CBD5E1; height: 65px; width: 150px;">
                <img src="${LOGO_BASE64}" style="max-height: 55px; max-width: 100%; width: auto; height: 55px; object-fit: contain; display: block; margin: 0 auto;" alt="JOHN BUILDWELL" />
              </td>
              <td colspan="8" bgcolor="#0F5233" class="bg-header-blue font-bold" style="background-color: #0F5233; color: #FFFFFF; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #0D4329; height: 65px; letter-spacing: 0.5px;">
                JB MARKETING PARAMETER REPORT
              </td>
            </tr>
            <tr style="height: 26px;">
              <td colspan="10" bgcolor="#E6F4EA" class="bg-header-green font-bold" style="background-color: #E6F4EA; color: #0F5233; font-size: 10pt; height: 26px; text-align: center; vertical-align: middle; font-weight: bold; text-transform: uppercase; border: 1px solid #C3E6CB;">MONTH OF ${monthNames[dateForMonth.getMonth()].toUpperCase()} ${dateForMonth.getFullYear()}</td>
            </tr>
            <tr>
              <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">S.NO.</th>
              <th colspan="2" bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">DESCRIPTION</th>
              <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">BUDGET/ TARGET</th>
              <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">ACTUAL</th>
              <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">% ACHIEVED</th>
              <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">1st Week Actual</th>
              <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">2nd Week Actual</th>
              <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">3rd Week Actual</th>
              <th bgcolor="#0F5233" class="bg-header-blue font-bold text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329;">4th Week Actual</th>
            </tr>
      `;

      marketingRowsList.forEach((row) => {
        const pctText = getPct(row.actual, row.target);
        
        const formatVal = (val, isCurrency) => {
          if (!isCurrency) return val;
          const formatted = Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          return `<div style="display: flex; justify-content: space-between;"><span>₹ </span><span>${formatted}</span></div>`;
        };

        html += `
          <tr>
            <td class="text-center" style="border: 1px solid #CBD5E1; background-color: #FFFFFF;">${row.sNo}</td>
            <td colspan="2" class="text-left font-bold" style="border: 1px solid #CBD5E1; background-color: #FFFFFF; color: #1E293B;">${row.name}</td>
            <td class="text-right" style="padding: 0 4px; border: 1px solid #CBD5E1; background-color: #FFFFFF;">${formatVal(row.target, row.isFloat)}</td>
            <td class="text-right" style="padding: 0 4px; border: 1px solid #CBD5E1; background-color: #FFFFFF;">${formatVal(row.actual, row.isFloat)}</td>
            <td bgcolor="#E6F4EA" class="font-bold text-right bg-light-green" style="background-color: #E6F4EA; color: #0F5233; font-weight: bold; border: 1px solid #CBD5E1;">${pctText}</td>
            <td class="text-right" style="padding: 0 4px; border: 1px solid #CBD5E1; background-color: #FFFFFF;">${formatVal(row.w1, row.isFloat)}</td>
            <td class="text-right" style="padding: 0 4px; border: 1px solid #CBD5E1; background-color: #FFFFFF;">${formatVal(row.w2, row.isFloat)}</td>
            <td class="text-right" style="padding: 0 4px; border: 1px solid #CBD5E1; background-color: #FFFFFF;">${formatVal(row.w3, row.isFloat)}</td>
            <td class="text-right" style="padding: 0 4px; border: 1px solid #CBD5E1; background-color: #FFFFFF;">${formatVal(row.w4, row.isFloat)}</td>
          </tr>
        `;
      });

      html += `
            <tr class="bg-black-row">
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td colspan="2" bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#D1E7DD" class="bg-orange-pct" style="background-color: #D1E7DD; color: #0F5233; font-size: 10pt; font-weight: bold; border: 1px solid #A3CFBB; text-align: center; vertical-align: middle;">${marketingPerformanceText}</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
              <td bgcolor="#F8FAFC" class="bg-black-row" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">&nbsp;</td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Trigger download
      handlePreview(html, `JB_ABSTRACT_OF_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting summary report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportMarketingReturnsReport = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Fetching marketing performance data...');
      const currentStats = providedStats || await ensureStats();
      const groupData = currentStats?.groupStats || stats.groupStats || {};

      // Generate the styled HTML sheet
      const projectList = currentStats?.projects || stats.projects || [];
      const projectTitle = selectedProject 
        ? (projectList.find(p => p._id === selectedProject)?.code || 'PROJECT')
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 7, "#0F5233")}
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
      handlePreview(html, `JB_${fileCode}_MARKETING_RETURNS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting marketing returns report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportLeadSourcesReport = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Fetching lead source distribution data...');
      const currentStats = providedStats || await ensureStats();
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader("JB - LEAD SOURCES PERFORMANCE REPORT", monthTitle, 5, "#0F5233")}
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
              <td>${targetVal || '&nbsp;'}</td>
              <td>${actualVal || '&nbsp;'}</td>
              <td>${convVal || '&nbsp;'}</td>
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
      handlePreview(html, `JB_LEAD_SOURCES_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting lead sources report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportRegistrationReport = async (returnHtml = false) => {
    try {
      setReportLoading(true);
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
            
            const commentsStr = getFormattedLeadRemarks(lead, '');
            const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';

            rowsHtml += `
              <tr ${rowClass}>
                <td>${localSNo++}</td>
                <td>${advDate}</td>
                <td>${projCode}</td>
                <td>${plotNo}</td>
                <td class="text-left bold-label">${custName}</td>
                <td>${projCode}</td>
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 7, "#0F5233")}
            
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
      handlePreview(html, `JB_${fileCode}_REGISTRATION_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting registration report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportKeyHandoverReport = async (returnHtml = false) => {
    try {
      setReportLoading(true);
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader("KEY HANDOVER THIS MONTH TARGET", monthTitle, 6, "#0F5233")}
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
      handlePreview(html, `JB_${fileCode}_KEY_HANDOVER_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting key handover report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportCollectionReport = async (returnHtml = false) => {
    try {
      setReportLoading(true);
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 8, "#0F5233")}
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
      handlePreview(html, `JB_COLLECTION_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting collection report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportBankLoansExcel = async (returnHtml = false) => {
    try {
      setReportLoading(true);
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 8, "#0F5233")}
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
      handlePreview(html, `JB_BANK_LOAN_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting bank loan report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportExtraWorksReport = async (returnHtml = false) => {
    try {
      setReportLoading(true);
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

            const completedDate = (ew.status === 'Completed' || stage.isCompleted)
              ? (ew.completedDate ? new Date(ew.completedDate) : (stage.completedDate ? new Date(stage.completedDate) : (ew.crdAddedDate ? new Date(ew.crdAddedDate) : null)))
              : null;

            extraWorksList.push({
              projectCode: flow.project?.code || 'UNASSIGNED',
              customerName: lead.name || '',
              contactNumber: lead.phone || '',
              unitId: ew.forUnit || flow.unitId || 'N/A',
              extraWorkName: ew.name || '',
              value: ew.amount || 0,
              raisedDate: addedDate,
              completedDate: completedDate,
              remarks: ew.clientNotes || ew.remarks || ew.status || (stage.isCompleted ? 'Completed' : 'Pending'),
              addedAt: addedDate || new Date(0)
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 10, "#0F5233")}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Project Type</th>
              <th>Customer Name</th>
              <th>Contact Number</th>
              <th>Unit</th>
              <th>Extra Work</th>
              <th>Value of Work</th>
              <th>Extra Work Raised On</th>
              <th>Completed On</th>
              <th>Remarks</th>
            </tr>
      `;

      let totalValue = 0;

      extraWorksList.forEach((ew, index) => {
        totalValue += ew.value;
        const phoneStr = ew.contactNumber ? `'${ew.contactNumber}` : '';
        const raisedDateStr = ew.raisedDate ? ew.raisedDate.toLocaleDateString('en-GB').replace(/\//g, '.') : '-';
        const completedDateStr = ew.completedDate ? ew.completedDate.toLocaleDateString('en-GB').replace(/\//g, '.') : '-';
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${ew.projectCode}</td>
            <td class="text-left bold-label">${ew.customerName}</td>
            <td>${phoneStr}</td>
            <td>${ew.unitId}</td>
            <td class="text-left">${ew.extraWorkName}</td>
            <td class="text-right">₹ ${ew.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${raisedDateStr}</td>
            <td>${completedDateStr}</td>
            <td class="text-left">${ew.remarks}</td>
          </tr>
        `;
      });

      // Total Row
      html += `
        <tr class="subtotal-row">
          <td colspan="6" class="text-right">TOTAL VALUE OF EXTRA WORKS</td>
          <td class="text-right">₹ ${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td colspan="3"></td>
        </tr>
      `;

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      handlePreview(html, `JB_EXTRA_WORKS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting extra works report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportComplaintsReport = async (returnHtml = false) => {
    try {
      setReportLoading(true);
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
            unitId: formatUnitWithLabel(flow.unitId || '', flow.project?.projectType),
            description: comp.description || '',
            status: comp.status || 'Pending',
            resolvedAt: comp.resolvedAt ? new Date(comp.resolvedAt) : null
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
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 8, "#0F5233")}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Customer Name</th>
              <th>Project Type</th>
              <th>Unit / Flat / Plot No</th>
              <th>Complaint</th>
              <th>Complaint Raised On</th>
              <th>Completed On</th>
              <th>Status</th>
            </tr>
      `;

      complaintsList.forEach((comp, index) => {
        const raisedDateStr = comp.reportedDate ? comp.reportedDate.toLocaleDateString('en-GB').replace(/\//g, '.') : '-';
        const completedDateStr = comp.resolvedAt ? comp.resolvedAt.toLocaleDateString('en-GB').replace(/\//g, '.') : '-';
        let statusColor = '#ea580c'; // Orange
        if (comp.status === 'Resolved' || comp.status === 'Completed' || comp.status === 'Sent to Client (Completed)') statusColor = '#16a34a'; // Green
        else if (comp.status === 'In Progress' || comp.status === 'Start Work') statusColor = '#2563eb'; // Blue
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td class="text-left bold-label">${comp.customerName}</td>
            <td>${comp.projectType} (${comp.projectCode})</td>
            <td>${comp.unitId}</td>
            <td class="text-left">${comp.description}</td>
            <td>${raisedDateStr}</td>
            <td>${completedDateStr}</td>
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
      handlePreview(html, `JB_COMPLAINTS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting customer complaints report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      setReportLoading(true);
      setReportLoadingText('Fetching filtered data for all reports...');
      window.__isDownloadingAll = true;
      const currentStats = await ensureStats();

      const allSheets = [];

      const convertHtmlToSheet = async (exportFunc, sheetName, label) => {
          setReportLoadingText(`Preparing ${label || sheetName}...`);
          window.__capturedHtml = null;
          await exportFunc(false, currentStats); // It triggers handlePreview
          const htmlString = window.__capturedHtml;
          if (!htmlString) return;
          allSheets.push({ name: sheetName, html: htmlString });
      };

      await convertHtmlToSheet(handleExportSummaryReport, 'Abstract', 'Abstract of Report');
      await convertHtmlToSheet(handleExportEnquiriesExcel, 'Enquiries', 'Enquiry Sheet');
      await convertHtmlToSheet(handleExportSiteVisitsExcel, 'Site Visits', 'Site Visit Sheet');
      await convertHtmlToSheet(handleExportHotListExcel, 'Hot List', 'Hot List Sheet');
      await convertHtmlToSheet(handleExportBookingsExcel, 'Bookings', 'Booking Sheet');
      await convertHtmlToSheet(handleExportMarketingReturnsReport, 'Marketing Returns', 'Marketing Performance');
      await convertHtmlToSheet(handleExportLeadSourcesReport, 'Lead Sources', 'Lead Sources');
      
      if (allSheets.length > 0) {
        setPreviewSheets(allSheets);
        setCurrentSheetIndex(0);
        setPreviewHtml(allSheets[0].html);
        setPreviewFilename(`JB_COMBINED_REPORT_${new Date().getFullYear()}_${new Date().getMonth() + 1}.xlsx`);
        setPreviewModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error previewing combined report');
    } finally {
      window.__isDownloadingAll = false;
      setReportLoading(false);
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

  const getSourcesData = () => {
    const budgetData = [];
    const spentData = [];
    const networthData = [];

    Object.keys(stats.sourceStats || {}).forEach(src => {
      const s = stats.sourceStats[src];
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
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header & Global Filters */}
      <div className="bg-white border border-black-150 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-[#0e623a]/5 to-transparent pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-[#0e623a]/10 text-[#0e623a] rounded-2xl border border-[#0e623a]/20">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-black-800 tracking-tight">Sales Reports</h1>
              {loading && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#0e623a] rounded-full text-xs font-bold animate-pulse shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 text-[#0e623a] animate-spin" />
                  <span>Syncing filtered data...</span>
                </div>
              )}
            </div>
            {/* <p className="text-xs text-black-500 mt-1">Download operational and performance reports.</p> */}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* User Filter */}
          {(user?.role === 'Superadmin' || user?.role === 'Superadmin') && (
            <div className="flex items-center bg-black-50 border border-black-200 rounded-xl px-3 py-2">
              <User className="w-4 h-4 text-black-400 mr-2" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-transparent text-xs font-bold text-black-700 focus:outline-none cursor-pointer"
              >
                <option value="">All Users</option>
                {(stats.users || []).map(u => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Project Filter */}
          <div className="flex items-center bg-black-50 border border-black-200 rounded-xl px-3 py-2">
            <FolderOpen className="w-4 h-4 text-black-400 mr-2" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent text-xs font-bold text-black-700 focus:outline-none cursor-pointer"
            >
              <option value="">All Projects</option>
              {(stats.projects || []).map(p => (
                <option key={p._id} value={p._id}>{p.code || p.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range & Presets Filter */}
          <div className="w-full lg:w-auto">
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onDateChange={(newFrom, newTo) => {
                setFromDate(newFrom);
                setToDate(newTo);
              }}
              label="Date Range & Presets"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div 
            onClick={handleDownloadAll}
            className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
          >
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
              <Download className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide">Download All Reports</h3>
            {/* <p className="text-[11px] text-emerald-600 font-semibold">Generate a single master workbook with all reports as separate tabs.</p> */}
          </div>

        
        <div 
          onClick={handleExportSummaryReport}
          className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-indigo-800 uppercase tracking-wide">Abstract of Report</h3>
          {/* <p className="text-[11px] text-indigo-500 font-semibold">Complete overview of all leads, statuses, and values.</p> */}
        </div>

        <div 
          onClick={handleExportEnquiriesExcel}
          className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide">Enquiry Sheet</h3>
          {/* <p className="text-[11px] text-emerald-500 font-semibold">Active and followed-up enquiries.</p> */}
        </div>

        <div 
          onClick={handleExportSiteVisitsExcel}
          className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-blue-800 uppercase tracking-wide">Site Visit Sheet</h3>
          {/* <p className="text-[11px] text-blue-500 font-semibold">Leads that progressed to site visits.</p> */}
        </div>

        <div 
          onClick={handleExportHotListExcel}
          className="bg-orange-50 border border-orange-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-orange-800 uppercase tracking-wide">Hot List Sheet</h3>
          {/* <p className="text-[11px] text-orange-500 font-semibold">Highly qualified, potential closing leads.</p> */}
        </div>

        <div 
          onClick={handleExportBookingsExcel}
          className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-green-100 text-green-600 rounded-2xl">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-green-800 uppercase tracking-wide">Booking Sheet</h3>
          {/* <p className="text-[11px] text-green-500 font-semibold">Successfully closed bookings and amounts.</p> */}
        </div>

        <div 
          onClick={handleExportMarketingReturnsReport}
          className="bg-cyan-50 border border-cyan-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-cyan-100 text-cyan-600 rounded-2xl">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-cyan-800 uppercase tracking-wide">Marketing Performance</h3>
          {/* <p className="text-[11px] text-cyan-500 font-semibold">Conversion rates, CPE, and source performance.</p> */}
        </div>

        <div 
          onClick={handleExportLeadSourcesReport}
          className="bg-teal-50 border border-teal-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-teal-100 text-teal-600 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-teal-800 uppercase tracking-wide">Lead Sources</h3>
          {/* <p className="text-[11px] text-teal-500 font-semibold">Detailed breakdown of lead origins and counts.</p> */}
        </div>

      </div>

      {/* Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                {previewSheets.length > 0 ? `${previewSheets[currentSheetIndex].name} - Preview` : 'Report Preview'}
              </h2>
              
              {previewSheets.length > 0 && (
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const newIdx = Math.max(0, currentSheetIndex - 1);
                        setCurrentSheetIndex(newIdx);
                        setPreviewHtml(previewSheets[newIdx].html);
                      }}
                      disabled={currentSheetIndex === 0}
                      className="px-4 py-1.5 rounded-lg font-bold text-gray-600 bg-white border hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      &larr; Prev Sheet
                    </button>
                    <span className="font-bold text-sm text-gray-600">
                      {currentSheetIndex + 1} of {previewSheets.length}
                    </span>
                    <button 
                      onClick={() => {
                        const newIdx = Math.min(previewSheets.length - 1, currentSheetIndex + 1);
                        setCurrentSheetIndex(newIdx);
                        setPreviewHtml(previewSheets[newIdx].html);
                      }}
                      disabled={currentSheetIndex === previewSheets.length - 1}
                      className="px-4 py-1.5 rounded-lg font-bold text-gray-600 bg-white border hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Next Sheet &rarr;
                    </button>
                 </div>
              )}

              <button 
                onClick={() => setPreviewModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition ml-4"
              >
                <div className="w-6 h-6 flex items-center justify-center font-bold text-xl leading-none">&times;</div>
              </button>
            </div>

            {/* Modal Body (Scrollable HTML Preview) */}
            <div className="p-6 overflow-auto flex-1 bg-gray-100">
              <div 
                className="bg-white shadow-sm border p-4 inline-block min-w-full"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-white border hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={downloadFromPreview}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Download Excel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ⏳ Loading Spinner Overlay */}
      {reportLoading && !previewModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-black-100 flex flex-col items-center gap-4 text-center max-w-sm animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
              <Loader2 className="w-8 h-8 text-[#0e623a] animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black-800">{reportLoadingText || 'Generating Report Preview'}</h3>
              <p className="text-xs font-semibold text-black-450 mt-1">Please wait while exact filtered data is fetched and formatted...</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExportReports;
