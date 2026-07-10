const fs = require('fs');

let sidebar = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

// Fix the syntax error in className="w-full flex items-center justify-between ${...} ..."
sidebar = sidebar.replace(
  /className="w-full flex items-center justify-between \$\{sidebarOpen \? "justify-between px-4" : "justify-center px-0"\} py-3 text-\[\#1e4a3b\] hover:bg-\[\#11c278\]\/10 hover:text-\[\#11c278\] rounded-xl transition duration-200"/g,
  'className={`w-full flex items-center ${sidebarOpen ? "justify-between px-4" : "justify-center px-0"} py-3 text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200`}'
);

fs.writeFileSync('client/src/components/Sidebar.jsx', sidebar);
console.log('Fixed syntax error in Sidebar.jsx');
