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
  const { token, user } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFlow, setExpandedFlow] = useState(null);
  const [rates, setRates] = useState({});
  const [submitting, setSubmitting] = useState(null); // id of work being submitted
  const [activeTab, setActiveTab] = useState('crd');
  const [selectedWorks, setSelectedWorks] = useState([]); // crd, ped, client, accounts, work-orders
  const [extraWorkDetailsModal, setExtraWorkDetailsModal] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Add Extra Work Modal Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingWork, setIsAddingWork] = useState(false);
  const [addForm, setAddForm] = useState({
    stageId: '',
    name: '',
    category: 'General',
    unit: 'Unit',
    quantity: 1,
    rate: 0
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

  const handleAddExtraWork = async (flowId) => {
    if (!addForm.stageId) {
      alert("Please select a stage!");
      return;
    }
    if (!addForm.name.trim()) {
      alert("Please enter a work name!");
      return;
    }

    try {
      setIsAddingWork(true);
      const res = await fetch(`${API_URL}/extra-works/${flowId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      });
      if (!res.ok) throw new Error('Failed to add extra work');
      
      setAddForm({
        stageId: '',
        name: '',
        category: 'General',
        unit: 'Unit',
        quantity: 1,
        rate: 0
      });
      setShowAddForm(false);
      await fetchFlows();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAddingWork(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">Pending (CRD)</span>;
      case 'Sent to PED': return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-bold">Shared to PED</span>;
      case 'PED Approved': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">Priced (Ready to Send)</span>;
      case 'Sent to Customer': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">Sent to Customer</span>;
      case 'Client Approved': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-bold">Client Approved</span>;
      case 'Added to CRD': return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">Added to CRD</span>;
      case 'Removed by Client': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">Removed by Client</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">{status}</span>;
    }
  };

  // Filter flows based on active tab requirements
  const getTabStatuses = () => {
    switch(activeTab) {
      case 'crd': return ['Pending', 'Sent to PED'];
      case 'ped': return ['Sent to PED', 'PED Approved'];
      case 'client': return ['Client Approved'];
      case 'accounts': return ['Client Approved'];
      case 'work-orders': return ['Added to CRD'];
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

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Extra Works Management</h1>
        
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-1.5 rounded-2xl flex flex-wrap gap-2 shadow-sm">
        {[
          { id: 'crd', label: 'CRD Team' },
          { id: 'ped', label: 'PED Team' },
          { id: 'client', label: 'Client Approved' },
          { id: 'accounts', label: 'Accounts Team' },
          { id: 'work-orders', label: 'Work Orders' }
        ].map(tab => (
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
                              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                                <button 
                                  onClick={() => setShowAddForm(!showAddForm)} 
                                  className="flex items-center gap-2 px-4 py-2 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00512c] transition-colors shadow-sm text-sm"
                                >
                                  <Plus className="w-4 h-4" /> Add Extra Work
                                </button>
                              )}
                            </div>

                            {showAddForm && (
                              <div className="mb-6 bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm animate-fade-in-up">
                                <h3 className="text-sm font-black text-emerald-900 mb-4 uppercase tracking-wider">Add New Extra Work</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                                  <div className="lg:col-span-1">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Stage <span className="text-red-500">*</span></label>
                                    <select 
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                      value={addForm.stageId}
                                      onChange={e => setAddForm({...addForm, stageId: e.target.value})}
                                    >
                                      <option value="">Select Stage...</option>
                                      {flow.stages.map(stage => (
                                        <option key={stage._id} value={stage._id}>{stage.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="lg:col-span-1">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. Electrical"
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                      value={addForm.category}
                                      onChange={e => setAddForm({...addForm, category: e.target.value})}
                                    />
                                  </div>
                                  <div className="lg:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Sub Category (Name) <span className="text-red-500">*</span></label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. Extra Switch Board"
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                      value={addForm.name}
                                      onChange={e => setAddForm({...addForm, name: e.target.value})}
                                    />
                                  </div>
                                  <div className="lg:col-span-1 flex gap-2">
                                    <div className="flex-1">
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Qty</label>
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
                                        type="text" placeholder="No"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                        value={addForm.unit}
                                        onChange={e => setAddForm({...addForm, unit: e.target.value})}
                                      />
                                    </div>
                                  </div>
                                  <div className="lg:col-span-1">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Rate (Optional)</label>
                                    <input 
                                      type="number" min="0"
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006838]/20"
                                      value={addForm.rate}
                                      onChange={e => setAddForm({...addForm, rate: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                  <button 
                                    onClick={() => handleAddExtraWork(flow._id)}
                                    disabled={isAddingWork}
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
                                      {(activeTab === 'crd' || activeTab === 'ped' || activeTab === 'accounts') && (
                                        <input 
                                          type="checkbox"
                                          className="w-4 h-4 rounded border-gray-300 text-[#006838] focus:ring-[#006838]"
                                          onChange={() => {
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
                                              setSelectedWorks(prev => [...new set([...prev, ...selectableWorks])]);
                                            }
                                          }}
                                          checked={(() => {
                                            let selectable = 0;
                                            let selected = 0;
                                            flow.stages.forEach(s => s.extraWorks?.forEach(w => {
                                              if ((activeTab === 'crd' && w.status === 'Pending') ||
                                                  (activeTab === 'ped' && w.status === 'PED Approved') ||
                                                  (activeTab === 'accounts' && w.status === 'Client Approved')) {
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
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-right">Estimated Value</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Estimated Date</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Sent to PED Date</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Customer Approval</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Sent to Accounts</th>
                                    <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Work Order Issued</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
                                  {flow.stages.map((stage, sIdx) => (
                                    stage.extraWorks && stage.extraWorks.length > 0 && stage.extraWorks.filter(w => {
                                      if (activeTab === 'crd') return ['Pending', 'Sent to PED'].includes(w.status);
                                      if (activeTab === 'ped') return ['Sent to PED', 'PED Approved'].includes(w.status);
                                      if (activeTab === 'client') return ['Client Approved'].includes(w.status);
                                      if (activeTab === 'accounts') return ['Client Approved'].includes(w.status);
                                      if (activeTab === 'work-orders') return ['Added to CRD'].includes(w.status);
                                      return false;
                                    }).map(work => (
                                      <tr key={work._id} className="hover:bg-emerald-50/30 transition-colors">
                                        <td className="p-4 align-middle text-center">
                                          {((activeTab === 'crd' && work.status === 'Pending') ||
                                            (activeTab === 'ped' && work.status === 'PED Approved') ||
                                            (activeTab === 'accounts' && work.status === 'Client Approved')) && (
                                            <input 
                                              type="checkbox"
                                              className="w-4 h-4 rounded border-gray-300 text-[#006838] focus:ring-[#006838]"
                                              checked={selectedWorks.includes(work._id)}
                                              onChange={() => setSelectedWorks(prev => prev.includes(work._id) ? prev.filter(id => id !== work._id) : [...prev, work._id])}
                                            />
                                          )}
                                        </td>
                                        <td className="p-4 align-middle">
                                          <button onClick={() => setExtraWorkDetailsModal({ flow, stageIdx: sIdx, work })} className="font-mono text-blue-700 font-bold hover:underline cursor-pointer">
                                            {work.ewId || '-'}
                                          </button>
                                        </td>
                                        <td className="p-4 align-middle text-right font-bold text-black-800">
                                          Rs. {(work.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-gray-600">
                                          {work.pricingDate ? new Date(work.pricingDate).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-gray-600">
                                          {work.sentToPedDate ? new Date(work.sentToPedDate).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-emerald-700 font-medium">
                                          {work.customerApprovalDate ? new Date(work.customerApprovalDate).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-blue-700 font-medium">
                                          {work.crdAddedDate ? new Date(work.crdAddedDate).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-purple-700 font-medium">
                                          {work.woId || (work.crdAddedDate ? new Date(work.crdAddedDate).toLocaleDateString('en-GB') : '-')}
                                        </td>
                                      </tr>
                                    ))
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {(() => {
                              if (activeTab === 'crd') {
                                const hasPending = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Pending'));
                                if (!hasPending) return null;
                                return (
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={async () => {
                                        setSubmitting('bulk-crd');
                                        try {
                                          const works = [];
                                          flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                            if (w.status === 'Pending' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
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
                                      disabled={submitting === 'bulk-crd' || selectedWorks.length === 0}
                                      className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                      {submitting === 'bulk-crd' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Share Selected to PED ({selectedWorks.length})</>}
                                    </button>
                                  </div>
                                );
                              }

                              if (activeTab === 'ped') {
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
                                      disabled={submitting === 'bulk-ped' || selectedWorks.length === 0}
                                      className="px-6 py-2 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00512c] transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                      {submitting === 'bulk-ped' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Share Selected to Client ({selectedWorks.length})</>}
                                    </button>
                                  </div>
                                );
                              }

                              if (activeTab === 'accounts') {
                                const hasClientApproved = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Client Approved'));
                                if (!hasClientApproved) return null;
                                return (
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={async () => {
                                        setSubmitting('bulk-accounts');
                                        try {
                                          const works = [];
                                          flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                            if (w.status === 'Client Approved' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
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
                        <button
                          onClick={() => {
                            handleSavePrice(extraWorkDetailsModal.flow._id, extraWorkDetailsModal.stageIdx, extraWorkDetailsModal.work._id);
                            setExtraWorkDetailsModal(null);
                          }}
                          disabled={submitting === extraWorkDetailsModal.work?._id || !(rates[extraWorkDetailsModal.work?._id] > 0)}
                          className="px-4 py-2 bg-[#006838] text-white font-bold text-xs rounded-lg hover:bg-[#00512c] transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                        >
                          {submitting === extraWorkDetailsModal.work?._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Save Price'}
                        </button>
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
