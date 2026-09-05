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
  Compass
} from 'lucide-react';

const getExcelStyles = (titleBg, monthBg, headerBg, execBg) => {
  return `
    <style>
      table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
      td, th { border: 1px solid #CBD5E1; padding: 8px 12px; font-size: 9.5pt; color: #1E293B; }
      th, .table-headers th { font-weight: bold; background-color: #0F5233 !important; color: #FFFFFF !important; border: 1px solid #0D4329 !important; text-align: center; height: 34px; font-size: 10pt; vertical-align: middle; }
      .title-row { font-size: 14pt; font-weight: bold; color: #FFFFFF !important; background-color: #0F5233 !important; text-align: center; border: 1px solid #0D4329 !important; height: 65px; vertical-align: middle; }
      .month-header { height: 28px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: #E6F4EA !important; color: #0F5233 !important; border: 1px solid #C3E6CB !important; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
      .section-banner { font-size: 11pt; font-weight: bold; background-color: #E6F4EA !important; color: #0F5233 !important; padding: 10px; border: 1px solid #C3E6CB; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
      .logo-cell { background-color: #FFFFFF !important; border: 1px solid #CBD5E1; text-align: center; vertical-align: middle; padding: 4px 8px; }
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
    ${dateRangeTitle ? `
    <tr>
      <td colspan="${safeCols}" class="month-header" style="height: 28px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: #E6F4EA; color: #0F5233; border: 1px solid #C3E6CB; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
        ${dateRangeTitle}
      </td>
    </tr>` : ''}
    <tr><td colspan="${safeCols}" style="border:none; height: 12px; background-color: transparent;"></td></tr>
  `;
};

