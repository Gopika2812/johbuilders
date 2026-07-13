import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Building, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  Clock,
  Loader2,
  Send,
  Plus
} from 'lucide-react';

const ExtraWorks = () => {
  const { token } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFlow, setExpandedFlow] = useState(null);
  const [rates, setRates] = useState({});
  const [submitting, setSubmitting] = useState(null); // id of work being submitted

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/extra-works`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch extra works');
      const data = await res.json();
      setFlows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, [token]);

  const handleRateChange = (workId, value) => {
    setRates(prev => ({ ...prev, [workId]: value }));
  };

  const handleSavePrice = async (flowId, stageIdx, workId) => {
    try {
      setSubmitting(workId);
      const rate = Number(rates[workId] || 0);
      const res = await fetch(`${API_URL}/extra-works/${flowId}/${stageIdx}/${workId}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rate })
      });
      if (!res.ok) throw new Error('Failed to save price');
      await fetchFlows();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleSendToCustomer = async (flowId, stageIdx, workId) => {
    try {
      setSubmitting(workId);
      const res = await fetch(`${API_URL}/extra-works/${flowId}/${stageIdx}/${workId}/send`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to send to customer');
      await fetchFlows();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleAddToCRD = async (flowId, stageIdx, workId) => {
    try {
      setSubmitting(workId);
      const res = await fetch(`${API_URL}/extra-works/${flowId}/${stageIdx}/${workId}/add-to-crd`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to add to CRD');
      await fetchFlows();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">Pending Price</span>;
      case 'PED Approved': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">Priced (Ready to Send)</span>;
      case 'Sent to Customer': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">Sent to Customer</span>;
      case 'Client Approved': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-bold">Client Approved</span>;
      case 'Added to CRD': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">Added to CRD</span>;
      case 'Removed by Client': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">Removed by Client</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-light text-emerald-900">Extra Works Management</h1>
          <p className="text-sm text-emerald-700/70 mt-1">Manage extra works, set prices, and send to customers.</p>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#006838] text-white">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">S.No</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Project</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Units</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Quotation Value</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Extra Works</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Final Value</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {flows.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500 font-medium">No extra works requests found.</td>
                </tr>
              ) : flows.map((flow, idx) => {
                const isExpanded = expandedFlow === flow._id;
                
                return (
                  <React.Fragment key={flow._id}>
                    <tr 
                      className={`hover:bg-emerald-50/50 transition-colors cursor-pointer ${isExpanded ? 'bg-emerald-50/80' : ''}`}
                      onClick={() => setExpandedFlow(isExpanded ? null : flow._id)}
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">{idx + 1}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(flow.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-emerald-900">{flow.lead?.name}</td>
                      <td className="px-6 py-4 text-gray-600">{flow.lead?.phone}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{flow.project?.name}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">{flow.unitId}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">Rs. {flow.totalOriginalValue?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-amber-600">Rs. {flow.totalExtraWorksValue?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">Rs. {flow.totalCurrentValue?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr>
                        <td colSpan="10" className="p-0 border-b-2 border-emerald-600">
                          <div className="bg-emerald-50 p-6 shadow-inner">
                            <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Building className="w-4 h-4" /> Requested Extra Works Details
                            </h4>
                            
                            <div className="space-y-4">
                              {flow.stages.map((stage, sIdx) => (
                                stage.extraWorks && stage.extraWorks.length > 0 && stage.extraWorks.map(work => {
                                  const isPriced = work.status !== 'Pending';
                                  
                                  return (
                                    <div key={work._id} className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 flex flex-wrap items-center justify-between gap-4">
                                      <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{work.category}</span>
                                          <span className="text-[10px] font-bold text-gray-500">Stage: {stage.name}</span>
                                        </div>
                                        <h5 className="font-bold text-gray-900">{work.name}</h5>
                                        <p className="text-xs text-gray-500 mt-1">Quantity: <strong className="text-gray-900">{work.quantity}</strong> {work.unit}</p>
                                      </div>
                                      
                                      <div className="flex items-center gap-4 flex-wrap">
                                        <div className="w-32">
                                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rate (Rs.)</label>
                                          <input
                                            type="number"
                                            disabled={work.status !== 'Pending'}
                                            value={rates[work._id] ?? work.rate ?? ''}
                                            onChange={(e) => handleRateChange(work._id, e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#006838]/20 focus:border-[#006838] disabled:opacity-50"
                                            placeholder="Enter rate..."
                                          />
                                        </div>
                                        <div className="w-32">
                                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total (Rs.)</label>
                                          <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-black text-emerald-700">
                                            {((rates[work._id] ?? work.rate ?? 0) * work.quantity).toLocaleString()}
                                          </div>
                                        </div>
                                        
                                        <div className="w-40 flex flex-col items-end gap-2">
                                          {getStatusBadge(work.status)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ))}
                            </div>
                            
                            {/* Bulk Actions */}
                            {(flow.stages.some(s => s.extraWorks?.some(w => w.status === 'PED Approved')) || 
                              flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Client Approved'))) && (
                              <div className="mt-6 flex flex-wrap justify-end gap-4 border-t border-emerald-200/50 pt-6">
                                {(() => {
                                  const hasPendingWithRate = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Pending' && rates[w._id] > 0));
                                  const hasPEDApproved = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'PED Approved'));
                                  
                                  if (hasPendingWithRate || hasPEDApproved) {
                                    return (
                                      <button
                                        onClick={async () => {
                                          try {
                                            setSubmitting('bulk-save-send');
                                            
                                            // 1. Save prices for any pending items that have a rate entered
                                            const pendingToSave = [];
                                            flow.stages.forEach((s, sIdx) => {
                                              s.extraWorks?.forEach(w => {
                                                if (w.status === 'Pending' && rates[w._id] > 0) {
                                                  pendingToSave.push({ sIdx, wId: w._id, rate: rates[w._id] });
                                                }
                                              });
                                            });
                                            
                                            if (pendingToSave.length > 0) {
                                              await Promise.all(pendingToSave.map(work => 
                                                fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/price`, {
                                                  method: 'PUT',
                                                  headers: { 
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}` 
                                                  },
                                                  body: JSON.stringify({ rate: work.rate })
                                                })
                                              ));
                                            }
                                            
                                            // 2. Send to customer (includes newly saved and previously approved ones)
                                            const worksToSend = [];
                                            flow.stages.forEach((s, sIdx) => {
                                              s.extraWorks?.forEach(w => {
                                                if (w.status === 'PED Approved' || (w.status === 'Pending' && rates[w._id] > 0)) {
                                                  worksToSend.push({ sIdx, wId: w._id });
                                                }
                                              });
                                            });
                                            
                                            if (worksToSend.length > 0) {
                                              await Promise.all(worksToSend.map(work => 
                                                fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/send`, {
                                                  method: 'PUT',
                                                  headers: { Authorization: `Bearer ${token}` }
                                                })
                                              ));
                                            }
                                            
                                            await fetchFlows();
                                          } catch (err) {
                                            alert('Failed to process some items');
                                          } finally {
                                            setSubmitting(null);
                                          }
                                        }}
                                        disabled={submitting === 'bulk-save-send'}
                                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                      >
                                        {submitting === 'bulk-save-send' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Save & Send All to Customer</>}
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                {flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Client Approved')) && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        setSubmitting('bulk-add');
                                        const worksToAdd = [];
                                        flow.stages.forEach((s, sIdx) => {
                                          s.extraWorks?.forEach(w => {
                                            if (w.status === 'Client Approved') worksToAdd.push({ sIdx, wId: w._id });
                                          });
                                        });
                                        for (const work of worksToAdd) {
                                          await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/add-to-crd`, {
                                            method: 'PUT',
                                            headers: { Authorization: `Bearer ${token}` }
                                          });
                                        }
                                        await fetchFlows();
                                      } catch (err) {
                                        alert('Failed to add some items to CRD');
                                      } finally {
                                        setSubmitting(null);
                                      }
                                    }}
                                    disabled={submitting === 'bulk-add'}
                                    className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
                                  >
                                    {submitting === 'bulk-add' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Add All Approved to CRD</>}
                                  </button>
                                )}
                              </div>
                            )}
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
      </div>
    </div>
  );
};

export default ExtraWorks;
