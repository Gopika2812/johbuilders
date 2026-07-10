const fs = require('fs');
const path = require('path');

const cssPath = 'client/src/index.css';
if (fs.existsSync(cssPath)) {
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  if (!cssContent.includes('@keyframes fadeInUp')) {
    cssContent += `\n
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }
.stagger-5 { animation-delay: 0.5s; }
.stagger-6 { animation-delay: 0.6s; }
`;
    fs.writeFileSync(cssPath, cssContent);
    console.log('Added animation classes to index.css');
  }
}

const dashboardPath = 'client/src/pages/Dashboard.jsx';
if (fs.existsSync(dashboardPath)) {
  let dbContent = fs.readFileSync(dashboardPath, 'utf8');

  // Let's add the animation classes to the main blocks.
  // 1. The top filters block
  dbContent = dbContent.replace(
    /<div className="bg-white\/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-4 mb-8 flex flex-col md:flex-row gap-4"/,
    '<div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-4 mb-8 flex flex-col md:flex-row gap-4 animate-fade-in-up stagger-1"'
  );

  // 2. The Project Inventory Cards
  dbContent = dbContent.replace(
    /className="bg-white\/90 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-100 flex-1"/g,
    'className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-100 flex-1 animate-fade-in-up stagger-2"'
  );
  
  // 3. LEAD DETAILS section
  dbContent = dbContent.replace(
    /<div className="grid grid-cols-2 md:grid-cols-5 gap-4">/g,
    '<div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in-up stagger-3">'
  );

  // 4. Pending follow-ups
  dbContent = dbContent.replace(
    /<div className="bg-orange-50\/50 rounded-2xl p-6 border border-orange-100">/g,
    '<div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 animate-fade-in-up stagger-4">'
  );

  // 5. Analytics Center
  dbContent = dbContent.replace(
    /<div className="bg-white\/90 backdrop-blur-md rounded-3xl shadow-sm border border-slate-100 p-6">/g,
    '<div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-sm border border-slate-100 p-6 animate-fade-in-up stagger-5">'
  );
  
  // 6. Day-wise sales & Advance trend
  dbContent = dbContent.replace(
    /className="bg-white\/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-6 relative"/g,
    'className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-6 relative animate-fade-in-up stagger-6"'
  );

  fs.writeFileSync(dashboardPath, dbContent);
  console.log('Added stagger animations to Dashboard.jsx');
}
