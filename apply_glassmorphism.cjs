const fs = require('fs');
const path = require('path');

// 1. Update index.css for the animated background
const cssPath = 'client/src/index.css';
if (fs.existsSync(cssPath)) {
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const animatedBody = `
@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: linear-gradient(-45deg, #e3f9eb, #fef4c0, #d1fae5, #fef08a, #cffafe);
  background-size: 400% 400%;
  animation: gradientAnimation 20s ease infinite;
  background-attachment: fixed;
  color: #2d3748;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}
`;

  // Replace existing body block
  cssContent = cssContent.replace(/body\s*\{[\s\S]*?min-height:\s*100vh;\s*\}/, animatedBody.trim());
  
  // Add some glassmorphism utility classes just in case
  if (!cssContent.includes('.glass-card')) {
    cssContent += `\n
.glass-card {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
}

.glass-nav {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.glass-sidebar {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.5);
}
`;
  }
  
  fs.writeFileSync(cssPath, cssContent);
  console.log('Updated index.css with animated background and glass utilities');
}

// 2. Apply glass classes to Dashboard.jsx
const dashboardPath = 'client/src/pages/Dashboard.jsx';
if (fs.existsSync(dashboardPath)) {
  let dbContent = fs.readFileSync(dashboardPath, 'utf8');

  // Replace bg-white/90 backdrop-blur-md with glass-card
  dbContent = dbContent.replace(/bg-white\/90 backdrop-blur-md/g, 'glass-card');
  dbContent = dbContent.replace(/bg-\[#f0fbf4\]\/90 backdrop-blur-md/g, 'glass-card');
  
  // Replace plain bg-white cards with glass-card
  dbContent = dbContent.replace(/bg-white rounded-2xl/g, 'glass-card rounded-2xl');
  
  // Replace orange cards
  dbContent = dbContent.replace(/bg-orange-50\/50 rounded-2xl p-6 border border-orange-100/g, 'glass-card rounded-2xl p-6 border border-white/60');
  
  fs.writeFileSync(dashboardPath, dbContent);
  console.log('Applied glass effect to Dashboard cards');
}

// 3. Apply glass classes to Navbar.jsx
const navbarPath = 'client/src/components/Navbar.jsx';
if (fs.existsSync(navbarPath)) {
  let navContent = fs.readFileSync(navbarPath, 'utf8');
  
  navContent = navContent.replace(/className="bg-white\/80 backdrop-blur-md/g, 'className="glass-nav');
  navContent = navContent.replace(/bg-white border-b/g, 'glass-nav');
  
  fs.writeFileSync(navbarPath, navContent);
  console.log('Applied glass effect to Navbar');
}

// 4. Apply glass classes to Sidebar.jsx
const sidebarPath = 'client/src/components/Sidebar.jsx';
if (fs.existsSync(sidebarPath)) {
  let sideContent = fs.readFileSync(sidebarPath, 'utf8');
  
  sideContent = sideContent.replace(/className=\{`bg-\[#edfbf4\]/g, 'className={`glass-sidebar');
  sideContent = sideContent.replace(/bg-\[#edfbf4\]/g, 'glass-sidebar');
  
  fs.writeFileSync(sidebarPath, sideContent);
  console.log('Applied glass effect to Sidebar');
}
