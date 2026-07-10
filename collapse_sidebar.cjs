const fs = require('fs');

// Patch App.jsx
let app = fs.readFileSync('client/src/App.jsx', 'utf8');
app = app.replace(
  /className=\{`flex-1 flex flex-col min-h-screen relative z-10 w-full max-w-full min-w-0 transition-all duration-300 \$\{sidebarOpen \? 'pl-0 md:pl-64' : 'pl-0'\}`\}/g,
  'className={`flex-1 flex flex-col min-h-screen relative z-10 w-full max-w-full min-w-0 transition-all duration-300 ${sidebarOpen ? \'pl-0 md:pl-64\' : \'pl-0 md:pl-20\'}`}'
);
fs.writeFileSync('client/src/App.jsx', app);

// Patch Navbar.jsx
let navbar = fs.readFileSync('client/src/components/Navbar.jsx', 'utf8');
navbar = navbar.replace(
  /className=\{`h-16 bg-transparent border-none flex items-center justify-between px-4 md:px-8 fixed top-0 right-0 z-30 shadow-sm transition-all duration-300 \$\{sidebarOpen \? 'left-0 md:left-64' : 'left-0'\}`\}/g,
  'className={`h-16 bg-transparent border-none flex items-center justify-between px-4 md:px-8 fixed top-0 right-0 z-30 shadow-sm transition-all duration-300 ${sidebarOpen ? \'left-0 md:left-64\' : \'left-0 md:left-20\'}`}'
);
fs.writeFileSync('client/src/components/Navbar.jsx', navbar);

// Patch Sidebar.jsx
let sidebar = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

// Sidebar width and transition
sidebar = sidebar.replace(
  /<aside className=\{`w-64 bg-\[\#edfbf4\] text-\[\#4b7a69\] flex flex-col h-screen fixed left-0 top-0 z-50 border-none shadow-none transition-transform duration-300 transform \$\{\s*sidebarOpen \? 'translate-x-0' : '-translate-x-full'\s*\}\`\}>/g,
  '<aside className={`bg-[#edfbf4] text-[#4b7a69] flex flex-col h-screen fixed left-0 top-0 z-50 border-none shadow-none transition-all duration-300 ${sidebarOpen ? \'w-64 translate-x-0\' : \'w-20 -translate-x-full md:translate-x-0 overflow-hidden\'}`}>'
);

// Logo collapse
sidebar = sidebar.replace(
  /<div className="p-6 border-b border-white\/10 flex items-center gap-3">\s*<h1 className="font-extrabold text-2xl tracking-tight"><span className="text-\[\#11c278\]">Land<\/span><span className="text-\[\#1e4a3b\]">ERP<\/span><\/h1>\s*<\/div>/g,
  `<div className="p-6 border-none flex items-center justify-center gap-3 overflow-hidden">
        {sidebarOpen ? (
          <h1 className="font-extrabold text-2xl tracking-tight"><span className="text-[#11c278]">Land</span><span className="text-[#1e4a3b]">ERP</span></h1>
        ) : (
          <h1 className="font-extrabold text-2xl tracking-tight"><span className="text-[#11c278]">L</span></h1>
        )}
      </div>`
);

// Span texts in links
// Only replace simple <span>Text</span> where Text is alphanumeric + spaces + maybe some special chars, avoiding ones with classes
sidebar = sidebar.replace(/<span>([a-zA-Z0-9\s&]+)<\/span>/g, '<span className={sidebarOpen ? "block truncate" : "hidden"}>$1</span>');

// Chevron icon for dropdowns
sidebar = sidebar.replace(/<ChevronDown className=\{`w-4 h-4 text-\[\#4b7a69\] transition-transform duration-200 \$\{.*?\}\`\} \/>/g, 
  (match) => {
    return `{sidebarOpen && ${match}}`;
  }
);

// Group headers (like "Leads Phase") in buttons
sidebar = sidebar.replace(/<span className="font-semibold">([a-zA-Z0-9\s&]+)<\/span>/g, '<span className={`font-semibold ${sidebarOpen ? "block" : "hidden"}`}>$1</span>');

// Pl-8 padding for submenus should only apply if sidebar is open, else maybe center them or hide the dropdown entirely
// Actually, it's easiest if dropdown submenus just float or are hidden when collapsed, but for now we just let them overflow hidden
sidebar = sidebar.replace(/className="pl-8 mt-1 space-y-1"/g, 'className={`mt-1 space-y-1 ${sidebarOpen ? "pl-8" : "pl-0 flex flex-col items-center"}`}');
sidebar = sidebar.replace(/px-4 py-3/g, 'px-4 py-3 justify-center md:justify-start');

fs.writeFileSync('client/src/components/Sidebar.jsx', sidebar);
console.log('Sidebar mini mode enabled.');
