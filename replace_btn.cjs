const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

// The block to replace
const originalBlock = `<button
                            onClick={() => navigate(\`/crd-flow/\${flow?._id || 'new'}/details\`)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 rounded transition"
                            title="Quick Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>`;

const newBlock = `<div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuId(actionMenuId === lead._id ? null : lead._id);
                              }}
                              className="p-1.5 text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 rounded transition cursor-pointer"
                              title="Quick Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {actionMenuId === lead._id && (
                              <div 
                                className="absolute right-8 top-1/2 -translate-y-1/2 w-48 bg-white border border-gray-200 shadow-xl z-50 rounded-xl flex flex-col p-1 text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(!activeFlow || (activeFlow.lead?._id !== lead._id && activeFlow.lead !== lead._id)) ? (
                                  <div className="p-3 text-xs text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                                    <div className="animate-spin h-4 w-4 border-b-2 border-[#0e623a] rounded-full"></div>
                                    Please click the row first to load options
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const firstUncompletedIdx = activeFlow.stages.findIndex(s => !(s.isCompleted || getStagePaid(s) >= getStageTotal(s)));
                                        const idx = firstUncompletedIdx >= 0 ? firstUncompletedIdx : 0;
                                        setPaymentStageIdx(idx);
                                        const thisStagePending = Math.max(0, getStageTotal(activeFlow.stages[idx]) - getStagePaid(activeFlow.stages[idx]));
                                        const arrears = activeFlow.stages.slice(0, idx).reduce((sum, s) => sum + Math.max(0, getStageTotal(s) - getStagePaid(s)), 0);
                                        setPaymentAmount((thisStagePending + arrears).toString());
                                        setPaymentMethod(lead.bookingInfo?.bankLoan === 'Yes' ? 'Bank Loan' : 'Bank Transfer');
                                        setActionMenuId(null);
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition"
                                    >
                                      <DollarSign className="w-4 h-4" /> Log Payment
                                    </button>
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDemandLetterStageIdx(0);
                                        setActionMenuId(null);
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-lg transition"
                                    >
                                      <Printer className="w-4 h-4" /> Demand Letter
                                    </button>

                                    {activeFlow.status === 'Active' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCancelModalOpen(true);
                                          setActionMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-800 rounded-lg transition"
                                      >
                                        <Trash className="w-4 h-4" /> Cancel Lead
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>`;

if (content.includes(originalBlock)) {
  content = content.replace(originalBlock, newBlock);
  fs.writeFileSync('client/src/pages/CRDFlow.jsx', content);
  console.log('Successfully replaced Quick Actions button with Dropdown menu!');
} else {
  console.log('Could not find the original block to replace.');
}
