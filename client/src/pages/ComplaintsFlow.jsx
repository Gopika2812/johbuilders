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
      <tr key={t.complaintId} className="hover:bg-emerald-50/50 transition-colors cursor-pointer">
        <td className="px-6 py-4 font-bold text-gray-900">{idx + 1}</td>
        <td className="px-6 py-4 text-gray-600">
          {new Date(t.reportedAt).toLocaleDateString('en-GB')}
        </td>
        <td className="px-6 py-4">
          <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-xs font-bold tracking-wider">
            {t.token}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${t.scope === 'Customer' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {t.scope || 'Company'}
          </span>
        </td>
        <td className="px-6 py-4 text-gray-600">
          {t.sentToPedAt ? new Date(t.sentToPedAt).toLocaleDateString('en-GB') : '-'}
        </td>
        <td className="px-6 py-4">
          {getStatusBadge(t.status)}
        </td>
        <td className="px-6 py-4 text-gray-600">
          {t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('en-GB') : '-'}
        </td>
        
        {/* Action Column for Complaints Tab */}
        {activeTab === 'Complaints' && (
          <td className="px-6 py-4 text-right">
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
          <td className="px-6 py-4">
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
    <div className="p-6 md:p-8 w-full mx-auto space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Complaints Tracking</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-1.5 rounded-2xl flex flex-wrap gap-2 shadow-sm">
        {['Complaints', 'PED Team'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab
                ? 'bg-[#006838] text-white shadow-md'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#006838] text-white">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-16">S.No</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Raised On</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Token ID</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Scope</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Sent to PED</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Completed On</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">
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
