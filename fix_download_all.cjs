const fs = require('fs');

const file = 'client/src/pages/ExportReports.jsx';
let content = fs.readFileSync(file, 'utf8');

const correctDownloadAll = `  const handleDownloadAll = async () => {
    try {
      setLoading(true);
      window.__isDownloadingAll = true;
      const wb = XLSX.utils.book_new();

      const convertHtmlToSheet = async (exportFunc, sheetName) => {
        window.__capturedHtml = null;
        await exportFunc(); // It triggers handlePreview, which sets window.__capturedHtml
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
      await convertHtmlToSheet(handleExportMarketingReturnsReport, 'Marketing Returns');
      await convertHtmlToSheet(handleExportLeadSourcesReport, 'Lead Sources');
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
  };`;

// Replace the old handleDownloadAll
// We can just regex match from 'const handleDownloadAll = async () => {' to 'finally {\n        setLoading(false);\n      }\n    };'
content = content.replace(/const handleDownloadAll = async \(\) => {[\s\S]*?finally {\s*setLoading\(false\);\s*}\s*};/m, correctDownloadAll);

fs.writeFileSync(file, content);
console.log('Fixed handleDownloadAll');
