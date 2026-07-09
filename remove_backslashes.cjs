const fs = require('fs');
['client/src/pages/CRDReports.jsx','client/src/pages/ExportReports.jsx','client/src/pages/KPIInsights.jsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\`/g, '`');
  fs.writeFileSync(file, content);
});
