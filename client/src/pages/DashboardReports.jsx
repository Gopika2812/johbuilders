import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { LOGO_BASE64 } from '../utils/logoBase64';
import { exportHtmlSheetsToExcel } from '../utils/excelExporter';
import DateRangeFilter from '../components/DateRangeFilter';
import SearchableSelect from '../components/SearchableSelect';
import {
  Download,
  FolderOpen,
  FileSpreadsheet,
  FileText,
  Users,
  Building,
  Target,
  User,
  Loader2,
  TrendingUp,
  Compass,
  X
} from 'lucide-react';

const getExcelStyles = (titleBg, monthBg, headerBg, execBg) => {
  return `
    <style>
      table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
      td, th { border: 1px solid #CBD5E1; padding: 8px 12px; font-size: 9.5pt; color: #1E293B; }
      th, .table-headers th { font-weight: bold; background-color: #0F5233 !important; color: #FFFFFF !important; border: 1px solid #0D4329 !important; text-align: center; height: 34px; font-size: 10pt; vertical-align: middle; }
      .title-row { font-size: 13pt; font-weight: 800; color: #FFFFFF !important; background-color: #0F5233 !important; text-align: center; border: 1.5px solid #0F5233 !important; height: 64px; vertical-align: middle; letter-spacing: 0.5px; }
      .month-header { height: 28px; vertical-align: middle; font-size: 9.5pt; font-weight: 700; background-color: #F0FDF4 !important; color: #166534 !important; border: 1.5px solid #0F5233 !important; text-align: center; text-transform: uppercase; letter-spacing: 0.8px; }
      .section-banner { font-size: 11pt; font-weight: bold; background-color: #F0FDF4 !important; color: #166534 !important; padding: 10px; border: 1px solid #C3E6CB; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
      .logo-cell { background-color: #FFFFFF !important; border: 1.5px solid #0F5233 !important; border-right: none !important; text-align: center; vertical-align: middle; padding: 6px 12px; }
      .even-row { background-color: #F8FAFC !important; }
      .bold-label { font-weight: bold; color: #0F172A; }
      .font-bold { font-weight: bold; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
    </style>
  `;
};

const getExcelHeader = (titleText, dateRangeTitle, totalColumns) => {
  const safeCols = Math.max(3, totalColumns);
  const logoCols = safeCols <= 4 ? 1 : 2;
  const titleCols = safeCols - logoCols;
  const webLogo = LOGO_BASE64;
  return `
    <tr style="height: 64px;">
      <td colspan="${logoCols}" bgcolor="#FFFFFF" class="logo-cell" style="background-color: #FFFFFF; padding: 6px 12px; text-align: center; vertical-align: middle; border: 1.5px solid #0F5233; border-right: none; height: 64px; width: 140px;">
        ${webLogo ? `<img src="${webLogo}" style="max-height: 48px; max-width: 130px; width: auto; height: 48px; object-fit: contain; display: block; margin: 0 auto;" alt="JOHN BUILDWELL" />` : `<div style="color: #0F5233; font-size: 11pt; font-weight: bold; text-align: center;">JOHN BUILDWELL</div>`}
      </td>
      <td colspan="${titleCols}" class="title-row text-center" style="background-color: #0F5233; color: #FFFFFF; border: 1.5px solid #0F5233; vertical-align: middle; text-align: center; font-size: 13pt; font-weight: 800; height: 64px; letter-spacing: 0.5px; padding: 0 16px;">
        ${titleText}
      </td>
    </tr>
    ${dateRangeTitle ? `
    <tr>
      <td colspan="${safeCols}" class="month-header" style="height: 28px; vertical-align: middle; font-size: 9.5pt; font-weight: 700; background-color: #F0FDF4; color: #166534; border: 1.5px solid #0F5233; border-top: none; text-align: center; text-transform: uppercase; letter-spacing: 0.8px;">
        ${dateRangeTitle}
      </td>
    </tr>` : ''}
    <tr><td colspan="${safeCols}" style="border:none; height: 12px; background-color: transparent;"></td></tr>
  `;
};

