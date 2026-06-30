import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Building, 
  Search, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  User, 
  Layers, 
  BookOpen,
  ArrowRight,
  TrendingUp,
  Landmark
} from 'lucide-react';

const BankLoanHistory = () => {
  const { token } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlow, setSelectedFlow] = useState(null);

  useEffect(() => {
    fetchCRDFlows();
  }, [token]);

  const fetchCRDFlows = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFlows(data);
      } else {
        setError('Failed to fetch milestone records');
      }
    } catch (err) {
      setError('Connection error loading bank loan data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract bank loan details for each client
  const getClientLoanDetails = (flow) => {
    let bankLoanPaid = 0;
    let bankLoanPending = 0;
    const loanPayments = [];

    // Stages with Bank Loan payments
    flow.stages.forEach((stage, sIdx) => {
      const stageLoanPayments = (stage.payments || []).filter(p => p.method === 'Bank Loan');
      stageLoanPayments.forEach(p => {
        bankLoanPaid += p.amount;
        loanPayments.push({
          stageName: stage.name,
          stageIndex: sIdx + 1,
          amount: p.amount,
          date: p.date,
          bankName: p.details?.preferredBank || p.details?.bankName || 'N/A',
          accountNumber: p.details?.accountNumber || 'N/A',
          customerName: p.details?.customerName || flow.lead?.name || 'N/A'
        });
      });

      // Calculate total pending amount for this stage
      const stagePaidTotal = (stage.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const stagePending = Math.max(0, stage.amount - stagePaidTotal);
      
      // Assume remaining pending amounts can be covered by bank loan if customer has any bank loan detail set
      // (If a payment was made using bank loan, or preferred bank is present, stage is considered for bank loan tracking)
      const hasBankLoanPayment = stageLoanPayments.length > 0;
      if (hasBankLoanPayment || flow.stages.some(s => (s.payments || []).some(p => p.method === 'Bank Loan'))) {
        bankLoanPending += stagePending;
      }
    });

    // Extract bank loan info from active flow stage splits
    const preferredBank = flow.stages.flatMap(s => s.payments || [])
      .find(p => p.method === 'Bank Loan')?.details?.preferredBank || 'N/A';

    return {
      bankLoanPaid,
      bankLoanPending,
      loanPayments,
      preferredBank
    };
  };

  // Filter flows that have bank loan logs or setup
  const loanClients = flows.map(flow => {
    const loanDetails = getClientLoanDetails(flow);
    return {
      flow,
      ...loanDetails
    };
  }).filter(c => {
    // Show clients that have matches name and are strictly marked with Bank Loan: Yes
    const matchesSearch = c.flow.lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.flow.project?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const isYesType = c.flow.lead?.bankLoan === 'Yes';
    return matchesSearch && isYesType;
  });

  // Calculate summary metrics
  const totalLoanClients = loanClients.length;
  const totalDisbursed = loanClients.reduce((sum, c) => sum + c.bankLoanPaid, 0);
  const totalLoanPending = loanClients.reduce((sum, c) => sum + c.bankLoanPending, 0);

  return (
    <div className="space-y-6 w-full mx-auto px-4 lg:px-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-150 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#0e623a]" />
            <span>Bank Loan History Ledger</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">Track stages disbursement history, payments split through Bank Loans, and pending releases.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Financed Customers</span>
            <span className="text-lg font-black text-gray-800">{totalLoanClients}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#0e623a]/10 text-[#0e623a] rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Disbursed (Loan)</span>
            <span className="text-lg font-black text-emerald-800">Rs. {totalDisbursed.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Pending Release</span>
            <span className="text-lg font-black text-amber-800">Rs. {totalLoanPending.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Loan Customers List Directory */}
        <div className="lg:col-span-2 bg-white border border-gray-150 rounded-3xl shadow-sm p-6 space-y-4 text-left">
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
                    const isSelected = selectedFlow?.flow?._id === client.flow._id;
                    return (
                      <tr 
                        key={client.flow._id} 
                        className={`hover:bg-gray-50/50 transition cursor-pointer ${isSelected ? 'bg-emerald-50/20' : ''}`}
                        onClick={() => setSelectedFlow(client)}
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
                              setSelectedFlow(client);
                            }}
                          >
                            <span>Ledger</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Customer Loan Ledger Ledger Details */}
        <div className="lg:col-span-1 space-y-6 text-left">
          {selectedFlow ? (
            <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-sm space-y-6">
              <div className="border-b pb-3">
                <span className="text-[9px] bg-[#0e623a]/15 text-[#0e623a] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Statement Ledger</span>
                <h3 className="text-sm font-black text-gray-800 mt-1">{selectedFlow.flow.lead?.name}</h3>
                <span className="text-[10px] text-gray-400 block font-semibold mt-0.5">{selectedFlow.flow.project?.name} ({selectedFlow.flow.unitId})</span>
              </div>

              {/* Loan Transaction statements list */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Disbursement History (Bank Loan)</span>
                
                {selectedFlow.loanPayments.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-400 text-[11px]">
                    No loan disbursements submitted yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedFlow.loanPayments.map((p, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-2 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-[#0e623a] font-black uppercase tracking-wider">Stage {p.stageIndex}</span>
                            <span className="text-xs font-bold text-gray-700 block mt-0.5">{p.stageName}</span>
                          </div>
                          <span className="text-xs text-emerald-800 font-extrabold">
                            Rs. {p.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{new Date(p.date).toLocaleString('en-GB')}</span>
                        </div>
                        <div className="text-[9px] text-gray-400 border-t pt-1.5 mt-1.5 flex justify-between items-center">
                          <span>Bank: <b>{p.bankName}</b></span>
                          <span>Ref A/C: <b>{p.accountNumber}</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stage Payment Targets */}
              <div className="space-y-3 pt-3 border-t border-gray-150">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Stages Split Overview</span>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {selectedFlow.flow.stages.map((stage, idx) => {
                    const stagePaid = (stage.payments || []).reduce((sum, p) => sum + p.amount, 0);
                    const stagePending = Math.max(0, stage.amount - stagePaid);
                    const isCompleted = stage.isCompleted;

                    return (
                      <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-gray-100 last:border-0">
                        <div className="max-w-[70%]">
                          <span className="font-bold text-gray-700 block truncate">{stage.name} ({stage.percentage}%)</span>
                          <span className="text-gray-400 block mt-0.5">
                            Target: Rs. {stage.amount.toLocaleString()} | Paid: Rs. {stagePaid.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          {isCompleted ? (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Completed</span>
                          ) : stagePending > 0 ? (
                            <span className="text-[9px] text-amber-700 font-bold block">Rs. {stagePending.toLocaleString()} Bal</span>
                          ) : (
                            <span className="text-[9px] text-gray-400 font-bold block">No Balance</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-150 p-8 rounded-3xl text-center text-gray-400 text-xs shadow-sm">
              Select a customer from the loan accounts list to inspect full disbursement statements.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankLoanHistory;
