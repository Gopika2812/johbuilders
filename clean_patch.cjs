const fs = require('fs');
let content = fs.readFileSync('client/src/pages/ExportReports.jsx', 'utf8');

const exportsToFix = [
  'handleExportEnquiriesExcel', 'handleExportSiteVisitsExcel', 'handleExportHotListExcel',
  'handleExportBookingsExcel', 'handleExportMarketingReturnsReport', 'handleExportLeadSourcesReport',
  'handleExportRegistrationReport', 'handleExportKeyHandoverReport', 'handleExportCollectionReport',
  'handleExportBankLoansExcel', 'handleExportExtraWorksReport', 'handleExportComplaintsReport'
];

exportsToFix.forEach(func => {
  content = content.replace(
    new RegExp('const ' + func + ' = async \\(\\) => {'),
    'const ' + func + ' = async (returnHtml = false) => {'
  );
});

if (!content.includes('const handlePreview = (html, filename)')) {
  content = content.replace('const [loading, setLoading] = useState(true);', 
    'const [loading, setLoading] = useState(true);\n  const handlePreview = (html, filename) => {\n    const blob = new Blob([html], { type: \'application/vnd.ms-excel\' });\n    const url = URL.createObjectURL(blob);\n    const a = document.createElement(\'a\');\n    a.href = url;\n    a.download = filename;\n    document.body.appendChild(a);\n    a.click();\n    document.body.removeChild(a);\n    URL.revokeObjectURL(url);\n  };');
}

content = content.replace(/handlePreview\(html,\s*([^)]+)\);/g, 'if (returnHtml) return html;\n      handlePreview(html, $1);');
content = content.replace(/const blob = new Blob\(\[html\], \{ type: 'application\/vnd\.ms-excel' \}\);/g, 'if (returnHtml) return html;\n      const blob = new Blob([html], { type: \'application/vnd.ms-excel\' });');

if (!content.includes('import XLSX')) {
  content = content.replace('import React,', 'import XLSX from \'xlsx-js-style\';\nimport React,');
}

const downloadAllFunc = `
  const handleDownloadAll = async () => {
    try {
      setLoading(true);
      const wb = XLSX.utils.book_new();

      const convertHtmlToSheet = (htmlString, sheetName) => {
        if (!htmlString) return;
        const div = document.createElement('div');
        div.innerHTML = htmlString;
        const table = div.querySelector('table');
        if (table) {
          const ws = XLSX.utils.table_to_sheet(table, { raw: true });
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      };

      convertHtmlToSheet(await handleExportEnquiriesExcel(true), 'Enquiries');
      convertHtmlToSheet(await handleExportSiteVisitsExcel(true), 'Site Visits');
      convertHtmlToSheet(await handleExportHotListExcel(true), 'Hot List');
      convertHtmlToSheet(await handleExportBookingsExcel(true), 'Bookings');
      convertHtmlToSheet(await handleExportMarketingReturnsReport(true), 'Mktg Returns');
      convertHtmlToSheet(await handleExportLeadSourcesReport(true), 'Lead Sources');
      convertHtmlToSheet(await handleExportRegistrationReport(true), 'Registrations');
      convertHtmlToSheet(await handleExportKeyHandoverReport(true), 'Handovers');
      convertHtmlToSheet(await handleExportCollectionReport(true), 'Collections');
      convertHtmlToSheet(await handleExportBankLoansExcel(true), 'Bank Loans');
      convertHtmlToSheet(await handleExportExtraWorksReport(true), 'Extra Works');
      convertHtmlToSheet(await handleExportComplaintsReport(true), 'Complaints');

      XLSX.writeFile(wb, \`JB_COMBINED_REPORT_\${new Date().getFullYear()}_\${new Date().getMonth() + 1}.xlsx\`);
    } catch (err) {
      console.error(err);
      alert('Error generating combined report');
    } finally {
      setLoading(false);
    }
  };
`;

if (!content.includes('const handleDownloadAll = async () =>')) {
  content = content.replace('const handleMonthChange = (monthVal)', downloadAllFunc + '\n  const handleMonthChange = (monthVal)');
}

const buttonHtml = `
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">
          <button onClick={handleDownloadAll} className="px-4 py-1.5 bg-[#0e623a] text-white rounded-lg text-xs font-bold hover:bg-[#0b4d2d] transition shadow-sm">
            Download All (Combined)
          </button>
`;

content = content.replace('<div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">', buttonHtml);

fs.writeFileSync('client/src/pages/ExportReports.jsx', content);
console.log('Clean patch successful!');
