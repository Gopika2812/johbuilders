const fs = require('fs');
let crdFlow = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

// 1. Add fetchProjectCrdFlow function to get the actual project details
const fetchProjectCrdFlowFunc = `  const handleLoadMasterCRDFormat = async () => {
    const selectedBooking = bookings.find(b => b._id === selectedBookingId);
    if (!selectedBooking) return;
    const projId = selectedBooking.project?._id || selectedBooking.project;
    try {
      setLoading(true);
      const res = await fetch(\`\${API_URL}/projects/\${projId}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (res.ok) {
        const projectData = await res.json();
        if (projectData.crdFlowSheet && projectData.crdFlowSheet.link) {
          setFileName(projectData.crdFlowSheet.name || 'Master_CRD_Format.xlsx');
          
          // Simulate parsing the master excel sheet
          const quot = quotations.find(q => (q.lead?._id || q.lead) === selectedBookingId);
          const valuation = quot ? quot.totalValue : (selectedBooking?.bookingInfo?.selectedUnits?.length 
            ? selectedBooking.bookingInfo.selectedUnits.length * (projectData.pricePerSqFt || 2000) * 1000
            : 2500000);
          
          let sumAmount = 0;
          const parsed = defaultStagesTemplate.map((stage, idx) => {
            let amount = Math.round((stage.percentage / 100) * valuation);
            if (idx === defaultStagesTemplate.length - 1) {
              amount = valuation - sumAmount;
            } else {
              sumAmount += amount;
            }
            return {
              name: stage.name,
              percentage: stage.percentage,
              amount: amount
            };
          });
          setExcelStages(parsed);
          setSuccess('Loaded Project Master CRD Format successfully!');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('No Master CRD Flow Format found for this project. Please upload it in Project Details.');
          setTimeout(() => setError(''), 4000);
        }
      }
    } catch (err) {
      setError('Error loading Master CRD Format');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeFlow = async () => {`;

if (!crdFlow.includes('handleLoadMasterCRDFormat')) {
  crdFlow = crdFlow.replace(
    /const handleInitializeFlow = async \(\) => \{/,
    fetchProjectCrdFlowFunc
  );
}

// 2. Update the Stage Initialization UI
const oldInitUI = `<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <label className="flex items-center gap-2 px-6 py-3 border border-gray-200 hover:border-[#0e623a]/30 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>{fileName || 'Upload Excel Sheet'}</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />
            </label>

            <button
              onClick={handleLoadPresetTemplate}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Load Default Presets
            </button>
          </div>`;

const newInitUI = `<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleLoadMasterCRDFormat}
              className="px-6 py-3 bg-[#0e623a] text-white hover:bg-[#0b4d2d] rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Auto-Load Master Project CRD Format
            </button>

            <span className="text-gray-400 text-xs font-bold">OR</span>

            <label className="flex items-center gap-2 px-6 py-3 border border-gray-200 hover:border-[#0e623a]/30 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer">
              <Upload className="w-4 h-4 text-gray-400" />
              <span>{fileName || 'Upload Custom Sheet'}</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />
            </label>
          </div>`;

if (crdFlow.includes(oldInitUI)) {
  crdFlow = crdFlow.replace(oldInitUI, newInitUI);
} else {
    // try a looser match just in case indentation differs
    crdFlow = crdFlow.replace(/<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">[\s\S]*?<\/div>/, newInitUI);
}

// 3. Optional: Add a button to view the Master Format in the Active Flow view (Quick Actions area)
// Look for the "Lead Setup" section
const leadSetupArea = `<td className="p-4 text-right align-middle">
                  <div className="flex flex-col items-end gap-3 text-xs">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold block mb-1">Assigned Executive</span>
                      <select`;

const replacementSetupArea = `<td className="p-4 text-right align-middle">
                  <div className="flex flex-col items-end gap-3 text-xs">
                    {activeFlow.project?.crdFlowSheet?.link && (
                      <a 
                        href={activeFlow.project.crdFlowSheet.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 transition border border-emerald-100 mb-2"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        View CRD Master Sheet
                      </a>
                    )}
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold block mb-1">Assigned Executive</span>
                      <select`;

if (crdFlow.includes(leadSetupArea)) {
  crdFlow = crdFlow.replace(leadSetupArea, replacementSetupArea);
}

fs.writeFileSync('client/src/pages/CRDFlow.jsx', crdFlow);
console.log('CRDFlow.jsx updated');
