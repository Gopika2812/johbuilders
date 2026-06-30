import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  MapPin, 
  Phone, 
  Wrench, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Building,
  DollarSign
} from 'lucide-react';

const Customers = () => {
  const { token } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected customer CRD Flow
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('extra-works'); // 'extra-works' or 'complaints'

  // New complaint input
  const [newComplaintDesc, setNewComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  useEffect(() => {
    fetchFlows();
  }, [token]);

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFlows(data);
        if (data.length > 0) {
          setSelectedFlow(data[0]);
        }
      } else {
        setError('Failed to fetch customers flow details');
      }
    } catch (err) {
      setError('Connection error loading customers list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComplaint = async (e) => {
    e.preventDefault();
    if (!newComplaintDesc.trim() || !selectedFlow) return;

    try {
      setSubmittingComplaint(true);
      const res = await fetch(`${API_URL}/crd-flow/${selectedFlow._id}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description: newComplaintDesc })
      });

      if (res.ok) {
        const updatedFlow = await res.json();
        setNewComplaintDesc('');
        setSuccessMsg('Complaint reported successfully!');
        
        // Update both local list and active selection reference
        setFlows(prev => prev.map(f => f._id === updatedFlow._id ? updatedFlow : f));
        setSelectedFlow(updatedFlow);
        
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to submit complaint');
      }
    } catch (err) {
      setError('Connection error logging complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId, newStatus) => {
    if (!selectedFlow) return;
    try {
      const res = await fetch(`${API_URL}/crd-flow/${selectedFlow._id}/complaints/${complaintId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updatedFlow = await res.json();
        setFlows(prev => prev.map(f => f._id === updatedFlow._id ? updatedFlow : f));
        setSelectedFlow(updatedFlow);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update complaint status');
      }
    } catch (err) {
      setError('Connection error updating complaint status');
    }
  };

  // Filter flows by search
  const filteredFlows = flows.filter(flow => {
    const leadName = flow.lead?.name || '';
    const phoneNo = flow.lead?.phone || '';
    const projCode = flow.project?.code || '';
    const match = searchTerm.toLowerCase();
    return leadName.toLowerCase().includes(match) || 
           phoneNo.includes(match) || 
           projCode.toLowerCase().includes(match);
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-[#0e623a]" />
          <span>Customers Management</span>
        </h1>
        <p className="text-gray-500 text-xs mt-1">Track complaints, milestones, and extra works for customers in the handover pipeline</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-650" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-1.5 animate-pulse">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0e623a]" />
        </div>
      ) : flows.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-150 text-center space-y-3">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-700">No active handover track customers</h3>
          <p className="text-xs text-gray-400">Initialize a milestone CRD Flow for booked leads to list them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left panel: Customers List */}
          <div className="bg-white border border-gray-150 rounded-3xl p-4 shadow-sm space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
              />
            </div>

            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto pr-1">
              {filteredFlows.map(flow => {
                const isSelected = selectedFlow?._id === flow._id;
                return (
                  <button
                    key={flow._id}
                    onClick={() => {
                      setSelectedFlow(flow);
                      setError('');
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl transition duration-150 flex flex-col gap-1.5 border my-1 cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-50/50 border-[#0e623a]/30 shadow-xs' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-gray-800 text-xs">{flow.lead?.name}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 uppercase tracking-wide">
                        {flow.project?.code || 'PROJECT'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-0.5 text-[10px] text-gray-400">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-300" />
                        <span>{flow.lead?.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-gray-300" />
                        <span>Plot / Unit: {flow.unitId} ({flow.project?.projectType || 'Land'})</span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredFlows.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-450 italic">
                  No customers matched search
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Details, Extra Works & Complaints tab */}
          {selectedFlow && (
            <div className="lg:col-span-2 space-y-6">
              
              {/* Customer Header card */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Handover Customer Details</span>
                  <h2 className="text-lg font-black text-gray-800 uppercase">{selectedFlow.lead?.name}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-semibold">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedFlow.lead?.phone}</span>
                    <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-gray-400" /> Plot / Unit {selectedFlow.unitId}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSubTab('extra-works')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                      activeSubTab === 'extra-works'
                        ? 'bg-[#0e623a] text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-250 text-gray-700'
                    }`}
                  >
                    Extra Works
                  </button>
                  <button
                    onClick={() => setActiveSubTab('complaints')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                      activeSubTab === 'complaints'
                        ? 'bg-[#0e623a] text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-250 text-gray-700'
                    }`}
                  >
                    Complaints ({selectedFlow.complaints?.length || 0})
                  </button>
                </div>
              </div>

              {/* Toggle Subtab content panels */}
              {activeSubTab === 'extra-works' ? (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Customer Extra Works Ledger</h3>
                  
                  {/* Ledger list */}
                  {(() => {
                    const allExtraWorks = [];
                    (selectedFlow.stages || []).forEach(stage => {
                      (stage.extraWorks || []).forEach(ew => {
                        allExtraWorks.push({
                          stageName: stage.name,
                          workName: ew.name,
                          amount: ew.amount,
                          isCompleted: stage.isCompleted,
                          addedAt: ew.addedAt
                        });
                      });
                    });

                    if (allExtraWorks.length === 0) {
                      return (
                        <div className="p-8 bg-gray-50 rounded-2xl border text-center text-xs text-gray-400 italic">
                          No extra works registered for this customer.
                        </div>
                      );
                    }

                    return (
                      <div className="divide-y border rounded-2xl overflow-hidden bg-white">
                        {allExtraWorks.map((ew, idx) => (
                          <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50/50 transition">
                            <div className="text-left space-y-1">
                              <span className="font-bold text-xs text-gray-800 block">{ew.workName}</span>
                              <span className="text-[10px] text-gray-450 font-bold block uppercase">{ew.stageName}</span>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                              <span className="font-black text-gray-800 text-xs">₹ {ew.amount.toLocaleString()}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                ew.isCompleted 
                                  ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
                                  : 'bg-amber-50 border-amber-250 text-amber-800'
                              }`}>
                                {ew.isCompleted ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                  
                  {/* File a complaint form */}
                  <form onSubmit={handleAddComplaint} className="space-y-3">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Report New Complaint</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Describe the complaint (e.g. Paint patch repair in bedroom)..."
                        value={newComplaintDesc}
                        onChange={(e) => setNewComplaintDesc(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold text-gray-700"
                        required
                      />
                      <button
                        type="submit"
                        disabled={submittingComplaint}
                        className="px-5 py-2.5 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>File Complaint</span>
                      </button>
                    </div>
                  </form>

                  {/* Complaints lists */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b pb-2">Reported Complaints</h4>
                    
                    {(!selectedFlow.complaints || selectedFlow.complaints.length === 0) ? (
                      <div className="p-8 bg-gray-50 rounded-2xl border text-center text-xs text-gray-400 italic">
                        No complaints filed for this customer.
                      </div>
                    ) : (
                      <div className="divide-y border rounded-2xl overflow-hidden bg-white">
                        {selectedFlow.complaints.map((comp, idx) => {
                          let statusColor = 'bg-amber-50 border-amber-250 text-amber-800';
                          if (comp.status === 'In Progress') {
                            statusColor = 'bg-blue-50 border-blue-200 text-blue-800';
                          } else if (comp.status === 'Resolved') {
                            statusColor = 'bg-emerald-50 border-emerald-250 text-emerald-800';
                          }

                          return (
                            <div key={comp._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50/50 transition">
                              <div className="text-left space-y-1">
                                <p className="text-xs font-semibold text-gray-800">{comp.description}</p>
                                <div className="flex gap-2 text-[9px] text-gray-400 font-bold">
                                  <span>Reported: {new Date(comp.reportedAt).toLocaleDateString()}</span>
                                  {comp.resolvedAt && (
                                    <span className="text-emerald-700">Resolved: {new Date(comp.resolvedAt).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusColor}`}>
                                  {comp.status}
                                </span>
                                
                                <select
                                  value={comp.status}
                                  onChange={(e) => handleUpdateComplaintStatus(comp._id, e.target.value)}
                                  className="px-2 py-1 bg-gray-50 border rounded-lg text-[10px] font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Resolved">Resolved</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Customers;
