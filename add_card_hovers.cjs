const fs = require('fs');
const path = require('path');

const dashboardPath = 'client/src/pages/Dashboard.jsx';
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');

  // Add interactive hover states to the main card wrappers
  
  // 1. The top filters block
  content = content.replace(
    /className="bg-white\/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-4 mb-8 flex flex-col md:flex-row gap-4([^"]*)"/g,
    'className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-4 mb-8 flex flex-col md:flex-row gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 $1"'
  );

  // 2. Project Inventory Cards
  content = content.replace(
    /className="bg-white\/90 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-100 flex-1([^"]*)"/g,
    'className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-1 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 $1"'
  );
  
  // 3. Lead Details Sub-cards
  content = content.replace(
    /className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-1([^"]*)"/g,
    'className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-1 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 $1"'
  );

  // 4. Pending follow-ups
  content = content.replace(
    /className="bg-orange-50\/50 rounded-2xl p-6 border border-orange-100([^"]*)"/g,
    'className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 $1"'
  );

  // 5. Analytics Center
  content = content.replace(
    /className="bg-white\/90 backdrop-blur-md rounded-3xl shadow-sm border border-slate-100 p-6([^"]*)"/g,
    'className="bg-white/90 backdrop-blur-md rounded-3xl shadow-sm border border-slate-100 p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 $1"'
  );

  // 6. Day-wise sales & Advance trend
  content = content.replace(
    /className="bg-white\/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-6 relative([^"]*)"/g,
    'className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-6 relative hover:-translate-y-1 hover:shadow-xl transition-all duration-300 $1"'
  );

  // If the previous ones didn't match perfectly, let's try a more general replacement 
  // for the specific cards shown in the user's screenshot.
  // The Project Inventory cards seem to use `bg-[#f0fbf4]/90` or `bg-white/90`.
  // From the grep output, we saw:
  // <div className="bg-[#f0fbf4]/90 backdrop-blur-md border-none shadow-md rounded-3xl p-5 w-full sticky top-16 z-20 transition-all duration-300">
  // Let's add hover to this.
  content = content.replace(
    /className="bg-\[#f0fbf4\]\/90 backdrop-blur-md border-none shadow-md rounded-3xl p-5 w-full sticky top-16 z-20 transition-all duration-300"/g,
    'className="bg-[#f0fbf4]/90 backdrop-blur-md border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-5 w-full sticky top-16 z-20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"'
  );

  fs.writeFileSync(dashboardPath, content);
  console.log('Added interactive hover classes to Dashboard.jsx cards.');
}
