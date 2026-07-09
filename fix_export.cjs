const fs = require('fs');
let content = fs.readFileSync('client/src/pages/ExportReports.jsx', 'utf8');

const matches = [...content.matchAll(/const handleExport = async \(returnHtml = false\) => {([\s\S]*?)alert\('Error exporting (.*?)'\);/g)];

for (const match of matches) {
    const block = match[0];
    const alertMsg = match[2];
    let correctName = '';
    
    if (alertMsg.includes('enquiry')) correctName = 'handleExportEnquiriesExcel';
    else if (alertMsg.includes('site visits')) correctName = 'handleExportSiteVisitsExcel';
    else if (alertMsg.includes('hot list')) correctName = 'handleExportHotListExcel';
    else if (alertMsg.includes('unit booking')) correctName = 'handleExportBookingsExcel';
    else if (alertMsg.includes('marketing returns')) correctName = 'handleExportMarketingReturnsReport';
    else if (alertMsg.includes('lead sources')) correctName = 'handleExportLeadSourcesReport';
    else if (alertMsg.includes('registration')) correctName = 'handleExportRegistrationReport';
    else if (alertMsg.includes('key handover')) correctName = 'handleExportKeyHandoverReport';
    else if (alertMsg.includes('collection')) correctName = 'handleExportCollectionReport';
    else if (alertMsg.includes('bank loan')) correctName = 'handleExportBankLoansExcel';
    else if (alertMsg.includes('extra works')) correctName = 'handleExportExtraWorksReport';
    else if (alertMsg.includes('customer complaints')) correctName = 'handleExportComplaintsReport';
    else correctName = 'handleExportUnknown';

    if (correctName) {
        content = content.replace('const handleExport = async (returnHtml = false) => {', `const ${correctName} = async (returnHtml = false) => {`);
    }
}

fs.writeFileSync('client/src/pages/ExportReports.jsx', content);
console.log('Fixed export function names!');
