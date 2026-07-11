import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import * as XLSX from 'xlsx-js-style';
import { htmlToStyledSheet } from '../utils/htmlToSheet';
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
  AlertCircle
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeCpeDrillDown, setActiveCpeDrillDown] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [crdMenuOpen, setCrdMenuOpen] = useState(false);

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewFilename, setPreviewFilename] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSheets, setPreviewSheets] = useState([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [previewOriginalWs, setPreviewOriginalWs] = useState(null);

  const handlePreview = (content, filename, isWorksheet = false) => {
    let htmlContent = content;
    if (isWorksheet) {
        htmlContent = XLSX.utils.sheet_to_html(content, { editable: false });
        htmlContent = `<div class="p-4 bg-white"><style>table{border-collapse:collapse;width:100%} td,th{border:1px solid #ddd;padding:8px;text-align:left;}</style>${htmlContent}</div>`;
    }

    if (window.__isDownloadingAll) {
      window.__capturedHtml = htmlContent;
      window.__capturedWs = isWorksheet ? content : null;
      return;
    }
    setPreviewSheets([]);
    setPreviewHtml(htmlContent);
    setPreviewFilename(filename);
    setPreviewOriginalWs(isWorksheet ? content : null);
    setPreviewModalOpen(true);
  };
  
  const downloadFromPreview = () => {
    if (previewSheets && previewSheets.length > 0) {
      const wb = XLSX.utils.book_new();
      for (const sheet of previewSheets) {
          if (sheet.originalWs) {
              XLSX.utils.book_append_sheet(wb, sheet.originalWs, sheet.name);
              continue;
          }
          const div = document.createElement('div');
          div.innerHTML = sheet.html;
          const table = div.querySelector('table');
          if (!table) continue;
          
          const styleBlock = div.querySelector('style');
          let titleBg = 'FCE4D6', monthBg = 'DDEBF7', headerBg = 'FCE4D6', execBg = 'DDEBF7';
          if (styleBlock) {
             const css = styleBlock.innerHTML;
             const mTitle = css.match(/\.title-row\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
             if (mTitle) titleBg = mTitle[1];
             const mMonth = css.match(/\.month-header\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
             if (mMonth) monthBg = mMonth[1];
             const mHeader = css.match(/\.table-headers\s*th\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
             if (mHeader) headerBg = mHeader[1];
             const mExec = css.match(/\.exec-banner\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
             if (mExec) execBg = mExec[1];
             if (!mExec) {
                const mGroup = css.match(/\.group-banner\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
                if (mGroup) execBg = mGroup[1];
             }
          }

          const ws = XLSX.utils.table_to_sheet(table, { raw: true });
          const borderStyle = { style: 'thin', color: { rgb: '000000' } };
          const border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
          
          for (let cellRef in ws) {
            if (cellRef[0] === '!') continue;
            const cell = ws[cellRef];
            const coord = XLSX.utils.decode_cell(cellRef);
            const rowNum = coord.r;
            
            cell.s = {
              border: border,
              font: { name: 'Calibri', sz: 10, color: { rgb: '000000' } },
              alignment: { vertical: 'center', horizontal: 'center', wrapText: true }
            };

            const tr = table.rows[rowNum];
            if (!tr) continue;
            const cellClasses = table.rows[rowNum].cells[coord.c]?.className || '';
            const rowClasses = tr.className || '';
            const allClass = cellClasses + ' ' + rowClasses;

            if (allClass.includes('title-row') || rowNum === 0) {
              cell.s.fill = { fgColor: { rgb: titleBg } };
              cell.s.font.bold = true;
              cell.s.font.sz = 14;
              if (coord.c > 1) cell.s.alignment.horizontal = 'left';
              if (rowNum === 0 && coord.c < 2) {
                 cell.s.fill = { fgColor: { rgb: '0E623A' } };
                 cell.s.font.color = { rgb: 'FFFFFF' };
                 cell.s.font.bold = true;
                 cell.s.font.sz = 18;
                 if (coord.c === 0 && (!cell.v || cell.v.trim() === '')) {
                   cell.v = "JOHN BUILDWELL";
                   cell.t = "s";
                 }
              }
            }
            else if (allClass.includes('month-header')) {
              cell.s.fill = { fgColor: { rgb: monthBg } };
              cell.s.font.bold = true;
            }
            else if (allClass.includes('table-headers')) {
              cell.s.fill = { fgColor: { rgb: headerBg } };
              cell.s.font.bold = true;
            }
            else if (allClass.includes('exec-banner') || allClass.includes('group-banner')) {
              cell.s.fill = { fgColor: { rgb: execBg } };
              cell.s.font.bold = true;
              cell.s.alignment.horizontal = 'left';
            }
            else if (allClass.includes('bg-header-blue')) {
              cell.s.fill = { fgColor: { rgb: '5B9BD5' } };
              cell.s.font.bold = true;
            }
            else if (allClass.includes('bg-header-green')) {
              cell.s.fill = { fgColor: { rgb: 'C6E0B4' } };
              cell.s.font.bold = true;
            }
            else if (allClass.includes('bg-black-row')) {
              cell.s.fill = { fgColor: { rgb: 'D9D9D9' } };
            }
            else if (allClass.includes('bg-orange-pct')) {
               cell.s.fill = { fgColor: { rgb: 'F8CBAD' } };
               cell.s.font.bold = true;
            }
            
            if (allClass.includes('text-left')) cell.s.alignment.horizontal = 'left';
            if (allClass.includes('text-right')) cell.s.alignment.horizontal = 'right';
            if (allClass.includes('font-bold')) cell.s.font.bold = true;
          }

          const colWidths = [];
          for (let cellRef in ws) {
            if (cellRef[0] === '!') continue;
            const cell = ws[cellRef];
            const coord = XLSX.utils.decode_cell(cellRef);
            if (coord.r === 0 || coord.r === 1) continue; 
            const val = cell.v ? cell.v.toString() : '';
            const valLen = val.length;
            const currentWidth = colWidths[coord.c] || 15;
            colWidths[coord.c] = Math.max(currentWidth, Math.min(valLen + 5, 100)); 
          }
          ws['!cols'] = colWidths.map(w => ({ wch: w || 15 }));
          ws['!rows'] = [{ hpt: 60 }]; 
          XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      }
      XLSX.writeFile(wb, previewFilename);
      setPreviewModalOpen(false);
      return;
    }

    if (previewOriginalWs) {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, previewOriginalWs, "Report");
        XLSX.writeFile(wb, previewFilename);
        setPreviewModalOpen(false);
        return;
    }

    const blob = new Blob([previewHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = previewFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPreviewModalOpen(false);
  };



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
      handlePreview(html, `JB_ENQUIRY_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

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
      handlePreview(html, `JB_SITE_VISIT_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

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
      handlePreview(html, `JB_HOT_LIST_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

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
      handlePreview(html, `JB_UNIT_BOOKING_DETAILS_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

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
      handlePreview(html, `JB_SUMMARY_OF_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

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
      handlePreview(html, `JB_MARKETING_RETURNS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

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
      handlePreview(html, `JB_LEAD_SOURCES_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting lead sources report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportNPACollectedReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load NPA Collected Report details for export');
        return;
      }
      const data = await res.json();

      // Apply active dashboard filters
      const filtered = data.filter(flow => {
        // Project filter
        if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return false;

        // User/Executive filter
        if (selectedUser && (flow.lead?.assignedTo?._id || flow.lead?.assignedTo) !== selectedUser) return false;

        return true;
      });

      if (filtered.length === 0) {
        alert('No NPA Collected records found for the selected filters.');
        return;
      }

      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const targetMonth = dateForMonth.getMonth();
      const targetYear = dateForMonth.getFullYear();

      const getWeeklyCollections = (flow) => {
        let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
        if (flow.stages) {
          flow.stages.forEach(stage => {
            if (stage.payments) {
              stage.payments.forEach(p => {
                const pDate = new Date(p.date);
                if (pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear) {
                  const day = pDate.getDate();
                  const amt = Number(p.amount) || 0;
                  if (day >= 1 && day <= 7) w1 += amt;
                  else if (day >= 8 && day <= 14) w2 += amt;
                  else if (day >= 15 && day <= 21) w3 += amt;
                  else w4 += amt;
                }
              });
            }
          });
        }
        return { w1, w2, w3, w4 };
      };

      const projectTitle = selectedProject 
        ? (stats.projects.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';
      const titleText = projectTitle 
        ? `JB - ${projectTitle.toUpperCase()} NPA COLLECTED REPORT`
        : `JB - NPA COLLECTED REPORT`;
        
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const monthTitle = `MONTH OF ${monthNames[targetMonth]} - ${targetYear}`;

      // Build HTML
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#0E623A", "#D1FAE5", "#0E623A", "#0E623A")}
        </head>
        <body>
          <table>
            <col width="60" />
            <col width="250" />
            <col width="150" />
            <col width="150" />
            <col width="150" />
            <col width="150" />
            <col width="150" />
            <col width="120" />
            <col width="120" />
            <col width="120" />
            <col width="120" />
            ${getExcelHeader(titleText, monthTitle, 11, "#0E623A", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S.NO.</th>
              <th>LEAD NAME</th>
              <th>PROJECT TYPE</th>
              <th>UNIT NO</th>
              <th>TOTAL AMOUNT</th>
              <th>DEBTORS AMOUNT</th>
              <th>TARGET AMOUNT</th>
              <th>WEEK 1</th>
              <th>WEEK 2</th>
              <th>WEEK 3</th>
              <th>WEEK 4</th>
            </tr>
      `;

      filtered.forEach((flow, index) => {
        const weeks = getWeeklyCollections(flow);
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';
        const projType = Array.isArray(flow.project?.projectType) ? flow.project.projectType.join(', ') : (flow.project?.projectType || 'N/A');

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td class="text-left bold-label">${flow.lead?.name || 'N/A'}</td>
            <td>${projType}</td>
            <td>${flow.unitId || 'N/A'}</td>
            <td class="text-right">${(flow.totalCurrentValue || 0).toLocaleString()}</td>
            <td class="text-right">${(flow.debtorsAmount || 0).toLocaleString()}</td>
            <td class="text-right">${(flow.targetAmount || 0).toLocaleString()}</td>
            <td class="text-right">${weeks.w1.toLocaleString()}</td>
            <td class="text-right">${weeks.w2.toLocaleString()}</td>
            <td class="text-right">${weeks.w3.toLocaleString()}</td>
            <td class="text-right">${weeks.w4.toLocaleString()}</td>
          </tr>
        `;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      handlePreview(html, `JB_NPA_COLLECTED_REPORT_${targetYear}_${targetMonth + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting NPA Collected Report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportRegistrationReport = async (options = {}) => {

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
              <td colspan="6" class="group-banner">${projCode.toUpperCase()}</td>
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
            const pType = flow.project?.projectType;
            const typeRaw = (Array.isArray(pType) ? pType.join(', ') : pType || '').toLowerCase();
            let houseType = 'Plots';
            if (typeRaw.includes('villa') || typeRaw.includes('house') || typeRaw.includes('individual')) {
              houseType = 'Villa';
            } else if (typeRaw.includes('apartment') || typeRaw.includes('flat')) {
              houseType = 'Flat';
            }

            const lastFlowNote = (flow.history && flow.history.length > 0) 
              ? flow.history[flow.history.length - 1].notes || flow.history[flow.history.length - 1].action 
              : '';
            const commentsStr = lastFlowNote || lead.closeRemarks || '';
            const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';

            rowsHtml += `
              <tr ${rowClass}>
                <td>${localSNo++}</td>
                <td>${advDate}</td>
                <td>${projCode}</td>
                <td>${plotNo}</td>
                <td class="text-left bold-label">${custName}</td>
                <td>${houseType}</td>
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
            ${getExcelHeader(titleText, monthTitle, 6, "#7c3aed", logoPath)}
            
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Adv Date</th>
              <th>Project</th>
              <th>Plot No</th>
              <th>Customer Name</th>
              <th>Project Type</th>
            </tr>
            
            <!-- REGISTERED STAGE LEADS (REGISTRATION THIS MONTH TARGET) -->
            ${buildRowsHtml(groupedRegistered)}

            <!-- REGISTRATION PENDING HEADER -->
            <tr>
              <td colspan="6" class="section-banner">REGISTRATION PENDING</td>
            </tr>
            <tr class="table-headers">
              <th>S No</th>
              <th>Adv Date</th>
              <th>Project</th>
              <th>Plot No</th>
              <th>Customer Name</th>
              <th>Project Type</th>
            </tr>

            <!-- PENDING STAGE LEADS (REGISTRATION PENDING) -->
            ${buildRowsHtml(groupedPending)}
          </table>
        </body>
        </html>
      `;

      if (options.returnWorksheet) {
        return htmlToStyledSheet(html, XLSX);
      }
      // Trigger download
      handlePreview(html, `JB_REGISTRATION_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting registration report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportKeyHandoverReport = async (options = {}) => {
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
            ${getExcelHeader("KEY HANDOVER REPORT", monthTitle, 6, "#7c3aed", logoPath)}
            <tr class="table-headers">
              <th>S.no</th>
              <th>Adv Date</th>
              <th>Customer Name</th>
              <th>Project Type</th>
              <th>Unit No</th>
              <th>Status (Key Handover Pending or Completed)</th>
            </tr>
      `;

      // Render all flows in a single table
      filtered.forEach((flow, index) => {
        const lead = flow.lead || {};
        const advDate = lead.bookingInfo?.bookingDate 
          ? new Date(lead.bookingInfo.bookingDate).toLocaleDateString('en-GB').replace(/\//g, '.')
          : '';
        const custName = lead.name || '';
        const unitNo = flow.unitId || '';

        // Determine Status
        const stages = flow.stages || [];
        const handoverStage = stages.find(s => s.name.toLowerCase().includes('handing over') || s.name.toLowerCase().includes('handover')) || stages[stages.length - 1];
        const isCompleted = handoverStage && handoverStage.isCompleted;
        const statusText = isCompleted ? 'Completed' : 'Key Handover Pending';

        // Determine Project Type
        const pType = flow.project?.projectType;
        const typeRaw = (Array.isArray(pType) ? pType.join(', ') : pType || '').toLowerCase();
        let projectType = 'Villa';
        if (typeRaw.includes('villa') || typeRaw.includes('house') || typeRaw.includes('individual')) {
          projectType = 'Villa';
        } else if (typeRaw.includes('apartment') || typeRaw.includes('flat')) {
          projectType = 'Flat';
        } else {
          projectType = 'Land';
        }

        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';
        
        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${advDate}</td>
            <td class="text-left bold-label">${custName}</td>
            <td>${projectType}</td>
            <td>${unitNo}</td>
            <td>${statusText}</td>
          </tr>
        `;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      if (options.returnWorksheet) {
        return htmlToStyledSheet(html, XLSX);
      }
      // Trigger download
      handlePreview(html, `JB_KEY_HANDOVER_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting key handover report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCollectionReport = async (options = {}) => {
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

      if (options.returnWorksheet) {
        return htmlToStyledSheet(html, XLSX);
      }
      // Trigger download
      handlePreview(html, `JB_COLLECTION_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting collection report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBankLoanReport = async (options = {}) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leadsRes = await fetch(`${API_URL}/leads?status=Booking,Cancelled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        alert('Failed to load CRD flows details for export');
        return;
      }
      
      const flowsData = await res.json();
      let allFlows = [...flowsData];
      
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        const pendingLoanLeads = leadsData.filter(l => (l.bankLoan === 'Yes' || l.bookingInfo?.hasLoan === 'Yes') && !flowsData.some(f => f.lead?._id === l._id));
        
        const mockFlows = pendingLoanLeads.map(lead => ({
          _id: `mock-${lead._id}`,
          project: lead.project || {},
          lead: lead,
          unitId: lead.bookingInfo?.selectedUnits?.join(', ') || 'N/A',
          totalCurrentValue: lead.bookingInfo?.loanDetails?.amountRequired || 0,
          stages: [],
          createdAt: lead.createdAt
        }));
        
        allFlows = [...allFlows, ...mockFlows];
      }

      // Helper to extract bank loan details for each client
      const getClientLoanDetails = (flow) => {
        let bankLoanPaid = flow.lead?.bookingInfo?.loanDetails?.disbursedAmount || 0;
        let bankLoanPending = 0;
        const loanPayments = [];

        (flow.stages || []).forEach((stage, sIdx) => {
          const stageLoanPayments = (stage.payments || []).filter(p => p.method === 'Bank Loan');
          stageLoanPayments.forEach(p => {
            bankLoanPaid += p.amount;
            loanPayments.push(p);
          });

          const stagePaidTotal = (stage.payments || []).reduce((sum, p) => sum + p.amount, 0);
          const stagePending = Math.max(0, stage.amount - stagePaidTotal);
          
          const hasBankLoanPayment = stageLoanPayments.length > 0;
          const isBankLoanCustomer = flow.lead?.bankLoan === 'Yes' || flow.lead?.bookingInfo?.hasLoan === 'Yes';
          if (hasBankLoanPayment || isBankLoanCustomer || (flow.stages || []).some(s => (s.payments || []).some(p => p.method === 'Bank Loan'))) {
            bankLoanPending += stagePending;
          }
        });

        const preferredBank = (flow.stages || []).flatMap(s => s.payments || []).find(p => p.method === 'Bank Loan')?.details?.preferredBank || flow.lead?.bookingInfo?.loanDetails?.preferredBank || 'N/A';
        const accountNumber = (flow.stages || []).flatMap(s => s.payments || []).find(p => p.method === 'Bank Loan')?.details?.accountNumber || flow.lead?.bookingInfo?.loanDetails?.accountNumber || 'N/A';
        
        let loanStatus = flow.lead?.bookingInfo?.loanDetails?.loanStatus || 'Pending';

        return { bankLoanPaid, bankLoanPending, loanPayments, preferredBank, accountNumber, loanStatus };
      };

      let loanClients = allFlows.map(flow => {
        return { flow, ...getClientLoanDetails(flow) };
      }).filter(c => {
        const isYesType = c.flow.lead?.bankLoan === 'Yes' || c.flow.lead?.bookingInfo?.hasLoan === 'Yes';
        return (isYesType || c.loanPayments.length > 0);
      });

      // Apply Filters
      loanClients = loanClients.filter(c => {
        if (selectedProject && (c.flow.project?._id || c.flow.project) !== selectedProject) return false;
        if (selectedUser && (c.flow.lead?.assignedTo?._id || c.flow.lead?.assignedTo) !== selectedUser) return false;
        return true;
      });

      if (loanClients.length === 0) {
        alert('No bank loan collection records found for the selected filters.');
        return;
      }

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
            ${getExcelHeader(titleText, "", 10, "#7c3aed", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Customer Name</th>
              <th>Project</th>
              <th>Plot/Unit No</th>
              <th>Project Value</th>
              <th>Financing Bank</th>
              <th>Account Number</th>
              <th>Status</th>
              <th>Loan Disbursed</th>
              <th>Loan Pending</th>
            </tr>
      `;

      let totalDisbursed = 0;
      let totalPending = 0;

      loanClients.forEach((client, index) => {
        totalDisbursed += client.bankLoanPaid;
        totalPending += client.bankLoanPending;
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';
        const projCode = client.flow.project?.code || 'UNASSIGNED';
        const unitId = client.flow.unitId || '';

        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td class="text-left bold-label">${client.flow.lead?.name || 'N/A'}</td>
            <td>${projCode}</td>
            <td>${unitId}</td>
            <td class="text-right">₹ ${(client.flow.totalCurrentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${client.preferredBank}</td>
            <td>${client.accountNumber !== 'N/A' ? client.accountNumber : ''}</td>
            <td style="font-weight: bold; color: ${client.loanStatus === 'Approved' ? '#1d4ed8' : '#b45309'}">${client.loanStatus}</td>
            <td class="text-right text-emerald-800 font-bold">₹ ${client.bankLoanPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right text-amber-700 font-bold">₹ ${client.bankLoanPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      });

      // Total Row
      html += `
        <tr class="subtotal-row">
          <td colspan="8" class="text-right">TOTAL</td>
          <td class="text-right text-emerald-800 font-bold">₹ ${totalDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-right text-amber-700 font-bold">₹ ${totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;

      html += `
          </table>
        </body>
        </html>
      `;

      if (options.returnWorksheet) {
        return htmlToStyledSheet(html, XLSX);
      }
      // Trigger download
      handlePreview(html, `JB_BANK_LOAN_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting bank loan report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExtraWorksReport = async (options = {}) => {
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

      if (options.returnWorksheet) {
        return htmlToStyledSheet(html, XLSX);
      }
      // Trigger download
      handlePreview(html, `JB_EXTRA_WORKS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting extra works report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportComplaintsReport = async (options = {}) => {
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

      if (options.returnWorksheet) {
        return htmlToStyledSheet(html, XLSX);
      }
      // Trigger download
      handlePreview(html, `JB_COMPLAINTS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);

    } catch (err) {
      console.error(err);
      alert('Error exporting customer complaints report');
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyCollections = (flow) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    
    if (flow.stages) {
      flow.stages.forEach(stage => {
        if (stage.payments) {
          stage.payments.forEach(p => {
            const pDate = new Date(p.date);
            if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
              const day = pDate.getDate();
              const amt = Number(p.amount) || 0;
              if (day >= 1 && day <= 7) w1 += amt;
              else if (day >= 8 && day <= 14) w2 += amt;
              else if (day >= 15 && day <= 21) w3 += amt;
              else w4 += amt;
            }
          });
        }
      });
    }
    
    return { w1, w2, w3, w4 };
  };

  const handleExportNPAReport = async (options = {}) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch CRD Flows');
      const data = await res.json();
      
      const filteredFlows = data.filter(flow => {
        if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return false;
        if (selectedUser && (flow.lead?.assignedTo?._id || flow.lead?.assignedTo) !== selectedUser) return false;
        return true;
      });

      if (filteredFlows.length === 0) {
        alert('No records found for the selected filters.');
        return;
      }

      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const titleText = `OVERALL COLLECTED REPORT - ${monthNames[dateForMonth.getMonth()]} ${dateForMonth.getFullYear()}`;

      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 11, "#7c3aed", logoPath)}
            <tr class="table-headers">
              <th>S.No</th>
              <th>Lead Name</th>
              <th>Project Type</th>
              <th>Unit No</th>
              <th>Total Amount</th>
              <th>Debtors Amount</th>
              <th>Target Amount</th>
              <th>Week 1</th>
              <th>Week 2</th>
              <th>Week 3</th>
              <th>Week 4</th>
            </tr>
      `;

      filteredFlows.forEach((flow, index) => {
        const weeks = getWeeklyCollections(flow);
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';
        const projectType = Array.isArray(flow.project?.projectType) ? flow.project.projectType.join(', ') : (flow.project?.projectType || 'N/A');
        
        html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td class="text-left bold-label">${flow.lead?.name || 'N/A'}</td>
            <td>${projectType}</td>
            <td>${flow.unitId || 'N/A'}</td>
            <td class="text-right font-bold">₹ ${(flow.totalCurrentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right" style="color: #e11d48; font-weight: bold;">₹ ${(flow.debtorsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right" style="color: #0e623a; font-weight: bold;">₹ ${(flow.targetAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">₹ ${weeks.w1.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">₹ ${weeks.w2.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">₹ ${weeks.w3.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">₹ ${weeks.w4.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      if (options.returnWorksheet) {
        return htmlToStyledSheet(html, XLSX);
      }
      
      handlePreview(html, `JB_OVERALL_COLLECTED_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
    } catch (err) {
      console.error(err);
      alert('Error exporting NPA Collected Report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportParameterReport = (options = {}) => {
    try {
      setLoading(true);

      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const monthYearTitle = `COLLECTION PARAMETER REPORT ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;

      const ws = XLSX.utils.aoa_to_sheet([]);

      const data = [
        [monthYearTitle, "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
        ["S NO", "COLLECTIONS", "TOTAL", "Unit", "TARGET", "ACTUAL", "%", "ACTUAL", "ACTUAL", "ACTUAL", "ACTUAL", "ACTUAL"],
        [1, "No.of Registrations ( 45 days)", 30, "Nos", 13, 0, "0%", 0, "", "", "", ""],
        [2, "No.of Key Handover", 16, "Nos", 6, 0, "0%", 0, "", "", "", ""],
        [3, "Total Debtors", 15.14, "Cr", 5.53, 0.90, "16%", 0.90, "", "", "", ""],
        [4, "Collection Amount (<60 Days)", 8.36, "Cr", 1.03, 0.61, "59%", 0.61, "", "", "", ""],
        [5, "NPA Value (>60 Days)", 6.78, "Cr", 4.5, 0.29, "6%", 0.29, "", "", "", ""],
        [6, "Bank Loans (15 Days)", 8, "Nos", 5, 0, "0%", 0, "", "", "", ""],
        [7, "Critical Customers Issues fixed", 5, "Nos", 0, 0, "#DIV/0!", 0, "", "", "", ""],
        [8, "Customer Compliants (15 Days)", 12, "Nos", 6, 0, "0%", 0, 0, "", "", ""],
        [9, "Additional Work Approvals (15 days)", 12, "Nos", 8, 6, "75%", 3, 3, "", "", ""],
        [10, "To Do tasks", 24, "Nos", 18, 9, "50%", 3, 6, "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "Over all Percentage", "", "", "", "", "#DIV/0!", "", "", "", "", ""]
      ];

      XLSX.utils.sheet_add_aoa(ws, data, { origin: "A1" });

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }
      ];

      ws['!cols'] = [
        { wch: 8 },  { wch: 35 }, { wch: 10 }, { wch: 8 },  
        { wch: 10 }, { wch: 10 }, { wch: 8 },  { wch: 10 }, 
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
      ];

      const headerBorder = {
        top: { style: 'thin', color: { rgb: "000000" } },
        bottom: { style: 'thin', color: { rgb: "000000" } },
        left: { style: 'thin', color: { rgb: "000000" } },
        right: { style: 'thin', color: { rgb: "000000" } }
      };

      for (let R = 0; R < data.length; R++) {
        for (let C = 0; C < 12; C++) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[address]) ws[address] = { v: '', t: 's' };
          
          let cellStyle = {
            border: headerBorder,
            alignment: { horizontal: "center", vertical: "center" },
            font: { name: "Arial", sz: 10, color: { rgb: "000000" } }
          };

          if (R === 0) {
            cellStyle.fill = { fgColor: { rgb: "FFFF00" } };
            cellStyle.font = { name: "Arial", sz: 12, bold: true, color: { rgb: "FF0000" } };
          } else if (R === 1) {
            if (C >= 7) {
              cellStyle.fill = { fgColor: { rgb: "92D050" } };
              cellStyle.font = { name: "Arial", sz: 10, bold: true, color: { rgb: "FF0000" } };
            } else {
              cellStyle.fill = { fgColor: { rgb: "92D050" } };
            }
          } else if (R === 2) {
            cellStyle.fill = { fgColor: { rgb: "A64040" } };
            cellStyle.font = { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } };
          } else {
            if (C === 1 && R !== 14) cellStyle.alignment.horizontal = "left";
          }
          
          ws[address].s = cellStyle;
        }
      }

      if (options.returnWorksheet) return ws;

      handlePreview(ws, COLLECTION_PARAMETER_REPORT__.xlsx, true);
    } catch (err) {
      console.error(err);
      alert('Error exporting Parameter Report');
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

  const handleDownloadAllReports = async () => {
    try {
      setLoading(true);
      window.__isDownloadingAll = true;
      const allSheets = [];

      const convertHtmlToSheet = async (exportFunc, sheetName, isWs = false) => {
          window.__capturedHtml = null;
          window.__capturedWs = null;
          await exportFunc(); // It triggers handlePreview
          
          if (isWs && window.__capturedWs) {
              allSheets.push({ name: sheetName, html: window.__capturedHtml, originalWs: window.__capturedWs });
          } else if (window.__capturedHtml) {
              allSheets.push({ name: sheetName, html: window.__capturedHtml });
          }
      };

      await convertHtmlToSheet(handleExportParameterReport, 'Parameter Report', true);
      await convertHtmlToSheet(handleExportRegistrationReport, 'Registration Report');
      await convertHtmlToSheet(handleExportKeyHandoverReport, 'Key Handover Report');
      await convertHtmlToSheet(handleExportCollectionReport, 'Collection Report');
      await convertHtmlToSheet(handleExportNPAReport, 'NPA Collected Reports', true);
      await convertHtmlToSheet(handleExportComplaintsReport, 'Complaints Report');
      await convertHtmlToSheet(handleExportBankLoanReport, 'Bank Loan Report');
      await convertHtmlToSheet(handleExportExtraWorksReport, 'Extra Works Report');
      
      if (allSheets.length > 0) {
        setPreviewSheets(allSheets);
        setCurrentSheetIndex(0);
        setPreviewHtml(allSheets[0].html);
        if (allSheets[0].originalWs) setPreviewOriginalWs(allSheets[0].originalWs);
        setPreviewFilename(`ALL_CRD_REPORTS_${new Date().toLocaleDateString('en-GB').replace(/\\//g, '-')}.xlsx`);
        setPreviewModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error previewing consolidated reports file');
    } finally {
      window.__isDownloadingAll = false;
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 w-full mx-auto text-left animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 border-b border-black-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-black-800 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-[#0e623a]" />
            <span>CRD Reports</span>
          </h1>
          {/* <p className="text-black-500 text-xs mt-1">
            Download specific CRD reports directly.
          </p> */}
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-black-150 shadow-xs">
          {/* Month Picker */}
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-3.5 h-3.5 text-[#0e623a]" />
            <span className="text-xs font-bold text-black-700">Range:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs font-bold text-black-700 bg-transparent border-b border-black-300 focus:outline-none focus:border-[#0e623a] px-1"
            />
            <span className="text-xs font-bold text-black-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs font-bold text-black-700 bg-transparent border-b border-black-300 focus:outline-none focus:border-[#0e623a] px-1"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">

        {/* Download All Reports */}
        <div 
          onClick={handleDownloadAllReports}
          className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-emerald-100 text-[#0e623a] rounded-2xl">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-[#0e623a] uppercase tracking-wide">Download All Reports</h3>
        </div>

        {/* Parameter Report */}
        <div 
          onClick={handleExportParameterReport}
          className="bg-orange-50 border border-orange-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-orange-800 uppercase tracking-wide">Parameter Report</h3>
          {/* <p className="text-[11px] text-orange-500 font-semibold">Collection parameters, KPIs and task metrics.</p> */}
        </div>
        
        {/* Registration Report */}
        <div 
          onClick={handleExportRegistrationReport}
          className="bg-purple-50 border border-purple-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-purple-800 uppercase tracking-wide">Registration Report</h3>
          {/* <p className="text-[11px] text-purple-500 font-semibold">Registered units and values.</p> */}
        </div>

        {/* Key Handover Report */}
        <div 
          onClick={handleExportKeyHandoverReport}
          className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Key className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-indigo-800 uppercase tracking-wide">Key Handover Report</h3>
          {/* <p className="text-[11px] text-indigo-500 font-semibold">Handed over keys and status.</p> */}
        </div>

        {/* Collection Report */}
        <div 
          onClick={handleExportCollectionReport}
          className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
            <DollarSign className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide">Collection Report</h3>
          {/* <p className="text-[11px] text-emerald-500 font-semibold">Payment tracking and collections.</p> */}
        </div>

        {/* Bank Loan Report */}
        <div 
          onClick={() => {
              if (typeof handleExportBankLoanReport !== 'undefined') handleExportBankLoanReport();
              else if (typeof handleExportBankLoansExcel !== 'undefined') handleExportBankLoansExcel();
          }}
          className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-blue-800 uppercase tracking-wide">Bank Loan Report</h3>
          {/* <p className="text-[11px] text-blue-500 font-semibold">Bank loans associated with units.</p> */}
        </div>

        {/* Extra Works Report */}
        <div 
          onClick={handleExportExtraWorksReport}
          className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-amber-800 uppercase tracking-wide">Extra Works</h3>
          {/* <p className="text-[11px] text-amber-500 font-semibold">Extra works requests and value.</p> */}
        </div>

        {/* Complaints Report */}
        <div 
          onClick={handleExportComplaintsReport}
          className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-rose-800 uppercase tracking-wide">Complaints</h3>
          <p className="text-[11px] text-rose-500 font-semibold">User complaints and statuses.</p>
        </div>

        {/* NPA Collected Report */}
        <div 
          onClick={handleExportNPAReport}
          className="bg-sky-50 border border-sky-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-sky-100 text-sky-600 rounded-2xl">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-sky-800 uppercase tracking-wide">NPA Collected Reports</h3>
          {/* <p className="text-[11px] text-sky-500 font-semibold">Track targets, debtors, and weekly collections.</p> */}
        </div>

        {/*  */}

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
                        if (previewSheets[newIdx].originalWs) setPreviewOriginalWs(previewSheets[newIdx].originalWs);
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
                        if (previewSheets[newIdx].originalWs) setPreviewOriginalWs(previewSheets[newIdx].originalWs);
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
                <CheckCircle className="w-4 h-4" />
                Download Excel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default KPIInsights;
