import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const DateRangeFilter = ({ fromDate, toDate, onDateChange, label = 'Date Filtration' }) => {
  const [filterMode, setFilterMode] = useState('month'); // 'month', 'custom', 'this_month', 'last_month', 'quarterly', 'half_yearly', 'yearly', 'financial_year'
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonthVal, setSelectedMonthVal] = useState(() => {
    if (fromDate) return fromDate.substring(0, 7);
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [selectedHalfYear, setSelectedHalfYear] = useState('H1');

  useEffect(() => {
    if (fromDate && filterMode === 'month') {
      const ym = fromDate.substring(0, 7);
      if (ym && ym !== selectedMonthVal) {
        setSelectedMonthVal(ym);
      }
    }
  }, [fromDate, filterMode]);

  // Generate Year options (e.g. 2020 to 2030)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Sync preset changes to parent date range
  const applyFilterMode = (mode, year = selectedYear, monthVal = selectedMonthVal, q = selectedQuarter, h = selectedHalfYear) => {
    const now = new Date();
    let start = '';
    let end = '';

    if (mode === 'this_month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const lastD = new Date(y, m + 1, 0).getDate();
      start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`;
    } else if (mode === 'last_month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = prev.getFullYear();
      const m = prev.getMonth();
      const lastD = new Date(y, m + 1, 0).getDate();
      start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`;
    } else if (mode === 'month') {
      const [y, m] = monthVal.split('-').map(Number);
      if (y && m) {
        const lastD = new Date(y, m, 0).getDate();
        start = `${y}-${String(m).padStart(2, '0')}-01`;
        end = `${y}-${String(m).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`;
      }
    } else if (mode === 'quarterly') {
      const y = year;
      if (q === 'Q1') {
        start = `${y}-01-01`;
        end = `${y}-03-31`;
      } else if (q === 'Q2') {
        start = `${y}-04-01`;
        end = `${y}-06-30`;
      } else if (q === 'Q3') {
        start = `${y}-07-01`;
        end = `${y}-09-30`;
      } else if (q === 'Q4') {
        start = `${y}-10-01`;
        end = `${y}-12-31`;
      } else if (q === 'FY_Q1') {
        start = `${y}-04-01`;
        end = `${y}-06-30`;
      } else if (q === 'FY_Q2') {
        start = `${y}-07-01`;
        end = `${y}-09-30`;
      } else if (q === 'FY_Q3') {
        start = `${y}-10-01`;
        end = `${y}-12-31`;
      } else if (q === 'FY_Q4') {
        start = `${y + 1}-01-01`;
        end = `${y + 1}-03-31`;
      }
    } else if (mode === 'half_yearly') {
      const y = year;
      if (h === 'H1') {
        start = `${y}-01-01`;
        end = `${y}-06-30`;
      } else if (h === 'H2') {
        start = `${y}-07-01`;
        end = `${y}-12-31`;
      } else if (h === 'FY_H1') {
        start = `${y}-04-01`;
        end = `${y}-09-30`;
      } else if (h === 'FY_H2') {
        start = `${y}-10-01`;
        end = `${y + 1}-03-31`;
      }
    } else if (mode === 'yearly') {
      start = `${year}-01-01`;
      end = `${year}-12-31`;
    } else if (mode === 'financial_year') {
      start = `${year}-04-01`;
      end = `${year + 1}-03-31`;
    }

    if (mode !== 'custom' && start && end) {
      onDateChange(start, end);
    }
  };

  const handleModeChange = (newMode) => {
    setFilterMode(newMode);
    applyFilterMode(newMode);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black text-[#0e623a] uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#0e623a]" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] text-white font-extrabold bg-gradient-to-r from-[#0e623a] to-[#0b4d2d] px-2.5 py-0.5 rounded-full shadow-xs tracking-tight">
          {fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`}
        </span>
      </div>

      {/* Date UI Container highlighted slightly */}
      <div className="flex flex-wrap items-center gap-2 bg-[#f0fbf4] border border-[#0e623a]/25 p-1.5 rounded-2xl shadow-[0_2px_10px_rgba(14,98,58,0.06)] transition-all hover:border-[#0e623a]/40">
        {/* Preset Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-white border border-[#0e623a]/30 px-3 py-1.5 rounded-xl shadow-xs shrink-0 hover:border-[#0e623a] transition">
          <Calendar className="w-4 h-4 text-[#0e623a] shrink-0" />
          <select
            value={filterMode}
            onChange={(e) => handleModeChange(e.target.value)}
            className="bg-transparent text-xs text-[#0e623a] font-extrabold focus:outline-none cursor-pointer border-0 p-0"
          >
            <option value="month">Month Wise</option>
            <option value="custom">Custom Date Range</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="quarterly">Quarterly</option>
            <option value="half_yearly">Half Yearly</option>
            <option value="yearly">Yearly (Calendar)</option>
            <option value="financial_year">Annual (Financial Year)</option>
          </select>
        </div>

        {/* Dynamic Controls based on selected mode */}
        {filterMode === 'month' && (
          <div className="flex items-center gap-1.5 bg-white border border-[#0e623a]/30 px-3 py-1.5 rounded-xl shadow-xs hover:border-[#0e623a] transition">
            <input
              type="month"
              value={selectedMonthVal}
              onChange={(e) => {
                setSelectedMonthVal(e.target.value);
                applyFilterMode('month', selectedYear, e.target.value);
              }}
              className="bg-transparent text-xs text-[#0e623a] font-extrabold focus:outline-none cursor-pointer p-0 border-0"
            />
          </div>
        )}

        {filterMode === 'quarterly' && (
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                setSelectedYear(y);
                applyFilterMode('quarterly', y);
              }}
              className="bg-white border border-[#0e623a]/30 px-2 py-1.5 rounded-xl text-xs text-[#0e623a] font-bold cursor-pointer"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedQuarter}
              onChange={(e) => {
                const q = e.target.value;
                setSelectedQuarter(q);
                applyFilterMode('quarterly', selectedYear, selectedMonthVal, q);
              }}
              className="bg-white border border-[#0e623a]/30 px-2 py-1.5 rounded-xl text-xs text-[#0e623a] font-bold cursor-pointer"
            >
              <option value="Q1">Q1 (Jan - Mar)</option>
              <option value="Q2">Q2 (Apr - Jun)</option>
              <option value="Q3">Q3 (Jul - Sep)</option>
              <option value="Q4">Q4 (Oct - Dec)</option>
              <option value="FY_Q1">FY Q1 (Apr - Jun)</option>
              <option value="FY_Q2">FY Q2 (Jul - Sep)</option>
              <option value="FY_Q3">FY Q3 (Oct - Dec)</option>
              <option value="FY_Q4">FY Q4 (Jan - Mar)</option>
            </select>
          </div>
        )}

        {filterMode === 'half_yearly' && (
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                setSelectedYear(y);
                applyFilterMode('half_yearly', y);
              }}
              className="bg-white border border-[#0e623a]/30 px-2 py-1.5 rounded-xl text-xs text-[#0e623a] font-bold cursor-pointer"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedHalfYear}
              onChange={(e) => {
                const h = e.target.value;
                setSelectedHalfYear(h);
                applyFilterMode('half_yearly', selectedYear, selectedMonthVal, selectedQuarter, h);
              }}
              className="bg-white border border-[#0e623a]/30 px-2 py-1.5 rounded-xl text-xs text-[#0e623a] font-bold cursor-pointer"
            >
              <option value="H1">H1 (Jan - Jun)</option>
              <option value="H2">H2 (Jul - Dec)</option>
              <option value="FY_H1">FY H1 (Apr - Sep)</option>
              <option value="FY_H2">FY H2 (Oct - Mar)</option>
            </select>
          </div>
        )}

        {(filterMode === 'yearly' || filterMode === 'financial_year') && (
          <div className="flex items-center gap-1.5 bg-white border border-[#0e623a]/30 px-3 py-1.5 rounded-xl">
            <select
              value={selectedYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                setSelectedYear(y);
                applyFilterMode(filterMode, y);
              }}
              className="bg-transparent text-xs text-[#0e623a] font-bold focus:outline-none cursor-pointer border-0 p-0"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>
                  {filterMode === 'financial_year' ? `FY ${y}-${(y + 1).toString().slice(2)}` : `Year ${y}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Inputs for Custom or Fine-tuning */}
        <div className="flex items-center gap-1.5 bg-white border border-[#0e623a]/30 px-3 py-1.5 rounded-xl shadow-xs hover:border-[#0e623a] transition">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFilterMode('custom');
              onDateChange(e.target.value, toDate);
            }}
            className="w-[125px] bg-transparent text-xs text-[#0e623a] font-extrabold focus:outline-none border-0 p-0 text-center cursor-pointer"
          />
          <span className="text-[11px] text-[#0e623a]/70 font-black uppercase">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setFilterMode('custom');
              onDateChange(fromDate, e.target.value);
            }}
            className="w-[125px] bg-transparent text-xs text-[#0e623a] font-extrabold focus:outline-none border-0 p-0 text-center cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
