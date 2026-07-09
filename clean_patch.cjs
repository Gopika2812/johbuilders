const fs = require('fs');
let content = fs.readFileSync('client/src/pages/ExportReports.jsx', 'utf8');

// 1. Add import
if (!content.includes('import XLSX')) {
  content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport XLSX from 'xlsx-js-style';");
}

// 2. Modify handlePreview
content = content.replace(
  "const handlePreview = (html, filename) => {\n    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });",
  "const handlePreview = (html, filename) => {\n    if (window.__isDownloadingAll) {\n      window.__capturedHtml = html;\n      return;\n    }\n    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });"
);

// 3. Add handleDownloadAll
const downloadAllFunc = `
  const handleDownloadAll = async () => {
    try {
      setLoading(true);
      window.__isDownloadingAll = true;
      const wb = XLSX.utils.book_new();

      const convertHtmlToSheet = async (exportFunc, sheetName) => {
        window.__capturedHtml = null;
        await exportFunc();
        const htmlString = window.__capturedHtml;
        if (!htmlString) return;
        const div = document.createElement('div');
        div.innerHTML = htmlString;
        const table = div.querySelector('table');
        if (table) {
          const ws = XLSX.utils.table_to_sheet(table, { raw: true });
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      };

      await convertHtmlToSheet(handleExportEnquiriesExcel, 'Enquiries');
      await convertHtmlToSheet(handleExportSiteVisitsExcel, 'Site Visits');
      await convertHtmlToSheet(handleExportHotListExcel, 'Hot List');
      await convertHtmlToSheet(handleExportBookingsExcel, 'Bookings');
      await convertHtmlToSheet(handleExportSummaryReport, 'Summary');
      await convertHtmlToSheet(handleExportMarketingReport, 'Mktg Returns');
      await convertHtmlToSheet(handleExportLeadSourcesExcel, 'Lead Sources');
      await convertHtmlToSheet(handleExportRegistrationReport, 'Registrations');
      await convertHtmlToSheet(handleExportKeyHandoverReport, 'Handovers');
      await convertHtmlToSheet(handleExportCollectionReport, 'Collections');
      await convertHtmlToSheet(handleExportBankLoansExcel, 'Bank Loans');
      await convertHtmlToSheet(handleExportExtraWorksReport, 'Extra Works');
      await convertHtmlToSheet(handleExportComplaintsReport, 'Complaints');

      XLSX.writeFile(wb, \`JB_COMBINED_REPORT_\${new Date().getFullYear()}_\${new Date().getMonth() + 1}.xlsx\`);
    } catch (err) {
      console.error(err);
      alert('Error generating combined report');
    } finally {
      window.__isDownloadingAll = false;
      setLoading(false);
    }
  };
`;

if (!content.includes('const handleDownloadAll = async () =>')) {
  content = content.replace('const handleMonthChange = (monthVal)', downloadAllFunc + '\n  const handleMonthChange = (monthVal)');
}

// 4. Add button
const buttonHtml = `
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">
          <button onClick={handleDownloadAll} className="px-4 py-1.5 bg-[#0e623a] text-white rounded-lg text-xs font-bold hover:bg-[#0b4d2d] transition shadow-sm">
            Download All (Combined)
          </button>
`;

content = content.replace('<div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">', buttonHtml);

fs.writeFileSync('client/src/pages/ExportReports.jsx', content);
console.log('Clean patch successful!');
