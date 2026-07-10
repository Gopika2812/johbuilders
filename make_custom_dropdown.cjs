const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

// Add the state for the custom dropdown
if (!content.includes('const [isPaymentStageDropdownOpen, setIsPaymentStageDropdownOpen] = useState(false);')) {
  content = content.replace(
    /const \[paymentStageIdx, setPaymentStageIdx\] = useState\(null\);/,
    `const [paymentStageIdx, setPaymentStageIdx] = useState(null);\n  const [isPaymentStageDropdownOpen, setIsPaymentStageDropdownOpen] = useState(false);`
  );
}

// The old select block to replace
const oldSelectBlock = `<select
                    value={paymentStageIdx}
                    onChange={(e) => {
                      const newIdx = Number(e.target.value);
                      setPaymentStageIdx(newIdx);
                      
                      const thisStagePending = Math.max(0, getStageTotal(activeFlow.stages[newIdx]) - getStagePaid(activeFlow.stages[newIdx]));
                      const arrears = getPendingPreviousStages(newIdx).reduce((sum, s) => sum + s.pending, 0);
                      setPaymentAmount((thisStagePending + arrears).toString());
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-sm font-semibold text-gray-800"
                  >
                    {activeFlow?.stages.map((stage, idx) => {
                      const thisStagePending = Math.max(0, getStageTotal(stage) - getStagePaid(stage));
                      const arrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                      const arrearsText = arrears > 0 ? \` + Arrears: Rs. \${arrears.toLocaleString()}\` : '';
                      return (
                        <option key={idx} value={idx}>Stage {idx + 1}: {stage.name} (Pending: Rs. {thisStagePending.toLocaleString()}{arrearsText})</option>
                      );
                    })}
                  </select>`;

// The new custom dropdown block
const newDropdownBlock = `<div className="relative w-full">
                    <div 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl text-sm font-semibold text-gray-800 cursor-pointer flex justify-between items-center"
                      onClick={() => setIsPaymentStageDropdownOpen(!isPaymentStageDropdownOpen)}
                    >
                      <span className="truncate">
                        {paymentStageIdx !== null && activeFlow ? (
                          \`Stage \${paymentStageIdx + 1}: \${activeFlow.stages[paymentStageIdx].name} (Pending: Rs. \${Math.max(0, getStageTotal(activeFlow.stages[paymentStageIdx]) - getStagePaid(activeFlow.stages[paymentStageIdx])).toLocaleString()}{
                            getPendingPreviousStages(paymentStageIdx).reduce((sum, s) => sum + s.pending, 0) > 0 
                            ? \` + Arrears: Rs. \${getPendingPreviousStages(paymentStageIdx).reduce((sum, s) => sum + s.pending, 0).toLocaleString()}\` 
                            : ''
                          })\`
                        ) : 'Select a stage...'}
                      </span>
                      <ChevronDown className={\`w-4 h-4 transition-transform \${isPaymentStageDropdownOpen ? 'rotate-180' : ''}\`} />
                    </div>
                    
                    {isPaymentStageDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {activeFlow?.stages.map((stage, idx) => {
                          const thisStagePending = Math.max(0, getStageTotal(stage) - getStagePaid(stage));
                          const arrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                          const arrearsText = arrears > 0 ? \` + Arrears: Rs. \${arrears.toLocaleString()}\` : '';
                          const isSelected = paymentStageIdx === idx;
                          
                          return (
                            <div 
                              key={idx} 
                              className={\`px-4 py-3 cursor-pointer text-sm font-medium transition \${
                                isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                              }\`}
                              onClick={() => {
                                setPaymentStageIdx(idx);
                                const newThisStagePending = Math.max(0, getStageTotal(activeFlow.stages[idx]) - getStagePaid(activeFlow.stages[idx]));
                                const newArrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                                setPaymentAmount((newThisStagePending + newArrears).toString());
                                setIsPaymentStageDropdownOpen(false);
                              }}
                            >
                              Stage {idx + 1}: {stage.name} <span className={\`text-[11px] ml-1 \${isSelected ? 'text-blue-600/80' : 'text-gray-500'}\`}>(Pending: Rs. {thisStagePending.toLocaleString()}{arrearsText})</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Backdrop to close dropdown when clicking outside */}
                  {isPaymentStageDropdownOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setIsPaymentStageDropdownOpen(false)}></div>
                  )}`;

// Also make sure to update the z-index of the modal wrapper to be safe, but usually it's fine.
if (content.includes(oldSelectBlock)) {
  content = content.replace(oldSelectBlock, newDropdownBlock);
  fs.writeFileSync('client/src/pages/CRDFlow.jsx', content);
  console.log('Custom dropdown implemented successfully!');
} else {
  console.log('Could not find the original select block to replace.');
}
