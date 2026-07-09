const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace bg-white with bg-[#f0fbf4]
  content = content.replace(/bg-white/g, 'bg-[#f0fbf4]');
  
  // Strip borders
  content = content.replace(/border border-gray-100/g, 'border-none');
  content = content.replace(/border border-gray-150/g, 'border-none');
  content = content.replace(/border border-gray-200/g, 'border-none');
  content = content.replace(/border border-slate-100\/50/g, 'border-none');
  content = content.replace(/border border-slate-100/g, 'border-none');

  fs.writeFileSync(filePath, content);
  console.log(`${filePath} cards updated perfectly.`);
}

patchFile('client/src/pages/CRDDashboard.jsx');
patchFile('client/src/pages/Dashboard.jsx');
