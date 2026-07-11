const fs = require('fs');

let content = fs.readFileSync('e:/builders/client/src/pages/CRDReports.jsx', 'utf8');

// 1. Update logoCols
content = content.replace('const logoCols = 2;', 'const logoCols = 3;');

// 2. Update totalValue
content = content.replace('const totalValue = flow.totalValue || 0;', 'const totalValue = flow.totalCurrentValue || 0;');

// 3. Add column widths for collection report HTML
const targetHtml = `        <body>
          <table>
            \${getExcelHeader(titleText, "", 8, "#7c3aed", logoPath)}
            <!-- Table Headers -->`;

const replacementHtml = `        <body>
          <table>
            <col width="60" />
            <col width="120" />
            <col width="250" />
            <col width="150" />
            <col width="100" />
            <col width="180" />
            <col width="180" />
            <col width="180" />
            \${getExcelHeader(titleText, "", 8, "#7c3aed", logoPath)}
            <!-- Table Headers -->`;

content = content.replace(targetHtml, replacementHtml);

// 4. Add useNavigate
content = content.replace("import { useAuth, API_URL } from '../context/AuthContext';", 
"import { useNavigate } from 'react-router-dom';\nimport { useAuth, API_URL } from '../context/AuthContext';");

// 5. Initialize navigate inside KPIInsights
content = content.replace("const KPIInsights = () => {\n  const { token, user } = useAuth();", 
"const KPIInsights = () => {\n  const { token, user } = useAuth();\n  const navigate = useNavigate();");

// 6. Add NPA Collected Report card
const cardTarget = `        {/* Complaints Report */}
        <div 
          onClick={handleExportComplaintsReport}
          className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-rose-800 uppercase tracking-wide">Complaints</h3>
          <p className="text-[10px] text-rose-500 font-semibold">User complaints and statuses.</p>
        </div>`;

const cardReplacement = `        {/* Complaints Report */}
        <div 
          onClick={handleExportComplaintsReport}
          className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-rose-800 uppercase tracking-wide">Complaints</h3>
          <p className="text-[10px] text-rose-500 font-semibold">User complaints and statuses.</p>
        </div>

        {/* NPA Collected Report */}
        <div 
          onClick={() => navigate('/crd-flow/overall-report')}
          className="bg-teal-50 border border-teal-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-teal-100 text-teal-600 rounded-2xl">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-teal-800 uppercase tracking-wide">NPA Collected Report</h3>
          <p className="text-[10px] text-teal-500 font-semibold">Track targets, debtors, and weekly collections.</p>
        </div>`;

content = content.replace(cardTarget, cardReplacement);

fs.writeFileSync('e:/builders/client/src/pages/CRDReports.jsx', content);
console.log('CRDReports.jsx successfully patched.');
