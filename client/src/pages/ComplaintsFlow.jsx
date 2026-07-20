import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Clock, CheckCircle2, FileText, Send, Loader2, Star, MessageSquare, ChevronDown, ChevronUp, Activity, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ComplaintsFlow = () => {
  const { token, user, isAdmin, hasColumnPermission } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [pedPrices, setPedPrices] = useState({});
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, feedback: '' });
  const [hoverRating, setHoverRating] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const canEditTab = (tabId) => {
    if (isAdmin) return true;
    if (!user || !user.permissions) return false;
    // Map to the existing Extra Works roles since teams are the same
    const tabPermissionMap = {
      'crd': 'extra_works_crd',
      'ped': 'extra_works_ped',
      'client': 'extra_works_client'
    };
    const permId = tabPermissionMap[tabId];
    if (!permId) return false;
    const perm = user.permissions.find(p => p.pageId === permId);
    return perm ? perm.canEdit : false;
  };

  const isComplaintVisible = (task) => {
    return true; // Show all records to everyone, relying on action buttons/labels to indicate turn
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch complaints');
      const data = await res.json();
      setTasks(data);

      const prices = {};
      data.forEach(t => {
        if (t.pedPrice) prices[t.complaintId] = t.pedPrice;
      });
      setPedPrices(prices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const apiCall = async (url, method = 'PUT', body = null) => {
    const options = {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Request failed');
    }
    return res.json();
  };

  const handleAction = async (complaintId, actionFn) => {
    setActionLoading(complaintId);
    try {
      await actionFn();
      await fetchTasks();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const generateQuotationPDF = (task) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 104, 56);
    doc.text('JOHN BUILDWELL', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text('Complaint Repair Quotation', 105, 30, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`Quotation Ref: QTN-${task.token}`, 20, 60);
    doc.text(`Project: ${task.projectName}`, 20, 70);
    doc.text(`Unit: ${task.unitId}`, 20, 80);
    doc.text(`Customer Name: ${task.customerName}`, 20, 90);

    const tableData = [
      ['1', task.title || 'Complaint Repair', task.description, `Rs. ${Number(pedPrices[task.complaintId] || task.pedPrice || 0).toLocaleString()}`]
    ];

    doc.autoTable({
      startY: 100,
      head: [['S.No', 'Title', 'Description', 'Total Price']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 104, 56] }
    });

    const finalY = doc.lastAutoTable.finalY || 130;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: Rs. ${Number(pedPrices[task.complaintId] || task.pedPrice || 0).toLocaleString()}`, 140, finalY + 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms & Conditions Apply.', 20, finalY + 40);
    doc.text('Authorized Signatory', 140, finalY + 40);
    doc.save(`Quotation_${task.token}.pdf`);
  };

  const getStatusBadge = (t) => {
    switch (t.status) {
      case 'Pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold w-max">Pending (CRD)</span>;
      case 'Sent to PED': return <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold w-max">Sent to PED</span>;
      case 'Returned to CRD':
        if (t.clientNotes) return <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-bold w-max flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Client Review</span>;
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold w-max">Priced (CRD)</span>;
      case 'Sent to Customer': return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold w-max">Sent to Customer</span>;
      case 'Client Approved': return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold w-max">Client Approved</span>;
      case 'Rejected': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold w-max">Rejected</span>;
      case 'Execution Sent to PED': return <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold w-max">Execution (PED)</span>;
      case 'Start Work': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Start Work</span>;
      case 'In Progress': return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'Completed': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'Sent to Client (Completed)': return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold w-max">Completed (Client)</span>;
      case 'Feedback Received': return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Star className="w-3 h-3 fill-emerald-800" /> Feedback Received</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold w-max">{t.status}</span>;
    }
  };

  const renderActionButtons = (t) => {
    const isCRD = isAdmin || canEditTab('crd');
    const isPED = isAdmin || canEditTab('ped');
    const isClient = isAdmin || canEditTab('client');

    const actions = [];

    if (t.status === 'Pending') {
      if (isCRD) {
        actions.push(
          <button key="crd-pending" onClick={() => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-ped`, 'PUT'))} className="px-3 py-1.5 bg-[#006838] text-white text-xs font-bold rounded-lg hover:bg-[#00522c]">
            {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Send to PED'}
          </button>
        );
      } else {
        return <span className="text-gray-400 text-xs italic font-medium whitespace-nowrap">Sent to CRD (from Client)</span>;
      }
    } else if (t.status === 'Returned to CRD') {
      if (isCRD) {
        if (t.clientNotes) {
          actions.push(
            <button key="crd-returned-reprice" onClick={() => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-ped`, 'PUT'))} className="px-3 py-1.5 bg-[#006838] text-white text-xs font-bold rounded-lg hover:bg-[#00522c]">
              {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Send to PED for Repricing'}
            </button>
          );
        } else {
          actions.push(
            <button key="crd-returned-client" onClick={() => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-customer`, 'PUT'))} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">
              {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Send to Client'}
            </button>
          );
        }
      } else {
        return <span className="text-gray-400 text-xs italic font-medium whitespace-nowrap">Sent to CRD (from PED)</span>;
      }
    } else if (t.status === 'Sent to PED') {
      if (isPED) {
        actions.push(
          <React.Fragment key="ped-price-actions">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-xs">Rs.</span>
              <input
                type="number"
                value={pedPrices[t.complaintId] || ''}
                onChange={(e) => setPedPrices({ ...pedPrices, [t.complaintId]: e.target.value })}
                placeholder="Price"
                className="w-24 pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#006838] outline-none"
              />
            </div>
            <button onClick={() => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/ped-price`, 'PUT', { pedPrice: pedPrices[t.complaintId] }))} className="px-3 py-1.5 bg-[#006838] text-white text-xs font-bold rounded-lg hover:bg-[#00522c]">
              {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Save & Send to CRD'}
            </button>
            <button onClick={() => generateQuotationPDF(t)} className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" title="Quotation">
              <FileText className="w-4 h-4" />
            </button>
          </React.Fragment>
        );
      } else {
        return <span className="text-gray-400 text-xs italic font-medium whitespace-nowrap">Sent to PED (from CRD)</span>;
      }
    } else if (t.status === 'Sent to Customer') {
      if (isClient) {
        actions.push(
          <React.Fragment key="client-decision">
            <button onClick={() => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/client-decision`, 'PUT', { decision: 'Approved' }))} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">
              {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Approve'}
            </button>
            <button onClick={() => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/client-decision`, 'PUT', { decision: 'Rejected' }))} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">
              {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Reject'}
            </button>
          </React.Fragment>
        );
      } else {
        return <span className="text-gray-400 text-xs italic font-medium whitespace-nowrap">Sent to Client (from CRD)</span>;
      }
    } else if (t.status === 'Client Approved') {
      if (isCRD) {
        actions.push(
          <button key="crd-approved" onClick={() => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-ped-execution`, 'PUT'))} className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700">
            {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Send to PED for Execution'}
          </button>
        );
      } else {
        return <span className="text-gray-400 text-xs italic font-medium whitespace-nowrap">Sent to CRD (from Client)</span>;
      }
    } else if (['Execution Sent to PED', 'Start Work', 'In Progress'].includes(t.status)) {
      if (isPED) {
        actions.push(
          <select
            key="ped-execution"
            value={t.status}
            onChange={(e) => {
              if (e.target.value !== t.status) {
                handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/status`, 'PUT', { status: e.target.value }));
              }
            }}
            className="px-3 py-1.5 border border-emerald-200 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-800 outline-none"
          >
            <option value="Execution Sent to PED" disabled>Select Status...</option>
            <option value="Start Work">Start Work</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        );
      } else {
        return <span className="text-gray-400 text-xs italic font-medium whitespace-nowrap">Sent to PED (Execution)</span>;
      }
    } else if (t.status === 'Completed') {
      if (isCRD) {
        actions.push(
          <button key="crd-completed" onClick={() => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-customer-completed`, 'PUT'))} className="px-3 py-1.5 bg-[#006838] text-white text-xs font-bold rounded-lg hover:bg-[#00522c]">
            {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Send Completed to Client'}
          </button>
        );
      } else {
        return <span className="text-gray-400 text-xs italic font-medium whitespace-nowrap">Sent to CRD (from PED)</span>;
      }
    } else if (t.status === 'Sent to Client (Completed)') {
      return <span className="text-gray-400 text-xs italic font-medium whitespace-nowrap">Sent to Client (Feedback)</span>;
    } else if (t.status === 'Feedback Received' || t.status === 'Resolved') {
      return <span className="text-emerald-600 text-xs font-bold">Resolved</span>;
    } else if (t.status === 'Rejected') {
      return <span className="text-red-500 text-xs font-bold">Rejected by Client</span>;
    }

    if (actions.length > 0) {
      return <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>;
    }

    return <span className="text-gray-400 text-xs italic font-medium">-</span>;
  };

  const filteredTasks = tasks
    .filter(t => isComplaintVisible(t))
    .sort((a, b) => {
      const aNew = a.status === 'Pending';
      const bNew = b.status === 'Pending';
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;
      return new Date(b.reportedAt) - new Date(a.reportedAt);
    });

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Complaints Tracking</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#006838] text-white">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-16">S.No</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Raised On</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Token ID</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Scope</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Price (Rs.)</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Feedback</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#006838]" />
                    <p className="mt-2 text-sm font-medium">Loading Complaints...</p>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-500 font-medium">
                    No complaints found.
                  </td>
                </tr>
              ) : filteredTasks.map((t, idx) => (
                <React.Fragment key={t.complaintId}>
                  <tr className="hover:bg-emerald-50/50 transition-colors cursor-pointer bg-white">
                    <td className="px-6 py-4 font-bold text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(t.reportedAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      <button
                        onClick={(e) => { e.stopPropagation(); setHistoryModal(t); }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm"
                        title="View Activity History"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        {t.token}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {t.status === 'Pending' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">New</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-bold">Old</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${t.scope === 'Customer' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {t.scope || 'Company'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-800 whitespace-normal min-w-[200px]">
                      <div className="font-bold mb-1">{t.title || 'Complaint'}</div>
                      <div className="text-xs text-gray-600 line-clamp-2" title={t.description}>{t.description}</div>
                    </td>
                    <td className="px-6 py-4 font-black text-[#006838]">
                      {t.pedPrice > 0 ? `Rs. ${t.pedPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(t)}
                        {t.clientNotes && (t.status === 'Returned to CRD' || t.status === 'Sent to PED') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedNotes(prev => ({ ...prev, [t.complaintId]: !prev[t.complaintId] }));
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-pink-600 hover:text-pink-800 transition-colors bg-pink-50 px-2 py-1 rounded-full border border-pink-100"
                          >
                            {expandedNotes[t.complaintId] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {expandedNotes[t.complaintId] ? 'Hide Note' : 'View Note'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {t.clientRating > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= t.clientRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          {t.clientFeedback && <p className="text-xs text-gray-500 italic max-w-[200px] truncate" title={t.clientFeedback}>"{t.clientFeedback}"</p>}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {renderActionButtons(t)}
                    </td>
                  </tr>
                  {t.clientNotes && (t.status === 'Returned to CRD' || t.status === 'Sent to PED') && expandedNotes[t.complaintId] && (
                    <tr className="bg-pink-50/40 border-t border-pink-100">
                      <td colSpan="10" className="px-6 py-3">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-pink-100 text-pink-600 rounded-md">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-[10px] uppercase tracking-widest text-pink-800 block mb-0.5">Client Review Note</span>
                            <span className="text-sm text-pink-950 font-medium whitespace-pre-wrap">{t.clientNotes}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[80vh]">
            <div className="bg-[#006838] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-300" />
                  Complaint Timeline
                </h3>
                <p className="text-emerald-100 text-xs mt-1">Token ID: <span className="font-mono font-bold">{historyModal.token}</span></p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="text-white/80 hover:text-white transition p-2 bg-black/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {historyModal.history && historyModal.history.length > 0 ? (
                <div className="relative border-l-2 border-emerald-200 ml-3 space-y-6">
                  {historyModal.history.map((h, i) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#006838] border-4 border-white shadow-sm" />
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-800 text-sm">{h.action}</span>
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {new Date(h.timestamp || h.date).toLocaleString('en-GB', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">{h.notes}</p>
                        {h.user && (
                          <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                            By {h.user}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No timeline available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsFlow;
