import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Search, Download, Calendar, Landmark } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

const CollectionReport = () => {
  const { token } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const getCollectedAmount = (flow) => {
    return flow.stages?.reduce((total, stage) => {
      return total + (stage.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0);
    }, 0) || 0;
  };

  const handleExport = () => {
    const exportData = filteredFlows.map((flow, index) => {
      const collected = getCollectedAmount(flow);
      const totalValue = flow.totalCurrentValue || 0;
      const pending = Math.max(0, totalValue - collected);
      const dateStr = flow.lead?.bookingInfo?.bookingDate 
        ? new Date(flow.lead.bookingInfo.bookingDate).toLocaleDateString('en-GB')
        : (flow.createdAt ? new Date(flow.createdAt).toLocaleDateString('en-GB') : 'N/A');

      return {
        'S.No': index + 1,
        'Date': dateStr,
        'Customer Name': flow.lead?.name || 'N/A',
        'Project': flow.project?.name || flow.project?.code || 'N/A',
        'Total Project Value': totalValue,
        'Collected Amount': collected,
        'Pending Amount': pending
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const colWidths = [
      { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, 
      { wch: 20 }, { wch: 20 }, { wch: 20 }
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
    XLSX.utils.book_append_sheet(wb, ws, "Collection Report");
    XLSX.writeFile(wb, `Collection_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
  };

  const filteredFlows = flows.filter(flow => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const custName = flow.lead?.name?.toLowerCase() || '';
    const projName = flow.project?.name?.toLowerCase() || '';
    return custName.includes(searchLower) || projName.includes(searchLower);
  });

  return (
    <div className="p-1 sm:p-4 md:p-6 lg:p-8 max-w-full lg:max-w-7xl mx-auto min-h-screen font-sans">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-150 mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 text-[#0e623a]">
          <img src="/JB logo.png" alt="JB Logo" className="h-9 sm:h-12 w-auto object-contain shrink-0" />
          <div className="p-2 sm:p-3 bg-emerald-50 rounded-xl sm:rounded-2xl shrink-0">
            <Landmark className="w-5 h-5 sm:w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black tracking-tight truncate sm:whitespace-normal">Collection Report</h1>
            <p className="text-[11px] sm:text-xs text-emerald-700/70 font-semibold mt-0.5 sm:mt-1">Overview of project values and collected amounts</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 bg-[#0e623a] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#0b4d2d] transition shadow shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-150 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin h-8 w-8 border-b-2 border-[#0e623a] rounded-full mx-auto mb-4"></div>
            Loading report...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : (
          <div>
            <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800 font-medium sm:hidden">
              <span>← Swipe table horizontally to view full details →</span>
              <span className="font-bold">{filteredFlows.length} records</span>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead className="bg-[#0e623a] text-white font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5 w-16 text-center whitespace-nowrap">S.No</th>
                    <th className="p-3.5 whitespace-nowrap">Date</th>
                    <th className="p-3.5 whitespace-nowrap">Customer Name</th>
                    <th className="p-3.5 whitespace-nowrap">Project</th>
                    <th className="p-3.5 text-right whitespace-nowrap">Total Project Value</th>
                    <th className="p-3.5 text-right whitespace-nowrap">Collected Amount</th>
                    <th className="p-3.5 text-right whitespace-nowrap">Pending Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredFlows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">No collection records found.</td>
                    </tr>
                  ) : (
                    filteredFlows.map((flow, idx) => {
                      const collected = getCollectedAmount(flow);
                      const totalValue = flow.totalCurrentValue || 0;
                      const pending = Math.max(0, totalValue - collected);
                      const dateStr = flow.lead?.bookingInfo?.bookingDate 
                        ? new Date(flow.lead.bookingInfo.bookingDate).toLocaleDateString('en-GB')
                        : (flow.createdAt ? new Date(flow.createdAt).toLocaleDateString('en-GB') : 'N/A');

                      return (
                        <tr key={flow._id} className="hover:bg-gray-50/50 transition">
                          <td className="p-3.5 text-center text-gray-400 font-semibold whitespace-nowrap">{idx + 1}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {dateStr}
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-gray-800 whitespace-nowrap">{flow.lead?.name || 'N/A'}</td>
                          <td className="p-3.5 text-gray-600 font-medium whitespace-nowrap">{flow.project?.name || flow.project?.code || 'N/A'}</td>
                          <td className="p-3.5 text-right font-black text-gray-800 whitespace-nowrap">Rs. {totalValue.toLocaleString()}</td>
                          <td className="p-3.5 text-right font-black text-[#0e623a] whitespace-nowrap">Rs. {collected.toLocaleString()}</td>
                          <td className="p-3.5 text-right font-bold text-rose-600 whitespace-nowrap">Rs. {pending.toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionReport;
