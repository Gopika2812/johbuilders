import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Building, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  Clock,
  Loader2,
  Send,
  Plus,
  Search,
  Download,
  X,
  FileText
} from 'lucide-react';

const ExtraWorks = () => {
  const { token, user, hasPermission, isAdmin } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFlow, setExpandedFlow] = useState(null);
  const [rates, setRates] = useState({});
  const [submitting, setSubmitting] = useState(null); // id of work being submitted
  const [activeTab, setActiveTab] = useState('');
  const [selectedWorks, setSelectedWorks] = useState([]); // crd, ped, client, accounts, work-orders
  const [extraWorkDetailsModal, setExtraWorkDetailsModal] = useState(null);
  const [expandedReqIds, setExpandedReqIds] = useState({});

  const tabs = [
    { id: 'crd', label: 'CRD Team', permissionId: 'extra_works_crd' },
    { id: 'ped', label: 'PED Team', permissionId: 'extra_works_ped' },
    { id: 'client', label: 'Client Approved', permissionId: 'extra_works_client' },
    { id: 'accounts', label: 'Accounts Team', permissionId: 'extra_works_accounts' },
    { id: 'work-orders', label: 'Work Orders', permissionId: 'extra_works_work_orders' }
  ];

  const allowedTabs = tabs.filter(tab => isAdmin || hasPermission(tab.permissionId));

  const canEditTab = (tabId) => {
    if (isAdmin) return true;
    if (!user || !user.permissions) return false;
    const tabPermissionMap = {
      'crd': 'extra_works_crd',
      'ped': 'extra_works_ped',
      'client': 'extra_works_client',
      'accounts': 'extra_works_accounts',
      'work-orders': 'extra_works_work_orders'
    };
    const permId = tabPermissionMap[tabId];
    if (!permId) return false;
    const perm = user.permissions.find(p => p.pageId === permId);
    return perm ? perm.canEdit : false;
  };

  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.find(t => t.id === activeTab)) {
      setActiveTab(allowedTabs[0].id);
    }
  }, [user, activeTab]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Add Extra Work Modal Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingGroupWork, setAddingGroupWork] = useState(null);
  const [isAddingWork, setIsAddingWork] = useState(false);
  const [addedWorks, setAddedWorks] = useState([]);
  const [addForm, setAddForm] = useState({
    stageId: '',
    name: '',
    category: 'General',
    unit: 'Unit',
    quantity: 1,
    rate: 0,
    forUnit: ''
  });

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

    const toggleWorkSelection = (workId) => {
    setSelectedWorks(prev => 
      prev.includes(workId) ? prev.filter(id => id !== workId) : [...prev, workId]
    );
  };

  const toggleSelectAll = (flow, activeTab) => {
    const selectableWorks = [];
    flow.stages.forEach(s => {
      s.extraWorks?.forEach(w => {
        if (activeTab === 'crd' && w.status === 'Pending') selectableWorks.push(w._id);
        if (activeTab === 'ped' && w.status === 'PED Approved') selectableWorks.push(w._id);
        if (activeTab === 'accounts' && w.status === 'Client Approved') selectableWorks.push(w._id);
      });
    });
    
    const allSelected = selectableWorks.length > 0 && selectableWorks.every(id => selectedWorks.includes(id));
    
    if (allSelected) {
      setSelectedWorks(prev => prev.filter(id => !selectableWorks.includes(id)));
    } else {
      setSelectedWorks(prev => [...new Set([...prev, ...selectableWorks])]);
    }
  };

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

  const handleSaveAndSendToClient = async (flowId, stageIdx, workId) => {
    try {
      setSubmitting(workId);
      const rate = Number(rates[workId] || 0);
      
      // 1. Save the price
      let res = await fetch(`${API_URL}/extra-works/${flowId}/${stageIdx}/${workId}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rate })
      });
      if (!res.ok) throw new Error('Failed to save price');

      // 2. Send to customer
      res = await fetch(`${API_URL}/extra-works/${flowId}/${stageIdx}/${workId}/send`, {
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

  const handleSendToPED = async (flowId, stageIdx, workId) => {
    try {
      setSubmitting(workId);
      const res = await fetch(`${API_URL}/extra-works/${flowId}/${stageIdx}/${workId}/send-to-ped`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to send to PED team');
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

  const handleAddToList = () => {
    if (!addForm.name.trim()) {
      alert("Please select a sub category!");
      return;
    }
    setAddedWorks(prev => [...prev, addForm]);
    setAddForm({
      ...addForm,
      name: '',
      category: '',
      unit: 'Unit',
      quantity: 1,
      rate: 0
    });
  };

  const handleAddExtraWork = async (flow, ewId = null) => {
    const stageId = flow.stages?.[0]?._id;
    if (!stageId) {
      alert("No stages found in this project to add work to!");
      return;
    }
    
    // If they filled the form but forgot to click Add to List
    let worksToSubmit = [...addedWorks];
    if (addForm.name.trim()) {
      worksToSubmit.push(addForm);
    }
    
    if (worksToSubmit.length === 0) {
      alert("Please add at least one extra work!");
      return;
    }

    try {
      setIsAddingWork(true);
      const res = await fetch(`${API_URL}/extra-works/${flow._id}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ works: worksToSubmit, stageId, ewId: ewId || addForm.ewId, forUnit: addForm.forUnit })
      });
      if (!res.ok) throw new Error('Failed to add extra works');
      
      setAddForm({
        stageId: '',
        name: '',
        category: '',
        unit: 'Unit',
        quantity: 1,
        rate: 0,
        forUnit: ''
      });
      setAddedWorks([]);
      setShowAddForm(false);
      setAddingGroupWork(null);
      await fetchFlows();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAddingWork(false);
    }
  };

  const handleCancelExtraWork = async (flowId, stageIdx, workId) => {
    try {
      setSubmitting(workId);
      const res = await fetch(`${API_URL}/extra-works/${flowId}/${stageIdx}/${workId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to cancel extra work');
      await fetchFlows();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">Pending (CRD)</span>;
      case 'Sent to PED': return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-bold">Sent to PED</span>;
      case 'PED Approved': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">Priced (Ready to Send)</span>;
      case 'Sent to Customer': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">Sent to Customer</span>;
      case 'Client Approved': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-bold">Client Approved</span>;
      case 'Sent to Accounts': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">Sent to Accounts</span>;
      case 'Added to CRD': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">Added to CRD</span>;
      case 'Execution Sent to PED': return <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-bold">Execution Sent to PED</span>;
      case 'Start Work': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">Start Work</span>;
      case 'In Progress': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-bold">In Progress</span>;
      case 'Completed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">Completed</span>;
      case 'Removed by Client': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">Removed by Client</span>;
      case 'Cancelled by Admin': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">Cancelled by Admin</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">{status}</span>;
    }
  };

  // Filter flows based on active tab requirements
  const getTabStatuses = () => {
    switch(activeTab) {
      case 'crd': return ['Pending', 'Sent to PED', 'PED Approved', 'Sent to Customer', 'Client Approved', 'Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed', 'Rejected', 'Removed by Client'];
      case 'ped': return ['Sent to PED', 'PED Approved', 'Sent to Customer', 'Client Approved', 'Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed', 'Rejected', 'Removed by Client'];
      case 'client': return ['Sent to Customer', 'Client Approved', 'Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed', 'Rejected', 'Removed by Client'];
      case 'accounts': return ['Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed'];
      case 'work-orders': return ['Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed'];
      default: return [];
    }
  };

  const filteredFlows = flows.filter(flow => {
    // 1. Must have at least one extra work in the valid statuses for the active tab
    const validStatuses = getTabStatuses();
    const hasValidWork = flow.stages.some(stage => 
      stage.extraWorks && stage.extraWorks.some(work => validStatuses.includes(work.status))
    );
    if (!hasValidWork) return false;

    let matchesSearch = true;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      matchesSearch = 
        (flow.lead?.name || '').toLowerCase().includes(search) ||
        (flow.lead?.phone || '').toLowerCase().includes(search) ||
        (flow.project?.name || '').toLowerCase().includes(search) ||
        (flow.unitId || '').toLowerCase().includes(search);
    }

    let matchesDate = true;
    if (startDate && endDate) {
      const flowDate = new Date(flow.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = flowDate >= start && flowDate <= end;
    }

    return matchesSearch && matchesDate;
  });

  const exportToExcel = async () => {
    try {
      setExporting(true);
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Extra Works Report');

      // Add Header with Logo
      let logoId = null;
      try {
        const logoRes = await fetch('/jb_logo.jpg');
        const logoBlob = await logoRes.blob();
        
        // Convert blob to base64 and strip the data URI prefix
        const base64data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(logoBlob);
          reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          };
        });
        
        logoId = workbook.addImage({
          base64: base64data,
          extension: 'jpeg',
        });
      } catch (err) {
        console.error("Could not load logo", err);
      }

      if (logoId) {
        sheet.addImage(logoId, {
          tl: { col: 0, row: 0 },
          br: { col: 3, row: 4 },
          editAs: 'oneCell'
        });
      }

      // Style Header Title
      sheet.mergeCells('D1:H4');
      const titleCell = sheet.getCell('D1');
      titleCell.value = 'JOHN BUILDWELL - EXTRA WORKS REPORT';
      titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006838' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.addRow([]);

      // Headers
      const headers = ['Date', 'Customer Name', 'Phone', 'CRD Person', 'Project', 'Units', 'Quotation Value', 'Extra Works', 'Final Value'];
      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006838' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: {style:'thin', color: {argb:'FFFFFFFF'}},
          left: {style:'thin', color: {argb:'FFFFFFFF'}},
          bottom: {style:'thin', color: {argb:'FFFFFFFF'}},
          right: {style:'thin', color: {argb:'FFFFFFFF'}}
        };
      });

      // Columns width
      sheet.columns = [
        { width: 15 }, // Date
        { width: 25 }, // Customer
        { width: 20 }, // Phone
        { width: 25 }, // CRD Person
        { width: 20 }, // Project
        { width: 15 }, // Units
        { width: 20 }, // Quotation
        { width: 20 }, // Extra Works
        { width: 20 }, // Final Value
      ];

      // Data
      filteredFlows.forEach(flow => {
        const row = sheet.addRow([
          new Date(flow.createdAt).toLocaleDateString(),
          flow.lead?.name || '',
          (flow.lead?.phone || '').toString(),
          flow.crdPersonName || 'Unassigned',
          flow.project?.name || '',
          flow.unitId || '',
          flow.totalOriginalValue || 0,
          flow.totalExtraWorksValue || 0,
          flow.totalCurrentValue || 0
        ]);
        
        row.getCell(3).numFmt = '@'; // Force phone as text
        row.getCell(7).numFmt = '₹#,##0.00';
        row.getCell(8).numFmt = '₹#,##0.00';
        row.getCell(9).numFmt = '₹#,##0.00';
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'Extra_Works_Report.xlsx');
      
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to export Excel file.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!loading && allowedTabs.length === 0) {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. You do not have permission to view any of the Extra Works tabs.</div>;
  }

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Extra Works Management</h1>
        
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-1.5 rounded-2xl flex flex-wrap gap-2 shadow-sm">
        {allowedTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedWorks([]); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#006838] text-white shadow-md'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search all columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/50 border border-emerald-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-white/50 border border-emerald-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-400 font-medium">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-white/50 border border-emerald-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          
          <button
            onClick={() => setShowExportModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Export Preview Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#006838] text-white rounded-t-[2rem]">
              <h2 className="text-xl font-bold flex items-center gap-2"><Download className="w-5 h-5" /> Export Preview</h2>
              <button onClick={() => setShowExportModal(false)} className="text-white/80 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-[#006838] p-4 flex items-center gap-4 text-white">
                  <img src="/jb_logo.jpg" alt="Logo" className="h-14 rounded-xl bg-white p-1 shadow-sm" />
                  <div>
                    <h3 className="text-lg font-black tracking-wider uppercase">JOHN BUILDWELL</h3>
                    <p className="text-sm font-semibold text-emerald-100">EXTRA WORKS REPORT {startDate && endDate ? `(${startDate} to ${endDate})` : ''}</p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-emerald-50 text-emerald-900 sticky top-0 shadow-sm border-b border-emerald-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Customer Name</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">CRD Person</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Project</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider">Units</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-right">Quotation</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-right">Extra Works</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-right">Final Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {filteredFlows.map(flow => (
                        <tr key={flow._id} className="hover:bg-emerald-50/50">
                          <td className="px-4 py-3 text-gray-600">{new Date(flow.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{flow.lead?.name}</td>
                          <td className="px-4 py-3 text-gray-600">{flow.lead?.phone}</td>
                          <td className="px-4 py-3 font-medium text-emerald-700">{flow.crdPersonName || 'Unassigned'}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{flow.project?.name}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{flow.unitId}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{flow.totalOriginalValue?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-amber-600">₹{flow.totalExtraWorksValue?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-black text-emerald-600">₹{flow.totalCurrentValue?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white rounded-b-[2rem] flex justify-end gap-3">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={exportToExcel}
                disabled={exporting}
                className="px-8 py-2.5 bg-[#006838] text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#00522c] transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Download Excel Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#006838] text-white">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">S.No</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">CRD Person</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Project</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Units</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Quotation Value</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Extra Works</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Final Value</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {filteredFlows.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-gray-500 font-medium">No extra works requests found.</td>
                </tr>
              ) : filteredFlows.map((flow, idx) => {
                const isExpanded = expandedFlow === flow._id;
                
                return (
                  <React.Fragment key={flow._id}>
                    <tr 
                      className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedFlow(isExpanded ? null : flow._id)}
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">{idx + 1}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(flow.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-emerald-900">{flow.lead?.name}</td>
                      <td className="px-6 py-4 text-gray-600">{flow.lead?.phone}</td>
                      <td className="px-6 py-4 font-medium text-emerald-700">{flow.crdPersonName || 'Unassigned'}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{flow.project?.name}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">{flow.unitId}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">Rs. {flow.totalOriginalValue?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-amber-600">Rs. {flow.totalExtraWorksValue?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">Rs. {flow.totalCurrentValue?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-bold hover:underline">
                        {isExpanded ? 'Close Details' : 'View Details'}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="11" className="p-0 border-b border-emerald-100 bg-emerald-50/20 shadow-inner">
                          <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-gray-800 text-lg">Extra Works Timeline</h3>
                              {(isAdmin || canEditTab('crd')) && (
                                <button 
                                  onClick={() => {
                                    setShowAddForm(!showAddForm);
                                    setAddedWorks([]);
                                    setAddForm({ stageId: '', name: '', category: '', unit: 'Unit', quantity: 1, rate: 0, forUnit: '' });
                                  }} 
                                  className="flex items-center gap-2 px-4 py-2 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00512c] transition-colors shadow-sm text-sm"
                                >
                                  <Plus className="w-4 h-4" /> Add Extra Work
                                </button>
                              )}
                            </div>

                            {showAddForm && (
                              <div className="mb-6 bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm animate-fade-in-up">
                                <h3 className="text-sm font-black text-emerald-900 mb-4 uppercase tracking-wider">Add New Extra Work</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                  {(() => {
                                    const catalog = flow.project?.extraWorkCatalog || [];
                                    const catalogCategories = Array.from(new Set(catalog.map(item => item.category)));
                                    const subCategories = addForm.category ? catalog.filter(item => item.category === addForm.category) : [];

                                    return (
                                      <>
                                        <div className="lg:col-span-1">
                                          <label className="block text-xs font-bold text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                                          <select
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                            value={addForm.category}
                                            onChange={e => setAddForm({...addForm, category: e.target.value, name: '', unit: 'Unit'})}
                                          >
                                            <option value="">Select Category...</option>
                                            {catalogCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                          </select>
                                        </div>
                                        <div className="lg:col-span-2">
                                          <label className="block text-xs font-bold text-gray-700 mb-1">Sub Category (Name) <span className="text-red-500">*</span></label>
                                          <select
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                            value={addForm.name}
                                            onChange={e => {
                                              const selectedItem = subCategories.find(item => item.name === e.target.value);
                                              setAddForm({...addForm, name: e.target.value, unit: selectedItem ? selectedItem.unit : 'Unit', rate: selectedItem ? selectedItem.rate : 0});
                                            }}
                                            disabled={!addForm.category}
                                          >
                                            <option value="">Select Sub Category...</option>
                                            {subCategories.map(sub => <option key={sub._id || sub.name} value={sub.name}>{sub.name}</option>)}
                                          </select>
                                        </div>
                                        {flow.unitId && flow.unitId.includes(',') && (
                                          <div className="lg:col-span-1">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Select Unit</label>
                                            <select 
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                              value={addForm.forUnit || flow.unitId.split(',')[0].trim()}
                                              onChange={e => setAddForm({...addForm, forUnit: e.target.value})}
                                            >
                                              {flow.unitId.split(',').map(u => <option key={u.trim()} value={u.trim()}>{u.trim()}</option>)}
                                            </select>
                                          </div>
                                        )}
                                        <div className="lg:col-span-1 flex gap-2">
                                          <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Qty <span className="text-red-500">*</span></label>
                                            <input 
                                              type="number" min="1"
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                              value={addForm.quantity}
                                              onChange={e => setAddForm({...addForm, quantity: e.target.value})}
                                            />
                                          </div>
                                          <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Unit</label>
                                            <input 
                                              type="text" placeholder="No" disabled
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 cursor-not-allowed focus:outline-none"
                                              value={addForm.unit}
                                            />
                                          </div>
                                        </div>
                                      </>
                                    );
                                  })()}
                                  {addedWorks.length > 0 && (
                                    <div className="mt-4 mb-4 lg:col-span-5">
                                      <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Works to be added ({addedWorks.length})</h4>
                                      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Category</th>
                                              <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Sub Category</th>
                                              <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">Qty</th>
                                              <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Rate</th>
                                              <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Amount</th>
                                              <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">Action</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200 bg-white">
                                            {addedWorks.map((w, idx) => (
                                              <tr key={idx}>
                                                <td className="px-3 py-2 text-xs font-medium text-gray-900">{w.category}</td>
                                                <td className="px-3 py-2 text-xs text-gray-500">{w.name}</td>
                                                <td className="px-3 py-2 text-xs text-center text-gray-500">{w.quantity} {w.unit}</td>
                                                <td className="px-3 py-2 text-xs text-right text-gray-500">Rs. {w.rate?.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-xs text-right font-bold text-[#006838]">Rs. {(w.quantity * w.rate)?.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-center">
                                                  <button onClick={() => setAddedWorks(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                                                    <X className="w-4 h-4 mx-auto" />
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                  <button
                                    onClick={handleAddToList}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
                                  >
                                    <Plus className="w-4 h-4" /> Add to List
                                  </button>
                                  <button 
                                    onClick={() => handleAddExtraWork(flow)}
                                    disabled={isAddingWork || (addedWorks.length === 0 && !addForm.name.trim())}
                                    className="px-5 py-2.5 bg-[#006838] hover:bg-[#00522a] text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                  >
                                    {isAddingWork ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Save Extra Work
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                              <table className="w-full text-left">
                                <thead className="bg-[#006838] text-white">
                                  <tr>
                                    <th className="p-4 w-12 text-center">
                                      {(activeTab === 'crd' || activeTab === 'ped' || activeTab === 'accounts') && (isAdmin || canEditTab(activeTab)) && (
                                        <input 
                                          type="checkbox"
                                          className="w-4 h-4 rounded border-gray-300 text-[#006838] focus:ring-[#006838]"
                                          onChange={() => {
                                            const selectableWorks = [];
                                            flow.stages.forEach(s => {
                                              s.extraWorks?.forEach(w => {
                                                if (activeTab === 'crd' && (w.status === 'Pending' || w.status === 'Returned to CRD' || w.status === 'Client Approved' || w.status === 'Added to CRD')) selectableWorks.push(w._id);
                                                if (activeTab === 'ped' && w.status === 'PED Approved') selectableWorks.push(w._id);
                                                if (activeTab === 'accounts' && w.status === 'Sent to Accounts') selectableWorks.push(w._id);
                                              });
                                            });
                                            const allSelected = selectableWorks.length > 0 && selectableWorks.every(id => selectedWorks.includes(id));
                                            if (allSelected) {
                                              setSelectedWorks(prev => prev.filter(id => !selectableWorks.includes(id)));
                                            } else {
                                              setSelectedWorks(prev => [...new Set([...prev, ...selectableWorks])]);
                                            }
                                          }}
                                          checked={(() => {
                                            let selectable = 0;
                                            let selected = 0;
                                            flow.stages.forEach(s => s.extraWorks?.forEach(w => {
                                              if ((activeTab === 'crd' && (w.status === 'Pending' || w.status === 'Client Approved' || w.status === 'Added to CRD')) ||
                                                  (activeTab === 'ped' && w.status === 'PED Approved') ||
                                                  (activeTab === 'accounts' && w.status === 'Sent to Accounts')) {
                                                selectable++;
                                                if (selectedWorks.includes(w._id)) selected++;
                                              }
                                            }));
                                            return selectable > 0 && selected === selectable;
                                          })()}
                                        />
                                      )}
                                    </th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider">Req ID</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Requested on</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Sent to PED Date on</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-right">Estimated Value</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Estimated Date on</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Customer Approval on </th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Sent to Account Team on </th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Work Order Issued on</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
                                  {(() => {
                                    const filteredFlowWorks = [];
                                    flow.stages.forEach((stage, sIdx) => {
                                      if (stage.extraWorks && stage.extraWorks.length > 0) {
                                        stage.extraWorks.forEach(work => {
                                          const isValid = (() => {
                                            if (activeTab === 'crd') return true; // all
                                            if (activeTab === 'ped') return ['Sent to PED', 'PED Approved', 'Returned to CRD', 'Sent to Customer', 'Client Approved', 'Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed', 'Rejected', 'Removed by Client'].includes(work.status);
                                            if (activeTab === 'client') return ['Sent to Customer', 'Client Approved', 'Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed', 'Rejected', 'Removed by Client'].includes(work.status);
                                            if (activeTab === 'accounts') return ['Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed'].includes(work.status);
                                            if (activeTab === 'work-orders') return ['Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed'].includes(work.status);
                                            return false;
                                          })();
                                          if (isValid) {
                                            filteredFlowWorks.push({ ...work, stageIdx: sIdx, originalWork: work });
                                          }
                                        });
                                      }
                                    });

                                    const groupedFlowWorks = Object.values(filteredFlowWorks.reduce((acc, work) => {
                                      const id = work.ewId || `NO_ID_${work._id}`;
                                      if (!acc[id]) {
                                        acc[id] = {
                                          ewId: id,
                                          displayId: work.ewId,
                                          items: [],
                                          totalAmount: 0,
                                          pricingDate: work.pricingDate,
                                          sentToPedDate: work.sentToPedDate,
                                          customerApprovalDate: work.customerApprovalDate,
                                          sentToAccountsDate: work.sentToAccountsDate,
                                          crdAddedDate: work.crdAddedDate,
                                          addedAt: work.addedAt
                                        };
                                      }
                                      acc[id].items.push(work);
                                      acc[id].totalAmount += (work.amount || 0);
                                      return acc;
                                    }, {}));

                                    return groupedFlowWorks.map((group, gIdx) => (
                                      <React.Fragment key={group.ewId || gIdx}>
                                        <tr 
                                          className="hover:bg-emerald-50/30 transition-colors cursor-pointer bg-white"
                                          onClick={() => setExpandedReqIds(prev => ({ ...prev, [group.ewId]: !prev[group.ewId] }))}
                                        >
                                          <td className="p-4 align-middle text-center flex items-center justify-center gap-2">
                                            {(() => {
                                              if (['crd', 'ped', 'accounts'].includes(activeTab) && (isAdmin || canEditTab(activeTab))) {
                                                const selectableWorksInGroup = group.items.filter(work => {
                                                  if (activeTab === 'crd' && (work.status === 'Pending' || work.status === 'Client Approved' || work.status === 'Added to CRD')) return true;
                                                  if (activeTab === 'ped' && work.status === 'PED Approved') return true;
                                                  if (activeTab === 'accounts' && work.status === 'Sent to Accounts') return true;
                                                  return false;
                                                });
                                                if (selectableWorksInGroup.length > 0) {
                                                  const isAllSelected = selectableWorksInGroup.every(w => selectedWorks.includes(w._id));
                                                  return (
                                                    <input 
                                                      type="checkbox"
                                                      className="w-4 h-4 rounded border-gray-300 text-[#006838] focus:ring-[#006838]"
                                                      checked={isAllSelected}
                                                      onClick={(e) => e.stopPropagation()}
                                                      onChange={(e) => {
                                                        e.stopPropagation();
                                                        if (isAllSelected) {
                                                          setSelectedWorks(prev => prev.filter(id => !selectableWorksInGroup.find(w => w._id === id)));
                                                        } else {
                                                          const idsToAdd = selectableWorksInGroup.map(w => w._id);
                                                          setSelectedWorks(prev => [...new Set([...prev, ...idsToAdd])]);
                                                        }
                                                      }}
                                                    />
                                                  );
                                                }
                                              }
                                              return null;
                                            })()}
                                            {expandedReqIds[group.ewId] ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                          </td>
                                          <td className="p-4 align-middle">
                                            <span className="font-mono text-[#006838] font-bold">
                                              {group.displayId || '-'}
                                            </span>
                                          </td>
                                          <td className="p-4 align-middle text-center text-sm text-gray-600">
                                            {group.addedAt ? new Date(group.addedAt).toLocaleDateString('en-GB') : '-'}
                                          </td>
                                          <td className="p-4 align-middle text-center text-sm text-gray-600">
                                            {group.sentToPedDate ? new Date(group.sentToPedDate).toLocaleDateString('en-GB') : '-'}
                                          </td>
                                          <td className="p-4 align-middle text-right font-bold text-black-800">
                                            Rs. {(group.totalAmount || 0).toLocaleString()}
                                          </td>
                                          <td className="p-4 align-middle text-center text-sm text-gray-600">
                                            {group.pricingDate ? new Date(group.pricingDate).toLocaleDateString('en-GB') : '-'}
                                          </td>
                                          <td className="p-4 align-middle text-center text-sm text-emerald-700 font-medium">
                                            {group.customerApprovalDate ? new Date(group.customerApprovalDate).toLocaleDateString('en-GB') : '-'}
                                          </td>
                                          <td className="p-4 align-middle text-center text-sm text-blue-700 font-medium">
                                            {group.sentToAccountsDate ? new Date(group.sentToAccountsDate).toLocaleDateString('en-GB') : '-'}
                                          </td>
                                          <td className="p-4 align-middle text-center text-sm text-purple-700 font-medium">
                                            {group.crdAddedDate ? new Date(group.crdAddedDate).toLocaleDateString('en-GB') : '-'}
                                          </td>
                                        </tr>
                                        {expandedReqIds[group.ewId] && group.items.map((work, wIdx) => (
                                          <tr key={work._id} className="bg-gray-50/50 hover:bg-white transition border-l-4 border-[#006838]">
                                            <td className="p-4 align-middle text-center flex items-center justify-center gap-2">
                                              {((activeTab === 'crd' && (work.status === 'Pending' || work.status === 'Returned to CRD' || work.status === 'Client Approved' || work.status === 'Added to CRD')) ||
                                                (activeTab === 'ped' && work.status === 'PED Approved') ||
                                                (activeTab === 'accounts' && work.status === 'Sent to Accounts')) && (isAdmin || canEditTab(activeTab)) && (
                                                <input 
                                                  type="checkbox"
                                                  className="w-4 h-4 rounded border-gray-300 text-[#006838] focus:ring-[#006838]"
                                                  checked={selectedWorks.includes(work._id)}
                                                  onChange={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedWorks(prev => prev.includes(work._id) ? prev.filter(id => id !== work._id) : [...prev, work._id]);
                                                  }}
                                                />
                                              )}
                                              <span className="text-xs text-gray-400 font-bold">{gIdx + 1}.{wIdx + 1}</span>
                                            </td>
                                            <td className="p-4 align-middle">
                                              <div className="font-bold text-gray-700 flex flex-col gap-1 text-xs whitespace-normal max-w-[200px]">
                                                <span>↳ {work.name || '-'}</span>
                                                <span className="text-[10px] text-gray-500 font-normal">Qty: {work.quantity || 1} {work.unit ? `x ${work.unit}` : ''} @ Rs. {work.rate || 0}</span>
                                                {work.clientNotes && (
                                                  <span className="text-[10px] text-blue-600 bg-blue-50 p-1.5 rounded mt-1 border border-blue-100 inline-block w-full">
                                                    <strong className="block mb-0.5 text-[9px] uppercase tracking-wider text-blue-400">Client Review Note:</strong> 
                                                    {work.clientNotes}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="p-4 align-middle text-center text-[11px] text-gray-500">
                                              {work.addedAt ? new Date(work.addedAt).toLocaleDateString('en-GB') : '-'}
                                            </td>
                                            <td className="p-4 align-middle text-center text-[11px] text-gray-500">
                                              {work.sentToPedDate ? new Date(work.sentToPedDate).toLocaleDateString('en-GB') : '-'}
                                            </td>
                                            <td className="p-4 align-middle text-right font-bold text-[#006838]">
                                              Rs. {(work.amount || 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 align-middle text-center text-[11px] text-gray-500">
                                              {work.pricingDate ? new Date(work.pricingDate).toLocaleDateString('en-GB') : '-'}
                                            </td>
                                            <td className="p-4 align-middle text-center text-[11px] text-emerald-600 font-medium">
                                              {work.customerApprovalDate ? new Date(work.customerApprovalDate).toLocaleDateString('en-GB') : '-'}
                                            </td>
                                            <td className="p-4 align-middle text-center text-[11px] text-blue-600 font-medium">
                                              {work.sentToAccountsDate ? new Date(work.sentToAccountsDate).toLocaleDateString('en-GB') : '-'}
                                            </td>
                                            <td className="p-4 align-middle">
                                          <div className="flex flex-col items-center justify-center gap-2">
                                                <span className="text-[11px] text-purple-700 font-medium">
                                                  {work.crdAddedDate ? new Date(work.crdAddedDate).toLocaleDateString('en-GB') : '-'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  {activeTab === 'ped' && ['Sent to PED', 'PED Approved', 'Sent to Customer', 'Client Approved', 'Sent to Accounts'].includes(work.status) && (
                                                      <input
                                                        type="number"
                                                        disabled={!(isAdmin || canEditTab('ped'))}
                                                        value={rates[work._id] ?? work.rate ?? ''}
                                                        onChange={(e) => handleRateChange(work._id, e.target.value)}
                                                        onBlur={(e) => {
                                                          if (rates[work._id] !== undefined && Number(rates[work._id]) !== Number(work.rate)) {
                                                            handleSavePrice(flow._id, work.stageIdx, work._id);
                                                          }
                                                        }}
                                                        className="w-20 px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#006838] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        placeholder="Rate"
                                                        onClick={(e) => e.stopPropagation()}
                                                      />
                                                  )}
                                                  {activeTab === 'ped' && ['Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress'].includes(work.status) && (
                                                      <select
                                                        value={work.status}
                                                        disabled={!(isAdmin || canEditTab('ped'))}
                                                        onChange={async (e) => {
                                                          try {
                                                            await fetch(`${API_URL}/extra-works/${flow._id}/${work.stageIdx}/${work._id}/update-status`, {
                                                              method: 'PUT',
                                                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                              body: JSON.stringify({ status: e.target.value })
                                                            });
                                                            await fetchFlows();
                                                          } catch (err) {
                                                            alert(err.message);
                                                          }
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-[#006838] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                      >
                                                        <option value="Added to CRD" disabled>Ready for Execution</option>
                                                        <option value="Execution Sent to PED" disabled>Execution Sent to PED</option>
                                                        <option value="Start Work">Start Work</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                      </select>
                                                  )}
                                                  {(user?.role === 'Admin' || user?.role === 'Manager') && !['Removed by Client', 'Rejected', 'Completed', 'Cancelled by Admin', 'Added to CRD'].includes(work.status) && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        if(window.confirm('Are you sure you want to cancel this extra work request?')) {
                                                          handleCancelExtraWork(flow._id, work.stageIdx, work._id);
                                                        }
                                                      }}
                                                      disabled={submitting === work._id}
                                                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[10px] font-bold"
                                                    >
                                                      Cancel
                                                    </button>
                                                  )}
                                                  {(() => {
                                                    if (work.status === 'Removed by Client') {
                                                      return <span className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1"><X className="w-3 h-3" /> Removed by Client</span>;
                                                    }
                                                    if (work.status === 'Cancelled by Admin') {
                                                      return <span className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1"><X className="w-3 h-3" /> Cancelled by Admin</span>;
                                                    }
                                                    if (work.status === 'Rejected') {
                                                      return <span className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1"><X className="w-3 h-3" /> Rejected</span>;
                                                    }
                                                    if (work.status === 'Completed') {
                                                      return <span className="text-[9px] font-bold text-green-500 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
                                                    }
                                                    if (activeTab === 'crd') {
                                                      if (['Sent to PED', 'PED Approved'].includes(work.status)) {
                                                        return <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Sent to PED Team</span>;
                                                      }
                                                      if (['Returned to CRD'].includes(work.status)) {
                                                        return <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Returned by PED (Priced)</span>;
                                                      }
                                                      if (['Sent to Customer'].includes(work.status)) {
                                                        return <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Sent to Client</span>;
                                                      }
                                                      if (['Sent to Accounts'].includes(work.status)) {
                                                        return <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Sent to Accounts</span>;
                                                      }
                                                      if (work.status === 'Added to CRD') {
                                                        return <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Work Order Created</span>;
                                                      }
                                                      if (['Execution Sent to PED', 'Start Work', 'In Progress'].includes(work.status)) {
                                                        return <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-teal-500" /> PED Executing</span>;
                                                      }
                                                    }
                                                    if (activeTab === 'ped') {
                                                      if (['Returned to CRD', 'Sent to Customer', 'Client Approved', 'Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed'].includes(work.status)) {
                                                        return <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Returned to CRD</span>;
                                                      }
                                                    }
                                                    if (activeTab === 'client') {
                                                      if (['Client Approved', 'Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress'].includes(work.status)) {
                                                        return <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Client Approved</span>;
                                                      }
                                                    }
                                                    if (activeTab === 'accounts') {
                                                      if (['Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress'].includes(work.status)) {
                                                        return <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Work Order Created</span>;
                                                      }
                                                    }
                                                    return null;
                                                  })()}
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                        {expandedReqIds[group.ewId] && (
                                          <tr className="bg-gray-50 border-l-4 border-[#006838]">
                                            <td colSpan="9" className="p-4">
                                              {addingGroupWork === group.ewId ? (
                                                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm animate-fade-in-up">
                                                  <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Add Extra Work to {group.displayId}</h4>
                                                    <button onClick={() => setAddingGroupWork(null)} className="text-gray-400 hover:text-gray-600">
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                                    {(() => {
                                                      const catalog = flow.project?.extraWorkCatalog || [];
                                                      const catalogCategories = Array.from(new Set(catalog.map(item => item.category)));
                                                      const subCategories = addForm.category ? catalog.filter(item => item.category === addForm.category) : [];

                                                      return (
                                                        <>
                                                          <div className="lg:col-span-1">
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                                                            <select
                                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                                              value={addForm.category}
                                                              onChange={e => setAddForm({...addForm, category: e.target.value, name: '', unit: 'Unit'})}
                                                            >
                                                              <option value="">Select Category...</option>
                                                              {catalogCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                            </select>
                                                          </div>
                                                          <div className="lg:col-span-2">
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">Sub Category (Name) <span className="text-red-500">*</span></label>
                                                            <select
                                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                                              value={addForm.name}
                                                              onChange={e => {
                                                                const selectedItem = subCategories.find(item => item.name === e.target.value);
                                                                setAddForm({...addForm, name: e.target.value, unit: selectedItem ? selectedItem.unit : 'Unit', rate: selectedItem ? selectedItem.rate : 0});
                                                              }}
                                                              disabled={!addForm.category}
                                                            >
                                                              <option value="">Select Sub Category...</option>
                                                              {subCategories.map(sub => <option key={sub._id || sub.name} value={sub.name}>{sub.name}</option>)}
                                                            </select>
                                                          </div>
                                                          {flow.unitId && flow.unitId.includes(',') && (
                                                            <div className="lg:col-span-1">
                                                              <label className="block text-xs font-bold text-gray-700 mb-1">Select Unit</label>
                                                              <select 
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                                                value={addForm.forUnit || flow.unitId.split(',')[0].trim()}
                                                                onChange={e => setAddForm({...addForm, forUnit: e.target.value})}
                                                              >
                                                                {flow.unitId.split(',').map(u => <option key={u.trim()} value={u.trim()}>{u.trim()}</option>)}
                                                              </select>
                                                            </div>
                                                          )}
                                                          <div className="lg:col-span-1 flex gap-2">
                                                            <div className="flex-1">
                                                              <label className="block text-xs font-bold text-gray-700 mb-1">Qty <span className="text-red-500">*</span></label>
                                                              <input 
                                                                type="number" min="1"
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                                                value={addForm.quantity}
                                                                onChange={e => setAddForm({...addForm, quantity: e.target.value})}
                                                              />
                                                            </div>
                                                            <div className="flex-1">
                                                              <label className="block text-xs font-bold text-gray-700 mb-1">Unit</label>
                                                              <input 
                                                                type="text" placeholder="No" disabled
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 cursor-not-allowed focus:outline-none"
                                                                value={addForm.unit}
                                                              />
                                                            </div>
                                                          </div>
                                                        </>
                                                      );
                                                    })()}
                                                  {addedWorks.length > 0 && (
                                                    <div className="mt-4 mb-4 lg:col-span-5">
                                                      <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Works to be added ({addedWorks.length})</h4>
                                                      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                          <thead className="bg-gray-100">
                                                            <tr>
                                                              <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Sub Category</th>
                                                              <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">Qty</th>
                                                              <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Amount</th>
                                                              <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">Action</th>
                                                            </tr>
                                                          </thead>
                                                          <tbody className="divide-y divide-gray-200 bg-white">
                                                            {addedWorks.map((w, idx) => (
                                                              <tr key={idx}>
                                                                <td className="px-3 py-2 text-[11px] text-gray-700">{w.name}</td>
                                                                <td className="px-3 py-2 text-[11px] text-center text-gray-500">{w.quantity} {w.unit}</td>
                                                                <td className="px-3 py-2 text-[11px] text-right font-bold text-[#006838]">Rs. {(w.quantity * w.rate)?.toLocaleString()}</td>
                                                                <td className="px-3 py-2 text-center">
                                                                  <button onClick={() => setAddedWorks(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                                                                    <X className="w-3 h-3 mx-auto" />
                                                                  </button>
                                                                </td>
                                                              </tr>
                                                            ))}
                                                          </tbody>
                                                        </table>
                                                      </div>
                                                    </div>
                                                  )}
                                                  </div>
                                                  <div className="mt-4 flex justify-between items-center">
                                                    <button
                                                      onClick={handleAddToList}
                                                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded transition-colors flex items-center gap-1 text-xs"
                                                    >
                                                      <Plus className="w-3 h-3" /> Add to List
                                                    </button>
                                                    <button 
                                                      onClick={() => handleAddExtraWork(flow, group.ewId)}
                                                      disabled={isAddingWork || (addedWorks.length === 0 && !addForm.name.trim())}
                                                      className="px-5 py-2 bg-[#006838] hover:bg-[#00522a] text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-xs"
                                                    >
                                                      {isAddingWork ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                      Save to {group.displayId}
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <button 
                                                  onClick={() => {
                                                    setAddingGroupWork(group.ewId);
                                                    setAddedWorks([]);
                                                    setAddForm({ stageId: '', name: '', category: '', unit: 'Unit', quantity: 1, rate: 0, forUnit: '' });
                                                  }}
                                                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-bold text-xs"
                                                >
                                                  <Plus className="w-3 h-3" /> Add Extra Work to {group.displayId}
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    ));
                                  })()}
                                </tbody>
                              </table>
                            </div>

                            {(() => {
                              if (activeTab === 'crd') {
                                if (!(isAdmin || canEditTab('crd'))) return null;
                                const hasPending = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Pending'));
                                const hasReturnedToCRD = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Returned to CRD'));
                                const hasClientApproved = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Client Approved'));
                                const hasAddedToCRD = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Added to CRD'));
                                if (!hasPending && !hasReturnedToCRD && !hasClientApproved && !hasAddedToCRD) return null;
                                return (
                                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                                    {(hasPending || hasReturnedToCRD) && (
                                      <button
                                        onClick={async () => {
                                          setSubmitting('bulk-crd');
                                          try {
                                            const works = [];
                                            flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                              if ((w.status === 'Pending' || w.status === 'Returned to CRD') && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
                                            }));
                                            for (const work of works) {
                                              await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/send-to-ped`, {
                                                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
                                              });
                                            }
                                            setSelectedWorks([]);
                                            await fetchFlows();
                                          } finally {
                                            setSubmitting(null);
                                          }
                                        }}
                                        disabled={submitting === 'bulk-crd' || !selectedWorks.some(id => {
                                          let isPendingOrReturned = false;
                                          flow.stages.forEach(s => s.extraWorks?.forEach(w => { if (w._id === id && (w.status === 'Pending' || w.status === 'Returned to CRD')) isPendingOrReturned = true; }));
                                          return isPendingOrReturned;
                                        })}
                                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                      >
                                        {submitting === 'bulk-crd' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Share Selected to PED</>}
                                      </button>
                                    )}
                                    {hasReturnedToCRD && (
                                      <button
                                        onClick={async () => {
                                          setSubmitting('bulk-crd-client');
                                          try {
                                            const works = [];
                                            flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                              if (w.status === 'Returned to CRD' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
                                            }));
                                            for (const work of works) {
                                              await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/send`, {
                                                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
                                              });
                                            }
                                            setSelectedWorks([]);
                                            await fetchFlows();
                                          } finally {
                                            setSubmitting(null);
                                          }
                                        }}
                                        disabled={submitting === 'bulk-crd-client' || !selectedWorks.some(id => {
                                          let isReturned = false;
                                          flow.stages.forEach(s => s.extraWorks?.forEach(w => { if (w._id === id && w.status === 'Returned to CRD') isReturned = true; }));
                                          return isReturned;
                                        })}
                                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                      >
                                        {submitting === 'bulk-crd-client' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Share Selected to Client</>}
                                      </button>
                                    )}
                                    {hasClientApproved && (
                                      <button
                                        onClick={async () => {
                                          setSubmitting('bulk-crd-accounts');
                                          try {
                                            const works = [];
                                            flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                              if (w.status === 'Client Approved' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
                                            }));
                                            for (const work of works) {
                                              await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/send-to-accounts`, {
                                                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
                                              });
                                            }
                                            setSelectedWorks([]);
                                            await fetchFlows();
                                          } finally {
                                            setSubmitting(null);
                                          }
                                        }}
                                        disabled={submitting === 'bulk-crd-accounts' || !selectedWorks.some(id => {
                                          let isApproved = false;
                                          flow.stages.forEach(s => s.extraWorks?.forEach(w => { if (w._id === id && w.status === 'Client Approved') isApproved = true; }));
                                          return isApproved;
                                        })}
                                        className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                      >
                                        {submitting === 'bulk-crd-accounts' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Building className="w-4 h-4" /> Share Selected to Accounts</>}
                                      </button>
                                    )}
                                    {hasAddedToCRD && (
                                      <button
                                        onClick={async () => {
                                          setSubmitting('bulk-crd-execution');
                                          try {
                                            const works = [];
                                            flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                              if (w.status === 'Added to CRD' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
                                            }));
                                            for (const work of works) {
                                              await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/send-to-ped-execution`, {
                                                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
                                              });
                                            }
                                            setSelectedWorks([]);
                                            await fetchFlows();
                                          } finally {
                                            setSubmitting(null);
                                          }
                                        }}
                                        disabled={submitting === 'bulk-crd-execution' || !selectedWorks.some(id => {
                                          let isAdded = false;
                                          flow.stages.forEach(s => s.extraWorks?.forEach(w => { if (w._id === id && w.status === 'Added to CRD') isAdded = true; }));
                                          return isAdded;
                                        })}
                                        className="px-6 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                      >
                                        {submitting === 'bulk-crd-execution' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send to PED for Execution</>}
                                      </button>
                                    )}
                                  </div>
                                );
                              }

                              if (activeTab === 'ped') {
                                if (!(isAdmin || canEditTab('ped'))) return null;
                                const hasReadyToShare = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'PED Approved'));
                                if (!hasReadyToShare) return null;
                                return (
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={async () => {
                                        setSubmitting('bulk-ped');
                                        try {
                                          const works = [];
                                          flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                            if (w.status === 'PED Approved' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
                                          }));
                                          for (const work of works) {
                                            await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/return-to-crd`, {
                                              method: 'PUT', headers: { Authorization: `Bearer ${token}` }
                                            });
                                          }
                                          setSelectedWorks([]);
                                          await fetchFlows();
                                        } finally {
                                          setSubmitting(null);
                                        }
                                      }}
                                      disabled={submitting === 'bulk-ped' || selectedWorks.length === 0}
                                      className="px-6 py-2 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00512c] transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                      {submitting === 'bulk-ped' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Share Selected to CRD ({selectedWorks.length})</>}
                                    </button>
                                  </div>
                                );
                              }

                              if (activeTab === 'accounts') {
                                if (!(isAdmin || canEditTab('accounts'))) return null;
                                const hasSentToAccounts = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Sent to Accounts'));
                                if (!hasSentToAccounts) return null;
                                return (
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={async () => {
                                        setSubmitting('bulk-accounts');
                                        try {
                                          const works = [];
                                          flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                            if (w.status === 'Sent to Accounts' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
                                          }));
                                          for (const work of works) {
                                            await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/add-to-crd`, {
                                              method: 'PUT', headers: { Authorization: `Bearer ${token}` }
                                            });
                                          }
                                          setSelectedWorks([]);
                                          await fetchFlows();
                                        } finally {
                                          setSubmitting(null);
                                        }
                                      }}
                                      disabled={submitting === 'bulk-accounts' || selectedWorks.length === 0}
                                      className="px-6 py-2 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00512c] transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                      {submitting === 'bulk-accounts' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Work Orders for Selected ({selectedWorks.length})</>}
                                    </button>
                                  </div>
                                );
                              }
                              return null;
                            })()}

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

      {/* Extra Work Details Popup */}
      {extraWorkDetailsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-black-100">
            <div className="bg-[#006838] p-6 text-white relative">
              <button 
                type="button" 
                onClick={() => setExtraWorkDetailsModal(null)}
                className="absolute top-4 right-4 text-emerald-100 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span>Extra Work Details</span>
              </h3>
            </div>
            
            <div className="bg-emerald-50/50 p-4 md:px-6 border-b border-emerald-100 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Customer Name</div>
                <div className="font-bold text-emerald-900">{extraWorkDetailsModal.flow?.lead?.name || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Project Type</div>
                <div className="font-bold text-gray-900">{extraWorkDetailsModal.flow?.project?.name || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Unit</div>
                <div className="font-bold text-gray-900">{extraWorkDetailsModal.flow?.unitId || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Booked On</div>
                <div className="font-bold text-gray-900">
                  {(() => {
                    const lead = extraWorkDetailsModal.flow?.lead;
                    let bookingDate = lead?.history?.find(h => h.status === 'Booking')?.timestamp || lead?.createdAt || extraWorkDetailsModal.flow?.createdAt;
                    return bookingDate ? new Date(bookingDate).toLocaleDateString('en-GB') : '-';
                  })()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Registration Date On</div>
                <div className="font-bold text-gray-900">
                  {(() => {
                    const regStage = extraWorkDetailsModal.flow?.stages?.find(s => s.name?.includes('Agreement'));
                    return regStage?.completedDate ? new Date(regStage.completedDate).toLocaleDateString('en-GB') : '-';
                  })()}
                </div>
              </div>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                  <tr>
                    <th className="px-6 py-4">Work ID</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Sub Category</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Rate</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  <tr>
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">{extraWorkDetailsModal.work?.ewId || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">{extraWorkDetailsModal.work?.category}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{extraWorkDetailsModal.work?.name}</td>
                    <td className="px-6 py-4 text-center">
                      <strong className="text-gray-800">{extraWorkDetailsModal.work?.quantity}</strong> <span className="text-gray-500 text-xs">{extraWorkDetailsModal.work?.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {activeTab !== 'crd' ? (
                        <input
                          type="number"
                          disabled={activeTab !== 'ped' || (extraWorkDetailsModal.work?.status !== 'Sent to PED' && extraWorkDetailsModal.work?.status !== 'PED Approved')}
                          value={rates[extraWorkDetailsModal.work?._id] ?? extraWorkDetailsModal.work?.rate ?? ''}
                          onChange={(e) => handleRateChange(extraWorkDetailsModal.work?._id, e.target.value)}
                          className="w-24 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#006838] disabled:opacity-50 inline-block text-right"
                          placeholder="0"
                        />
                      ) : (
                        <span className="font-bold text-gray-800">Rs. {extraWorkDetailsModal.work?.rate || 0}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                        ${extraWorkDetailsModal.work?.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        extraWorkDetailsModal.work?.status === 'Client Approved' ? 'bg-emerald-100 text-emerald-700' :
                        extraWorkDetailsModal.work?.status === 'Added to CRD' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-200 text-gray-700'}`}>
                        {extraWorkDetailsModal.work?.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {activeTab === 'crd' && extraWorkDetailsModal.work?.status === 'Pending' && (
                        <button
                          onClick={() => {
                            handleSendToPED(extraWorkDetailsModal.flow._id, extraWorkDetailsModal.stageIdx, extraWorkDetailsModal.work._id);
                            setExtraWorkDetailsModal(null);
                          }}
                          disabled={submitting === extraWorkDetailsModal.work?._id}
                          className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-600 hover:text-white transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                        >
                          {submitting === extraWorkDetailsModal.work?._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Share to PED'}
                        </button>
                      )}
                      {activeTab === 'ped' && (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              handleSavePrice(extraWorkDetailsModal.flow._id, extraWorkDetailsModal.stageIdx, extraWorkDetailsModal.work._id);
                              setExtraWorkDetailsModal(null);
                            }}
                            disabled={submitting === extraWorkDetailsModal.work?._id || !(rates[extraWorkDetailsModal.work?._id] > 0)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-200 transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                          >
                            {submitting === extraWorkDetailsModal.work?._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Save Price'}
                          </button>
                          <button
                            onClick={() => {
                              handleSaveAndSendToClient(extraWorkDetailsModal.flow._id, extraWorkDetailsModal.stageIdx, extraWorkDetailsModal.work._id);
                              setExtraWorkDetailsModal(null);
                            }}
                            disabled={submitting === extraWorkDetailsModal.work?._id || !(rates[extraWorkDetailsModal.work?._id] > 0)}
                            className="px-4 py-2 bg-[#006838] text-white font-bold text-xs rounded-lg hover:bg-[#00512c] transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                          >
                            {submitting === extraWorkDetailsModal.work?._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Send to Client'}
                          </button>
                        </div>
                      )}
                      {activeTab === 'accounts' && extraWorkDetailsModal.work?.status === 'Client Approved' && (
                        <button
                          onClick={() => {
                            handleAddToCRD(extraWorkDetailsModal.flow._id, extraWorkDetailsModal.stageIdx, extraWorkDetailsModal.work._id);
                            setExtraWorkDetailsModal(null);
                          }}
                          disabled={submitting === extraWorkDetailsModal.work?._id}
                          className="px-4 py-2 bg-[#006838] text-white font-bold text-xs rounded-lg hover:bg-[#00512c] transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                        >
                          {submitting === extraWorkDetailsModal.work?._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Create Work Order'}
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtraWorks;
