import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  DollarSign, 
  Search, 
  Calendar, 
  Folder, 
  FolderOpen,
  Save, 
  TrendingUp, 
  SlidersHorizontal,
  Plus,
  X,
  Clock,
  Trash2
} from 'lucide-react';

const BudgetPlanning = () => {
  const { token } = useAuth();
  
  // Date and filter states
  const getCurrentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth()); // Format: YYYY-MM
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data states
  const [leadGroups, setLeadGroups] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState([]);

  const toggleGroupCollapse = (groupName) => {
    setCollapsedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName) 
        : [...prev, groupName]
    );
  };

  // Daily Expense Modal states
  const [activeExpenseSource, setActiveExpenseSource] = useState(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  const handleOpenExpenseModal = (sourceName) => {
    setActiveExpenseSource(sourceName);
    
    // Set default local time for date input (YYYY-MM-DDTHH:MM)
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, 16);
    
    setExpenseDate(localISOTime);
    setExpenseAmount('');
    setExpenseDescription('');
  };

  const handleAddExpenseItem = (e) => {
    e.preventDefault();
    const amountNum = Number(expenseAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    const currentExpenses = allocations[activeExpenseSource]?.expenses || [];
    const newExpense = {
      amount: amountNum,
      date: new Date(expenseDate).toISOString(),
      description: expenseDescription.trim() || 'Log expenditure'
    };

    const updatedExpenses = [...currentExpenses, newExpense];
    const totalSpent = updatedExpenses.reduce((sum, item) => sum + item.amount, 0);

    setAllocations(prev => ({
      ...prev,
      [activeExpenseSource]: {
        ...prev[activeExpenseSource],
        spent: totalSpent,
        expenses: updatedExpenses
      }
    }));

    setExpenseAmount('');
    setExpenseDescription('');
  };

  const handleRemoveExpenseItem = (index) => {
    const currentExpenses = allocations[activeExpenseSource]?.expenses || [];
    const updatedExpenses = currentExpenses.filter((_, idx) => idx !== index);
    const totalSpent = updatedExpenses.reduce((sum, item) => sum + item.amount, 0);

    setAllocations(prev => ({
      ...prev,
      [activeExpenseSource]: {
        ...prev[activeExpenseSource],
        spent: totalSpent,
        expenses: updatedExpenses
      }
    }));
  };

  useEffect(() => {
    fetchInitialData();
  }, [selectedMonth]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Lead Groups
      const groupsRes = await fetch(`${API_URL}/lead-groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let activeGroups = [];
      if (groupsRes.ok) {
        activeGroups = await groupsRes.json();
        setLeadGroups(activeGroups);
      }

      // 2. Fetch Budget Plan for current month
      const planRes = await fetch(`${API_URL}/budget-plans/${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const newAllocations = {};
      
      // Seed default allocations (0) for all existing sources
      activeGroups.forEach(group => {
        group.sources?.forEach(src => {
          newAllocations[src] = { budget: 0, spent: 0, groupName: group.name, expenses: [] };
        });
      });

      if (planRes.ok) {
        const planData = await planRes.json();
        if (planData && planData.allocations) {
          planData.allocations.forEach(alloc => {
            if (newAllocations[alloc.source]) {
              newAllocations[alloc.source].budget = alloc.budget || 0;
              newAllocations[alloc.source].spent = alloc.spent || 0;
              newAllocations[alloc.source].expenses = alloc.expenses || [];
            } else {
              // Source might be unassigned or legacy
              newAllocations[alloc.source] = {
                budget: alloc.budget || 0,
                spent: alloc.spent || 0,
                groupName: alloc.groupName || 'Unassigned',
                expenses: alloc.expenses || []
              };
            }
          });
        }
      }
      
      setAllocations(newAllocations);
    } catch (err) {
      console.error('Error loading budget planner:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAllocation = (source, field, val) => {
    const numVal = Number(val) || 0;
    setAllocations(prev => ({
      ...prev,
      [source]: {
        ...prev[source],
        [field]: numVal
      }
    }));
  };

  const handleSavePlan = async () => {
    // Transform allocations object into array format expected by backend
    const allocationsArray = Object.keys(allocations).map(sourceName => ({
      groupName: allocations[sourceName].groupName,
      source: sourceName,
      budget: allocations[sourceName].budget,
      spent: allocations[sourceName].spent,
      expenses: allocations[sourceName].expenses || []
    }));

    try {
      const response = await fetch(`${API_URL}/budget-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          allocations: allocationsArray
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save budget plan configuration.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving budget details.');
    }
  };

  // Helper to calculate totals for a specific group
  const calculateGroupTotals = (group) => {
    let totalBudget = 0;
    let totalSpent = 0;
    
    group.sources?.forEach(src => {
      if (allocations[src]) {
        totalBudget += allocations[src].budget || 0;
        totalSpent += allocations[src].spent || 0;
      }
    });

    return { totalBudget, totalSpent };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left animate-fadeIn">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-gray-100 shadow-sm rounded-3xl">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800">Budget Planning</h2>
          <p className="text-xs text-gray-500 mt-1">Plan and track budget vs spent metrics for all client lead source types</p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Budget Plan Saved!
            </span>
          )}
          <button
            onClick={handleSavePlan}
            className="px-5 py-2.5 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Budget Plan</span>
          </button>
        </div>
      </div>

      {/* Main Budget Sheet */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-6">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute left-3 top-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search lead source type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-gray-700"
            />
          </div>

          {/* Month selector */}
          <div className="relative w-full sm:max-w-xs flex items-center gap-2 justify-end">
            <span className="text-xs font-bold text-gray-450 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Month:</span>
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-gray-700 font-bold"
            />
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="py-20 text-center text-gray-500 italic">
            Loading allocations planner sheet...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-16">S.NO.</th>
                  <th className="p-4">LEAD SOURCE TYPE</th>
                  <th className="p-4 w-44 text-right">BUDGET (₹)</th>
                  <th className="p-4 w-44 text-right">SPENT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {leadGroups.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-400 italic">
                      No lead groups configured. Configure lead source groups in Settings first.
                    </td>
                  </tr>
                ) : (
                  leadGroups.map((group) => {
                    // Filter child sources based on search query
                    const visibleSources = group.sources?.filter(src => 
                      src.toLowerCase().includes(searchQuery.toLowerCase())
                    ) || [];

                    // Skip displaying group if search query matches nothing in the group
                    if (searchQuery && visibleSources.length === 0) return null;

                    const { totalBudget, totalSpent } = calculateGroupTotals(group);

                    return (
                      <React.Fragment key={group._id}>
                        {/* Parent Group Header Row */}
                        <tr 
                          onClick={() => toggleGroupCollapse(group.name)}
                          className="bg-gray-50/70 border-y border-gray-150 font-bold text-gray-800 cursor-pointer hover:bg-gray-100/80 transition select-none"
                          title="Click to collapse/expand lead sources"
                        >
                          <td className="p-4 text-center">
                            {collapsedGroups.includes(group.name) ? (
                              <Folder className="w-4 h-4 text-amber-500 mx-auto" />
                            ) : (
                              <FolderOpen className="w-4 h-4 text-amber-500 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 uppercase tracking-wider text-xs font-extrabold flex items-center gap-2">
                            <span>{group.name}</span>
                            <span className="text-[9px] text-gray-400 font-normal">
                              ({collapsedGroups.includes(group.name) ? 'click to expand' : 'click to collapse'})
                            </span>
                          </td>
                          <td className="p-4 text-right font-extrabold text-emerald-700 text-sm">
                            ₹{totalBudget.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-extrabold text-red-600 text-sm">
                            ₹{totalSpent.toLocaleString()}
                          </td>
                        </tr>

                        {/* Child Rows for Lead Sources */}
                        {!collapsedGroups.includes(group.name) && visibleSources.map((src, index) => {
                          const allocation = allocations[src] || { budget: 0, spent: 0 };
                          return (
                            <tr key={src} className="hover:bg-emerald-50/5 transition align-middle">
                              <td className="p-4 text-center text-gray-400 font-semibold">
                                {index + 1}
                              </td>
                              <td className="p-4 font-semibold text-gray-700 pl-8 uppercase">
                                ↳ {src}
                              </td>
                              <td className="p-4 text-right">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={allocation.budget || ''}
                                  onChange={(e) => handleUpdateAllocation(src, 'budget', e.target.value)}
                                  className="px-3 py-1.5 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-right w-36 mx-auto inline-block"
                                />
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2 w-36 ml-auto">
                                  <span className="font-extrabold text-gray-700 text-xs">
                                    ₹{(allocation.spent || 0).toLocaleString()}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenExpenseModal(src)}
                                    className="px-2.5 py-1.5 bg-[#0e623a]/10 hover:bg-[#0e623a]/25 text-[#0e623a] text-[10px] font-bold rounded-lg transition flex items-center gap-1"
                                    title="View/Add Daily Expense Logs"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Log</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      {/* Daily Expense Logging Modal */}
      {activeExpenseSource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col justify-between transform transition-all duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="text-left">
                <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0e623a]" />
                  <span>Log Daily Expenditure</span>
                </h3>
                <p className="text-[10px] text-gray-405 mt-1 uppercase tracking-wider font-bold">
                  Channel: <span className="text-[#0e623a]">{activeExpenseSource}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveExpenseSource(null)}
                className="p-1.5 hover:bg-gray-150 rounded-full text-gray-405 hover:text-gray-750 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto text-left">
              
              {/* Form to Log New Expenditure */}
              <form onSubmit={handleAddExpenseItem} className="bg-emerald-50/30 border border-emerald-100/55 p-4 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-gray-700">Add New Entry</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Description / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly billing, print advertisement setup..."
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition flex items-center gap-1 ml-auto shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Entry</span>
                </button>
              </form>

              {/* Log History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-700">Logged History</h4>
                
                <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-inner max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-550 uppercase tracking-wider text-[9px]">
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3 w-40">Date & Time</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 w-28 text-right">Amount</th>
                        <th className="p-3 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {(!allocations[activeExpenseSource]?.expenses || allocations[activeExpenseSource].expenses.length === 0) ? (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-400 italic">
                            No expenditures logged for this channel. Log one above!
                          </td>
                        </tr>
                      ) : (
                        allocations[activeExpenseSource].expenses.map((exp, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="p-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                            <td className="p-3 text-gray-500">
                              {new Date(exp.date).toLocaleString()}
                            </td>
                            <td className="p-3 font-semibold text-gray-750 truncate max-w-[180px]">
                              {exp.description}
                            </td>
                            <td className="p-3 text-right font-extrabold text-red-600">
                              ₹{(exp.amount || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveExpenseItem(idx)}
                                className="p-1 text-gray-450 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Remove Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-3xl">
              <div className="text-xs font-bold text-gray-550">
                <span>Total Accumulated Spent: </span>
                <span className="text-red-650 text-sm font-extrabold ml-1">
                  ₹{(allocations[activeExpenseSource]?.spent || 0).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleSavePlan();
                  setActiveExpenseSource(null);
                }}
                className="px-4 py-2 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition shadow-sm flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Close</span>
              </button>
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default BudgetPlanning;