const DashboardReports = () => {
  const { token, user, hasFullDashboardAccess } = useAuth();

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

  // User and Project filters
  const [selectedUser, setSelectedUser] = useState(() => {
    return hasFullDashboardAccess ? '' : (user?._id || '');
  });
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    if (user && !hasFullDashboardAccess) {
      setSelectedUser(user._id || '');
    }
  }, [user, hasFullDashboardAccess]);

  const [stats, setStats] = useState({ users: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportLoadingText, setReportLoadingText] = useState('');

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSheets, setPreviewSheets] = useState([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewFilename, setPreviewFilename] = useState('');

  useEffect(() => {
    if (token) {
      fetchDashboardStats();
    }
  }, [token, fromDate, toDate, selectedUser, selectedProject]);

  const fetchDashboardStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let url = `${API_URL}/dashboard/stats?fromDate=${fromDate}&toDate=${toDate}`;
      if (selectedUser) url += `&userId=${selectedUser}`;
      if (selectedProject) url += `&projectId=${selectedProject}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        return data;
      }
    } catch (err) {
      console.error('Error loading dashboard report stats:', err);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const ensureStats = async () => {
    if (stats && stats.cards) return stats;
    return await fetchDashboardStats(true);
  };

  const handlePreview = (html, filename, reportName = 'Report') => {
    if (window.__isDownloadingAll) {
      window.__capturedHtml = html;
      return;
    }
    setPreviewSheets([{ name: reportName, html }]);
    setCurrentSheetIndex(0);
    setPreviewHtml(html);
    setPreviewFilename(filename);
    setPreviewModalOpen(true);
  };

  const downloadFromPreview = async () => {
    try {
      if (previewSheets.length > 1) {
        await exportHtmlSheetsToExcel(previewSheets, previewFilename || 'JB_COMBINED_DASHBOARD_REPORTS.xlsx');
      } else {
        await exportHtmlSheetsToExcel([{ name: 'Report', html: previewHtml }], previewFilename || 'JB_DASHBOARD_REPORT.xlsx');
      }
      setPreviewModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Error downloading Excel report');
    }
  };

  const getUserPerformanceDataFromStats = (statsObj, startD, endD) => {
    if (!statsObj) return [];
    const data = {};
    const salesUsers = (statsObj.users || []).filter(u => (u.role || '').toLowerCase().includes('sales'));

    salesUsers.forEach(u => {
      data[u.name] = {
        userName: u.name,
        totalLeads: 0,
        assigned: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        futureFollowup: 0,
        booked: 0,
        lost: 0,
        salesValue: 0
      };
    });

    Object.keys(statsObj.personProjectStages || {}).forEach(key => {
      const row = statsObj.personProjectStages[key];
      if (!row || !row.personName) return;
      if (!data[row.personName]) {
        data[row.personName] = {
          userName: row.personName,
          totalLeads: 0,
          assigned: 0,
          enquiries: 0,
          siteVisits: 0,
          hotList: 0,
          futureFollowup: 0,
          booked: 0,
          lost: 0,
          salesValue: 0
        };
      }
      data[row.personName].totalLeads += (row.totalLeads || 0);
      data[row.personName].assigned += (row.assigned || 0);
      data[row.personName].enquiries += (row.enquiries || 0);
      data[row.personName].siteVisits += (row.siteVisits || 0);
      data[row.personName].hotList += (row.hotList || 0);
      data[row.personName].futureFollowup += (row.futureFollowup || 0);
      data[row.personName].booked += (row.booked || 0);
      data[row.personName].lost += (row.lost || 0);
      data[row.personName].salesValue += (row.salesValue || row.bookedValue || 0);
    });

    return Object.values(data).filter(u => u.totalLeads > 0 || salesUsers.some(su => su.name === u.userName));
  };

  // 1. Overall Summary Report
  const handleExportSummaryReport = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Generating Overall Summary Report...');
      const activeStats = providedStats || await ensureStats();
      if (!activeStats) return;

      const inventory = activeStats.cards?.inventory || {};
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

      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader('OVERALL PERFORMANCE SUMMARY REPORT', dateTitle, 9)}
            
            <tr><td colspan="9" class="section-banner">PART 1: PROJECTS & UNIT TYPE SUMMARY</td></tr>
            <tr class="table-headers">
              <th colspan="4" class="text-left">Metric</th>
              <th colspan="2" class="text-right">Count</th>
              <th colspan="3" class="text-right">Total Value (INR)</th>
            </tr>
            <tr>
              <td colspan="4" class="bold-label text-left">Available Projects (Common)</td>
              <td colspan="2" class="text-right">${availableProjCount}</td>
              <td colspan="3" class="text-right">Rs. ${availableProjVal.toLocaleString()}</td>
            </tr>
            ${plotProjCount > 0 || plotProjVal > 0 ? `
            <tr class="even-row">
              <td colspan="4" class="bold-label text-left">Available Projects (Plot)</td>
              <td colspan="2" class="text-right">${plotProjCount}</td>
              <td colspan="3" class="text-right">Rs. ${plotProjVal.toLocaleString()}</td>
            </tr>` : ''}
            ${unitProjCount > 0 || unitProjVal > 0 ? `
            <tr>
              <td colspan="4" class="bold-label text-left">Available Projects (Unit)</td>
              <td colspan="2" class="text-right">${unitProjCount}</td>
              <td colspan="3" class="text-right">Rs. ${unitProjVal.toLocaleString()}</td>
            </tr>` : ''}
            <tr><td colspan="9" style="border:none; height: 10px;"></td></tr>
            
            <tr class="table-headers">
              <th colspan="2" class="text-left">Project Type</th>
              <th class="text-right">Overall Count</th>
              <th class="text-right">Overall Value (INR)</th>
              <th class="text-right">Available Count</th>
              <th class="text-right">Available Value (INR)</th>
              <th class="text-right">Booked Units</th>
              <th colspan="2" class="text-right">Booked Value (INR)</th>
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

        const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
        html += `
          <tr ${rowClass}>
            <td colspan="2" class="bold-label text-left">${type}</td>
            <td class="text-right">${overallCount}</td>
            <td class="text-right">Rs. ${overallVal.toLocaleString()}</td>
            <td class="text-right">${availCount}</td>
            <td class="text-right">Rs. ${availVal.toLocaleString()}</td>
            <td class="text-right">${bookedCount}</td>
            <td colspan="2" class="text-right">Rs. ${bookedVal.toLocaleString()}</td>
          </tr>
        `;
      });

      html += `
            <tr><td colspan="9" style="border:none; height: 15px;"></td></tr>
            <tr><td colspan="9" class="section-banner">PART 2: USER PERFORMANCE SUMMARY</td></tr>
            <tr class="table-headers">
              <th class="text-left">User Name</th>
              <th class="text-right">Total Leads</th>
              <th class="text-right">Assigned</th>
              <th class="text-right">Follow-Up</th>
              <th class="text-right">Site Visit</th>
              <th class="text-right">Future Follow-up</th>
              <th class="text-right">Booked</th>
              <th class="text-right">Lost</th>
              <th class="text-right">Sales Value</th>
            </tr>
      `;

      let uData = getUserPerformanceDataFromStats(activeStats, fromDate, toDate);
      if (selectedUser) {
        const targetUserName = (activeStats.users || []).find(u => u._id === selectedUser)?.name;
        if (targetUserName) {
          uData = uData.filter(u => u.userName === targetUserName);
        }
      }

      uData.forEach((row, idx) => {
        const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
        html += `
          <tr ${rowClass}>
            <td class="bold-label text-left">${row.userName}</td>
            <td class="text-right font-bold">${row.totalLeads}</td>
            <td class="text-right">${row.assigned}</td>
            <td class="text-right">${row.enquiries}</td>
            <td class="text-right">${row.siteVisits}</td>
            <td class="text-right">${row.futureFollowup}</td>
            <td class="text-right">${row.booked}</td>
            <td class="text-right">${row.lost}</td>
            <td class="text-right">Rs. ${(row.salesValue || 0).toLocaleString('en-IN')}</td>
          </tr>
        `;
      });

      if (uData.length > 0) {
        html += `
          <tr class="summary-row" style="font-weight: bold; background-color: #E6F4EA;">
            <td class="bold-label text-left">TOTAL</td>
            <td class="text-right font-bold">${uData.reduce((s, r) => s + (r.totalLeads || 0), 0)}</td>
            <td class="text-right">${uData.reduce((s, r) => s + (r.assigned || 0), 0)}</td>
            <td class="text-right">${uData.reduce((s, r) => s + (r.enquiries || 0), 0)}</td>
            <td class="text-right">${uData.reduce((s, r) => s + (r.siteVisits || 0), 0)}</td>
            <td class="text-right">${uData.reduce((s, r) => s + (r.futureFollowup || 0), 0)}</td>
            <td class="text-right">${uData.reduce((s, r) => s + (r.booked || 0), 0)}</td>
            <td class="text-right">${uData.reduce((s, r) => s + (r.lost || 0), 0)}</td>
            <td class="text-right">Rs. ${uData.reduce((s, r) => s + (r.salesValue || 0), 0).toLocaleString('en-IN')}</td>
          </tr>
        `;
      }

      html += `
          </table>
        </body>
        </html>
      `;

      handlePreview(html, `JB_OVERALL_SUMMARY_REPORT_${new Date().toISOString().substring(0, 10)}.xlsx`, 'Overall Performance Summary Report');
    } catch (err) {
      console.error(err);
      alert('Error generating summary report');
    } finally {
      setReportLoading(false);
    }
  };

  // 2. Executive / User Wise Report
  const handleExportUserReport = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Generating Executive Wise Performance Report...');
      const activeStats = providedStats || await ensureStats();
      if (!activeStats) return;

      const dateTitle = (fromDate || toDate) ? `DATE RANGE: ${fromDate || 'START'} TO ${toDate || 'END'}` : '';
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader('JOHN BUILDWELL ERP - EXECUTIVE WISE PERFORMANCE REPORT', dateTitle, 9)}
      `;

      const salesUsers = (activeStats.users || []).filter(u => (u.role || '').toLowerCase().includes('sales'));
      const allExecutivesInStages = Array.from(new Set(Object.values(activeStats.personProjectStages || {}).map(r => r.personName).filter(Boolean)));
      const candidateUserNames = Array.from(new Set([...salesUsers.map(u => u.name), ...allExecutivesInStages]));

      const targetUsers = selectedUser
        ? [(salesUsers.find(u => u._id === selectedUser) || (activeStats.users || []).find(u => u._id === selectedUser))?.name].filter(Boolean)
        : candidateUserNames;

      targetUsers.forEach(uName => {
        let uTotalLeads = 0;
        let uAssigned = 0;
        let uEnquiries = 0;
        let uSiteVisits = 0;
        let uFutureFollowup = 0;
        let uBooked = 0;
        let uLost = 0;
        let uSalesValue = 0;
        const rows = [];

        Object.keys(activeStats.personProjectStages || {}).forEach(key => {
          const row = activeStats.personProjectStages[key];
          if (row.personName === uName) {
            uTotalLeads += (row.totalLeads || 0);
            uAssigned += (row.assigned || 0);
            uEnquiries += (row.enquiries || 0);
            uSiteVisits += (row.siteVisits || 0);
            uFutureFollowup += (row.futureFollowup || 0);
            uBooked += (row.booked || 0);
            uLost += (row.lost || 0);
            uSalesValue += (row.salesValue || row.bookedValue || 0);
            rows.push(row);
          }
        });

        if (rows.length === 0 && uTotalLeads === 0) return;

        html += `
          <tr><td colspan="9" class="section-banner">USER: ${uName.toUpperCase()} (TOTAL LEADS: ${uTotalLeads}${uSalesValue > 0 ? ` | SALES VALUE: Rs. ${uSalesValue.toLocaleString('en-IN')}` : ''})</td></tr>
          <tr class="table-headers">
            <th class="text-left">Project Name</th>
            <th class="text-right">Total Leads</th>
            <th class="text-right">Assigned</th>
            <th class="text-right">Follow-Up</th>
            <th class="text-right">Site Visit</th>
            <th class="text-right">Future Follow-up</th>
            <th class="text-right">Booked</th>
            <th class="text-right">Lost</th>
            <th class="text-right">Sales Value</th>
          </tr>
        `;

        rows.forEach((row, idx) => {
          const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
          const rowVal = row.salesValue || row.bookedValue || 0;
          html += `
            <tr ${rowClass}>
              <td class="bold-label text-left">${row.projectName}</td>
              <td class="text-right font-bold">${row.totalLeads}</td>
              <td class="text-right">${row.assigned || 0}</td>
              <td class="text-right">${row.enquiries || 0}</td>
              <td class="text-right">${row.siteVisits || 0}</td>
              <td class="text-right">${row.futureFollowup || 0}</td>
              <td class="text-right">${row.booked || 0}</td>
              <td class="text-right">${row.lost || 0}</td>
              <td class="text-right">Rs. ${rowVal.toLocaleString('en-IN')}</td>
            </tr>
          `;
        });

        if (rows.length > 1) {
          html += `
            <tr class="summary-row" style="font-weight:bold; background-color:#E6F4EA;">
              <td class="bold-label text-left">SUBTOTAL</td>
              <td class="text-right font-bold">${uTotalLeads}</td>
              <td class="text-right">${uAssigned}</td>
              <td class="text-right">${uEnquiries}</td>
              <td class="text-right">${uSiteVisits}</td>
              <td class="text-right">${uFutureFollowup}</td>
              <td class="text-right">${uBooked}</td>
              <td class="text-right">${uLost}</td>
              <td class="text-right">Rs. ${uSalesValue.toLocaleString('en-IN')}</td>
            </tr>
          `;
        }

        html += `<tr><td colspan="9" style="border:none; height:15px;"></td></tr>`;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      handlePreview(html, `JB_EXECUTIVE_WISE_REPORT_${new Date().toISOString().substring(0, 10)}.xlsx`, 'Executive Wise Performance Report');
    } catch (err) {
      console.error(err);
      alert('Error generating executive report');
    } finally {
      setReportLoading(false);
    }
  };

  // 3. Project Wise Report
  const handleExportProjectReport = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Generating Project Wise Performance Report...');
      const activeStats = providedStats || await ensureStats();
      if (!activeStats) return;

      const dateTitle = (fromDate || toDate) ? `DATE RANGE: ${fromDate || 'START'} TO ${toDate || 'END'}` : '';
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader('JOHN BUILDWELL ERP - PROJECT WISE PERFORMANCE REPORT', dateTitle, 9)}
      `;

      const targetProjects = selectedProject
        ? [(activeStats.projects || []).find(p => p._id === selectedProject)?.code || (activeStats.projects || []).find(p => p._id === selectedProject)?.name].filter(Boolean)
        : (activeStats.projects || []).map(p => p.code || p.name);

      targetProjects.forEach(projName => {
        const stages = activeStats.projectStages?.[projName] || { totalLeads: 0, assigned: 0, enquiries: 0, siteVisits: 0, futureFollowup: 0, booked: 0, lost: 0, salesValue: 0 };

        html += `
          <tr><td colspan="9" class="section-banner">PROJECT: ${projName.toUpperCase()} (TOTAL LEADS: ${stages.totalLeads}${stages.salesValue > 0 ? ` | SALES VALUE: Rs. ${stages.salesValue.toLocaleString('en-IN')}` : ''})</td></tr>
          <tr class="table-headers">
            <th colspan="5" class="text-left">Pipeline Stage</th>
            <th colspan="4" class="text-right">Lead Count / Value</th>
          </tr>
          <tr>
            <td colspan="5" class="bold-label text-left">Total Leads</td>
            <td colspan="4" class="text-right font-bold">${stages.totalLeads || 0}</td>
          </tr>
          <tr class="even-row">
            <td colspan="5" class="bold-label text-left">Assigned</td>
            <td colspan="4" class="text-right">${stages.assigned || 0}</td>
          </tr>
          <tr>
            <td colspan="5" class="bold-label text-left">Follow-Up (Enquiries)</td>
            <td colspan="4" class="text-right">${stages.enquiries || 0}</td>
          </tr>
          <tr class="even-row">
            <td colspan="5" class="bold-label text-left">Site Visits</td>
            <td colspan="4" class="text-right">${stages.siteVisits || 0}</td>
          </tr>
          <tr>
            <td colspan="5" class="bold-label text-left">Future Follow-up</td>
            <td colspan="4" class="text-right">${stages.futureFollowup || 0}</td>
          </tr>
          <tr class="even-row">
            <td colspan="5" class="bold-label text-left">Booked Leads</td>
            <td colspan="4" class="text-right">${stages.booked || 0}</td>
          </tr>
          <tr>
            <td colspan="5" class="bold-label text-left">Lost Leads</td>
            <td colspan="4" class="text-right">${stages.lost || 0}</td>
          </tr>
          <tr class="even-row">
            <td colspan="5" class="bold-label text-left">Booked Sales Value</td>
            <td colspan="4" class="text-right font-bold">Rs. ${(stages.salesValue || 0).toLocaleString('en-IN')}</td>
          </tr>
          
          <tr><td colspan="9" style="border:none; height:10px;"></td></tr>
          
          <tr class="table-headers">
            <th class="text-left">Executive Name</th>
            <th class="text-right">Total Leads</th>
            <th class="text-right">Assigned</th>
            <th class="text-right">Follow-Up</th>
            <th class="text-right">Site Visit</th>
            <th class="text-right">Future Follow-up</th>
            <th class="text-right">Booked</th>
            <th class="text-right">Lost</th>
            <th class="text-right">Sales Value</th>
          </tr>
        `;

        let executiveIdx = 0;
        Object.keys(activeStats.personProjectStages || {}).forEach(key => {
          const row = activeStats.personProjectStages[key];
          if (row.projectName === projName) {
            const rowClass = executiveIdx % 2 === 1 ? 'class="even-row"' : '';
            executiveIdx++;
            const rowVal = row.salesValue || row.bookedValue || 0;
            html += `
              <tr ${rowClass}>
                <td class="bold-label text-left">${row.personName}</td>
                <td class="text-right font-bold">${row.totalLeads}</td>
                <td class="text-right">${row.assigned || 0}</td>
                <td class="text-right">${row.enquiries || 0}</td>
                <td class="text-right">${row.siteVisits || 0}</td>
                <td class="text-right">${row.futureFollowup || 0}</td>
                <td class="text-right">${row.booked || 0}</td>
                <td class="text-right">${row.lost || 0}</td>
                <td class="text-right">Rs. ${rowVal.toLocaleString('en-IN')}</td>
              </tr>
            `;
          }
        });

        html += `<tr><td colspan="9" style="border:none; height:20px;"></td></tr>`;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      handlePreview(html, `JB_PROJECT_WISE_REPORT_${new Date().toISOString().substring(0, 10)}.xlsx`, 'Project Wise Performance Report');
    } catch (err) {
      console.error(err);
      alert('Error generating project report');
    } finally {
      setReportLoading(false);
    }
  };

  // 4. Marketing Source Report
  const handleExportSourceReport = async (returnHtml = false, providedStats = null) => {
    try {
      setReportLoading(true);
      setReportLoadingText('Generating Marketing Source Performance Report...');
      const activeStats = providedStats || await ensureStats();
      if (!activeStats) return;

      const dateTitle = (fromDate || toDate) ? `DATE RANGE: ${fromDate || 'START'} TO ${toDate || 'END'}` : '';
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#0F5233", "#E6F4EA", "#0F5233", "#E6F4EA")}
        </head>
        <body>
          <table>
            ${getExcelHeader('JOHN BUILDWELL ERP - MARKETING SOURCE PERFORMANCE REPORT', dateTitle, 10)}
            <tr class="table-headers">
              <th class="text-left">Source Type</th>
              <th class="text-right">Total Leads</th>
              <th class="text-right">Assigned</th>
              <th class="text-right">Follow-Up</th>
              <th class="text-right">Site Visit</th>
              <th class="text-right">Future Follow-up</th>
              <th class="text-right">Booked</th>
              <th class="text-right">Lost</th>
              <th class="text-right">Spent (INR)</th>
              <th class="text-right">Sales Value (INR)</th>
            </tr>
      `;

      const targetSources = Object.keys(activeStats.sourceStats || {});
      let totLeads = 0, totAssigned = 0, totEnquiries = 0, totSiteVisits = 0, totFuture = 0, totBooked = 0, totLost = 0, totSpent = 0, totValue = 0;

      targetSources.forEach((src, idx) => {
        const s = activeStats.sourceStats?.[src] || {};
        const count = s.count || 0;
        const assigned = s.assigned || 0;
        const enquiries = s.enquiries || 0;
        const siteVisits = s.siteVisits || 0;
        const futureFollowup = s.futureFollowup || 0;
        const booked = s.booked || 0;
        const lost = s.lost || 0;
        const spent = s.spent || 0;
        const value = s.value || 0;

        totLeads += count;
        totAssigned += assigned;
        totEnquiries += enquiries;
        totSiteVisits += siteVisits;
        totFuture += futureFollowup;
        totBooked += booked;
        totLost += lost;
        totSpent += spent;
        totValue += value;

        const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
        html += `
          <tr ${rowClass}>
            <td class="bold-label text-left">${src}</td>
            <td class="text-right font-bold">${count}</td>
            <td class="text-right">${assigned}</td>
            <td class="text-right">${enquiries}</td>
            <td class="text-right">${siteVisits}</td>
            <td class="text-right">${futureFollowup}</td>
            <td class="text-right">${booked}</td>
            <td class="text-right">${lost}</td>
            <td class="text-right">Rs. ${spent.toLocaleString()}</td>
            <td class="text-right">Rs. ${value.toLocaleString()}</td>
          </tr>
        `;
      });

      if (targetSources.length > 0) {
        html += `
          <tr class="summary-row" style="font-weight:bold; background-color:#E6F4EA;">
            <td class="bold-label text-left">TOTAL</td>
            <td class="text-right font-bold">${totLeads}</td>
            <td class="text-right">${totAssigned}</td>
            <td class="text-right">${totEnquiries}</td>
            <td class="text-right">${totSiteVisits}</td>
            <td class="text-right">${totFuture}</td>
            <td class="text-right">${totBooked}</td>
            <td class="text-right">${totLost}</td>
            <td class="text-right">Rs. ${totSpent.toLocaleString()}</td>
            <td class="text-right">Rs. ${totValue.toLocaleString()}</td>
          </tr>
        `;
      }

      html += `
          </table>
        </body>
        </html>
      `;

      handlePreview(html, `JB_SOURCE_WISE_REPORT_${new Date().toISOString().substring(0, 10)}.xlsx`, 'Marketing Source Performance Report');
    } catch (err) {
      console.error(err);
      alert('Error generating source report');
    } finally {
      setReportLoading(false);
    }
  };

  // 5. Download All Master Workbook
  const handleDownloadAll = async () => {
    try {
      setReportLoading(true);
      setReportLoadingText('Fetching filtered data for all dashboard reports...');
      window.__isDownloadingAll = true;
      const currentStats = await ensureStats();

      const allSheets = [];

      const convertHtmlToSheet = async (exportFunc, sheetName, label) => {
        setReportLoadingText(`Preparing ${label || sheetName}...`);
        window.__capturedHtml = null;
        await exportFunc(false, currentStats);
        const htmlString = window.__capturedHtml;
        if (!htmlString) return;
        allSheets.push({ name: sheetName, html: htmlString });
      };

      await convertHtmlToSheet(handleExportSummaryReport, 'Overall Summary', 'Summary Report');
      await convertHtmlToSheet(handleExportUserReport, 'User Performance', 'Executive Wise Report');
      await convertHtmlToSheet(handleExportProjectReport, 'Project Wise', 'Project Wise Report');
      await convertHtmlToSheet(handleExportSourceReport, 'Source Performance', 'Marketing Source Report');

      if (allSheets.length > 0) {
        setPreviewSheets(allSheets);
        setCurrentSheetIndex(0);
        setPreviewHtml(allSheets[0].html);
        setPreviewFilename(`JB_COMBINED_DASHBOARD_REPORTS_${new Date().getFullYear()}_${new Date().getMonth() + 1}.xlsx`);
        setPreviewModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error previewing combined dashboard report');
    } finally {
      window.__isDownloadingAll = false;
      setReportLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Global Filters Panel */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-sm relative z-30 transition-all">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3.5 w-full">
          {/* User Filter */}
          {hasFullDashboardAccess && (
            <div className="flex flex-col gap-1 w-full lg:w-52 shrink-0">
              <SearchableSelect
                label="Filtered User"
                icon={User}
                options={[
                  { value: '', label: 'All Users' },
                  ...(stats.users || [])
                    .filter(u => (u.role || '').toLowerCase().includes('sales'))
                    .map(u => ({
                      value: u._id,
                      label: u.name,
                      subLabel: u.role,
                      badge: u.role
                    }))
                ]}
                value={selectedUser}
                onChange={(val) => setSelectedUser(val)}
                placeholder="All Users"
                searchPlaceholder="Search sales user..."
              />
            </div>
          )}

          {/* Project Filter */}
          <div className="flex flex-col gap-1 w-full lg:w-52 shrink-0">
            <SearchableSelect
              label="Filtered Project"
              icon={FolderOpen}
              options={[
                { value: '', label: 'All Projects' },
                ...(stats.projects || []).map(p => ({
                  value: p._id,
                  label: p.code || p.name,
                  subLabel: p.name && p.code ? p.name : undefined
                }))
              ]}
              value={selectedProject}
              onChange={(val) => setSelectedProject(val)}
              placeholder="All Projects"
              searchPlaceholder="Search projects..."
            />
          </div>

          {/* Date Range & Presets Filter */}
          <div className="w-full lg:flex-1 min-w-0">
            <DateRangeFilter
              label="Date Filtration Mode"
              fromDate={fromDate}
              toDate={toDate}
              onDateChange={(newFrom, newTo) => {
                setFromDate(newFrom);
                setToDate(newTo);
              }}
            />
          </div>

          {loading && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-[#0e623a] rounded-xl text-xs font-bold animate-pulse shadow-xs shrink-0 self-end">
              <Loader2 className="w-3.5 h-3.5 text-[#0e623a] animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Reports Grid (2nd Format UI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* Card 1: Download All */}
        <div
          onClick={handleDownloadAll}
          className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide">Download All Reports</h3>
        </div>

        {/* Card 2: Summary Report */}
        <div
          onClick={handleExportSummaryReport}
          className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-indigo-800 uppercase tracking-wide">Summary Report</h3>
        </div>

        {/* Card 3: User Report */}
        <div
          onClick={handleExportUserReport}
          className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide">User Report</h3>
        </div>

        {/* Card 4: Project Report */}
        <div
          onClick={handleExportProjectReport}
          className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-blue-800 uppercase tracking-wide">Project Report</h3>
        </div>

        {/* Card 5: Source Report */}
        <div
          onClick={handleExportSourceReport}
          className="bg-purple-50 border border-purple-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-purple-800 uppercase tracking-wide">Source Report</h3>
        </div>

      </div>

      {/* Full Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-6xl h-[94vh] sm:h-[90vh] rounded-2xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden relative border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[#0e623a] shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight truncate">
                      {previewSheets.length > 0 
                        ? (previewSheets[currentSheetIndex].name.toLowerCase().includes('preview') 
                            ? previewSheets[currentSheetIndex].name 
                            : `${previewSheets[currentSheetIndex].name} - Preview`)
                        : 'Report Preview'}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold truncate">Excel Layout & Print Preview</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {/* Desktop Sheet switcher */}
                  {previewSheets.length > 1 && (
                    <div className="hidden sm:flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-xl border border-gray-200">
                      <button 
                        onClick={() => {
                          const newIdx = Math.max(0, currentSheetIndex - 1);
                          setCurrentSheetIndex(newIdx);
                          setPreviewHtml(previewSheets[newIdx].html);
                        }}
                        disabled={currentSheetIndex === 0}
                        className="px-2 py-0.5 rounded-lg font-bold text-xs text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        &larr; Prev
                      </button>
                      <span className="font-bold text-xs text-gray-700 px-1">
                        {currentSheetIndex + 1} / {previewSheets.length}
                      </span>
                      <button 
                        onClick={() => {
                          const newIdx = Math.min(previewSheets.length - 1, currentSheetIndex + 1);
                          setCurrentSheetIndex(newIdx);
                          setPreviewHtml(previewSheets[newIdx].html);
                        }}
                        disabled={currentSheetIndex === previewSheets.length - 1}
                        className="px-2 py-0.5 rounded-lg font-bold text-xs text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setPreviewModalOpen(false)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                    title="Close Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Sheet switcher bar */}
              {previewSheets.length > 1 && (
                <div className="flex sm:hidden items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      const newIdx = Math.max(0, currentSheetIndex - 1);
                      setCurrentSheetIndex(newIdx);
                      setPreviewHtml(previewSheets[newIdx].html);
                    }}
                    disabled={currentSheetIndex === 0}
                    className="flex-1 py-1 px-2 rounded-lg font-bold text-xs text-gray-700 bg-gray-50 border border-gray-200 disabled:opacity-30 text-center"
                  >
                    &larr; Prev Sheet
                  </button>
                  <span className="font-extrabold text-xs text-[#0e623a] px-2 whitespace-nowrap">
                    Sheet {currentSheetIndex + 1} of {previewSheets.length}
                  </span>
                  <button 
                    onClick={() => {
                      const newIdx = Math.min(previewSheets.length - 1, currentSheetIndex + 1);
                      setCurrentSheetIndex(newIdx);
                      setPreviewHtml(previewSheets[newIdx].html);
                    }}
                    disabled={currentSheetIndex === previewSheets.length - 1}
                    className="flex-1 py-1 px-2 rounded-lg font-bold text-xs text-gray-700 bg-gray-50 border border-gray-200 disabled:opacity-30 text-center"
                  >
                    Next Sheet &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Scroll Hint Banner */}
            <div className="sm:hidden px-3 py-1 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[10px] text-[#0e623a] font-semibold shrink-0">
              <span>↔ Swipe horizontally to view full table</span>
              <span className="text-[9px] text-gray-500 font-bold">100% EXCEL VIEW</span>
            </div>

            {/* Modal Body (Scrollable HTML Preview with elegant card framing) */}
            <div className="p-2 sm:p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-100 flex justify-start sm:justify-center items-start">
              <div 
                className="bg-white shadow-md rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-6 inline-block min-w-[640px] sm:min-w-[720px] max-w-none my-1"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-t border-gray-200 bg-white flex flex-row items-center justify-end gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={downloadFromPreview}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#0e623a] hover:bg-[#0b4d2d] shadow-sm flex items-center justify-center gap-2 transition cursor-pointer text-center whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Download Excel</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Loading Spinner Overlay */}
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

export default DashboardReports;
