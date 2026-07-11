const fs = require('fs');

let content = fs.readFileSync('e:/builders/client/src/pages/CRDReports.jsx', 'utf8');
const newFunction = fs.readFileSync('e:/builders/npa_logic.txt', 'utf8');

// Insert the new function before handleExportRegistrationReport
content = content.replace("  const handleExportRegistrationReport = async () => {", newFunction);

// Change the onClick handler in the NPA Collected Report card
const oldCardTarget = `        {/* NPA Collected Report */}
        <div 
          onClick={() => navigate('/crd-flow/overall-report')}
          className="bg-teal-50 border border-teal-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >`;

const newCardReplacement = `        {/* NPA Collected Report */}
        <div 
          onClick={handleExportNPACollectedReport}
          className="bg-teal-50 border border-teal-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >`;

content = content.replace(oldCardTarget, newCardReplacement);

fs.writeFileSync('e:/builders/client/src/pages/CRDReports.jsx', content);
console.log('Successfully added handleExportNPACollectedReport and updated card onClick.');
