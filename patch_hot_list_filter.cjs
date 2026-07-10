const fs = require('fs');

const files = [
  'client/src/pages/CRDReports.jsx',
  'client/src/pages/KPIInsights.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace Hot list filter logic
    content = content.replace(
      /const isHotList = lead\.status === 'Qualified' \|\| lead\.status === 'Negotiation';/g,
      "const isHotList = (lead.status === 'Hot List' || (lead.history && lead.history.some(h => h.status === 'Hot List'))) && !lead.isClosed;"
    );

    fs.writeFileSync(file, content);
    console.log('Patched ' + file);
  }
});
