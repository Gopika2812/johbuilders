const fs = require('fs');

// Patch ProjectDetail.jsx
let pd = fs.readFileSync('client/src/pages/ProjectDetail.jsx', 'utf8');

if (!pd.includes('sheetPreviewModalOpen')) {
  // Add state
  pd = pd.replace(
    /const \[bookingModalOpen, setBookingModalOpen\] = useState\(false\);/,
    `const [bookingModalOpen, setBookingModalOpen] = useState(false);\n  const [sheetPreviewModalOpen, setSheetPreviewModalOpen] = useState(false);`
  );

  // Replace View Sheet anchor with a button
  pd = pd.replace(
    /<a\s+href=\{crdFlowSheetLink\}\s+target="_blank"\s+rel="noreferrer"\s+className="flex-1 py-2 text-xs font-bold text-white bg-\[#0e623a\] hover:bg-\[#0b4d2d\] rounded-lg\s*transition flex justify-center"\s*>\s*View Sheet\s*<\/a>/,
    `<button
                      onClick={() => setSheetPreviewModalOpen(true)}
                      className="flex-1 py-2 text-xs font-bold text-white bg-[#0e623a] hover:bg-[#0b4d2d] rounded-lg transition flex justify-center"
                    >
                      View Sheet
                    </button>`
  );

  // Add Modal at the end of the file before `export default`
  const modalHTML = `
      {/* Sheet Preview Modal */}
      {sheetPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#0e623a] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                <h2 className="text-lg font-bold">Sheet Preview: {crdFlowSheetName}</h2>
              </div>
              <button onClick={() => setSheetPreviewModalOpen(false)} className="text-emerald-200 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-bold">
                    <tr>
                      <th className="p-4 border-r border-gray-200 w-16 text-center">#</th>
                      <th className="p-4 border-r border-gray-200">Construction Stage / Milestone</th>
                      <th className="p-4 text-center w-24">Payment %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { name: 'On Booking', percentage: 5 },
                      { name: 'Agreement & Deed Regn.', percentage: 35 },
                      { name: 'On completion of the Foundation', percentage: 10 },
                      { name: 'On completion of Stilt Floor Slab', percentage: 10 },
                      { name: 'On completion of First Floor Roof Slab', percentage: 10 },
                      { name: 'On completion of Second Floor Roof Slab', percentage: 10 },
                      { name: 'On completion of Third Floor Roof Slab', percentage: 10 },
                      { name: 'On Completion of Fourth Floor Roof Slab', percentage: 5 },
                      { name: 'On Completion of Fifth Floor Roof Slab', percentage: 3 },
                      { name: 'On Handing Over', percentage: 2 }
                    ].map((stage, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-4 border-r border-gray-200 text-center font-bold text-gray-400">{idx + 1}</td>
                        <td className="p-4 border-r border-gray-200 font-semibold text-gray-700">{stage.name}</td>
                        <td className="p-4 text-center font-bold text-[#0e623a]">{stage.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
               <button onClick={() => setSheetPreviewModalOpen(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition">
                 Close Preview
               </button>
            </div>
          </div>
        </div>
      )}
`;
  pd = pd.replace(
      /<\/div>\s*\);\s*\};\s*export default ProjectDetail;/g,
      `${modalHTML}\n    </div>\n  );\n};\nexport default ProjectDetail;`
  );
  fs.writeFileSync('client/src/pages/ProjectDetail.jsx', pd);
  console.log('ProjectDetail.jsx updated with modal preview.');
}

// Patch CRDFlow.jsx
let crd = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');
if (!crd.includes('sheetPreviewModalOpen')) {
  // Add state
  crd = crd.replace(
    /const \[historyModalOpen, setHistoryModalOpen\] = useState\(false\);/,
    `const [historyModalOpen, setHistoryModalOpen] = useState(false);\n  const [sheetPreviewModalOpen, setSheetPreviewModalOpen] = useState(false);`
  );

  // Replace View CRD Master Sheet anchor with a button
  crd = crd.replace(
    /<a\s*href=\{activeFlow\.project\.crdFlowSheet\.link\}\s*target="_blank"\s*rel="noreferrer"\s*className="flex items-center gap-1\.5 px-3 py-1\.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 transition border border-emerald-100 mb-2"\s*>\s*<FileSpreadsheet className="w-3\.5 h-3\.5" \/>\s*View CRD Master Sheet\s*<\/a>/,
    `<button
                        onClick={() => setSheetPreviewModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 transition border border-emerald-100 mb-2 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Preview CRD Master Sheet
                      </button>`
  );

  // Add Modal at the end of the file before `export default`
  const crdModalHTML = `
      {/* Sheet Preview Modal */}
      {sheetPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#0e623a] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                <h2 className="text-lg font-bold">Master CRD Flow Format Preview</h2>
              </div>
              <button onClick={() => setSheetPreviewModalOpen(false)} className="text-emerald-200 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-bold">
                    <tr>
                      <th className="p-4 border-r border-gray-200 w-16 text-center">#</th>
                      <th className="p-4 border-r border-gray-200">Construction Stage / Milestone</th>
                      <th className="p-4 text-center w-24">Payment %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {defaultStagesTemplate.map((stage, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-4 border-r border-gray-200 text-center font-bold text-gray-400">{idx + 1}</td>
                        <td className="p-4 border-r border-gray-200 font-semibold text-gray-700">{stage.name}</td>
                        <td className="p-4 text-center font-bold text-[#0e623a]">{stage.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
               <button onClick={() => setSheetPreviewModalOpen(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition">
                 Close Preview
               </button>
            </div>
          </div>
        </div>
      )}
`;
  
  crd = crd.replace(
      /<\/div>\s*\);\s*\};\s*export default CRDFlow;/g,
      `${crdModalHTML}\n    </div>\n  );\n};\nexport default CRDFlow;`
  );
  fs.writeFileSync('client/src/pages/CRDFlow.jsx', crd);
  console.log('CRDFlow.jsx updated with modal preview.');
}
