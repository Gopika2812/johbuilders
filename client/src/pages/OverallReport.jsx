import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Search, Download, BarChart2 } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

const OverallReport = () => {
  const { token } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ debtorsAmount: '', targetAmount: '' });

  useEffect(() => {
    fetchCRDFlows();
  }, [token]);

  const fetchCRDFlows = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch CRD Flows');
      const data = await res.json();
      setFlows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (flow) => {
    setEditingId(flow._id);
    setEditValues({
      debtorsAmount: flow.debtorsAmount || '',
      targetAmount: flow.targetAmount || ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`${API_URL}/crd-flow/${id}/editable-amounts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          debtorsAmount: Number(editValues.debtorsAmount) || 0,
          targetAmount: Number(editValues.targetAmount) || 0
        })
      });
      
      if (!res.ok) throw new Error('Failed to update amounts');
      
      const updatedFlow = await res.json();
      
      setFlows(flows.map(f => f._id === id ? { ...f, debtorsAmount: updatedFlow.debtorsAmount, targetAmount: updatedFlow.targetAmount } : f));
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const getWeeklyCollections = (flow) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    
    if (flow.stages) {
      flow.stages.forEach(stage => {
        if (stage.payments) {
          stage.payments.forEach(p => {
            const pDate = new Date(p.date);
            if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
              const day = pDate.getDate();
              const amt = Number(p.amount) || 0;
              if (day >= 1 && day <= 7) w1 += amt;
              else if (day >= 8 && day <= 14) w2 += amt;
              else if (day >= 15 && day <= 21) w3 += amt;
              else w4 += amt;
            }
          });
        }
      });
    }
    
    return { w1, w2, w3, w4 };
  };

  const handleExport = () => {
    const exportData = filteredFlows.map((flow, index) => {
      const weeks = getWeeklyCollections(flow);
      return {
        'S.No': index + 1,
        'Lead Name': flow.lead?.name || 'N/A',
        'Project Type': Array.isArray(flow.project?.projectType) ? flow.project.projectType.join(', ') : (flow.project?.projectType || 'N/A'),
        'Unit No': flow.unitId || 'N/A',
        'Total Amount': flow.totalCurrentValue || 0,
        'Debtors Amount': flow.debtorsAmount || 0,
        'Target Amount': flow.targetAmount || 0,
        'Week 1': weeks.w1,
        'Week 2': weeks.w2,
        'Week 3': weeks.w3,
        'Week 4': weeks.w4
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const colWidths = [
      { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];
    ws['!cols'] = colWidths;

    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0E623A" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Overall Report");
    XLSX.writeFile(wb, `Overall_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
  };

  const filteredFlows = flows.filter(flow => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const custName = flow.lead?.name?.toLowerCase() || '';
    const projName = flow.project?.name?.toLowerCase() || '';
    return custName.includes(searchLower) || projName.includes(searchLower);
  });

  return (
    <div className="p-8 max-w-[95%] mx-auto min-h-screen font-sans">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-[#0e623a]">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Overall Report</h1>
            <p className="text-xs text-emerald-700/70 font-semibold mt-1">Track targets, debtors, and weekly collections</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lead or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0e623a] text-white text-sm font-bold rounded-xl hover:bg-[#0b4d2d] transition shadow"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-150 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin h-8 w-8 border-b-2 border-[#0e623a] rounded-full mx-auto mb-4"></div>
            Loading report...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-12 text-center">S.No</th>
                  <th className="p-3">Lead Name</th>
                  <th className="p-3">Project Type</th>
                  <th className="p-3 text-center">Unit No</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-right">Debtors Amount</th>
                  <th className="p-3 text-right">Target Amount</th>
                  <th className="p-3 text-right">Week 1</th>
                  <th className="p-3 text-right">Week 2</th>
                  <th className="p-3 text-right">Week 3</th>
                  <th className="p-3 text-right">Week 4</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredFlows.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="p-8 text-center text-gray-500 text-sm">No records found.</td>
                  </tr>
                ) : (
                  filteredFlows.map((flow, idx) => {
                    const weeks = getWeeklyCollections(flow);
                    const isEditing = editingId === flow._id;

                    return (
                      <tr key={flow._id} className="hover:bg-gray-50/50 transition">
                        <td className="p-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                        <td className="p-3 font-bold text-gray-800">{flow.lead?.name || 'N/A'}</td>
                        <td className="p-3 text-gray-600 font-medium">{Array.isArray(flow.project?.projectType) ? flow.project.projectType.join(', ') : (flow.project?.projectType || 'N/A')}</td>
                        <td className="p-3 text-center font-semibold text-indigo-600 bg-indigo-50/50 rounded">{flow.unitId || 'N/A'}</td>
                        <td className="p-3 text-right font-black text-gray-800">Rs. {(flow.totalCurrentValue || 0).toLocaleString()}</td>
                        
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-24 px-2 py-1 border rounded text-right text-xs"
                              value={editValues.debtorsAmount}
                              onChange={(e) => setEditValues({...editValues, debtorsAmount: e.target.value})}
                            />
                          ) : (
                            <span className="font-bold text-rose-600">Rs. {(flow.debtorsAmount || 0).toLocaleString()}</span>
                          )}
                        </td>
                        
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-24 px-2 py-1 border rounded text-right text-xs"
                              value={editValues.targetAmount}
                              onChange={(e) => setEditValues({...editValues, targetAmount: e.target.value})}
                            />
                          ) : (
                            <span className="font-bold text-[#0e623a]">Rs. {(flow.targetAmount || 0).toLocaleString()}</span>
                          )}
                        </td>
                        
                        <td className="p-3 text-right font-medium text-emerald-600 bg-emerald-50/30">Rs. {weeks.w1.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium text-emerald-600 bg-emerald-50/30">Rs. {weeks.w2.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium text-emerald-600 bg-emerald-50/30">Rs. {weeks.w3.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium text-emerald-600 bg-emerald-50/30">Rs. {weeks.w4.toLocaleString()}</td>
                        
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <button onClick={() => handleSaveEdit(flow._id)} className="px-3 py-1 bg-emerald-600 text-white rounded shadow-sm text-[10px] font-bold hover:bg-emerald-700">Save</button>
                          ) : (
                            <button onClick={() => handleEditClick(flow)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold hover:bg-gray-200">Edit</button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverallReport;
