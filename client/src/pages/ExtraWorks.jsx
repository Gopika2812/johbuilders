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
  X
} from 'lucide-react';

const ExtraWorks = () => {
  const { token } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFlow, setExpandedFlow] = useState(null);
  const [rates, setRates] = useState({});
  const [submitting, setSubmitting] = useState(null); // id of work being submitted

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  // Filter flows
  const filteredFlows = flows.filter(flow => {
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
                      onClick={() => setExpandedFlow(flow._id)}
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
                        View Details
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {expandedFlow && (() => {
        const flow = flows.find(f => f._id === expandedFlow);
        if (!flow) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-emerald-100 animate-fade-in-up">
              <div className="p-6 bg-[#006838] text-white flex justify-between items-center rounded-t-[2rem]">
                <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-5 h-5" /> Extra Works Details - {flow.lead?.name}
                </h2>
                <button onClick={() => setExpandedFlow(null)} className="text-white/80 hover:text-white transition bg-white/10 hover:bg-white/20 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-emerald-50/50">
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#006838] text-white">
                      <tr>
                        <th className="p-4 font-bold text-[11px] uppercase tracking-wider">Category</th>
                        <th className="p-4 font-bold text-[11px] uppercase tracking-wider">Sub Category</th>
                        <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Qty</th>
                        <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-right">Rate (Rs)</th>
                        <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-right">Total (Rs)</th>
                        <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {flow.stages.map((stage, sIdx) => (
                        stage.extraWorks && stage.extraWorks.length > 0 && stage.extraWorks.map(work => (
                          <tr key={work._id} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="p-4 align-middle">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full whitespace-nowrap">{work.category}</span>
                              <div className="text-[10px] font-bold text-gray-500 mt-2">Stage: {stage.name}</div>
                            </td>
                            <td className="p-4 align-middle font-bold text-gray-900 text-sm max-w-[200px] break-words">
                              {work.name}
                            </td>
                            <td className="p-4 align-middle text-center">
                              <strong className="text-gray-900 text-sm">{work.quantity}</strong> <span className="text-gray-500 text-xs">{work.unit}</span>
                            </td>
                            <td className="p-4 align-middle text-right">
                              <input
                                type="number"
                                disabled={work.status !== 'Pending'}
                                value={rates[work._id] ?? work.rate ?? ''}
                                onChange={(e) => handleRateChange(work._id, e.target.value)}
                                className="w-28 ml-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#006838]/20 focus:border-[#006838] disabled:opacity-50 disabled:bg-gray-100 text-right transition-colors"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-4 align-middle text-right font-black text-[#006838] text-sm">
                              {((rates[work._id] ?? work.rate ?? 0) * work.quantity).toLocaleString()}
                            </td>
                            <td className="p-4 align-middle text-center">
                              <div className="flex justify-center">
                                {getStatusBadge(work.status)}
                              </div>
                            </td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Bulk Actions */}
              {(flow.stages.some(s => s.extraWorks?.some(w => w.status === 'PED Approved')) || 
                flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Client Approved'))) && (
                <div className="p-6 border-t border-emerald-100 bg-white flex flex-wrap justify-end gap-4 rounded-b-[2rem]">
                  {(() => {
                    const hasPendingWithRate = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Pending' && rates[w._id] > 0));
                    const hasPEDApproved = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'PED Approved'));
                    
                    if (hasPendingWithRate || hasPEDApproved) {
                      return (
                        <button
                          onClick={async () => {
                            try {
                              setSubmitting('bulk-save-send');
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
                          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                          {submitting === 'bulk-save-send' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Save & Send All to Customer</>}
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
                      className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
                    >
                      {submitting === 'bulk-add' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Add All Approved to CRD</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default ExtraWorks;
