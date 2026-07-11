import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  ChevronDown,
  ChevronUp,
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
  const [expandedFlowId, setExpandedFlowId] = useState(null);

  
  const updateLoanStatus = async (leadId, newStatus, lead) => {
    try {
      const updatedBookingInfo = {
        ...(lead?.bookingInfo || {}),
        loanDetails: {
          ...(lead?.bookingInfo?.loanDetails || {}),
          loanStatus: newStatus
        }
      };

      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingInfo: updatedBookingInfo })
      });
      if (res.ok) {
        fetchCRDFlows();
      }
    } catch (err) {
      console.error('Failed to update loan status', err);
    }
  };

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
      // Assume remaining pending amounts can be covered by bank loan if customer is flagged for bank loan
      // or if they have made at least one bank loan payment.
      const hasBankLoanPayment = stageLoanPayments.length > 0;
      const isBankLoanCustomer = flow.lead?.bankLoan === 'Yes';
      if (hasBankLoanPayment || isBankLoanCustomer || flow.stages.some(s => (s.payments || []).some(p => p.method === 'Bank Loan'))) {
        bankLoanPending += stagePending;
      }
    });

    // Extract bank loan info from active flow stage splits
    const preferredBank = flow.stages.flatMap(s => s.payments || []).find(p => p.method === 'Bank Loan')?.details?.preferredBank || flow.lead?.bookingInfo?.loanDetails?.preferredBank || 'N/A';
    
    let loanStatus = flow.lead?.bookingInfo?.loanDetails?.loanStatus || 'Pending';
    if (bankLoanPaid > 0) loanStatus = 'Disbursed';

    return {
      bankLoanPaid,
      bankLoanPending,
      loanPayments,
      preferredBank,
      loanStatus
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-black-150 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-black-800 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#0e623a]" />
            <span>Bank Loan History Ledger</span>
          </h1>
          {/* <p className="text-xs text-black-500 mt-1">Track stages disbursement history, payments split through Bank Loans, and pending releases.</p> */}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-black-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-black-400 font-bold uppercase tracking-wider block">Financed Customers</span>
            <span className="text-lg font-black text-black-800">{totalLoanClients}</span>
          </div>
        </div>

        <div className="bg-white border border-black-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#0e623a]/10 text-[#0e623a] rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-black-400 font-bold uppercase tracking-wider block">Total Disbursed (Loan)</span>
            <span className="text-lg font-black text-emerald-800">Rs. {totalDisbursed.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white border border-black-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-black-400 font-bold uppercase tracking-wider block">Total Pending Release</span>
            <span className="text-lg font-black text-amber-800">Rs. {totalLoanPending.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="w-full bg-white border border-black-150 rounded-3xl shadow-sm p-6 space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-sm font-bold text-black-800">Active Bank Loan Accounts</h2>
              {/* <p className="text-[12px] text-black-400">List of bookings being financed via registered commercial banks.</p> */}
            </div>
            
            {/* Search filter input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer/project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-black-50 border border-black-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0e623a] w-48"
              />
              <Search className="w-3.5 h-3.5 text-black-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-black-400 text-xs font-bold animate-pulse">Loading loan ledger logs...</div>
          ) : loanClients.length === 0 ? (
            <div className="p-8 text-center text-black-400 text-xs">No active bank loan payment logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-black-50 text-black-500 font-bold uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Project Value</th>
                    <th className="p-4">Financing Bank</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Loan Disbursed</th>
                    <th className="p-4 text-right">Loan Pending</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black-50">
                  {loanClients.map((client) => {
                    const isExpanded = expandedFlowId === client.flow._id;
                    return (
                      <React.Fragment key={client.flow._id}>
                        <tr 
                          className={`hover:bg-black-50/50 transition cursor-pointer ${isExpanded ? 'bg-emerald-50/20' : ''}`}
                          onClick={() => setExpandedFlowId(isExpanded ? null : client.flow._id)}
                        >
                          <td className="p-4">
                            <div className="font-bold text-black-800">{client.flow.lead?.name}</div>
                            <div className="text-[11px] text-black-450 mt-0.5">{client.flow.project?.code} - Unit {client.flow.unitId}</div>
                          </td>
                          <td className="p-4 font-semibold text-black-700">
                            Rs. {client.flow.totalCurrentValue.toLocaleString()}
                          </td>
                          <td className="p-4 text-black-600 font-bold">
                            {client.preferredBank}
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <select 
                              value={client.loanStatus}
                              onChange={(e) => updateLoanStatus(client.flow.lead._id, e.target.value, client.flow.lead)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase cursor-pointer border-none outline-none appearance-none ${
                                client.loanStatus === 'Disbursed' ? 'bg-emerald-50 text-emerald-700' :
                                client.loanStatus === 'Approved' ? 'bg-blue-50 text-blue-700' :
                                'bg-amber-50 text-amber-700'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Disbursed">Disbursed</option>
                            </select>
                          </td>
                          <td className="p-4 text-right text-emerald-800 font-bold">
                            Rs. {client.bankLoanPaid.toLocaleString()}
                          </td>
                          <td className="p-4 text-right text-amber-700 font-bold">
                            Rs. {client.bankLoanPending.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              className="p-1 px-2.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#0e623a] rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
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
                            <td colSpan="7" className="p-0 border-b border-black-200">
                              <div className="p-6 bg-black-50/50 rounded-b-lg border-x border-black-150 mx-2 mb-4 space-y-6">
                                
                                <div>
                                  <h3 className="text-sm font-extrabold text-[#0e623a] mb-3 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Disbursement History (Bank Loan)
                                  </h3>
                                  {client.loanPayments.length === 0 ? (
                                    <div className="p-4 bg-white border border-black-200 rounded-xl text-center text-black-400 text-[12px]">
                                      No loan disbursements submitted yet.
                                    </div>
                                  ) : (
                                    <div className="overflow-hidden border border-black-200 rounded-xl bg-white shadow-sm">
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
                                        <tbody className="divide-y divide-black-100">
                                          {client.loanPayments.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-black-50/50">
                                              <td className="px-4 py-2 font-bold text-black-700">{p.stageName} <span className="text-[10px] text-black-400 ml-1">(Stage {p.stageIndex})</span></td>
                                              <td className="px-4 py-2 text-black-500">{new Date(p.date).toLocaleString('en-GB')}</td>
                                              <td className="px-4 py-2 text-black-600">{p.bankName}</td>
                                              <td className="px-4 py-2 text-black-600">{p.accountNumber}</td>
                                              <td className="px-4 py-2 text-right font-extrabold text-emerald-700">Rs. {p.amount.toLocaleString()}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h3 className="text-sm font-extrabold text-black-800 mb-3 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-black-600" />
                                    Stages Split Overview
                                  </h3>
                                  <div className="overflow-hidden border border-black-200 rounded-xl bg-white shadow-sm">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-black-50 text-black-600 font-bold tracking-wide border-b border-black-200">
                                        <tr>
                                          <th className="px-4 py-2">Stage Name</th>
                                          <th className="px-4 py-2 text-right">Target Amount</th>
                                          <th className="px-4 py-2 text-right">Paid Amount</th>
                                          <th className="px-4 py-2 text-right">Balance</th>
                                          <th className="px-4 py-2 text-center">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-black-100">
                                        {client.flow.stages.map((stage, idx) => {
                                          const stagePaid = (stage.payments || []).reduce((sum, p) => sum + p.amount, 0);
                                          const stagePending = Math.max(0, stage.amount - stagePaid);
                                          const isCompleted = stage.isCompleted;
                                          return (
                                            <tr key={idx} className="hover:bg-black-50/50">
                                              <td className="px-4 py-2 font-bold text-black-700">{stage.name} <span className="text-[11px] text-black-400 font-normal">({stage.percentage}%)</span></td>
                                              <td className="px-4 py-2 text-right text-black-600 font-medium">Rs. {stage.amount.toLocaleString()}</td>
                                              <td className="px-4 py-2 text-right text-emerald-700 font-medium">Rs. {stagePaid.toLocaleString()}</td>
                                              <td className="px-4 py-2 text-right text-amber-700 font-bold">Rs. {stagePending.toLocaleString()}</td>
                                              <td className="px-4 py-2 text-center">
                                                {isCompleted ? (
                                                  <span className="text-[11px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Completed</span>
                                                ) : stagePending > 0 ? (
                                                  <span className="text-[11px] bg-amber-50 border border-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Pending</span>
                                                ) : (
                                                  <span className="text-[11px] text-black-400 font-bold">No Balance</span>
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
        </div>
      </div>
  );
};

export default BankLoanHistory;
