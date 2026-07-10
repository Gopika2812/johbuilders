const fs = require('fs');

let sidebar = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

// Catch any <span> inside the dropdown buttons (headers)
sidebar = sidebar.replace(
  /<span className="font-semibold( text-sm)?">([^<]+)<\/span>/g,
  '<span className={`font-semibold$1 ${sidebarOpen ? "block" : "hidden"}`}>$2</span>'
);

// Also check "Customers", "Audit Logs", etc., which might just be <span>Text</span>
// But earlier I did: sidebar = sidebar.replace(/<span>([a-zA-Z0-9\s&]+)<\/span>/g, '<span className={sidebarOpen ? "block truncate" : "hidden"}>$1</span>');
// So "Customers" should have been caught if it didn't have classes. 
// Let's ensure any `<span>` that doesn't have `{sidebarOpen` and is just a text label gets hidden.
sidebar = sidebar.replace(
  /<span>(Customers|Audit Logs|Settings)<\/span>/g,
  '<span className={sidebarOpen ? "block truncate" : "hidden"}>$1</span>'
);

fs.writeFileSync('client/src/components/Sidebar.jsx', sidebar);
console.log('Sidebar missed labels fixed');
