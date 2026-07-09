const fs = require('fs');

let sidebar = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

// Sidebar background
sidebar = sidebar.replace(/w-64 bg-\[\#0e623a\] text-white/g, 'w-64 bg-[#edfbf4] text-[#4b7a69]');
sidebar = sidebar.replace(/border-r border-\[\#0b4d2d\] shadow-lg/g, 'border-none shadow-none');
sidebar = sidebar.replace(/border-r\s*\n\s*border-\[\#0b4d2d\] shadow-lg/g, 'border-none shadow-none');

// Logo
sidebar = sidebar.replace(/<h1 className="font-extrabold text-2xl tracking-tight text-\[\#00c875\]">LandERP<\/h1>/g, '<h1 className="font-extrabold text-2xl tracking-tight"><span className="text-[#11c278]">Land</span><span className="text-[#1e4a3b]">ERP</span></h1>');
sidebar = sidebar.replace(/<div className="p-2 bg-white\/10 rounded-lg border border-white\/20">[\s\S]*?<\/div>\s*<div>[\s\S]*?<\/div>/g, '<h1 className="font-extrabold text-2xl tracking-tight"><span className="text-[#11c278]">Land</span><span className="text-[#1e4a3b]">ERP</span></h1>');

// Active links (main)
sidebar = sidebar.replace(/bg-white\/10 text-white font-bold border border-white\/10 shadow-sm/g, 'bg-[#11c278] text-white font-bold shadow-md');
// Active links (sub)
sidebar = sidebar.replace(/text-white font-extrabold border-l-2 border-white pl-2/g, 'text-[#11c278] font-extrabold pl-2');

// Inactive links
sidebar = sidebar.replace(/text-emerald-100 hover:bg-white\/5 hover:text-white/g, 'text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278]');
sidebar = sidebar.replace(/text-emerald-150 hover:text-white hover:bg-white\/5/g, 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10');
sidebar = sidebar.replace(/text-emerald-300/g, 'text-[#4b7a69]');
sidebar = sidebar.replace(/text-emerald-200/g, 'text-[#4b7a69]');
sidebar = sidebar.replace(/text-gray-400/g, 'text-gray-500');

// Icons in active links
// Currently they are `{isActive(...) ? 'text-white' : 'text-emerald-300'}`
sidebar = sidebar.replace(/\? 'text-white' : 'text-\[\#4b7a69\]'/g, "? 'text-white' : 'text-[#4b7a69]'");

fs.writeFileSync('client/src/components/Sidebar.jsx', sidebar);
console.log('Sidebar patched successfully.');
