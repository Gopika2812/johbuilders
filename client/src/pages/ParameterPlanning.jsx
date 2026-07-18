import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Layers, 
  Calendar, 
  Save
} from 'lucide-react';

const ParameterPlanning = () => {
  const { token } = useAuth();
  
  // Date and filter states
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }); // Format: YYYY-MM
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [targets, setTargets] = useState({
    registrationsTarget: 0,
    keyHandoverTarget: 0,
    totalDebtorsTarget: 0,
    collectionAmountTarget: 0,
    npaValueTarget: 0,
    bankLoansTarget: 0,
    criticalIssuesTarget: 0,
    customerComplaintsTarget: 0,
    extraWorksTarget: 0
  });

  const [actuals, setActuals] = useState({
    registrations: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
    keyHandover: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
    totalDebtors: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
    collectionAmount: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
    npaValue: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
    bankLoans: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
    criticalIssues: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
    customerComplaints: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
    extraWorks: { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 }
  });

  useEffect(() => {
    fetchInitialData();
  }, [selectedMonth]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/parameter-plans/${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const t = data.target || {};
        setTargets({
          registrationsTarget: t.registrationsTarget || 0,
          keyHandoverTarget: t.keyHandoverTarget || 0,
          totalDebtorsTarget: t.totalDebtorsTarget || 0,
          collectionAmountTarget: t.collectionAmountTarget || 0,
          npaValueTarget: t.npaValueTarget || 0,
          bankLoansTarget: t.bankLoansTarget || 0,
          criticalIssuesTarget: t.criticalIssuesTarget || 0,
          customerComplaintsTarget: t.customerComplaintsTarget || 0,
          extraWorksTarget: t.extraWorksTarget || 0
        });
        
        if (data.actuals) {
          setActuals(data.actuals);
        }
      }
    } catch (err) {
      console.error('Error loading parameter stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarget = (field, value) => {
    const numVal = Number(value) || 0;
    setTargets(prev => ({
      ...prev,
      [field]: numVal
    }));
  };

  const handleSavePlan = async () => {
    try {
      const response = await fetch(`${API_URL}/parameter-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          ...targets
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save parameter targets.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving targets.');
    }
  };

  const calculatePercentage = (actual, target) => {
    if (!target || target <= 0) return '0%';
    const pct = (actual / target) * 100;
    return `${pct.toFixed(0)}%`;
  };

  const rows = [
    { label: 'No.of Registrations ( 45 days)', key: 'registrationsTarget', actKey: 'registrations', unit: 'Nos', isFloat: false },
    { label: 'No.of Key Handover', key: 'keyHandoverTarget', actKey: 'keyHandover', unit: 'Nos', isFloat: false },
    { label: 'Total Debtors', key: 'totalDebtorsTarget', actKey: 'totalDebtors', unit: 'Cr', isFloat: true },
    { label: 'Collection Amount (<60 Days)', key: 'collectionAmountTarget', actKey: 'collectionAmount', unit: 'Cr', isFloat: true },
    { label: 'NPA Value (>60 Days)', key: 'npaValueTarget', actKey: 'npaValue', unit: 'Cr', isFloat: true },
    { label: 'Bank Loans (15 Days)', key: 'bankLoansTarget', actKey: 'bankLoans', unit: 'Nos', isFloat: false },
    { label: 'Critical Customers Issues fixed', key: 'criticalIssuesTarget', actKey: 'criticalIssues', unit: 'Nos', isFloat: false },
    { label: 'Customer Complaints (15 Days)', key: 'customerComplaintsTarget', actKey: 'customerComplaints', unit: 'Nos', isFloat: false },
    { label: 'Additional Work Approvals (15 days)', key: 'extraWorksTarget', actKey: 'extraWorks', unit: 'Nos', isFloat: false }
  ];

  const calculateOverallPerformance = () => {
    let totalPct = 0;
    let validRows = 0;
    rows.forEach(r => {
      const target = targets[r.key] || 0;
      const actualObj = actuals[r.actKey];
      const actual = actualObj?.actual || 0;
      
      if (target > 0) {
        totalPct += (actual / target) * 100;
        validRows++;
      }
    });
    
    if (validRows === 0) return '0%';
    const avg = totalPct / validRows;
    return `${avg.toFixed(0)}%`;
  };

  const overallPerformance = calculateOverallPerformance();

  // Helper to format values
  const fmt = (val, isFloat) => {
      if (val === undefined || val === null) return 0;
      return isFloat ? Number(val).toFixed(2) : Math.round(val);
  };

  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const displayMonth = `${monthNames[new Date(selectedMonth + '-01').getMonth()]} - ${selectedMonth.split('-')[0]}`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left animate-fadeIn font-sans pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-black-100 shadow-sm rounded-3xl">
        <div>
          <h2 className="text-xl font-extrabold text-black-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#006838]" />
            <span>Parameter Planning</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Targets Saved!
            </span>
          )}
          <button
            onClick={handleSavePlan}
            className="px-5 py-2.5 bg-[#006838] text-white rounded-xl text-xs font-bold hover:bg-[#004f29] transition flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Plan</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-black-100 rounded-3xl shadow-sm p-6 space-y-6 animate-fadeIn font-sans">
        <div className="flex justify-end border-b border-black-100 pb-4">
          <div className="relative w-full sm:max-w-xs flex items-center gap-2 justify-end">
            <span className="text-xs font-bold text-black-455 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-black-400" />
              <span>Planning Month:</span>
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs bg-black-50 border border-black-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006838] text-black-700 font-bold"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-black-500 italic">
            Loading parameter planning data...
          </div>
        ) : (
          <div className="overflow-x-auto border border-black-150 rounded-2xl">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr>
                    <th colSpan="12" className="bg-yellow-300 text-yellow-900 font-bold text-center py-2 text-sm border-b border-black-200">
                        COLLECTION PARAMETER REPORT {displayMonth}
                    </th>
                </tr>
                <tr className="bg-[#6b8e23] border-b border-black-200 font-bold text-white uppercase tracking-wider text-[11px]">
                  <th className="p-3 border-r border-black-200/20" colSpan="7"></th>
                  <th className="p-3 text-center border-r border-black-200/20 text-red-500 font-bold bg-[#8fbc8f]">Week 1</th>
                  <th className="p-3 text-center border-r border-black-200/20 text-red-500 font-bold bg-[#8fbc8f]">Week 2</th>
                  <th className="p-3 text-center border-r border-black-200/20 text-red-500 font-bold bg-[#8fbc8f]">Week 3</th>
                  <th className="p-3 text-center border-r border-black-200/20 text-red-500 font-bold bg-[#8fbc8f]">Week 4</th>
                  <th className="p-3 text-center text-red-500 font-bold bg-[#8fbc8f]">Week 5</th>
                </tr>
                <tr className="bg-[#8b3a3a] border-b border-black-200 font-bold text-white tracking-wider text-[11px]">
                  <th className="p-3 w-14 text-center border-r border-black-200/20">S NO</th>
                  <th className="p-3 border-r border-black-200/20 text-center uppercase">COLLECTIONS</th>
                  <th className="p-3 w-28 text-center border-r border-black-200/20 uppercase">TOTAL</th>
                  <th className="p-3 w-16 text-center border-r border-black-200/20">Unit</th>
                  <th className="p-3 w-28 text-center border-r border-black-200/20 uppercase">TARGET</th>
                  <th className="p-3 w-28 text-center border-r border-black-200/20 uppercase">ACTUAL</th>
                  <th className="p-3 w-16 text-center border-r border-black-200/20">%</th>
                  <th className="p-3 w-24 text-center border-r border-black-200/20 uppercase">ACTUAL</th>
                  <th className="p-3 w-24 text-center border-r border-black-200/20 uppercase">ACTUAL</th>
                  <th className="p-3 w-24 text-center border-r border-black-200/20 uppercase">ACTUAL</th>
                  <th className="p-3 w-24 text-center border-r border-black-200/20 uppercase">ACTUAL</th>
                  <th className="p-3 w-24 text-center uppercase">ACTUAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black-200 font-sans">
                {rows.map((row, index) => {
                  const targetVal = targets[row.key] || 0;
                  const actObj = actuals[row.actKey] || { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 };
                  
                  return (
                  <tr key={row.key} className="hover:bg-black-50 transition align-middle bg-white">
                    <td className="p-3 text-center font-bold text-black-500 border-r border-black-100">
                      {index + 1}
                    </td>
                    <td className="p-3 font-semibold text-black-700 border-r border-black-100">
                      {row.label}
                    </td>
                    <td className="p-3 text-center font-extrabold text-black-800 border-r border-black-100">
                      {fmt(actObj.total, row.isFloat)}
                    </td>
                    <td className="p-3 text-center text-black-600 font-semibold border-r border-black-100">
                      {row.unit}
                    </td>
                    <td className="p-3 text-center border-r border-black-100 bg-black-50/50">
                      <input
                        type="number"
                        placeholder="0"
                        step={row.isFloat ? '0.01' : '1'}
                        value={targetVal || ''}
                        onChange={(e) => handleUpdateTarget(row.key, e.target.value)}
                        className="px-2 py-1.5 bg-white border border-black-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006838] text-[12px] font-bold text-center w-20"
                      />
                    </td>
                    <td className="p-3 text-center font-extrabold text-[#006838] border-r border-black-100">
                      {fmt(actObj.actual, row.isFloat)}
                    </td>
                    <td className="p-3 text-center font-bold text-black-600 border-r border-black-100">
                      {calculatePercentage(actObj.actual, targetVal)}
                    </td>
                    <td className="p-3 text-center text-black-600 font-semibold border-r border-black-100">
                      {fmt(actObj.w1, row.isFloat)}
                    </td>
                    <td className="p-3 text-center text-black-600 font-semibold border-r border-black-100">
                      {fmt(actObj.w2, row.isFloat)}
                    </td>
                    <td className="p-3 text-center text-black-600 font-semibold border-r border-black-100">
                      {fmt(actObj.w3, row.isFloat)}
                    </td>
                    <td className="p-3 text-center text-black-600 font-semibold border-r border-black-100">
                      {fmt(actObj.w4, row.isFloat)}
                    </td>
                    <td className="p-3 text-center text-black-600 font-semibold">
                      {fmt(actObj.w5, row.isFloat)}
                    </td>
                  </tr>
                )})}

                {/* Overall Percentage Row */}
                <tr className="bg-black-50/50 transition align-middle border-t border-black-200">
                  <td className="p-3 border-r border-black-100" colSpan="2"></td>
                  <td className="p-3 font-bold text-black-700 uppercase border-r border-black-100 text-right pr-6" colSpan="4">
                    Over all Percentage
                  </td>
                  <td className="p-3 text-center font-extrabold text-[#006838] border-r border-black-100 bg-emerald-50">
                    {overallPerformance}
                  </td>
                  <td className="p-3 border-r border-black-100" colSpan="4"></td>
                  <td className="p-3"></td>
                </tr>

              </tbody>
            </table>

          </div>
        )}
      </div>

    </div>
  );
};

export default ParameterPlanning;
