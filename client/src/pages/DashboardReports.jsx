import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { LOGO_BASE64 } from '../utils/logoBase64';
import { exportHtmlSheetsToExcel } from '../utils/excelExporter';
import { useLocation, useNavigate } from 'react-router-dom';
import DateRangeFilter from '../components/DateRangeFilter';
import {
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Target,
  Search,
  ArrowRight,
  ArrowLeft,
  TrendingDown,
  Building,
  BarChart3,
  Percent,
  FileText,
  User,
  FolderOpen,
  Layers,
  Download,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Eye
} from 'lucide-react';

const DashboardReports = () => {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Active Report Tab: 'summary' | 'user' | 'project' | 'source'
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'summary';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam && ['summary', 'user', 'project', 'source'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

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

  // Filter dropdowns
  const [selectedUserFilter, setSelectedUserFilter] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/dashboard/stats?fromDate=${fromDate || ''}&toDate=${toDate || ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard report stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token, fromDate, toDate]);

  const getExcelHeader = (titleText, dateRangeTitle = '', totalColumns = 7) => {
    const safeCols = Math.max(3, totalColumns);
    const webLogo = LOGO_BASE64;
    return `
      <tr style="height: 68px;">
        <td colspan="2" bgcolor="#FFFFFF" class="logo-cell" style="background-color: #FFFFFF; padding: 4px 8px; text-align: center; vertical-align: middle; border: 1px solid #CBD5E1; height: 68px; width: 140px;">
          ${webLogo ? `<img src="${webLogo}" style="max-height: 56px; max-width: 175px; width: auto; height: 56px; object-fit: contain; display: block; margin: 0 auto;" alt="JOHN BUILDWELL" />` : `<div style="color: #0F5233; font-size: 11pt; font-weight: bold; text-align: center;">JOHN BUILDWELL</div>`}
        </td>
        <td colspan="${safeCols - 2}" bgcolor="#0F5233" class="title-row text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1px solid #0D4329; border-left: none; vertical-align:middle; text-align:center; font-size: 14pt; font-weight: bold; height: 68px; letter-spacing: 0.5px;">
          ${titleText}
        </td>
      </tr>
      ${dateRangeTitle ? `
      <tr>
        <td colspan="${safeCols}" bgcolor="#E6F4EA" class="month-header" style="height: 28px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: #E6F4EA; color: #0F5233; border: 1px solid #C3E6CB; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
          ${dateRangeTitle}
        </td>
      </tr>` : ''}
      <tr><td colspan="${safeCols}" style="border:none; height: 12px; background-color: transparent;"></td></tr>
    `;
  };

  // EXCEL EXPORTERS FOR EACH REPORT
  const handleExportSummaryExcel = async () => {
    if (!stats) return;
    setExporting(true);
    try {
      const inventory = stats.cards?.inventory || {};
      const availableProjCount = inventory.totalProjects || 0;
      const availableProjVal = Object.values(inventory.totalValueByType || {}).reduce((sum, val) => sum + (val || 0), 0);
      const plotProjCount = inventory.projectsByType?.Plot || 0;
      const plotProjVal = (inventory.totalValueByType?.Plot || 0);
      const unitProjCount = (inventory.projectsByType?.Flat || 0) +
        (inventory.projectsByType?.Villa || 0) +
        (inventory.projectsByType?.House || 0) +
        (inventory.projectsByType?.Unit || 0);
      const unitProjVal = (inventory.totalValueByType?.Flat || 0) +
        (inventory.totalValueByType?.Villa || 0) +
        (inventory.totalValueByType?.House || 0) +
        (inventory.totalValueByType?.Unit || 0);

      const dateTitle = (fromDate || toDate) ? `DATE RANGE: ${fromDate || 'START'} TO ${toDate || 'END'}` : '';

      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8"/>
          <style>
            table { border-collapse: collapse; }
            td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
            th { font-weight: bold; background-color: #0F5233; color: #FFFFFF; border: 1px solid #0F5233; text-align: center; }
            .title-row { font-size: 14pt; font-weight: bold; background-color: #0F5233; color: #FFFFFF; }
            .section-banner { font-size: 11pt; font-weight: bold; background-color: #0F5233; color: #FFFFFF; padding: 12px; border: 1px solid #0D4329; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
            .even-row { background-color: #f8fafc; }
            .bold-label { font-weight: bold; color: #0f172a; }
            .summary-row { font-weight: bold; background-color: #E6F4EA; color: #0F5233; }
          </style>
        </head>
        <body>
          <table>
            ${getExcelHeader('OVERALL PERFORMANCE SUMMARY REPORT', dateTitle, 9)}
            
            <tr><td colspan="9" class="section-banner">PART 1: PROJECTS & UNIT TYPE SUMMARY</td></tr>
            <tr>
              <th colspan="3" class="text-left">Metric</th>
              <th colspan="3" class="text-right">Count</th>
              <th colspan="3" class="text-right">Total Value (INR)</th>
            </tr>
            <tr>
              <td colspan="3" class="bold-label text-left">Available Projects (Common)</td>
              <td colspan="3" class="text-right">${availableProjCount}</td>
              <td colspan="3" class="text-right">Rs. ${availableProjVal.toLocaleString()}</td>
            </tr>
            ${plotProjCount > 0 || plotProjVal > 0 ? `
            <tr class="even-row">
              <td colspan="3" class="bold-label text-left">Available Projects (Plot)</td>
              <td colspan="3" class="text-right">${plotProjCount}</td>
              <td colspan="3" class="text-right">Rs. ${plotProjVal.toLocaleString()}</td>
            </tr>` : ''}
            ${unitProjCount > 0 || unitProjVal > 0 ? `
            <tr>
              <td colspan="3" class="bold-label text-left">Available Projects (Unit)</td>
              <td colspan="3" class="text-right">${unitProjCount}</td>
              <td colspan="3" class="text-right">Rs. ${unitProjVal.toLocaleString()}</td>
            </tr>` : ''}
            <tr><td colspan="9" style="border:none; height: 10px;"></td></tr>
            
            <tr>
              <th class="text-left">Project Type</th>
              <th class="text-right">Overall Count</th>
              <th class="text-right">Overall Value (INR)</th>
              <th class="text-right">Available Count</th>
              <th class="text-right">Available Value (INR)</th>
              <th class="text-right">Booked Count</th>
              <th class="text-right">Booked Value (INR)</th>
              <th class="text-right">Handover Count</th>
              <th class="text-right">Handover Value (INR)</th>
            </tr>
      `;

      const candidateTypes = ['Plot', 'Flat', 'Villa', 'Unit'];
      const activeTypes = candidateTypes.filter(type => {
        const overallCount = (inventory.totalByType?.[type] || 0) + (type === 'Villa' ? (inventory.totalByType?.House || 0) : 0);
        return overallCount > 0;
      });
      const typesToRender = activeTypes.length > 0 ? activeTypes : ['Plot', 'Unit'];

      typesToRender.forEach((type, idx) => {
        const overallCount = (inventory.totalByType?.[type] || 0) + (type === 'Villa' ? (inventory.totalByType?.House || 0) : 0);
        const overallVal = (inventory.totalValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.totalValueByType?.House || 0) : 0);
        const availCount = (inventory.availableByType?.[type] || 0) + (type === 'Villa' ? (inventory.availableByType?.House || 0) : 0);
        const availVal = (inventory.availableValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.availableValueByType?.House || 0) : 0);
        const bookedCount = (inventory.bookedByType?.[type] || 0) + (type === 'Villa' ? (inventory.bookedByType?.House || 0) : 0);
        const bookedVal = (inventory.bookedValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.bookedValueByType?.House || 0) : 0);
        const handCount = (inventory.handoverByType?.[type] || 0) + (type === 'Villa' ? (inventory.handoverByType?.House || 0) : 0);
        const handVal = (inventory.handoverValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.handoverValueByType?.House || 0) : 0);

        const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
        htmlContent += `
          <tr ${rowClass}>
            <td class="bold-label text-left">${type}</td>
            <td class="text-right">${overallCount}</td>
            <td class="text-right">Rs. ${overallVal.toLocaleString()}</td>
            <td class="text-right">${availCount}</td>
            <td class="text-right">Rs. ${availVal.toLocaleString()}</td>
            <td class="text-right">${bookedCount}</td>
            <td class="text-right">Rs. ${bookedVal.toLocaleString()}</td>
            <td class="text-right">${handCount}</td>
            <td class="text-right">Rs. ${handVal.toLocaleString()}</td>
          </tr>
        `;
      });

      htmlContent += `
            <tr><td colspan="9" style="border:none; height: 16px;"></td></tr>
            <tr><td colspan="9" class="section-banner">PART 2: SALES FINANCIAL CONVERSION</td></tr>
            <tr>
              <th colspan="3" class="text-left">Financial Metric</th>
              <th colspan="3" class="text-right">Count</th>
              <th colspan="3" class="text-right">Amount (INR)</th>
            </tr>
            <tr>
              <td colspan="3" class="bold-label text-left">Booked / Conversion Value</td>
              <td colspan="3" class="text-right">${stats.cards?.conversion?.count || 0} Units</td>
              <td colspan="3" class="text-right">Rs. ${(stats.cards?.conversion?.value || 0).toLocaleString()}</td>
            </tr>
            <tr class="even-row">
              <td colspan="3" class="bold-label text-left">Received Amount</td>
              <td colspan="3" class="text-right">-</td>
              <td colspan="3" class="text-right">Rs. ${(stats.cards?.conversion?.received || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="3" class="bold-label text-left">Pending Balance Amount</td>
              <td colspan="3" class="text-right">-</td>
              <td colspan="3" class="text-right">Rs. ${(stats.cards?.conversion?.pending || 0).toLocaleString()}</td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await exportHtmlSheetsToExcel([{ name: 'Overall Performance', html: htmlContent }], `Overall_Summary_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Error exporting summary report:', err);
      alert('Failed to export Summary Report to Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportUserExcel = async () => {
    if (!stats) return;
    setExporting(true);
    try {
      const dateTitle = (fromDate || toDate) ? `DATE RANGE: ${fromDate || 'START'} TO ${toDate || 'END'}` : '';
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8"/>
          <style>
            table { border-collapse: collapse; }
            td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
            th { font-weight: bold; background-color: #0F5233; color: white; border: 1px solid #0F5233; text-align: center; }
            .title-row { font-size: 14pt; font-weight: bold; background-color: #0F5233; color: #FFFFFF; }
            .section-banner { font-size: 11pt; font-weight: bold; background-color: #E6F4EA; color: #0F5233; padding: 12px; border: 1px solid #C3E6CB; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
            .even-row { background-color: #f8fafc; }
            .bold-label { font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <table>
            ${getExcelHeader('JOHN BUILDWELL ERP - EXECUTIVE WISE PERFORMANCE REPORT', dateTitle, 7)}
      `;

      const targetUsers = selectedUserFilter
        ? [selectedUserFilter]
        : (stats.users || []).map(u => u.name);

      targetUsers.forEach(uName => {
        let uTotalLeads = 0;
        let uEnquiries = 0;
        let uSiteVisits = 0;
        let uHotList = 0;
        let uBooked = 0;
        let uHandover = 0;
        const rows = [];

        Object.keys(stats.personProjectStages || {}).forEach(key => {
          const row = stats.personProjectStages[key];
          if (row.personName === uName) {
            uTotalLeads += row.totalLeads;
            uEnquiries += row.enquiries;
            uSiteVisits += row.siteVisits;
            uHotList += row.hotList;
            uBooked += row.booked;
            uHandover += row.handover;
            rows.push(row);
          }
        });

        htmlContent += `
          <tr><td colspan="7" class="section-banner">USER: ${uName.toUpperCase()} (TOTAL LEADS: ${uTotalLeads})</td></tr>
          <tr>
            <th class="text-left">Project Name</th>
            <th class="text-right">Total Leads</th>
            <th class="text-right">Enquiries</th>
            <th class="text-right">Site Visit</th>
            <th class="text-right">Hot List</th>
            <th class="text-right">Booked</th>
            <th class="text-right">Handover</th>
          </tr>
        `;

        rows.forEach((row, idx) => {
          const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
          htmlContent += `
            <tr ${rowClass}>
              <td class="bold-label text-left">${row.projectName}</td>
              <td class="text-right">${row.totalLeads}</td>
              <td class="text-right">${row.enquiries}</td>
              <td class="text-right">${row.siteVisits}</td>
              <td class="text-right">${row.hotList}</td>
              <td class="text-right">${row.booked}</td>
              <td class="text-right">${row.handover}</td>
            </tr>
          `;
        });

        htmlContent += `<tr><td colspan="7" style="border:none; height:15px;"></td></tr>`;
      });

      htmlContent += `
          </table>
        </body>
        </html>
      `;

      await exportHtmlSheetsToExcel([{ name: 'User Performance', html: htmlContent }], `User_Wise_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Error exporting user report:', err);
      alert('Failed to export User Report to Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportProjectExcel = async () => {
    if (!stats) return;
    setExporting(true);
    try {
      const dateTitle = (fromDate || toDate) ? `DATE RANGE: ${fromDate || 'START'} TO ${toDate || 'END'}` : '';
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8"/>
          <style>
            table { border-collapse: collapse; }
            td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
            th { font-weight: bold; background-color: #0F5233; color: white; border: 1px solid #0F5233; text-align: center; }
            .title-row { font-size: 14pt; font-weight: bold; background-color: #0F5233; color: #FFFFFF; }
            .section-banner { font-size: 11pt; font-weight: bold; background-color: #E6F4EA; color: #0F5233; padding: 12px; border: 1px solid #C3E6CB; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
            .even-row { background-color: #f8fafc; }
            .bold-label { font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <table>
            ${getExcelHeader('JOHN BUILDWELL ERP - PROJECT WISE PERFORMANCE REPORT', dateTitle, 7)}
      `;

      const targetProjects = selectedProjectFilter
        ? [selectedProjectFilter]
        : (stats.projects || []).map(p => p.code || p.name);

      targetProjects.forEach(projName => {
        const stages = stats.projectStages?.[projName] || { totalLeads: 0, enquiries: 0, siteVisits: 0, hotList: 0, booked: 0, handover: 0 };

        htmlContent += `
          <tr><td colspan="7" class="section-banner">PROJECT: ${projName.toUpperCase()}</td></tr>
          <tr>
            <th colspan="3" class="text-left">Workflow Stage</th>
            <th colspan="4" class="text-right">Count</th>
          </tr>
          <tr>
            <td colspan="3" class="bold-label text-left">Total Leads</td>
            <td colspan="4" class="text-right">${stages.totalLeads}</td>
          </tr>
          <tr class="even-row">
            <td colspan="3" class="bold-label text-left">Enquiries</td>
            <td colspan="4" class="text-right">${stages.enquiries}</td>
          </tr>
          <tr>
            <td colspan="3" class="bold-label text-left">Site Visits</td>
            <td colspan="4" class="text-right">${stages.siteVisits}</td>
          </tr>
          <tr class="even-row">
            <td colspan="3" class="bold-label text-left">Hot List</td>
            <td colspan="4" class="text-right">${stages.hotList}</td>
          </tr>
          <tr>
            <td colspan="3" class="bold-label text-left">Booked Units</td>
            <td colspan="4" class="text-right">${stages.booked}</td>
          </tr>
          <tr class="even-row">
            <td colspan="3" class="bold-label text-left">Site Conversion (Handover)</td>
            <td colspan="4" class="text-right">${stages.handover}</td>
          </tr>
          
          <tr><td colspan="7" style="border:none; height:10px;"></td></tr>
          
          <tr>
            <th colspan="2" class="text-left">Executive Name</th>
            <th class="text-right">Total Leads</th>
            <th class="text-right">Enquiries</th>
            <th class="text-right">Site Visit</th>
            <th class="text-right">Hot List</th>
            <th class="text-right">Booked</th>
          </tr>
        `;

        let executiveIdx = 0;
        Object.keys(stats.personProjectStages || {}).forEach(key => {
          const row = stats.personProjectStages[key];
          if (row.projectName === projName) {
            const rowClass = executiveIdx % 2 === 1 ? 'class="even-row"' : '';
            executiveIdx++;
            htmlContent += `
              <tr ${rowClass}>
                <td colspan="2" class="bold-label text-left">${row.personName}</td>
                <td class="text-right">${row.totalLeads}</td>
                <td class="text-right">${row.enquiries}</td>
                <td class="text-right">${row.siteVisits}</td>
                <td class="text-right">${row.hotList}</td>
                <td class="text-right">${row.booked}</td>
              </tr>
            `;
          }
        });

        htmlContent += `<tr><td colspan="7" style="border:none; height:20px;"></td></tr>`;
      });

      htmlContent += `
          </table>
        </body>
        </html>
      `;

      await exportHtmlSheetsToExcel([{ name: 'Project Performance', html: htmlContent }], `Project_Wise_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Error exporting project report:', err);
      alert('Failed to export Project Report to Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSourceExcel = async () => {
    if (!stats) return;
    setExporting(true);
    try {
      const dateTitle = (fromDate || toDate) ? `DATE RANGE: ${fromDate || 'START'} TO ${toDate || 'END'}` : '';
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8"/>
          <style>
            table { border-collapse: collapse; }
            td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
            th { font-weight: bold; background-color: #0F5233; color: white; border: 1px solid #0F5233; text-align: center; }
            .title-row { font-size: 14pt; font-weight: bold; background-color: #0F5233; color: #FFFFFF; }
            .section-banner { font-size: 11pt; font-weight: bold; background-color: #E6F4EA; color: #0F5233; padding: 12px; border: 1px solid #C3E6CB; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
            .even-row { background-color: #f8fafc; }
            .bold-label { font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <table>
            ${getExcelHeader('JOHN BUILDWELL ERP - MARKETING SOURCE PERFORMANCE REPORT', dateTitle, 4)}
            <tr>
              <th class="text-left">Source Type</th>
              <th class="text-right">Budget Allocation</th>
              <th class="text-right">Spent Value</th>
              <th class="text-right">Networth Value</th>
            </tr>
      `;

      const targetSources = selectedSourceFilter
        ? [selectedSourceFilter]
        : Object.keys(stats.sourceStats || {});

      targetSources.forEach((src, idx) => {
        const s = stats.sourceStats?.[src] || { budget: 0, spent: 0, value: 0 };
        const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
        htmlContent += `
          <tr ${rowClass}>
            <td class="bold-label text-left">${src}</td>
            <td class="text-right">Rs. ${(s.budget || 0).toLocaleString()}</td>
            <td class="text-right">Rs. ${(s.spent || 0).toLocaleString()}</td>
            <td class="text-right">Rs. ${(s.value || 0).toLocaleString()}</td>
          </tr>
        `;
      });

      htmlContent += `
          </table>
        </body>
        </html>
      `;

      await exportHtmlSheetsToExcel([{ name: 'Source Performance', html: htmlContent }], `Source_Wise_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Error exporting source report:', err);
      alert('Failed to export Source Report to Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 w-full mx-auto text-left animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-black-800 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#0e623a]" />
            <span>Dashboard Reports</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Access, filter, and export comprehensive Summary, User Performance, Project Wise, and Source Reports
          </p>
        </div>

        {/* 4 Report Navigation / Tab Buttons */}
        <div className="grid grid-cols-2 lg:flex lg:flex-wrap lg:items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-red-600 text-white ring-2 ring-red-400'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Summary Report</span>
          </button>

          <button
            onClick={() => setActiveTab('user')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ${
              activeTab === 'user'
                ? 'bg-green-600 text-white ring-2 ring-green-400'
                : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>User Report</span>
          </button>

          <button
            onClick={() => setActiveTab('project')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ${
              activeTab === 'project'
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Project Report</span>
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ${
              activeTab === 'source'
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Source Report</span>
          </button>
        </div>
      </div>

      {/* Date Range & Dynamic Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Date Filter */}
          <div className="col-span-1 sm:col-span-2">
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onDateChange={(newFrom, newTo) => {
                setFromDate(newFrom);
                setToDate(newTo);
              }}
              onRefresh={fetchStats}
              label="Date Filtration Range"
            />
          </div>

          {/* Contextual Filter Dropdown */}
          {activeTab === 'user' && (
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Filtered User</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-800 font-bold focus:outline-none border-0 p-0"
                >
                  <option value="">All Users</option>
                  {(stats?.users || []).map(u => (
                    <option key={u._id || u.name} value={u.name}>{u.name} ({u.role || 'Staff'})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'project' && (
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Filtered Project</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                <FolderOpen className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={selectedProjectFilter}
                  onChange={(e) => setSelectedProjectFilter(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-800 font-bold focus:outline-none border-0 p-0"
                >
                  <option value="">All Projects</option>
                  {(stats?.projects || []).map(p => (
                    <option key={p._id || p.name} value={p.code || p.name}>{p.code || p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'source' && (
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Filtered Source</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                <Target className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={selectedSourceFilter}
                  onChange={(e) => setSelectedSourceFilter(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-800 font-bold focus:outline-none border-0 p-0"
                >
                  <option value="">All Marketing Sources</option>
                  {Object.keys(stats?.sourceStats || {}).map(src => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Export to Excel Action Button */}
          <div className="w-full">
            <button
              onClick={() => {
                if (activeTab === 'summary') handleExportSummaryExcel();
                else if (activeTab === 'user') handleExportUserExcel();
                else if (activeTab === 'project') handleExportProjectExcel();
                else if (activeTab === 'source') handleExportSourceExcel();
              }}
              disabled={exporting || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0e623a] hover:bg-[#0b4d2d] text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exporting ? 'Exporting Excel...' : `Export ${activeTab.toUpperCase()} to Excel`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Report View Body */}
      {loading ? (
        <div className="py-24 text-center text-gray-400 italic bg-white rounded-3xl border border-gray-200">
          Loading interactive report data...
        </div>
      ) : !stats ? (
        <div className="py-24 text-center text-gray-400 italic bg-white rounded-3xl border border-gray-200">
          No report metrics available.
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
          
          {/* TAB 1: SUMMARY REPORT */}
          {activeTab === 'summary' && (() => {
            const inventory = stats.cards?.inventory || {};
            const availableProjCount = inventory.totalProjects || 0;
            const availableProjVal = Object.values(inventory.totalValueByType || {}).reduce((sum, val) => sum + (val || 0), 0);
            const plotProjCount = inventory.projectsByType?.Plot || 0;
            const plotProjVal = (inventory.totalValueByType?.Plot || 0);
            const unitProjCount = (inventory.projectsByType?.Flat || 0) + (inventory.projectsByType?.Villa || 0) + (inventory.projectsByType?.House || 0) + (inventory.projectsByType?.Unit || 0);
            const unitProjVal = (inventory.totalValueByType?.Flat || 0) + (inventory.totalValueByType?.Villa || 0) + (inventory.totalValueByType?.House || 0) + (inventory.totalValueByType?.Unit || 0);

            const candidateTypes = ['Plot', 'Flat', 'Villa', 'Unit'];
            const activeTypes = candidateTypes.filter(type => {
              const overallCount = (inventory.totalByType?.[type] || 0) + (type === 'Villa' ? (inventory.totalByType?.House || 0) : 0);
              return overallCount > 0;
            });
            const typesToRender = activeTypes.length > 0 ? activeTypes : ['Plot', 'Unit'];

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                  <h3 className="text-base font-extrabold text-black-800 uppercase tracking-wide">
                    Overall Performance Summary Report
                  </h3>
                  <span className="text-xs font-bold text-gray-500">
                    Period: {fromDate || 'Start'} to {toDate || 'End'}
                  </span>
                </div>

                {/* Section 1: Top Inventory Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#f0fbf4] rounded-2xl p-4 border border-emerald-100">
                    <span className="text-xs text-gray-500 font-bold uppercase block">Available Projects (Common)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-[#0e623a]">{availableProjCount}</span>
                      <span className="text-xs font-bold text-gray-600">Rs. {availableProjVal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-[#f0fbf4] rounded-2xl p-4 border border-emerald-100">
                    <span className="text-xs text-gray-500 font-bold uppercase block">Available Projects (Plot)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-[#0e623a]">{plotProjCount}</span>
                      <span className="text-xs font-bold text-gray-600">Rs. {plotProjVal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-[#f0fbf4] rounded-2xl p-4 border border-emerald-100">
                    <span className="text-xs text-gray-500 font-bold uppercase block">Available Projects (Unit)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-[#0e623a]">{unitProjCount}</span>
                      <span className="text-xs font-bold text-gray-600">Rs. {unitProjVal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Units Breakdown Table */}
                <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                  <div className="bg-[#0e623a] text-white p-3 font-bold text-xs uppercase">
                    Part 1: Projects & Unit Type Breakdown
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-[11px] font-bold text-gray-700 uppercase border-b border-gray-200">
                          <th className="p-3">Project Type</th>
                          <th className="p-3 text-right">Overall Count</th>
                          <th className="p-3 text-right">Overall Value</th>
                          <th className="p-3 text-right">Available Count</th>
                          <th className="p-3 text-right">Available Value</th>
                          <th className="p-3 text-right">Booked Count</th>
                          <th className="p-3 text-right">Booked Value</th>
                          <th className="p-3 text-right">Handover Count</th>
                          <th className="p-3 text-right">Handover Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {typesToRender.map((type, idx) => {
                          const overallCount = (inventory.totalByType?.[type] || 0) + (type === 'Villa' ? (inventory.totalByType?.House || 0) : 0);
                          const overallVal = (inventory.totalValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.totalValueByType?.House || 0) : 0);
                          const availCount = (inventory.availableByType?.[type] || 0) + (type === 'Villa' ? (inventory.availableByType?.House || 0) : 0);
                          const availVal = (inventory.availableValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.availableValueByType?.House || 0) : 0);
                          const bookedCount = (inventory.bookedByType?.[type] || 0) + (type === 'Villa' ? (inventory.bookedByType?.House || 0) : 0);
                          const bookedVal = (inventory.bookedValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.bookedValueByType?.House || 0) : 0);
                          const handCount = (inventory.handoverByType?.[type] || 0) + (type === 'Villa' ? (inventory.handoverByType?.House || 0) : 0);
                          const handVal = (inventory.handoverValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.handoverValueByType?.House || 0) : 0);

                          return (
                            <tr key={type} className={idx % 2 === 1 ? 'bg-gray-50/40' : ''}>
                              <td className="p-3 font-bold text-gray-900 uppercase">{type}</td>
                              <td className="p-3 text-right font-bold text-gray-800">{overallCount}</td>
                              <td className="p-3 text-right">₹{overallVal.toLocaleString()}</td>
                              <td className="p-3 text-right text-emerald-700 font-bold">{availCount}</td>
                              <td className="p-3 text-right">₹{availVal.toLocaleString()}</td>
                              <td className="p-3 text-right text-amber-700 font-bold">{bookedCount}</td>
                              <td className="p-3 text-right">₹{bookedVal.toLocaleString()}</td>
                              <td className="p-3 text-right text-blue-700 font-bold">{handCount}</td>
                              <td className="p-3 text-right">₹{handVal.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Financial Conversion Summary */}
                <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                  <div className="bg-[#0e623a] text-white p-3 font-bold text-xs uppercase">
                    Part 2: Sales Financial Conversion Summary
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <span className="text-xs text-gray-500 font-bold uppercase block">Booked / Total Conversion Value</span>
                      <span className="text-2xl font-black text-emerald-800 block mt-1">
                        ₹{(stats.cards?.conversion?.value || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-emerald-700 font-bold mt-1 block">
                        {stats.cards?.conversion?.count || 0} Units Booked
                      </span>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <span className="text-xs text-gray-500 font-bold uppercase block">Received Amount</span>
                      <span className="text-2xl font-black text-blue-800 block mt-1">
                        ₹{(stats.cards?.conversion?.received || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-blue-700 font-bold mt-1 block">
                        Collected to Date
                      </span>
                    </div>

                    <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                      <span className="text-xs text-gray-500 font-bold uppercase block">Pending Balance Amount</span>
                      <span className="text-2xl font-black text-rose-800 block mt-1">
                        ₹{(stats.cards?.conversion?.pending || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-rose-700 font-bold mt-1 block">
                        Outstanding Collection
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: USER REPORT */}
          {activeTab === 'user' && (() => {
            const targetUsers = selectedUserFilter
              ? [selectedUserFilter]
              : (stats.users || []).map(u => u.name);

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                  <h3 className="text-base font-extrabold text-black-800 uppercase tracking-wide">
                    Executive Wise Performance Report
                  </h3>
                  <span className="text-xs font-bold text-gray-500">
                    Showing: {selectedUserFilter || 'All Users'} | Period: {fromDate || 'Start'} to {toDate || 'End'}
                  </span>
                </div>

                {targetUsers.map(uName => {
                  let uTotalLeads = 0;
                  let uEnquiries = 0;
                  let uSiteVisits = 0;
                  let uHotList = 0;
                  let uBooked = 0;
                  let uHandover = 0;
                  const rows = [];

                  Object.keys(stats.personProjectStages || {}).forEach(key => {
                    const row = stats.personProjectStages[key];
                    if (row.personName === uName) {
                      uTotalLeads += row.totalLeads;
                      uEnquiries += row.enquiries;
                      uSiteVisits += row.siteVisits;
                      uHotList += row.hotList;
                      uBooked += row.booked;
                      uHandover += row.handover;
                      rows.push(row);
                    }
                  });

                  if (rows.length === 0 && selectedUserFilter) {
                    return (
                      <div key={uName} className="p-8 text-center text-gray-400 italic border border-gray-150 rounded-2xl">
                        No lead performance recorded for user {uName} in this date range.
                      </div>
                    );
                  }

                  return (
                    <div key={uName} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs space-y-2">
                      <div className="bg-[#0e623a] text-white p-3 font-extrabold text-xs uppercase flex items-center justify-between">
                        <span>USER: {uName}</span>
                        <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-black">
                          Total: {uTotalLeads} Leads
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-emerald-50/50 text-[11px] font-bold text-gray-700 uppercase border-b border-gray-200">
                              <th className="p-3">Project Name</th>
                              <th className="p-3 text-right">Total Leads</th>
                              <th className="p-3 text-right">Enquiries</th>
                              <th className="p-3 text-right">Site Visit</th>
                              <th className="p-3 text-right">Hot List</th>
                              <th className="p-3 text-right">Booked</th>
                              <th className="p-3 text-right">Handover</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-medium">
                            <tr className="bg-emerald-50/30 font-bold text-gray-900">
                              <td className="p-3 text-[#0e623a] uppercase font-black">OVERALL TOTAL</td>
                              <td className="p-3 text-right">{uTotalLeads}</td>
                              <td className="p-3 text-right text-emerald-700">{uEnquiries}</td>
                              <td className="p-3 text-right text-blue-700">{uSiteVisits}</td>
                              <td className="p-3 text-right text-amber-700">{uHotList}</td>
                              <td className="p-3 text-right text-rose-700">{uBooked}</td>
                              <td className="p-3 text-right text-emerald-800">{uHandover}</td>
                            </tr>
                            {rows.map((row, idx) => (
                              <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50/40' : ''}>
                                <td className="p-3 font-bold text-gray-800">{row.projectName}</td>
                                <td className="p-3 text-right">{row.totalLeads}</td>
                                <td className="p-3 text-right text-emerald-700">{row.enquiries}</td>
                                <td className="p-3 text-right text-blue-700">{row.siteVisits}</td>
                                <td className="p-3 text-right text-amber-700">{row.hotList}</td>
                                <td className="p-3 text-right text-rose-700">{row.booked}</td>
                                <td className="p-3 text-right text-emerald-800">{row.handover}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* TAB 3: PROJECT REPORT */}
          {activeTab === 'project' && (() => {
            const targetProjects = selectedProjectFilter
              ? [selectedProjectFilter]
              : (stats.projects || []).map(p => p.code || p.name);

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                  <h3 className="text-base font-extrabold text-black-800 uppercase tracking-wide">
                    Project Wise Performance Report
                  </h3>
                  <span className="text-xs font-bold text-gray-500">
                    Showing: {selectedProjectFilter || 'All Projects'} | Period: {fromDate || 'Start'} to {toDate || 'End'}
                  </span>
                </div>

                {targetProjects.map(projName => {
                  const stages = stats.projectStages?.[projName] || { totalLeads: 0, enquiries: 0, siteVisits: 0, hotList: 0, booked: 0, handover: 0 };
                  let executiveRows = [];
                  Object.keys(stats.personProjectStages || {}).forEach(key => {
                    const row = stats.personProjectStages[key];
                    if (row.projectName === projName) {
                      executiveRows.push(row);
                    }
                  });

                  return (
                    <div key={projName} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs space-y-4 p-4">
                      <div className="bg-[#0e623a] text-white p-3 rounded-xl font-extrabold text-xs uppercase flex items-center justify-between">
                        <span>PROJECT: {projName}</span>
                        <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-black">
                          Total: {stages.totalLeads} Leads
                        </span>
                      </div>

                      {/* Stages Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                          <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Leads</span>
                          <span className="text-base font-black text-gray-800">{stages.totalLeads}</span>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-150">
                          <span className="text-[10px] text-emerald-700 uppercase font-bold block">Enquiries</span>
                          <span className="text-base font-black text-emerald-800">{stages.enquiries}</span>
                        </div>
                        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-150">
                          <span className="text-[10px] text-blue-700 uppercase font-bold block">Site Visits</span>
                          <span className="text-base font-black text-blue-800">{stages.siteVisits}</span>
                        </div>
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-150">
                          <span className="text-[10px] text-amber-700 uppercase font-bold block">Hot List</span>
                          <span className="text-base font-black text-amber-800">{stages.hotList}</span>
                        </div>
                        <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-150">
                          <span className="text-[10px] text-rose-700 uppercase font-bold block">Booked Units</span>
                          <span className="text-base font-black text-rose-800">{stages.booked}</span>
                        </div>
                        <div className="bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-200">
                          <span className="text-[10px] text-emerald-800 uppercase font-bold block">Handover</span>
                          <span className="text-base font-black text-emerald-900">{stages.handover}</span>
                        </div>
                      </div>

                      {/* Executive Breakdown Table */}
                      {executiveRows.length > 0 && (
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-[10px] font-bold text-gray-600 uppercase border-b border-gray-200">
                                <th className="p-2.5">Executive Name</th>
                                <th className="p-2.5 text-right">Total Leads</th>
                                <th className="p-2.5 text-right">Enquiries</th>
                                <th className="p-2.5 text-right">Site Visit</th>
                                <th className="p-2.5 text-right">Hot List</th>
                                <th className="p-2.5 text-right">Booked</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium">
                              {executiveRows.map((row, idx) => (
                                <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50/40' : ''}>
                                  <td className="p-2.5 font-bold text-gray-800 uppercase">{row.personName}</td>
                                  <td className="p-2.5 text-right font-bold">{row.totalLeads}</td>
                                  <td className="p-2.5 text-right text-emerald-700">{row.enquiries}</td>
                                  <td className="p-2.5 text-right text-blue-700">{row.siteVisits}</td>
                                  <td className="p-2.5 text-right text-amber-700">{row.hotList}</td>
                                  <td className="p-2.5 text-right text-rose-700">{row.booked}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* TAB 4: SOURCE REPORT */}
          {activeTab === 'source' && (() => {
            const targetSources = selectedSourceFilter
              ? [selectedSourceFilter]
              : Object.keys(stats.sourceStats || {});

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                  <h3 className="text-base font-extrabold text-black-800 uppercase tracking-wide">
                    Marketing Source Performance Report
                  </h3>
                  <span className="text-xs font-bold text-gray-500">
                    Showing: {selectedSourceFilter || 'All Sources'} | Period: {fromDate || 'Start'} to {toDate || 'End'}
                  </span>
                </div>

                <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                  <div className="bg-[#0e623a] text-white p-3 font-bold text-xs uppercase">
                    Marketing Source Budget vs Return (ROI)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-[11px] font-bold text-gray-700 uppercase border-b border-gray-200">
                          <th className="p-3">Source Name</th>
                          <th className="p-3 text-right">Budget Allocation</th>
                          <th className="p-3 text-right">Spent Value</th>
                          <th className="p-3 text-right">Networth Generated Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {targetSources.map((src, idx) => {
                          const s = stats.sourceStats?.[src] || { budget: 0, spent: 0, value: 0 };
                          return (
                            <tr key={src} className={idx % 2 === 1 ? 'bg-gray-50/40' : ''}>
                              <td className="p-3 font-bold text-gray-800 uppercase">{src}</td>
                              <td className="p-3 text-right font-bold text-blue-700">₹{(s.budget || 0).toLocaleString()}</td>
                              <td className="p-3 text-right font-bold text-rose-700">₹{(s.spent || 0).toLocaleString()}</td>
                              <td className="p-3 text-right font-bold text-emerald-700">₹{(s.value || 0).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
};

export default DashboardReports;
