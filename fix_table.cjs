const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

// 1. Remove the !selectedBookingId condition and the Simplified Record Table.
// We'll replace everything from '{!selectedBookingId ? (' up to '{/* Auto Initializing Flow State */}'
// with a new structure that shows the table, and for the selected row, shows the Stage Details.

// Find the start of the toggle
const startToggleIdx = content.indexOf('{!selectedBookingId ? (');
const autoInitIdx = content.indexOf('{/* Auto Initializing Flow State */}');
const extraWorkModalIdx = content.indexOf('{/* Extra Work Modal dialog */}');

// We need to preserve everything before startToggleIdx and everything after extraWorkModalIdx (the modals).
const beforeToggle = content.substring(0, startToggleIdx);
const modals = content.substring(extraWorkModalIdx);

// Construct the new main content block
const newContent = `
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-800">Booked Leads Directory</h2>
            <p className="text-xs text-gray-500 mt-1">Manage milestone payments for all confirmed bookings</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Project Code Filter */}
            <div>
              <select
                value={filterProjectCode}
                onChange={(e) => setFilterProjectCode(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
              >
                <option value="">All Projects</option>
                {Array.from(new Set(projects.map(p => p.code).filter(Boolean))).map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
              />
            </div>

            {/* Reset Filters */}
            {(filterProjectCode || filterDate) && (
              <button
                onClick={() => { setFilterProjectCode(''); setFilterDate(''); }}
                className="text-xs font-bold text-red-600 hover:text-red-800 transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Booked Leads Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b">
              <tr>
                <th className="p-4">S.No</th>
                <th className="p-4">Booking Date</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Project</th>
                <th className="p-4">Units</th>
                <th className="p-4">Final Quotation Value</th>
                <th className="p-4">Assigned Person</th>
                <th className="p-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings
                .filter(lead => {
                  if (filterProjectCode && lead.project?.code !== filterProjectCode) return false;
                  if (filterDate) {
                    const bookingStr = new Date(lead.bookingInfo?.bookingDate || lead.createdAt).toLocaleDateString('en-CA');
                    if (bookingStr !== filterDate) return false;
                  }
                  return true;
                })
                .map((lead, index) => {
                  const flow = flows.find(f => (f.lead?._id || f.lead) === lead._id);
                  const quot = quotations.find(q => (q.lead?._id || q.lead) === lead._id);
                  const value = flow ? flow.totalCurrentValue : (quot ? quot.totalValue : null);
                  const isSelected = selectedBookingId === lead._id;
                  
                  return (
                    <React.Fragment key={lead._id}>
                      <tr 
                        className={\`transition cursor-pointer \${isSelected ? 'bg-emerald-50/30' : 'hover:bg-gray-50/50'}\`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedBookingId(null);
                            setActiveFlow(null);
                          } else {
                            handleBookingSelect(lead._id);
                          }
                        }}
                      >
                        <td className="p-4">{index + 1}</td>
                        <td className="p-4 text-gray-600">
                          {new Date(lead.bookingInfo?.bookingDate || lead.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{lead.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-700">{lead.phone}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-700">
                            {lead.project?.name || lead.project?.code || 'N/A'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block">
                            {lead.bookingInfo?.selectedUnits?.join(', ') || 'N/A'}
                          </div>
                        </td>
                        <td className="p-4">
                          {value !== null ? (
                            <div className="text-[10px] text-blue-800 font-extrabold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded inline-block">
                              Rs. {value.toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.assignedTo?._id || lead.assignedTo || ''}
                            onChange={(e) => {
                              // Re-use logic for assignedTo if needed, or just let them select.
                              // Right now handleUpdateAssignedTo uses selectedBookingId, so we can temporarily set it or just dispatch an update directly.
                              fetch(\`\${API_URL}/leads/\${lead._id}\`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': \`Bearer \${token}\`
                                },
                                body: JSON.stringify({ assignedTo: e.target.value })
                              }).then(res => res.json()).then(data => {
                                fetchBookings();
                                setSuccess('Assigned executive updated successfully');
                                setTimeout(() => setSuccess(''), 3000);
                              });
                            }}
                            className="w-[120px] px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                          >
                            <option value="">Unassigned</option>
                            {users.filter(u => u.role === 'Sales Executive' || u.role === 'Manager').map(user => (
                              <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(\`/crd-flow/\${flow?._id || 'new'}/details\`)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 rounded transition"
                            title="Quick Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Accordion for Stage Details */}
                      {isSelected && (
                        <tr>
                          <td colSpan="9" className="p-0 border-b-2 border-emerald-500">
                            <div className="bg-gray-50/50 p-6 border-x-4 border-emerald-500 shadow-inner">
                              
                              {/* Auto Initializing Flow State */}
                              {!activeFlow ? (
                                <div className="bg-white border border-gray-150 p-12 rounded-3xl shadow-sm space-y-6 text-center flex flex-col items-center justify-center">
                                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e623a]"></div>
                                  <div className="max-w-md mx-auto space-y-2 mt-4">
                                    <h3 className="text-sm font-bold text-gray-800">Initializing CRD Master Format...</h3>
                                    <p className="text-xs text-gray-500">Automatically setting up the milestone payment schedules for this booking.</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-sm">
                                  <div className="flex items-center justify-between mb-6">
                                    <div>
                                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-[#0e623a]" />
                                        Stage Details & Milestone Payments
                                      </h3>
                                      <p className="text-xs text-gray-500 mt-1">Manage payment milestones for {lead.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setExtraWorkStageIdx(0)}
                                        className="px-4 py-2 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-xl hover:bg-emerald-100 transition border border-emerald-200 shadow-sm cursor-pointer"
                                      >
                                        + Add Extra Works
                                      </button>
                                      <button
                                        onClick={() => setPaymentStageIdx(0)}
                                        className="px-4 py-2 bg-[#0e623a] text-white font-bold text-[10px] rounded-xl hover:bg-[#0b4d2d] transition shadow cursor-pointer flex items-center gap-1"
                                      >
                                        <CreditCard className="w-3.5 h-3.5" /> Log Payment
                                      </button>
                                    </div>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-y">
                                        <tr>
                                          <th className="p-4 w-12">#</th>
                                          <th className="p-4">Milestone Stage</th>
                                          <th className="p-4 text-right">Stage Value</th>
                                          <th className="p-4 text-center">Status</th>
                                          <th className="p-4 text-right">Received</th>
                                          <th className="p-4 text-right">Pending</th>
                                          <th className="p-4 text-center">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {activeFlow.stages.map((stage, idx) => {
                                          const stageTotal = getStageTotal(stage);
                                          const stagePaid = getStagePaid(stage);
                                          const isPaidInFull = stagePaid >= stageTotal;

                                          return (
                                            <React.Fragment key={idx}>
                                              <tr className={\`hover:bg-gray-50/50 transition \${isPaidInFull ? 'bg-emerald-50/10' : ''}\`}>
                                                <td className="p-4 font-bold text-gray-400">{idx + 1}</td>
                                                <td className="p-4">
                                                  <div className="font-bold text-gray-800">{stage.name}</div>
                                                  <div className="text-[10px] text-gray-400">{stage.percentage}% of total value</div>
                                                </td>
                                                <td className="p-4 text-right font-semibold text-gray-700">
                                                  Rs. {stageTotal.toLocaleString()}
                                                  {stage.extraWorks && stage.extraWorks.length > 0 && (
                                                    <div className="text-[9px] text-blue-600 mt-0.5">+ Extra Works</div>
                                                  )}
                                                </td>
                                                <td className="p-4 text-center">
                                                  <span className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${isPaidInFull ? 'bg-emerald-100 text-emerald-800' : (stagePaid > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600')}\`}>
                                                    {isPaidInFull ? 'Paid' : (stagePaid > 0 ? 'Partial' : 'Pending')}
                                                  </span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-emerald-600">
                                                  Rs. {stagePaid.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right font-bold text-rose-600">
                                                  Rs. {Math.max(0, stageTotal - stagePaid).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center">
                                                  <button
                                                    onClick={() => setPaymentStageIdx(idx)}
                                                    disabled={isPaidInFull}
                                                    className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold transition \${isPaidInFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer border border-blue-200'}\`}
                                                  >
                                                    {isPaidInFull ? 'Cleared' : 'Pay Now'}
                                                  </button>
                                                </td>
                                              </tr>
                                              {/* Extra works rows if any */}
                                              {stage.extraWorks && stage.extraWorks.map((ew, ewIdx) => (
                                                <tr key={\`ew-\${idx}-\${ewIdx}\`} className="bg-blue-50/30">
                                                  <td className="p-2 border-l-2 border-blue-400"></td>
                                                  <td className="p-2 text-[10px] text-gray-600 flex items-center gap-1">
                                                    <ChevronRight className="w-3 h-3 text-blue-400" />
                                                    <span className="font-bold">{ew.name}</span>
                                                  </td>
                                                  <td className="p-2 text-right text-[10px] font-semibold text-gray-700">Rs. {ew.amount.toLocaleString()}</td>
                                                  <td colSpan="4"></td>
                                                </tr>
                                              ))}
                                              {/* Payments breakdown if any */}
                                              {stage.payments && stage.payments.length > 0 && (
                                                <tr className="bg-gray-50/50">
                                                  <td></td>
                                                  <td colSpan="6" className="p-2">
                                                    <div className="flex flex-wrap gap-2">
                                                      {stage.payments.map((p, pIdx) => (
                                                        <div key={\`p-\${idx}-\${pIdx}\`} className="flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-1 rounded text-[9px] shadow-sm">
                                                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                          <span className="font-semibold text-gray-700">Rs. {p.amount.toLocaleString()}</span>
                                                          <span className="text-gray-400 border-l border-gray-200 pl-1.5 ml-0.5">{new Date(p.date).toLocaleDateString('en-GB')}</span>
                                                          <span className="text-blue-600 font-bold border-l border-gray-200 pl-1.5 ml-0.5">{p.mode}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          );
                                        })}
                                      </tbody>
                                      <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                          <td colSpan="2" className="p-4 text-right font-black text-gray-800 uppercase text-[10px] tracking-wider">Total CRD Value</td>
                                          <td className="p-4 text-right font-black text-[#0e623a] text-sm">Rs. {(() => {
                                            const totalWithExtra = activeFlow.stages.reduce((sum, s) => sum + getStageTotal(s), 0);
                                            return totalWithExtra.toLocaleString();
                                          })()}</td>
                                          <td colSpan="4"></td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

              {bookings.filter(lead => {
                if (filterProjectCode && lead.project?.code !== filterProjectCode) return false;
                if (filterDate) {
                  const bookingStr = new Date(lead.bookingInfo?.bookingDate || lead.createdAt).toLocaleDateString('en-CA');
                  if (bookingStr !== filterDate) return false;
                }
                return true;
              }).length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-400">
                    No matching booked leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
`;

// Insert the missing MoreVertical icon if not present in imports.
if (!content.includes('MoreVertical')) {
  content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, group) => {
    return `import { ${group}, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';`;
  });
}

const finalContent = beforeToggle + newContent + modals;
fs.writeFileSync('client/src/pages/CRDFlow.jsx', finalContent);
console.log('CRDFlow.jsx has been updated successfully with accordion table layout.');
