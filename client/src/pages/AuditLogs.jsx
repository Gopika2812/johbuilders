import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { History, Calendar, User, Search, Filter, ChevronLeft, ChevronRight, RefreshCw, Layers } from 'lucide-react';

const AuditLogs = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [uniqueActions, setUniqueActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [limit] = useState(15);
  
  // Expanded log IDs for showing diffs
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [token, page, selectedAction, fromDate, toDate]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_URL}/audit-logs?page=${page}&limit=${limit}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectedAction) url += `&action=${encodeURIComponent(selectedAction)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
        setTotalLogs(data.pagination.totalLogs);
        if (data.uniqueActions) {
          setUniqueActions(data.uniqueActions);
        }
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (err) {
      setError('Connection error fetching audit records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedAction('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('Create') || action.includes('Booked')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (action.includes('Update') || action.includes('Stage')) {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    if (action.includes('Delete') || action.includes('Lost')) {
      return 'bg-red-50 text-red-700 border-red-100';
    }
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  const formatFieldName = (name) => {
    // converts camelCase fields to Title Case spaced strings
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div className="space-y-6 text-left">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0e623a] p-6 text-white rounded-3xl shadow-sm relative overflow-hidden">
        <h3 className="text-lg font-black flex items-center gap-2 relative z-10">
          <History className="w-5 h-5 text-emerald-300" />
          <span>System Audit Logs & Operations Tracking</span>
        </h3>
        <p className="text-emerald-100 text-xs mt-1 max-w-xl relative z-10 leading-relaxed">
          Monitor administrative operations, lead stage updates, and quotation parameter modifications. Clicking on modified rows displays previous values and edited values.
        </p>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-8 pointer-events-none select-none">
          <History className="w-32 h-32" />
        </div>
      </div>

      {/* Filters Form Container */}
      <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Keyword Search */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Search Logs</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search user, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-700 font-bold focus:outline-none border-none p-0"
              />
            </div>
          </div>

          {/* Action dropdown */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filter Action</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-xs text-gray-700 font-bold focus:outline-none border-none p-0 cursor-pointer"
              >
                <option value="">All Actions</option>
                {uniqueActions.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From Date</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-gray-450 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-xs text-gray-700 font-bold focus:outline-none border-none p-0"
              />
            </div>
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To Date</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-gray-450 shrink-0" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-xs text-gray-700 font-bold focus:outline-none border-none p-0"
              />
            </div>
          </div>

          {/* Controls button */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs List Frame */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0e623a]"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 italic text-xs">
            No audit logs found matching the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              const hasDiff = log.metadata?.changedFields && log.metadata.changedFields.length > 0;
              const isExpanded = expandedLogId === log._id;

              return (
                <div 
                  key={log._id} 
                  className={`p-5 transition-all duration-150 ${hasDiff ? 'cursor-pointer hover:bg-gray-50/50' : 'hover:bg-gray-50/30'}`}
                  onClick={() => {
                    if (hasDiff) {
                      setExpandedLogId(isExpanded ? null : log._id);
                    }
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#0e623a] flex items-center justify-center text-xs font-extrabold uppercase border border-emerald-100 shrink-0">
                        {log.userName ? log.userName.slice(0, 2) : 'EM'}
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-gray-800 text-xs">{log.userName}</span>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-extrabold uppercase tracking-wide">
                            {log.userRole}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                          {hasDiff && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">
                              Click to view edits
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-xs font-medium leading-relaxed max-w-2xl">{log.description}</p>
                      </div>
                    </div>

                    {/* Date / Timestamp */}
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold shrink-0 md:text-right pl-13 md:pl-0">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Diff Visualizer Dropdown Box */}
                  {hasDiff && isExpanded && (
                    <div className="mt-4 ml-13 bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-3 text-left animate-fadeIn">
                      <div className="flex items-center gap-1.5 text-[#0e623a] font-bold text-xs border-b pb-2">
                        <Layers className="w-4 h-4" />
                        <span>Modified Parameter Diffs (Before vs. After)</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200">
                              <th className="pb-2 w-1/3">Field Name</th>
                              <th className="pb-2 w-1/3 text-red-650">Previous Value</th>
                              <th className="pb-2 w-1/3 text-emerald-700">Edited Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-sans text-xs">
                            {log.metadata.changedFields.map((f, fIdx) => (
                              <tr key={fIdx} className="hover:bg-gray-100/40 transition">
                                <td className="py-2.5 font-extrabold text-gray-600">
                                  {formatFieldName(f.field)}
                                </td>
                                <td className="py-2.5 text-red-600 font-semibold line-through decoration-red-300">
                                  {f.prev || 'empty'}
                                </td>
                                <td className="py-2.5 text-emerald-800 font-black">
                                  {f.next || 'empty'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginated Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-bold uppercase">
              Total {totalLogs} Logs • Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 bg-white border rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-white border rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
