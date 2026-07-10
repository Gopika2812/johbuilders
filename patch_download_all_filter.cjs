const fs = require('fs');

const file = 'client/src/pages/ExportReports.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /await convertHtmlToSheet\(handleExportRegistrationReport, 'Registrations'\);[\s\S]*?await convertHtmlToSheet\(handleExportComplaintsReport, 'Complaints'\);/;
content = content.replace(regex, '');

fs.writeFileSync(file, content);
console.log('Removed CRD reports from Download All');
