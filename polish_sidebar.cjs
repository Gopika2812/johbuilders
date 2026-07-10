const fs = require('fs');

let sidebar = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

// 1. Fix Link classes. We need dynamic justify and px based on sidebarOpen.
// Current: `flex items-center gap-3 px-4 py-3 justify-center md:justify-start rounded-xl transition-all duration-200 ${`
sidebar = sidebar.replace(
  /className=\{`flex items-center gap-3 px-4 py-3 justify-center md:justify-start/g,
  'className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200'
);
sidebar = sidebar.replace(
  /className=\{`flex items-center gap-3 px-4 py-3 justify-center md:justify-start/g,
  'className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200'
);
// Catch any remaining
sidebar = sidebar.replace(
  /className=\{`flex items-center gap-3 px-4 py-3 justify-center md:justify-start/g,
  'className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200'
);
sidebar = sidebar.replace(
  /className=\{`flex items-center gap-3 px-4 py-3 justify-center md:justify-start/g,
  'className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200'
);
sidebar = sidebar.replace(
  /className=\{`flex items-center gap-3 px-4 py-3 justify-center md:justify-start/g,
  'className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200'
);
// Note: It's better to just regex all links that match:
sidebar = sidebar.replace(/flex items-center gap-3 px-4 py-3 justify-center md:justify-start/g, 'flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"}');

// Also for buttons (Leads Phase, Reports Master)
sidebar = sidebar.replace(/px-4 py-3 justify-center md:justify-start/g, '${sidebarOpen ? "justify-between px-4" : "justify-center px-0"} py-3');

// 2. Hide submenus entirely when sidebar is collapsed to avoid ugly rendering
// Search for `leadsMenuOpen && (`
sidebar = sidebar.replace(/\{leadsMenuOpen && \(/g, '{leadsMenuOpen && sidebarOpen && (');
sidebar = sidebar.replace(/\{financeMenuOpen && \(/g, '{financeMenuOpen && sidebarOpen && (');
sidebar = sidebar.replace(/\{reportsMenuOpen && \(/g, '{reportsMenuOpen && sidebarOpen && (');
sidebar = sidebar.replace(/\{employeeMenuOpen && \(/g, '{employeeMenuOpen && sidebarOpen && (');
sidebar = sidebar.replace(/\{projectMenuOpen && \(/g, '{projectMenuOpen && sidebarOpen && (');

// 3. User says "make icon clors should be in dark green". In their target image, it's a very dark sea green.
// I used `text-[#4b7a69]`. Let's change it to a darker green like `text-[#2b5946]` or `text-[#1e4a3b]`.
sidebar = sidebar.replace(/text-\[\#4b7a69\]/g, 'text-[#1e4a3b]');

// 4. Logo needs to be centered nicely when collapsed
sidebar = sidebar.replace(/<div className="p-6 border-none flex items-center justify-center gap-3 overflow-hidden">/g, 
  '<div className={`p-6 border-none flex items-center ${sidebarOpen ? "justify-start" : "justify-center"} gap-3 overflow-hidden`}>');

// 5. Fix the bottom profile section which was cut off.
// Let's hide the profile text when collapsed.
sidebar = sidebar.replace(/<div className="flex items-center gap-3 px-4 py-3 bg-white\/40 backdrop-blur-sm rounded-xl">/g,
  '<div className={`flex items-center gap-3 py-3 bg-white/40 backdrop-blur-sm rounded-xl ${sidebarOpen ? "px-4" : "px-0 justify-center"}`}>');

sidebar = sidebar.replace(/<div className="flex-1">/g, '<div className={`flex-1 ${sidebarOpen ? "block" : "hidden"}`}>');

// Logout button 
sidebar = sidebar.replace(/<button onClick=\{logout\} className="p-2 text-\[\#1e4a3b\] hover:bg-white\/50 rounded-lg transition" title="Logout">/g,
  '<button onClick={logout} className={`p-2 text-[#1e4a3b] hover:bg-white/50 rounded-lg transition ${sidebarOpen ? "" : "hidden"}`} title="Logout">');

// Active link background `bg-[#11c278]` but for projects it was `bg-white/10`. Make sure active links are right.
sidebar = sidebar.replace(/bg-white\/10 text-white font-bold border-l-4 border-white/g, 'bg-[#11c278] text-white font-bold shadow-md');

fs.writeFileSync('client/src/components/Sidebar.jsx', sidebar);
console.log('Sidebar polished');
