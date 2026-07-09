const fs = require('fs');

const file = 'client/src/pages/ExportReports.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the old button
const oldButtonHtml = `        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">
          <button onClick={handleDownloadAll} className="px-4 py-1.5 bg-[#0e623a] text-white rounded-lg text-xs font-bold hover:bg-[#0b4d2d] transition shadow-sm">
            Download All (Combined)
          </button>`;

if (content.includes(oldButtonHtml)) {
  content = content.replace(oldButtonHtml, '<div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">');
} else {
    // maybe it is slightly different, let's try a regex
    content = content.replace(/<button onClick=\{handleDownloadAll\}[\s\S]*?<\/button>/, '');
}

// 2. Add Download import if it doesn't exist
if (!content.includes('Download,')) {
    content = content.replace('import { TrendingUp,', 'import { TrendingUp, Download,');
}

// 3. Add the card to the top of the grid
const gridStart = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">';
const newCard = `
          <div 
            onClick={handleDownloadAll}
            className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
          >
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
              <Download className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide">Download All Reports</h3>
            <p className="text-[10px] text-emerald-600 font-semibold">Generate a single master workbook with all reports as separate tabs.</p>
          </div>
`;

if (!content.includes('Download All Reports</h3>')) {
  content = content.replace(gridStart, gridStart + newCard);
}

fs.writeFileSync(file, content);
console.log('Added combined report card.');
