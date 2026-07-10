const fs = require('fs');

let projectDetail = fs.readFileSync('client/src/pages/ProjectDetail.jsx', 'utf8');

// 1. Add state for CRD Flow Sheet
if (!projectDetail.includes('crdFlowSheetFile')) {
  projectDetail = projectDetail.replace(
    /const \[mVideos, setMVideos\] = useState\(.*?\);/,
    `$&
  const [crdFlowSheetFile, setCrdFlowSheetFile] = useState(null);
  const [crdFlowSheetName, setCrdFlowSheetName] = useState('');
  const [crdFlowSheetLink, setCrdFlowSheetLink] = useState('');
  const [isUploadingCrd, setIsUploadingCrd] = useState(false);`
  );
}

// 2. Fetch the existing crdFlowSheet from project
projectDetail = projectDetail.replace(
  /if \(data\.marketingInfo\) \{/,
  `if (data.crdFlowSheet) {
          setCrdFlowSheetName(data.crdFlowSheet.name || '');
          setCrdFlowSheetLink(data.crdFlowSheet.link || '');
        }
        if (data.marketingInfo) {`
);

// 3. Add handleCrdUpload function
if (!projectDetail.includes('handleCrdUpload')) {
  projectDetail = projectDetail.replace(
    /const handleMarketingSubmit = async \(e\) => \{/,
    `const handleCrdUpload = async () => {
    if (!crdFlowSheetFile) return alert('Please select a file first');
    setIsUploadingCrd(true);
    
    // Simulate upload delay for demo
    setTimeout(async () => {
      const mockLink = 'https://docs.google.com/spreadsheets/d/mock-crd-sheet-' + Date.now();
      try {
        const response = await fetch(\`\${API_URL}/projects/\${id}/crd-flow-sheet\`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({
            name: crdFlowSheetFile.name,
            link: mockLink
          })
        });

        if (response.ok) {
          const updated = await response.json();
          setProject(updated);
          setCrdFlowSheetName(crdFlowSheetFile.name);
          setCrdFlowSheetLink(mockLink);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          alert('Failed to save CRD Flow Sheet');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploadingCrd(false);
        setCrdFlowSheetFile(null);
      }
    }, 1500);
  };

  const handleMarketingSubmit = async (e) => {`
  );
}

// 4. Add the tab button
projectDetail = projectDetail.replace(
  /Marketing & Promotions[\s\S]*?<\/button>/,
  `$&
        <button
          type="button"
          onClick={() => setActiveTab('crdFlow')}
          className={\`flex-1 sm:flex-initial py-3 px-6 text-sm font-bold border-b-2 transition text-center \${
            activeTab === 'crdFlow'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }\`}
        >
          CRD Flow Format
        </button>`
);

// 5. Add the tab content
const crdTabContent = `
      {/* 🟢 CRD FLOW FORMAT VIEW */}
      {activeTab === 'crdFlow' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-[#0e623a]/10 rounded-full flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-10 h-10 text-[#0e623a]" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-800">Master CRD Flow Format</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Upload the master Excel template for this project. Once uploaded, this format will automatically be used for all booked leads in the CRD Flow manager.
              </p>
            </div>

            {crdFlowSheetLink ? (
              <div className="bg-[#f0f9f4] border border-[#0e623a]/20 p-5 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-800 truncate" title={crdFlowSheetName}>{crdFlowSheetName}</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">Active Template Ready</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => {
                      setCrdFlowSheetLink('');
                      setCrdFlowSheetName('');
                    }}
                    className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  >
                    Replace Format
                  </button>
                  <a 
                    href={crdFlowSheetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 text-xs font-bold text-white bg-[#0e623a] hover:bg-[#0b4d2d] rounded-lg transition flex justify-center"
                  >
                    View Sheet
                  </a>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50 hover:bg-gray-100 transition">
                <input 
                  type="file" 
                  id="crdUpload" 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                  onChange={(e) => setCrdFlowSheetFile(e.target.files[0])}
                />
                
                {crdFlowSheetFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-sm font-bold text-[#0e623a] break-all px-4">{crdFlowSheetFile.name}</span>
                    <button 
                      onClick={handleCrdUpload}
                      disabled={isUploadingCrd}
                      className="px-6 py-2 bg-[#0e623a] text-white text-sm font-bold rounded-xl hover:bg-[#0b4d2d] transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUploadingCrd ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Save Format
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <label htmlFor="crdUpload" className="cursor-pointer flex flex-col items-center gap-3">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-semibold text-[#0e623a]">Click to browse Excel files</span>
                    <span className="text-xs text-gray-400">.xlsx, .xls formats up to 10MB</span>
                  </label>
                )}
              </div>
            )}
          </div>
        </div>
      )}
`;

projectDetail = projectDetail.replace(
  /\{\/\* 🟢 PLOT PROJECT VIEW \*\/\}/,
  `${crdTabContent}\n\n      {/* 🟢 PLOT PROJECT VIEW */}`
);

fs.writeFileSync('client/src/pages/ProjectDetail.jsx', projectDetail);
console.log('ProjectDetail.jsx updated');
