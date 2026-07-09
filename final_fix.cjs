const fs = require('fs');
let content = fs.readFileSync('client/src/pages/ExportReports.jsx', 'utf8');

// 1. Clean up handlePreview and inject window.__isDownloadingAll logic
// First we match the start of handlePreview and everything up to the blob creation, replacing it completely
content = content.replace(
  /const handlePreview = \(html, filename\) => {[\s\S]*?const blob = new Blob\(\[html\]/g,
  `const handlePreview = (html, filename) => {
    if (window.__isDownloadingAll) {
      window.__capturedHtml = html;
      return;
    }
    const blob = new Blob([html]`
);

// 2. Define fileCode at the top of the component so it's globally available for all exports
if (!content.includes("const fileCode = 'ALL_PROJECTS';")) {
  content = content.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const fileCode = \'ALL_PROJECTS\';'
  );
}

// 3. Make sure all handleExportUnknown are still correctly named (just in case they reverted)
const exportsToFix = [
  'handleExportEnquiriesExcel', 'handleExportSiteVisitsExcel', 'handleExportHotListExcel',
  'handleExportBookingsExcel', 'handleExportSummaryReport', 'handleExportMarketingReturnsReport', 'handleExportLeadSourcesReport',
  'handleExportRegistrationReport', 'handleExportKeyHandoverReport', 'handleExportCollectionReport',
  'handleExportBankLoansExcel', 'handleExportExtraWorksReport', 'handleExportComplaintsReport'
];

exportsToFix.forEach(func => {
  content = content.replace(
    new RegExp('const ' + func + ' = async \\(\\) => {'),
    'const ' + func + ' = async (returnHtml = false) => {'
  );
});

fs.writeFileSync('client/src/pages/ExportReports.jsx', content);
console.log('Final fix applied successfully!');
