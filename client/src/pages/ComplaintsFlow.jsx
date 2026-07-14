import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, FileText, Send, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ComplaintsFlow = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('Complaints');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [pedPrices, setPedPrices] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchTasks();
  }, []);

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

  const handleSendToPED = async (flowId, complaintId) => {
    setActionLoading(complaintId);
    try {
      const res = await fetch(`${API_URL}/tasks/${flowId}/${complaintId}/send-to-ped`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to send to PED');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to send to PED Team');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSavePrice = async (flowId, complaintId) => {
    const price = pedPrices[complaintId];
    if (price === undefined || price === null || price === '') return;
    
    setActionLoading(`price-${complaintId}`);
    try {
      const res = await fetch(`${API_URL}/tasks/${flowId}/${complaintId}/ped-price`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ pedPrice: Number(price) })
      });
      if (!res.ok) throw new Error('Failed to save price');
      alert('Price saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save price');
    } finally {
      setActionLoading(null);
    }
  };

  const generateQuotationPDF = (task) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 104, 56); // Brand Green
    doc.text('JOHN BUILDWELL', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text('Complaint Repair Quotation', 105, 30, { align: 'center' });
    
    // Details
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`Quotation Ref: QTN-${task.token}`, 20, 60);
    doc.text(`Project: ${task.projectName}`, 20, 70);
    doc.text(`Unit: ${task.unitId}`, 20, 80);
    doc.text(`Customer Name: ${task.customerName}`, 20, 90);
    
    // Table
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
    
    // Footer
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed':
      case 'Resolved':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'In Progress':
      case 'Start Work':
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> {status}</span>;
      default:
        return <span className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-xs font-bold flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3" /> Pending</span>;
    }
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="9" className="p-8 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#006838]" />
            <p className="mt-2 text-sm font-medium">Loading Complaints...</p>
          </td>
        </tr>
      );
    }
    
    if (tasks.length === 0) {
      return (
        <tr>
          <td colSpan="9" className="p-8 text-center text-gray-500 font-medium">
            No complaints found.
          </td>
        </tr>
      );
    }

    return tasks.map((t, idx) => (
      <tr key={t.complaintId} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
        <td className="p-4 text-sm text-gray-600 font-medium">{idx + 1}</td>
        <td className="p-4 text-sm text-gray-900 font-bold whitespace-nowrap">
          {new Date(t.reportedAt).toLocaleDateString('en-GB')}
        </td>
        <td className="p-4">
          <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-xs font-bold tracking-wider">
            {t.token}
          </span>
        </td>
        <td className="p-4">
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${t.scope === 'Customer' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {t.scope || 'Company'}
          </span>
        </td>
        <td className="p-4 text-sm text-gray-600 font-medium whitespace-nowrap">
          {t.sentToPedAt ? new Date(t.sentToPedAt).toLocaleDateString('en-GB') : '-'}
        </td>
        <td className="p-4">
          {getStatusBadge(t.status)}
        </td>
        <td className="p-4 text-sm text-gray-600 font-medium whitespace-nowrap">
          {t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('en-GB') : '-'}
        </td>
        
        {/* Action Column for Complaints Tab */}
        {activeTab === 'Complaints' && (
          <td className="p-4 text-right">
            {!t.sentToPedAt ? (
              <button
                onClick={() => handleSendToPED(t.flowId, t.complaintId)}
                disabled={actionLoading === t.complaintId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006838] text-white text-xs font-bold rounded-lg hover:bg-[#00522c] transition-colors disabled:opacity-50"
              >
                {actionLoading === t.complaintId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send to PED
              </button>
            ) : (
              <span className="text-xs font-bold text-gray-400 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sent
              </span>
            )}
          </td>
        )}
        
        {/* Action Column for PED Team Tab */}
        {activeTab === 'PED Team' && (
          <td className="p-4">
            {t.scope === 'Customer' ? (
              <div className="flex items-center justify-end gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Rs.</span>
                  <input
                    type="number"
                    value={pedPrices[t.complaintId] || ''}
                    onChange={(e) => setPedPrices({...pedPrices, [t.complaintId]: e.target.value})}
                    placeholder="Price"
                    className="w-32 pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#006838] focus:border-transparent outline-none font-medium"
                  />
                </div>
                <button
                  onClick={() => handleSavePrice(t.flowId, t.complaintId)}
                  disabled={actionLoading === `price-${t.complaintId}`}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => generateQuotationPDF(t)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006838] text-white text-xs font-bold rounded-lg hover:bg-[#00522c] transition-colors shadow-sm shadow-[#006838]/20"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Make Quotation
                </button>
              </div>
            ) : (
              <span className="text-xs font-medium text-gray-400 italic block text-right">No price required</span>
            )}
          </td>
        )}
      </tr>
    ));
  };

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-8 border border-white/40 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#006838] mb-2">
              <span>CRD Flow</span>
              <ChevronRight className="w-4 h-4" />
              <span>Complaints Flow</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Complaints Tracking</h1>
            <p className="text-gray-500 mt-2 text-sm max-w-xl leading-relaxed">
              Monitor customer complaints, determine scopes, and coordinate with the PED team for repair quotations.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {['Complaints', 'PED Team'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === tab 
                ? 'bg-white text-[#006838] shadow-sm border border-gray-100' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">S.No</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Raised On</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Token ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Scope</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sent to PED</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Completed On</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  {activeTab === 'PED Team' ? 'PED Pricing & Action' : 'Action'}
                </th>
              </tr>
            </thead>
            <tbody>
              {renderTableContent()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsFlow;
