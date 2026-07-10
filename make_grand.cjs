const fs = require('fs');
const path = require('path');

const cssPath = 'client/src/index.css';
if (fs.existsSync(cssPath)) {
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Enhance glass-card to look more grand
  cssContent = cssContent.replace(
    /\.glass-card\s*\{[\s\S]*?\}/,
    `.glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 100%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 10px 40px -10px rgba(31, 38, 135, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  border-radius: 24px;
}`
  );

  // Enhance Sidebar
  cssContent = cssContent.replace(
    /\.glass-sidebar\s*\{[\s\S]*?\}/,
    `.glass-sidebar {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 253, 244, 0.6) 100%);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-right: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 5px 0 30px -10px rgba(0,0,0,0.05);
}`
  );

  // Enhance Navbar
  cssContent = cssContent.replace(
    /\.glass-nav\s*\{[\s\S]*?\}/,
    `.glass-nav {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 30px -5px rgba(0,0,0,0.03);
}`
  );
  
  // Add global typography and premium classes
  if (!cssContent.includes('.grand-heading')) {
    cssContent += `\n
.grand-heading {
  background: linear-gradient(135deg, #065f46 0%, #047857 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.premium-shadow {
  box-shadow: 0 20px 40px -15px rgba(4, 120, 87, 0.15);
}

.btn-grand {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-grand:hover {
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.4);
  transform: translateY(-2px);
}
`;
  }

  fs.writeFileSync(cssPath, cssContent);
  console.log('index.css enhanced for grand UI');
}

// Enhance Dashboard headings
const dashboardPath = 'client/src/pages/Dashboard.jsx';
if (fs.existsSync(dashboardPath)) {
  let dbContent = fs.readFileSync(dashboardPath, 'utf8');
  
  dbContent = dbContent.replace(/<h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">/g, 
    '<h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3 grand-heading">');
    
  dbContent = dbContent.replace(/text-gray-900 font-black text-3xl/g, 'grand-heading text-4xl');
  
  // Replace buttons
  dbContent = dbContent.replace(/bg-emerald-600 hover:bg-emerald-700 text-white/g, 'btn-grand rounded-xl font-bold');
  dbContent = dbContent.replace(/bg-blue-600 hover:bg-blue-700 text-white/g, 'btn-grand rounded-xl font-bold');
  dbContent = dbContent.replace(/bg-purple-600 hover:bg-purple-700 text-white/g, 'btn-grand rounded-xl font-bold');
  dbContent = dbContent.replace(/bg-orange-600 hover:bg-orange-700 text-white/g, 'btn-grand rounded-xl font-bold');

  fs.writeFileSync(dashboardPath, dbContent);
  console.log('Dashboard enhanced for grand UI');
}

// Enhance Navbar UI
const navPath = 'client/src/components/Navbar.jsx';
if (fs.existsSync(navPath)) {
  let navContent = fs.readFileSync(navPath, 'utf8');
  
  // Make dropdown glassy
  navContent = navContent.replace(/bg-white rounded-2xl shadow-xl border border-gray-100/g, 'glass-card');
  navContent = navContent.replace(/bg-white rounded-2xl shadow-2xl border border-gray-100/g, 'glass-card');
  
  fs.writeFileSync(navPath, navContent);
}

// Enhance Sidebar UI
const sidebarPath = 'client/src/components/Sidebar.jsx';
if (fs.existsSync(sidebarPath)) {
  let sideContent = fs.readFileSync(sidebarPath, 'utf8');
  
  sideContent = sideContent.replace(/text-\[#11c278\]/g, 'text-emerald-500');
  sideContent = sideContent.replace(/text-\[#1e4a3b\]/g, 'text-emerald-900');
  
  fs.writeFileSync(sidebarPath, sideContent);
}
