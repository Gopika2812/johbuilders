import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { formatUnitWithLabel } from '../utils/formatUtils';
import { AlertCircle, Clock, CheckCircle2, FileText, Send, Loader2, Star, MessageSquare, ChevronDown, ChevronUp, Activity, X, Search, Eye, Image } from 'lucide-react';
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
  const [staffList, setStaffList] = useState([]);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Filtration State
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'new', 'old'
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    }
  };

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

  const isOldComplaint = (t) => {
    const oldStatuses = [
      'Execution Sent to PED',
      'Start Work',
      'In Progress',
      'Completed',
      'Sent to Client (Completed)',
      'Feedback Received',
      'Resolved'
    ];
    return oldStatuses.includes(t?.status);
  };

  const isComplaintVisible = (task) => {
    return true; // Show all records to everyone, relying on action buttons/labels to indicate turn
  };

  useEffect(() => {
    fetchTasks();
    fetchStaff();

    const intervalId = setInterval(() => {
      fetchTasks();
    }, 5000);

    return () => clearInterval(intervalId);
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
    doc.text(`Unit/Flat/Villa: ${formatUnitWithLabel(task.unitId, task.projectType)}`, 20, 80);
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
        if (!t.pedPrice || t.pedPrice === 0 || t.noPrice) return <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold w-max">No Price (CRD)</span>;
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold w-max">Priced (CRD)</span>;
      case 'Sent to Customer': return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold w-max">Sent to Customer</span>;
      case 'Client Approved': return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold w-max">Client Approved</span>;
      case 'Rejected': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold w-max">Rejected</span>;
      case 'Execution Sent to PED': return <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold w-max">Execution (PED)</span>;
      case 'Start Work':
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
          <button key="crd-pending" onClick={() => setAssignModal({ title: 'Send Complaint to PED Team', onConfirm: (assigneeId) => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-ped`, 'PUT', { assignedTo: assigneeId })) })} className="px-3 py-1.5 bg-[#006838] text-white text-xs font-bold rounded-lg hover:bg-[#00522c] cursor-pointer">
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
            <button key="crd-returned-reprice" onClick={() => setAssignModal({ title: 'Send Complaint to PED for Repricing', onConfirm: (assigneeId) => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-ped`, 'PUT', { assignedTo: assigneeId })) })} className="px-3 py-1.5 bg-[#006838] text-white text-xs font-bold rounded-lg hover:bg-[#00522c] cursor-pointer">
              {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Send to PED for Repricing'}
            </button>
          );
        } else if (!t.pedPrice || t.pedPrice === 0 || t.noPrice) {
          // NO PRICE: Bypasses Client Approval, sends directly to PED Execution!
          actions.push(
            <button key="crd-no-price-exec" onClick={() => setAssignModal({ title: 'Send Complaint to PED for Execution', onConfirm: (assigneeId) => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-ped-execution`, 'PUT', { assignedTo: assigneeId })) })} className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 shadow-sm cursor-pointer whitespace-nowrap">
              {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Send to PED for Execution'}
            </button>
          );
        } else {
          // PRICE GIVEN: Send to Client for Approval!
          actions.push(
            <button key="crd-returned-client" onClick={() => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-customer`, 'PUT'))} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm cursor-pointer whitespace-nowrap">
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
            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
              <div className="relative shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                <input
                  type="number"
                  value={pedPrices[t.complaintId] || ''}
                  onChange={(e) => setPedPrices({ ...pedPrices, [t.complaintId]: e.target.value })}
                  placeholder="Price"
                  className="w-24 pl-8 pr-2 py-1.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#006838] focus:border-transparent outline-none font-bold text-gray-900 shadow-sm bg-white"
                />
              </div>
              <button 
                onClick={() => setAssignModal({ title: 'Save Price & Send Complaint to CRD', onConfirm: (assigneeId) => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/ped-price`, 'PUT', { pedPrice: pedPrices[t.complaintId], assignedTo: assigneeId })) })} 
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006838] hover:bg-[#00522c] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition whitespace-nowrap shrink-0"
              >
                {actionLoading === t.complaintId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Save & Send to CRD</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setAssignModal({ title: 'Send Free Complaint to CRD', onConfirm: (assigneeId) => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/ped-price`, 'PUT', { pedPrice: 0, noPrice: true, assignedTo: assigneeId })) })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition whitespace-nowrap shrink-0"
                title="No Price charged, send directly for execution via CRD"
              >
                {actionLoading === t.complaintId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                ) : (
                  'No Price (Free)'
                )}
              </button>
              <button 
                onClick={() => generateQuotationPDF(t)} 
                className="p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 border border-gray-200 cursor-pointer transition shrink-0" 
                title="Download Quotation PDF"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
              </button>
            </div>
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
          <button key="crd-approved" onClick={() => setAssignModal({ title: 'Send Approved Complaint to PED for Execution', onConfirm: (assigneeId) => handleAction(t.complaintId, () => apiCall(`${API_URL}/tasks/${t.flowId}/${t.complaintId}/send-to-ped-execution`, 'PUT', { assignedTo: assigneeId })) })} className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700">
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
            className="px-3 py-1.5 border border-emerald-200 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-800 outline-none cursor-pointer"
          >
            <option value="Execution Sent to PED" disabled>Select Status...</option>
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
    .filter(t => {
      if (!isComplaintVisible(t)) return false;
      
      // Status Filter (New / Old)
      if (statusFilter === 'new' && isOldComplaint(t)) return false;
      if (statusFilter === 'old' && !isOldComplaint(t)) return false;

      // Date Range Filter
      if (startDate && endDate) {
        const compDate = new Date(t.reportedAt);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (compDate < start || compDate > end) return false;
      }

      // Search Query Filter
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const matchToken = t.token?.toLowerCase().includes(query);
        const matchTitle = t.title?.toLowerCase().includes(query);
        const matchDesc = t.description?.toLowerCase().includes(query);
        const matchCustomer = t.customerName?.toLowerCase().includes(query);
        const matchUnit = t.unitId?.toLowerCase().includes(query);
        const matchProject = t.projectName?.toLowerCase().includes(query);
        if (!matchToken && !matchTitle && !matchDesc && !matchCustomer && !matchUnit && !matchProject) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const aOld = isOldComplaint(a);
      const bOld = isOldComplaint(b);
      if (!aOld && bOld) return -1;
      if (aOld && !bOld) return 1;
      return new Date(b.reportedAt) - new Date(a.reportedAt);
    });

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-6 animate-fade-in pb-24">
      {/* Header Banner & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Complaints Tracking</h1>
          <p className="text-xs text-gray-500 mt-1">Manage client complaints and track resolution progress.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-white border border-[#006838]/20 p-2 rounded-xl shadow-sm px-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-gray-700 w-36 md:w-48 font-medium placeholder-gray-400"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 bg-white border border-[#006838]/20 p-1.5 rounded-xl shadow-sm">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#006838]"
            />
            <span className="text-xs text-gray-400 font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#006838]"
            />
          </div>

          {/* New / Old Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-[#006838]/20 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#006838] cursor-pointer font-bold shadow-sm"
          >
            <option value="all">All Status ({tasks.length})</option>
            <option value="new">New Complaints ({tasks.filter(t => !isOldComplaint(t)).length})</option>
            <option value="old">Old Complaints ({tasks.filter(t => isOldComplaint(t)).length})</option>
          </select>
        </div>
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
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right min-w-[360px]">Action</th>
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
                  <tr 
                    onClick={() => setHistoryModal(t)}
                    className={`transition-colors cursor-pointer ${
                      !isOldComplaint(t) 
                        ? 'bg-yellow-50/70 hover:bg-yellow-100/60' 
                        : 'bg-white hover:bg-emerald-50/50'
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(t.reportedAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      <button
                        onClick={(e) => { e.stopPropagation(); setHistoryModal(t); }}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm cursor-pointer"
                        title="View Details & History"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        {t.token}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {!isOldComplaint(t) ? (
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full text-[11px] font-bold">New</span>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900">{t.title || 'Complaint'}</span>
                        {t.assignedPersonName && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                            Assigned: {t.assignedPersonName}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setHistoryModal(t); }}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition border border-emerald-100 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                          title="View Full Description & Uploaded Images"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-[#006838]">
                      {t.noPrice || (t.pedPrice === 0 && !['Pending', 'Sent to PED'].includes(t.status)) ? (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-xs font-bold whitespace-nowrap">No Price</span>
                      ) : (t.pedPrice > 0 ? `Rs. ${t.pedPrice.toLocaleString()}` : '-')}
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
                            className="flex items-center gap-1 text-[10px] font-bold text-pink-600 hover:text-pink-800 transition-colors bg-pink-50 px-2 py-1 rounded-full border border-pink-100 cursor-pointer"
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
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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

      {/* Complaint Details, Description & Images Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setHistoryModal(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[88vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-[#006838] p-5 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-300" />
                  {historyModal.title || 'Complaint Details'}
                </h3>
                <p className="text-emerald-100 text-xs mt-1 flex items-center gap-2">
                  Token ID: <span className="font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded text-white">{historyModal.token}</span>
                  • Date: <span className="font-semibold">{new Date(historyModal.reportedAt).toLocaleDateString('en-GB')}</span>
                </p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="text-white/80 hover:text-white transition p-2 bg-black/10 hover:bg-black/20 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-5">
              {/* Customer & Unit Information */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm text-xs">
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[9px] block mb-0.5">Customer Name</span>
                  <span className="font-bold text-gray-900">{historyModal.customerName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[9px] block mb-0.5">Phone Number</span>
                  <span className="font-bold text-gray-900">{historyModal.customerPhone || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[9px] block mb-0.5">Project / Unit</span>
                  <span className="font-bold text-emerald-700">{historyModal.projectName} ({formatUnitWithLabel(historyModal.unitId, historyModal.projectType)})</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase text-[9px] block mb-0.5">Quoted Price</span>
                  <span className="font-black text-[#006838]">
                    {historyModal.pedPrice > 0 ? `Rs. ${historyModal.pedPrice.toLocaleString()}` : (historyModal.noPrice ? 'No Price (Free)' : '-')}
                  </span>
                </div>
              </div>

              {/* Full Description Box */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" /> Full Issue Description
                </h4>
                <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  {historyModal.description || 'No description provided.'}
                </p>
              </div>

              {/* Uploaded Complaint Images Gallery */}
              {historyModal.images && historyModal.images.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-emerald-600" /> Uploaded Complaint Images ({historyModal.images.length})
                  </h4>
                  <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {historyModal.images.map((imgUrl, i) => (
                      <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 group relative block">
                        <img src={imgUrl} alt={`Complaint Attachment ${i+1}`} className="w-36 h-36 object-cover rounded-xl border-2 border-gray-200 shadow-sm group-hover:border-[#006838] transition" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center text-white font-bold text-xs gap-1.5">
                          <Eye className="w-4 h-4" /> Open Image
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity History Timeline */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" /> Activity History Timeline
                </h4>
                {historyModal.history && historyModal.history.length > 0 ? (
                  <div className="relative border-l-2 border-emerald-200 ml-2 space-y-4">
                    {historyModal.history.map((h, i) => (
                      <div key={i} className="relative pl-5">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#006838] border-4 border-white shadow-sm" />
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-800 text-xs">{h.action}</span>
                            <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                              {new Date(h.timestamp || h.date).toLocaleString('en-GB', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: true
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">{h.notes}</p>
                          {h.user && (
                            <div className="mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                              By {h.user}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No timeline entries yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Transfer Assign Person Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-emerald-100 space-y-5 animate-scale-up">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Complaint Assignment</div>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">{assignModal.title}</h3>
              </div>
              <button
                onClick={() => { setAssignModal(null); setSelectedAssignee(''); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Assign Person to handle complaint <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006838] focus:bg-white focus:outline-none transition shadow-sm cursor-pointer"
              >
                <option value="">-- Select Assigned Staff Member --</option>
                {staffList.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.role || emp.department || 'Staff'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 italic mt-1">
                Only the assigned person (and Superadmin) will see this complaint in their dashboard queue.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => { setAssignModal(null); setSelectedAssignee(''); }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedAssignee) {
                    alert('Please select an assigned staff member before proceeding!');
                    return;
                  }
                  const assigneeId = selectedAssignee;
                  const modalData = assignModal;
                  setAssignModal(null);
                  setSelectedAssignee('');
                  await modalData.onConfirm(assigneeId);
                }}
                disabled={!selectedAssignee}
                className="px-5 py-2 bg-[#006838] hover:bg-[#00512c] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Assign & Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComplaintsFlow;