const DashboardReports = () => {
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

  // User and Project filters
  const [selectedUser, setSelectedUser] = useState(() => {
    const isPrivileged = user?.role === 'Superadmin' || user?.role === 'Admin' || user?.role === 'superadmin' || user?.role === 'admin';
    return isPrivileged ? '' : (user?._id || '');
  });
  const [selectedProject, setSelectedProject] = useState('');

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

  const handlePreview = (html, filename) => {
    if (window.__isDownloadingAll) {
      window.__capturedHtml = html;
      return;
    }
    setPreviewSheets([{ name: 'Report Preview', html }]);
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
    (statsObj.users || []).forEach(u => {
      data[u.name] = {
        userName: u.name,
        totalLeads: 0,
        assigned: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        futureFollowup: 0,
        booked: 0,
        handover: 0,
        lost: 0
      };
    });

    const rangeStart = startD ? new Date(startD) : null;
    let rangeEnd = null;
    if (endD) {
      rangeEnd = new Date(endD);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    const inDateRange = (dateStr) => {
      if (!startD && !endD) return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (rangeStart && d < rangeStart) return false;
      if (rangeEnd && d > rangeEnd) return false;
      return true;
    };

    if (statsObj.cards?.leadsList && Array.isArray(statsObj.cards.leadsList)) {
      statsObj.cards.leadsList.forEach(lead => {
        const isCreated = inDateRange(lead.createdAt);
        if (!isCreated) return;

        const uName = lead.assignedTo || 'Unassigned';
        if (!data[uName]) {
          data[uName] = {
            userName: uName,
            totalLeads: 0,
            assigned: 0,
            enquiries: 0,
            siteVisits: 0,
            hotList: 0,
            futureFollowup: 0,
            booked: 0,
            handover: 0,
            lost: 0
          };
        }

        data[uName].totalLeads += 1;
        const status = lead.status || '';
        const isHot = lead.leadCategory === 'Hot' || lead.leadCategory === 'HOT' || (lead.leadCategory && lead.leadCategory.toLowerCase() === 'hot') || status === 'Hot List';

        if (status === 'Assigned') data[uName].assigned = (data[uName].assigned || 0) + 1;
        else if (status === 'Contacted' || status === 'Follow-Up' || status === 'Followup') data[uName].enquiries += 1;
        else if (status === 'Site Visit' || status === 'Site Visit Follow-up') data[uName].siteVisits += 1;
        if (isHot) data[uName].hotList += 1;
        if (status === 'Future Follow-up' || status === 'Future Followup' || (status && status.toLowerCase().includes('future'))) data[uName].futureFollowup = (data[uName].futureFollowup || 0) + 1;
        else if (status === 'Booking' || status === 'Booked') data[uName].booked += 1;
        else if (status === 'Won' || status === 'Handover') data[uName].handover += 1;
        else if (status === 'Lost' || status === 'Closed' || status === 'Cancelled' || lead.isClosed) data[uName].lost += 1;
      });

      return Object.values(data).filter(u => u.totalLeads > 0 || (u.assigned || 0) > 0 || u.enquiries > 0 || u.siteVisits > 0 || u.hotList > 0 || (u.futureFollowup || 0) > 0 || u.booked > 0 || u.handover > 0 || u.lost > 0);
    }

    return Object.values(data);
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
            ${getExcelHeader('OVERALL SUMMARY REPORT', dateTitle, 9)}
            
            <tr><td colspan="9" class="section-banner">PART 1: PROJECTS & UNIT TYPE SUMMARY</td></tr>
            <tr class="table-headers">
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
            
            <tr class="table-headers">
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
        html += `
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

      html += `
            <tr><td colspan="9" style="border:none; height: 15px;"></td></tr>
            <tr><td colspan="9" class="section-banner">PART 2: USER PERFORMANCE SUMMARY</td></tr>
            <tr class="table-headers">
              <th class="text-left">User Name</th>
              <th class="text-right">Total Leads</th>
              <th class="text-right">Enquiries</th>
              <th class="text-right">Site Visit</th>
              <th class="text-right">Hot List</th>
              <th class="text-right">Booking</th>
              <th colspan="3" class="text-right">Handover</th>
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
            <td class="text-right">${row.totalLeads}</td>
            <td class="text-right">${row.enquiries}</td>
            <td class="text-right">${row.siteVisits}</td>
            <td class="text-right">${row.hotList}</td>
            <td class="text-right">${row.booked}</td>
            <td colspan="3" class="text-right">${row.handover}</td>
          </tr>
        `;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      handlePreview(html, `JB_OVERALL_SUMMARY_REPORT_${new Date().toISOString().substring(0, 10)}.xlsx`);
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
            ${getExcelHeader('JOHN BUILDWELL ERP - EXECUTIVE WISE PERFORMANCE REPORT', dateTitle, 7)}
      `;

      const targetUsers = selectedUser
        ? [(activeStats.users || []).find(u => u._id === selectedUser)?.name].filter(Boolean)
        : (activeStats.users || []).map(u => u.name);

      targetUsers.forEach(uName => {
        let uTotalLeads = 0;
        let uEnquiries = 0;
        let uSiteVisits = 0;
        let uHotList = 0;
        let uBooked = 0;
        let uHandover = 0;
        const rows = [];

        Object.keys(activeStats.personProjectStages || {}).forEach(key => {
          const row = activeStats.personProjectStages[key];
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

        html += `
          <tr><td colspan="7" class="section-banner">USER: ${uName.toUpperCase()} (TOTAL LEADS: ${uTotalLeads})</td></tr>
          <tr class="table-headers">
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
          html += `
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

        html += `<tr><td colspan="7" style="border:none; height:15px;"></td></tr>`;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      handlePreview(html, `JB_EXECUTIVE_WISE_REPORT_${new Date().toISOString().substring(0, 10)}.xlsx`);
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
            ${getExcelHeader('JOHN BUILDWELL ERP - PROJECT WISE PERFORMANCE REPORT', dateTitle, 7)}
      `;

      const targetProjects = selectedProject
        ? [(activeStats.projects || []).find(p => p._id === selectedProject)?.code || (activeStats.projects || []).find(p => p._id === selectedProject)?.name].filter(Boolean)
        : (activeStats.projects || []).map(p => p.code || p.name);

      targetProjects.forEach(projName => {
        const stages = activeStats.projectStages?.[projName] || { totalLeads: 0, enquiries: 0, siteVisits: 0, hotList: 0, booked: 0, handover: 0 };

        html += `
          <tr><td colspan="7" class="section-banner">PROJECT: ${projName.toUpperCase()}</td></tr>
          <tr class="table-headers">
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
          
          <tr class="table-headers">
            <th colspan="2" class="text-left">Executive Name</th>
            <th class="text-right">Total Leads</th>
            <th class="text-right">Enquiries</th>
            <th class="text-right">Site Visit</th>
            <th class="text-right">Hot List</th>
            <th class="text-right">Booked</th>
          </tr>
        `;

        let executiveIdx = 0;
        Object.keys(activeStats.personProjectStages || {}).forEach(key => {
          const row = activeStats.personProjectStages[key];
          if (row.projectName === projName) {
            const rowClass = executiveIdx % 2 === 1 ? 'class="even-row"' : '';
            executiveIdx++;
            html += `
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

        html += `<tr><td colspan="7" style="border:none; height:20px;"></td></tr>`;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      handlePreview(html, `JB_PROJECT_WISE_REPORT_${new Date().toISOString().substring(0, 10)}.xlsx`);
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
            ${getExcelHeader('JOHN BUILDWELL ERP - MARKETING SOURCE PERFORMANCE REPORT', dateTitle, 4)}
            <tr class="table-headers">
              <th class="text-left">Source Type</th>
              <th class="text-right">Budget Allocation</th>
              <th class="text-right">Spent Value</th>
              <th class="text-right">Networth Generated Value</th>
            </tr>
      `;

      const targetSources = Object.keys(activeStats.sourceStats || {});

      targetSources.forEach((src, idx) => {
        const s = activeStats.sourceStats?.[src] || { budget: 0, spent: 0, value: 0 };
        const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
        html += `
          <tr ${rowClass}>
            <td class="bold-label text-left">${src}</td>
            <td class="text-right">Rs. ${(s.budget || 0).toLocaleString()}</td>
            <td class="text-right">Rs. ${(s.spent || 0).toLocaleString()}</td>
            <td class="text-right">Rs. ${(s.value || 0).toLocaleString()}</td>
          </tr>
        `;
      });

      html += `
          </table>
        </body>
        </html>
      `;

      handlePreview(html, `JB_SOURCE_WISE_REPORT_${new Date().toISOString().substring(0, 10)}.xlsx`);
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
      {/* Header & Global Filters */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-[#0e623a]/5 to-transparent pointer-events-none"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-[#0e623a]/10 text-[#0e623a] rounded-2xl border border-[#0e623a]/20">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-black-800 tracking-tight">Dashboard Reports</h1>
              {loading && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#0e623a] rounded-full text-xs font-bold animate-pulse shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 text-[#0e623a] animate-spin" />
                  <span>Syncing filtered data...</span>
                </div>
              )}
            </div>
            {/* <p className="text-xs text-gray-500 mt-1">Export executive summary, user performance, and project pipelines.</p> */}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* User Filter */}
          {(user?.role === 'Superadmin' || user?.role === 'Admin' || user?.role === 'superadmin' || user?.role === 'admin') && (
            <div className="w-48">
              <SearchableSelect
                icon={User}
                options={[
                  { value: '', label: 'All Users' },
                  ...(stats.users || []).map(u => ({
                    value: u._id,
                    label: u.name,
                    subLabel: u.role,
                    badge: u.role
                  }))
                ]}
                value={selectedUser}
                onChange={(val) => setSelectedUser(val)}
                placeholder="All Users"
                searchPlaceholder="Search users..."
              />
            </div>
          )}

          {/* Project Filter */}
          <div className="w-48">
            <SearchableSelect
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
          <div className="w-full lg:w-auto">
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onDateChange={(newFrom, newTo) => {
                setFromDate(newFrom);
                setToDate(newTo);
              }}
            />
          </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                {previewSheets.length > 0 ? `${previewSheets[currentSheetIndex].name} - Preview` : 'Report Preview'}
              </h2>
              
              {previewSheets.length > 1 && (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      const newIdx = Math.max(0, currentSheetIndex - 1);
                      setCurrentSheetIndex(newIdx);
                      setPreviewHtml(previewSheets[newIdx].html);
                    }}
                    disabled={currentSheetIndex === 0}
                    className="px-4 py-1.5 rounded-lg font-bold text-gray-600 bg-white border hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
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
                    className="px-4 py-1.5 rounded-lg font-bold text-gray-600 bg-white border hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
                  >
                    Next Sheet &rarr;
                  </button>
                </div>
              )}

              <button 
                onClick={() => setPreviewModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition ml-4 cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center font-bold text-xl leading-none">&times;</div>
              </button>
            </div>

            {/* Modal Body (Scrollable HTML Preview) */}
            <div className="p-6 overflow-auto flex-1 bg-gray-100">
              <div 
                className="bg-white shadow-sm border border-gray-200 p-4 inline-block min-w-full"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={downloadFromPreview}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Excel
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
