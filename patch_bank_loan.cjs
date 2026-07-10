const fs = require('fs');

const file = 'client/src/pages/BankLoanHistory.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add ChevronDown, ChevronUp to Lucide imports
content = content.replace(
  /import \{\s*([\s\S]*?)\s*\} from 'lucide-react';/,
  (match, p1) => {
    return `import { \n  ChevronDown, \n  ChevronUp, \n  ${p1}\n} from 'lucide-react';`;
  }
);

// Rename selectedFlow to expandedFlowId
content = content.replace(/const \[selectedFlow, setSelectedFlow\] = useState\(null\);/g, 'const [expandedFlowId, setExpandedFlowId] = useState(null);');

// Replace the main layout grid and selected flow panel
const mainRegex = /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">[\s\S]*?(?=<\/div>\s*<\/div>\s*\);)/;

const newMainContent = `<div className="w-full bg-white border border-gray-150 rounded-3xl shadow-sm p-6 space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Active Bank Loan Accounts</h2>
              <p className="text-[11px] text-gray-400">List of bookings being financed via registered commercial banks.</p>
            </div>
            
            {/* Search filter input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer/project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0e623a] w-48"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400 text-xs font-bold animate-pulse">Loading loan ledger logs...</div>
          ) : loanClients.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">No active bank loan payment logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Project Value</th>
                    <th className="p-4">Financing Bank</th>
                    <th className="p-4 text-right">Loan Disbursed</th>
                    <th className="p-4 text-right">Loan Pending</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loanClients.map((client) => {
                    const isExpanded = expandedFlowId === client.flow._id;
                    return (
                      <React.Fragment key={client.flow._id}>
                        <tr 
                          className={\`hover:bg-gray-50/50 transition cursor-pointer \${isExpanded ? 'bg-emerald-50/20' : ''}\`}
                          onClick={() => setExpandedFlowId(isExpanded ? null : client.flow._id)}
                        >
                          <td className="p-4">
                            <div className="font-bold text-gray-800">{client.flow.lead?.name}</div>
                            <div className="text-[10px] text-gray-450 mt-0.5">{client.flow.project?.code} - Unit {client.flow.unitId}</div>
                          </td>
                          <td className="p-4 font-semibold text-gray-700">
                            Rs. {client.flow.totalCurrentValue.toLocaleString()}
                          </td>
                          <td className="p-4 text-gray-600 font-bold">
                            {client.preferredBank}
                          </td>
                          <td className="p-4 text-right text-emerald-800 font-bold">
                            Rs. {client.bankLoanPaid.toLocaleString()}
                          </td>
                          <td className="p-4 text-right text-amber-700 font-bold">
                            Rs. {client.bankLoanPending.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              className="p-1 px-2.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#0e623a] rounded-lg font-bold text-[10px] transition inline-flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedFlowId(isExpanded ? null : client.flow._id);
                              }}
                            >
                              <span>{isExpanded ? 'Close' : 'Ledger'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expandable Dropdown Content */}
                        {isExpanded && (
                          <tr className="bg-white">
                            <td colSpan="6" className="p-0 border-b border-gray-200">
                              <div className="p-6 bg-gray-50/50 rounded-b-lg border-x border-gray-150 mx-2 mb-4 space-y-6">
                                
                                <div>
                                  <h3 className="text-sm font-extrabold text-[#0e623a] mb-3 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Disbursement History (Bank Loan)
                                  </h3>
                                  {client.loanPayments.length === 0 ? (
                                    <div className="p-4 bg-white border border-gray-200 rounded-xl text-center text-gray-400 text-[11px]">
                                      No loan disbursements submitted yet.
                                    </div>
                                  ) : (
                                    <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-[#f0fbf4] text-[#0e623a] font-bold tracking-wide border-b border-emerald-100">
                                          <tr>
                                            <th className="px-4 py-2">Stage</th>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2">Bank Name</th>
                                            <th className="px-4 py-2">Ref A/C</th>
                                            <th className="px-4 py-2 text-right">Amount Disbursed</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {client.loanPayments.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50">
                                              <td className="px-4 py-2 font-bold text-gray-700">{p.stageName} <span className="text-[9px] text-gray-400 ml-1">(Stage {p.stageIndex})</span></td>
                                              <td className="px-4 py-2 text-gray-500">{new Date(p.date).toLocaleString('en-GB')}</td>
                                              <td className="px-4 py-2 text-gray-600">{p.bankName}</td>
                                              <td className="px-4 py-2 text-gray-600">{p.accountNumber}</td>
                                              <td className="px-4 py-2 text-right font-extrabold text-emerald-700">Rs. {p.amount.toLocaleString()}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h3 className="text-sm font-extrabold text-gray-800 mb-3 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-gray-600" />
                                    Stages Split Overview
                                  </h3>
                                  <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-gray-50 text-gray-600 font-bold tracking-wide border-b border-gray-200">
                                        <tr>
                                          <th className="px-4 py-2">Stage Name</th>
                                          <th className="px-4 py-2 text-right">Target Amount</th>
                                          <th className="px-4 py-2 text-right">Paid Amount</th>
                                          <th className="px-4 py-2 text-right">Balance</th>
                                          <th className="px-4 py-2 text-center">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {client.flow.stages.map((stage, idx) => {
                                          const stagePaid = (stage.payments || []).reduce((sum, p) => sum + p.amount, 0);
                                          const stagePending = Math.max(0, stage.amount - stagePaid);
                                          const isCompleted = stage.isCompleted;
                                          return (
                                            <tr key={idx} className="hover:bg-gray-50/50">
                                              <td className="px-4 py-2 font-bold text-gray-700">{stage.name} <span className="text-[10px] text-gray-400 font-normal">({stage.percentage}%)</span></td>
                                              <td className="px-4 py-2 text-right text-gray-600 font-medium">Rs. {stage.amount.toLocaleString()}</td>
                                              <td className="px-4 py-2 text-right text-emerald-700 font-medium">Rs. {stagePaid.toLocaleString()}</td>
                                              <td className="px-4 py-2 text-right text-amber-700 font-bold">Rs. {stagePending.toLocaleString()}</td>
                                              <td className="px-4 py-2 text-center">
                                                {isCompleted ? (
                                                  <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Completed</span>
                                                ) : stagePending > 0 ? (
                                                  <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Pending</span>
                                                ) : (
                                                  <span className="text-[10px] text-gray-400 font-bold">No Balance</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>`;

if (mainRegex.test(content)) {
  content = content.replace(mainRegex, newMainContent);
  fs.writeFileSync(file, content);
  console.log('Successfully patched BankLoanHistory.jsx');
} else {
  console.log('Failed to match layout in BankLoanHistory.jsx');
}
