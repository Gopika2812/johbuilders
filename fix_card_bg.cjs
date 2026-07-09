const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CRDDashboard.jsx', 'utf8');

// Change card backgrounds to #f0fbf4
content = content.replace(/bg-white rounded-3xl/g, 'bg-[#f0fbf4] rounded-3xl');

// Inner small cards were changed to bg-white earlier. Let's change them to #f0fbf4 or transparent
content = content.replace(/bg-white rounded-2xl p-4/g, 'bg-transparent border border-[#e1f0e8] rounded-2xl p-4');
content = content.replace(/bg-white border-none shadow-sm/g, 'bg-transparent border-none');
content = content.replace(/bg-white border-none rounded-xl/g, 'bg-transparent rounded-xl');

// For the filter dropdowns, let's keep them white or change to #f0fbf4
content = content.replace(/bg-white border-none shadow-sm px-3/g, 'bg-[#f0fbf4] border-none shadow-sm px-3');

fs.writeFileSync('client/src/pages/CRDDashboard.jsx', content);
console.log('Cards background updated.');
