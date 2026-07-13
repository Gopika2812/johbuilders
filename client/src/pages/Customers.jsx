import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
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
  DollarSign,
  History,
  Loader2
} from 'lucide-react';

const Customers = () => {
  const { token, user } = useAuth();
  const [flows, setFlows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected customer CRD Flow
  const [selectedFlow, setSelectedFlow] = useState(null);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [activeSubTab, setActiveSubTab] = useState('extra-works'); // 'extra-works' or 'complaints'

  // New complaint input
  const [newComplaintDesc, setNewComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  useEffect(() => {
    fetchFlows();
    if (user?.role === 'Admin' || user?.role === 'Super Admin') {
      fetchEmployees();
    }
  }, [token]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {}
  };

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFlows(data);
        
        // Auto-select logic
        if (initialSearch && data.length > 0) {
          const match = initialSearch.toLowerCase();
          const filtered = data.filter(flow => 
            (flow.lead?.name || '').toLowerCase().includes(match) || 
            (flow.lead?.phone || '').includes(match)
          );
          if (filtered.length > 0) {
            setSelectedFlow(filtered[0]);
          } else {
            setSelectedFlow(data[0]);
          }
        } else if (data.length > 0) {
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
      const res = await fetch(`${API_URL}/tasks/${selectedFlow._id}/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Refresh flows to get updated state
        fetchFlows();
        setSuccessMsg('Complaint status updated');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update complaint status');
      }
    } catch (err) {
      setError('Connection error updating complaint status');
    }
  };

  const handleAssignTask = async (complaintId, assignedTo, riskLevel) => {
    if (!selectedFlow || !assignedTo) return;
    try {
      const res = await fetch(`${API_URL}/tasks/${selectedFlow._id}/${complaintId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo, riskLevel })
      });

      if (res.ok) {
        fetchFlows();
        setSuccessMsg('Task assigned successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to assign task');
      }
    } catch (err) {
      setError('Connection error assigning task');
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
        <h1 className="text-2xl font-bold text-black-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-[#0e623a]" />
          <span>Customers Management</span>
        </h1>
        {/* <p className="text-black-500 text-xs mt-1">Track complaints, milestones, and extra works for customers in the handover pipeline</p> */}
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
        <div className="bg-white p-12 rounded-3xl border border-black-150 text-center space-y-3">
          <Users className="w-12 h-12 text-black-300 mx-auto" />
          <h3 className="text-sm font-bold text-black-700">No active handover track customers</h3>
          <p className="text-xs text-black-400">Initialize a milestone CRD Flow for booked leads to list them here.</p>
        </div>
      ) : (
        <div className="bg-white border border-black-150 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black-100 pb-4">
            <h2 className="text-sm font-bold text-black-800">Active Handover Customers</h2>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-black-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black-50 text-black-500 font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Unit / Plot</th>
                  <th className="p-4 text-center">Complaints</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black-50">
                {filteredFlows.map(flow => {
                  const isExpanded = selectedFlow?._id === flow._id;
                  
                  return (
                    <React.Fragment key={flow._id}>
                      <tr 
                        className={`hover:bg-black-50/50 transition cursor-pointer ${isExpanded ? 'bg-emerald-50/20' : ''}`}
                        onClick={() => {
                          if (isExpanded) {
                            setSelectedFlow(null);
                          } else {
                            setSelectedFlow(flow);
                            setActiveSubTab('extra-works');
                            setError('');
                          }
                        }}
                      >
                        <td className="p-4 font-extrabold text-black-800 text-[13px]">{flow.lead?.name || 'N/A'}</td>
                        <td className="p-4 text-black-600 font-semibold">{flow.lead?.phone || 'N/A'}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 uppercase tracking-wide">
                            {flow.project?.code || 'PROJECT'}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-black-700">
                          {flow.unitId} <span className="text-black-400 font-normal">({flow.project?.projectType || 'Land'})</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            (flow.complaints?.length || 0) > 0 
                              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                              : 'bg-black-50 text-black-500 border border-black-200'
                          }`}>
                            {flow.complaints?.length || 0}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button className="px-3 py-1.5 bg-emerald-50 text-[#0e623a] hover:bg-emerald-100 transition font-bold rounded-lg border border-emerald-200 text-[11px]">
                            {isExpanded ? 'Close' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr>
                          <td colSpan="6" className="p-0 border-b border-black-150">
                            <div className="p-6 bg-black-50/30 border-x border-black-150 mx-2 mb-4 rounded-b-2xl shadow-inner space-y-6">
                              
                              {/* Customer Header card */}
                              <div className="bg-white border border-black-150 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-black-400 uppercase tracking-wider block">Handover Customer Details</span>
                                  <h2 className="text-base font-black text-black-800 uppercase">{selectedFlow.lead?.name}</h2>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-black-500 font-semibold">
                                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-black-400" /> {selectedFlow.lead?.phone}</span>
                                    <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-black-400" /> Plot / Unit {selectedFlow.unitId}</span>
                                  </div>
                                </div>

                                <div className="flex gap-2 bg-black-50 p-1.5 rounded-xl border border-black-150">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveSubTab('extra-works'); }}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                                      activeSubTab === 'extra-works'
                                        ? 'bg-white text-[#0e623a] shadow-sm border border-black-200'
                                        : 'text-black-500 hover:text-black-800'
                                    }`}
                                  >
                                    Extra Works
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveSubTab('complaints'); }}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                                      activeSubTab === 'complaints'
                                        ? 'bg-white text-[#0e623a] shadow-sm border border-black-200'
                                        : 'text-black-500 hover:text-black-800'
                                    }`}
                                  >
                                    Complaints ({selectedFlow.complaints?.length || 0})
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveSubTab('history'); }}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                                      activeSubTab === 'history'
                                        ? 'bg-white text-[#0e623a] shadow-sm border border-black-200'
                                        : 'text-black-500 hover:text-black-800'
                                    }`}
                                  >
                                    History
                                  </button>
                                </div>
                              </div>

                              {/* Toggle Subtab content panels */}
                              {activeSubTab === 'extra-works' ? (
                                <div className="bg-white border border-black-150 rounded-2xl p-5 shadow-sm space-y-4">
                                  <h3 className="text-[11px] font-bold text-black-700 uppercase tracking-wide">Customer Extra Works Ledger</h3>
                                  
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
                                        <div className="p-8 bg-black-50 rounded-xl border border-dashed border-black-200 text-center text-xs text-black-400 font-semibold italic">
                                          No extra works registered for this customer.
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="divide-y border rounded-xl overflow-hidden bg-white">
                                        {allExtraWorks.map((ew, idx) => (
                                          <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-black-50/50 transition">
                                            <div className="text-left space-y-1">
                                              <span className="font-bold text-xs text-black-800 block">{ew.workName}</span>
                                              <span className="text-[10px] text-black-450 font-bold block uppercase">{ew.stageName}</span>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                              <span className="font-black text-black-800 text-xs">₹ {ew.amount.toLocaleString()}</span>
                                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${
                                                ew.isCompleted 
                                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                                  : 'bg-amber-50 border-amber-200 text-amber-800'
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
                              ) : activeSubTab === 'complaints' ? (
                                <div className="bg-white border border-black-150 rounded-2xl p-5 shadow-sm space-y-6">
                                  
                                  {/* File a complaint form */}
                                  <form onSubmit={handleAddComplaint} className="space-y-3 bg-black-50 p-4 rounded-xl border border-black-100">
                                    <label className="text-[11px] font-bold text-black-700 uppercase tracking-wide block">Report New Complaint</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Describe the complaint (e.g. Paint patch repair in bedroom)..."
                                        value={newComplaintDesc}
                                        onChange={(e) => setNewComplaintDesc(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white border border-black-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold text-black-700 shadow-sm"
                                        required
                                      />
                                      <button
                                        type="submit"
                                        disabled={submittingComplaint}
                                        className="px-5 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-[11px] font-bold rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                                      >
                                        {submittingComplaint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                        <span>File Complaint</span>
                                      </button>
                                    </div>
                                  </form>

                                  {/* Complaints lists */}
                                  <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold text-black-500 uppercase tracking-wide border-b pb-2">Reported Complaints</h4>
                                    
                                    {(!selectedFlow.complaints || selectedFlow.complaints.length === 0) ? (
                                      <div className="p-8 bg-black-50 rounded-xl border border-dashed border-black-200 text-center text-xs text-black-400 font-semibold italic">
                                        No complaints filed for this customer.
                                      </div>
                                    ) : (
                                      <div className="border rounded-xl overflow-hidden bg-white">
                                        <table className="w-full text-left text-[11px]">
                                          <thead className="bg-black-50 text-black-500 font-bold uppercase tracking-wider border-b">
                                            <tr>
                                              <th className="p-3 w-12 text-center">S.No</th>
                                              <th className="p-3">Date</th>
                                              <th className="p-3">Complaint</th>
                                              <th className="p-3">Assigned Person</th>
                                              <th className="p-3">Task/Risk Level</th>
                                              <th className="p-3 text-center">Status</th>
                                              <th className="p-3 text-center">Action</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-black-50">
                                            {selectedFlow.complaints.map((comp, idx) => {
                                              let statusColor = 'bg-amber-50 border-amber-250 text-amber-800';
                                              if (comp.status === 'In Progress' || comp.status === 'Start Work') {
                                                statusColor = 'bg-blue-50 border-blue-200 text-blue-800';
                                              } else if (comp.status === 'Resolved' || comp.status === 'Completed') {
                                                statusColor = 'bg-emerald-50 border-emerald-250 text-emerald-800';
                                              }
                                              
                                              let riskColor = 'bg-gray-50 border-gray-200 text-gray-700';
                                              if (comp.riskLevel === 'High') riskColor = 'bg-red-50 border-red-200 text-red-700';
                                              if (comp.riskLevel === 'Medium') riskColor = 'bg-orange-50 border-orange-200 text-orange-700';
                                              if (comp.riskLevel === 'Low') riskColor = 'bg-emerald-50 border-emerald-200 text-emerald-700';

                                              return (
                                                <tr key={comp._id} className="hover:bg-black-50/50 transition">
                                                  <td className="p-3 text-center font-bold text-black-400">{idx + 1}</td>
                                                  <td className="p-3 text-black-500 font-bold">{new Date(comp.reportedAt).toLocaleDateString()}</td>
                                                  <td className="p-3">
                                                    <p className="font-semibold text-black-800">{comp.description}</p>
                                                    {comp.resolvedAt && (
                                                      <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">Resolved: {new Date(comp.resolvedAt).toLocaleDateString()}</span>
                                                    )}
                                                  </td>
                                                  <td className="p-3">
                                                    {comp.assignedPersonName ? (
                                                      <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[9px] uppercase">
                                                          {comp.assignedPersonName.slice(0, 2)}
                                                        </div>
                                                        <span className="font-bold text-black-700">{comp.assignedPersonName}</span>
                                                      </div>
                                                    ) : (
                                                      <span className="text-black-400 italic font-semibold text-[10px]">Unassigned</span>
                                                    )}
                                                  </td>
                                                  <td className="p-3">
                                                    {comp.riskLevel ? (
                                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${riskColor}`}>
                                                        {comp.riskLevel} Risk
                                                      </span>
                                                    ) : (
                                                      <span className="text-black-400 italic font-semibold text-[10px]">-</span>
                                                    )}
                                                  </td>
                                                  <td className="p-3 text-center">
                                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wide border whitespace-nowrap ${statusColor}`}>
                                                      {comp.status}
                                                    </span>
                                                  </td>
                                                  <td className="p-3 text-center">
                                                    {(user?.role === 'Admin' || user?.role === 'Super Admin') && !comp.assignedTo && (
                                                      <div className="flex flex-col gap-1 items-end">
                                                        <select
                                                          className="w-full text-[10px] border rounded p-1 font-semibold text-black-600 bg-black-50 outline-none"
                                                          onChange={(e) => {
                                                            if (e.target.value) {
                                                              const [userId, risk] = e.target.value.split('|');
                                                              if (userId && risk) {
                                                                handleAssignTask(comp._id, userId, risk);
                                                                e.target.value = '';
                                                              }
                                                            }
                                                          }}
                                                        >
                                                          <option value="">Assign Task...</option>
                                                          {employees.map(emp => (
                                                            <optgroup key={emp._id} label={emp.name}>
                                                              <option value={`${emp._id}|High`}>High Risk</option>
                                                              <option value={`${emp._id}|Medium`}>Medium Risk</option>
                                                              <option value={`${emp._id}|Low`}>Low Risk</option>
                                                            </optgroup>
                                                          ))}
                                                        </select>
                                                      </div>
                                                    )}
                                                    
                                                    {/* Allow changing status if already assigned */}
                                                    {(user?.role === 'Admin' || user?.role === 'Super Admin') && comp.assignedTo && (
                                                      <select
                                                        value={comp.status}
                                                        onChange={(e) => handleUpdateComplaintStatus(comp._id, e.target.value)}
                                                        className="w-full mt-1 px-2 py-1 bg-white border rounded text-[10px] font-bold text-black-700 uppercase tracking-wide focus:outline-none"
                                                      >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Start Work">Start Work</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                      </select>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : activeSubTab === 'history' ? (
                                <div className="bg-white border border-black-150 rounded-2xl p-5 shadow-sm space-y-4">
                                  <h3 className="text-[11px] font-bold text-black-700 uppercase tracking-wide flex items-center gap-2">
                                    <History className="w-3.5 h-3.5 text-[#0e623a]" /> CRD Flow History
                                  </h3>
                                  
                                  {(!selectedFlow.history || selectedFlow.history.length === 0) ? (
                                    <div className="p-8 bg-black-50 rounded-xl border border-dashed border-black-200 text-center text-xs text-black-400 font-semibold italic">
                                      No history logs for this CRD flow yet.
                                    </div>
                                  ) : (
                                    <div className="divide-y border rounded-xl overflow-hidden bg-white">
                                      {selectedFlow.history.slice().reverse().map((entry, idx) => (
                                        <div key={idx} className="p-4 flex gap-4 hover:bg-black-50/50 transition">
                                          <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[10px] uppercase shadow-inner">
                                              {entry.user ? entry.user.slice(0, 2) : 'SY'}
                                            </div>
                                          </div>
                                          <div>
                                            <h4 className="font-bold text-black-800 text-xs">{entry.action}</h4>
                                            <p className="text-[11px] text-black-600 mt-1 font-medium">{entry.notes}</p>
                                            <div className="text-[10px] text-black-400 mt-1.5 font-bold uppercase tracking-wide">
                                              {new Date(entry.date).toLocaleString()} • {entry.user || 'System'}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : null}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                
                {filteredFlows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-xs text-black-450 italic font-semibold">
                      No customers matched search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
