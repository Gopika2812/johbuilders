import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  FileText, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  Building, 
  User, 
  Phone, 
  Calendar,
  AlertCircle,
  Loader2,
  Filter,
  RotateCcw
} from 'lucide-react';

const SOURCE_TYPES = [
  'Paper Ad',
  'Railway station Hoardings (Rental)',
  'Local TV',
  'FM Radio',
  'Airport Advertisement - Tuticorin',
  'Hydrogen Balloon',
  'Notice distribution',
  'Unipole',
  'LED board behind park',
  'Pearl Bliss Tuticorin Project',
  'Satellite Channel',
  '99acres',
  'Housing.com',
  'Facebook',
  'Instagram',
  'Youtube',
  'Real Estate',
  'Magicbricks',
  'Website',
  'Direct',
  'Direct Visit',
  'Old Customer',
  'Reference',
  'Flexboard/Banner',
  'Stall'
];

const QuotationsDirectory = () => {
  const { token, hasColumnPermission, isAdmin } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchQuotations();
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/employees?excludeSuperadmin=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter(emp => 
          emp.role !== 'Superadmin' && 
          emp.role?.toLowerCase() !== 'super admin' && 
          emp.name?.toLowerCase() !== 'super admin' && 
          emp.name !== 'Super Admin'
        ));
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const updateCrdPerson = async (quotationId, userId) => {
    try {
      const res = await fetch(`${API_URL}/quotations/${quotationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ crdPerson: userId })
      });
      if (res.ok) {
        const updated = await res.json();
        setQuotations(prev => prev.map(q => q._id === quotationId ? updated : q));
        setSuccess('CRD Person assigned successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to assign CRD Person');
      }
    } catch (err) {
      setError('Error assigning CRD Person');
    }
  };

  const updatePedPerson = async (quotationId, userId) => {
    try {
      const res = await fetch(`${API_URL}/quotations/${quotationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pedPerson: userId })
      });
      if (res.ok) {
        const updated = await res.json();
        setQuotations(prev => prev.map(q => q._id === quotationId ? updated : q));
        setSuccess('PED Person assigned successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to assign PED Person');
      }
    } catch (err) {
      setError('Error assigning PED Person');
    }
  };

  const updateAccountsPerson = async (quotationId, userId) => {
    try {
      const res = await fetch(`${API_URL}/quotations/${quotationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accountsPerson: userId })
      });
      if (res.ok) {
        const updated = await res.json();
        setQuotations(prev => prev.map(q => q._id === quotationId ? updated : q));
        setSuccess('Accounts Person assigned successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to assign Accounts Person');
      }
    } catch (err) {
      setError('Error assigning Accounts Person');
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await fetch(`${API_URL}/quotations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuotations(data);
      } else {
        setError('Failed to fetch quotation records');
      }
    } catch (err) {
      setError('Connection error loading quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/quotations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Quotation deleted successfully');
        setQuotations(quotations.filter(q => q._id !== id));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete quotation');
      }
    } catch (err) {
      setError('Connection error deleting quotation');
    } finally {
      setDeletingId(null);
    }
  };

  // Get all unique lead sources
  const allAvailableSources = Array.from(
    new Set([
      ...SOURCE_TYPES,
      ...quotations.map(q => q.lead?.leadSource).filter(Boolean)
    ])
  ).sort();

  const filteredQuotations = quotations.filter(q => {
    const term = searchTerm.toLowerCase();
    const custName = `${q.lead?.salutation ? `${q.lead.salutation} ` : ''}${q.customerName || ''}`.toLowerCase();
    const matchesSearch = !searchTerm ||
      custName.includes(term) ||
      (q.customerPhone || '').includes(term) ||
      (q.project?.code || '').toLowerCase().includes(term) ||
      (q.project?.name || '').toLowerCase().includes(term);

    const source = q.lead?.leadSource || 'Direct Visit';
    const matchesSource = !selectedSource || source.toLowerCase() === selectedSource.toLowerCase();

    const qDate = q.createdAt ? new Date(q.createdAt).getTime() : null;
    const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
    const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

    const matchesStartDate = !start || !qDate || qDate >= start;
    const matchesEndDate = !end || !qDate || qDate <= end;

    return matchesSearch && matchesSource && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="space-y-6">
      {/* Upper Title Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-black-150 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-black-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#0e623a]" />
            <span>Quotation Records Directory</span>
          </h2>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl animate-fade-in">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar Control Group */}
      <div className="bg-white border border-black-150 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative md:col-span-4">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-black-400" />
            </span>
            <input
              type="text"
              placeholder="Search by customer name, phone, project code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold text-black-700 placeholder-black-400"
            />
          </div>

          {/* Lead Source Filter */}
          <div className="md:col-span-3 flex items-center gap-1.5 bg-black-50 border border-black-200 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[#0e623a]">
            <Filter className="w-3.5 h-3.5 text-black-400 shrink-0" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-black-700 outline-none cursor-pointer"
            >
              <option value="">All Lead Sources</option>
              {allAvailableSources.map((src, i) => (
                <option key={i} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Date Filtration: From Date -> To Date */}
          <div className="md:col-span-4 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 bg-black-50 border border-black-200 rounded-xl px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-[#0e623a]">
              <span className="text-[10px] font-bold text-black-400 uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-black-700 outline-none cursor-pointer"
              />
            </div>
            <div className="flex-1 flex items-center gap-1.5 bg-black-50 border border-black-200 rounded-xl px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-[#0e623a]">
              <span className="text-[10px] font-bold text-black-400 uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-black-700 outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Reset / Clear Button */}
          <div className="md:col-span-1 flex justify-end">
            {(searchTerm || selectedSource || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSource('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition border border-red-200 cursor-pointer"
                title="Clear all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Date Presets & Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-black-400 uppercase">Presets:</span>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = now.getMonth();
                setStartDate(`${y}-${String(m + 1).padStart(2, '0')}-01`);
                const lastD = new Date(y, m + 1, 0).getDate();
                setEndDate(`${y}-${String(m + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`);
              }}
              className="px-2.5 py-1 bg-black-50 hover:bg-[#0e623a]/10 hover:text-[#0e623a] text-black-600 text-[11px] font-bold rounded-lg border border-black-200 transition cursor-pointer"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                setStartDate(`${y}-${String(m + 1).padStart(2, '0')}-01`);
                const lastD = new Date(y, m + 1, 0).getDate();
                setEndDate(`${y}-${String(m + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`);
              }}
              className="px-2.5 py-1 bg-black-50 hover:bg-[#0e623a]/10 hover:text-[#0e623a] text-black-600 text-[11px] font-bold rounded-lg border border-black-200 transition cursor-pointer"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const y = now.getFullYear();
                setStartDate(`${y}-01-01`);
                setEndDate(`${y}-12-31`);
              }}
              className="px-2.5 py-1 bg-black-50 hover:bg-[#0e623a]/10 hover:text-[#0e623a] text-black-600 text-[11px] font-bold rounded-lg border border-black-200 transition cursor-pointer"
            >
              This Year
            </button>
          </div>

          <div className="text-black-600 font-bold text-xs flex items-center gap-3">
            <span>Showing <strong className="text-black-800">{filteredQuotations.length}</strong> of {quotations.length} records</span>
            <span className="text-[#0e623a] bg-[#0e623a]/10 px-2.5 py-0.5 rounded-lg border border-[#0e623a]/20">
              Total: <strong>₹{filteredQuotations.reduce((sum, q) => sum + (q.totalValue || 0), 0).toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Grid Card */}
      {loading ? (
        <div className="p-12 text-center text-xs text-black-400">Loading quotation database records...</div>
      ) : (
        <div className="bg-white border border-black-150 shadow-sm rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black-50 border-b border-black-150 text-xs font-bold text-black-500 uppercase tracking-wider">
                  {hasColumnPermission('quotations', 'customerDetails') && <th className="p-4">Customer Details</th>}
                  {hasColumnPermission('quotations', 'project') && <th className="p-4">Project</th>}
                  {hasColumnPermission('quotations', 'quotedUnits') && <th className="p-4">Quoted Units</th>}
                  {hasColumnPermission('quotations', 'totalValue') && <th className="p-4">Total Value</th>}
                  {hasColumnPermission('quotations', 'preparedBy') && <th className="p-4">Prepared By</th>}
                  {hasColumnPermission('quotations', 'createdDate') && <th className="p-4">Created Date</th>}
                  {hasColumnPermission('quotations', 'crdPerson') && <th className="p-4">CRD Person</th>}
                  {hasColumnPermission('quotations', 'pedPerson') && <th className="p-4">PED Person</th>}
                  {hasColumnPermission('quotations', 'accountsPerson') && <th className="p-4">Accounts Person</th>}
                  {hasColumnPermission('quotations', 'actions') && <th className="p-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black-100 text-sm">
                {filteredQuotations.map(q => (
                  <tr key={q._id} className="hover:bg-black-50/50 transition duration-150">
                    {/* Customer */}
                    {hasColumnPermission('quotations', 'customerDetails') && (
                      <td className="p-4">
                        <div className="font-bold text-black-800 flex items-center gap-1.5 flex-wrap">
                          <span>{q.lead?.salutation && !q.customerName?.startsWith(q.lead.salutation) ? `${q.lead.salutation} ` : ''}{q.customerName}</span>
                          {q.lead?.leadSource && (
                            <span className="px-2 py-0.5 bg-[#0e623a]/10 text-[#0e623a] text-[10px] font-extrabold rounded-md border border-[#0e623a]/20 shrink-0">
                              {q.lead.leadSource}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-black-400 mt-1">
                          <Phone className="w-3 h-3 text-black-300" />
                          <span>{q.customerPhone}</span>
                        </div>
                      </td>
                    )}

                    {/* Project */}
                    {hasColumnPermission('quotations', 'project') && (
                      <td className="p-4">
                        <div className="font-bold text-black-700 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-[#0e623a]/75" />
                          <span>{q.project?.code || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-black-400 mt-0.5">{q.project?.name || ''}</div>
                      </td>
                    )}

                    {/* Quoted Units */}
                    {hasColumnPermission('quotations', 'quotedUnits') && (
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {q.selectedUnits?.map((unit, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-[#0e623a]/10 text-[#0e623a] text-xs font-bold rounded-lg border border-[#0e623a]/20">
                              {unit}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-black-500 font-semibold">
                          Type: {q.projectType} • Total Area: {q.totalArea?.toLocaleString()} Sq.Ft
                        </div>
                      </td>
                    )}

                    {/* Total Value */}
                    {hasColumnPermission('quotations', 'totalValue') && (
                      <td className="p-4 font-bold text-black-800">
                        <div className="text-sm">Rs. {q.totalValue?.toLocaleString()}</div>
                        <div className="text-[10px] text-black-400 font-medium mt-0.5">Rate: Rs. {q.pricePerSqFt}/Sq.Ft</div>
                      </td>
                    )}

                    {/* Prepared By */}
                    {hasColumnPermission('quotations', 'preparedBy') && (
                      <td className="p-4">
                        <div className="font-bold text-black-700">{q.createdBy?.name || 'System User'}</div>
                        <div className="text-[10px] text-black-400 capitalize">{q.createdBy?.role || 'User'}</div>
                      </td>
                    )}

                    {/* Created Date */}
                    {hasColumnPermission('quotations', 'createdDate') && (
                      <td className="p-4 text-xs font-semibold text-black-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-black-400" />
                          <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                    )}

                    {/* CRD Person */}
                    {hasColumnPermission('quotations', 'crdPerson') && (
                      <td className="p-4">
                        <select
                          disabled={!isAdmin}
                          value={q.crdPerson?._id || q.crdPerson || ''}
                          onChange={(e) => updateCrdPerson(q._id, e.target.value)}
                          className="w-full text-[11px] bg-black-50 border border-black-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0e623a] font-bold text-black-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-75"
                        >
                          <option value="">Select Person...</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                          ))}
                        </select>
                      </td>
                    )}

                    {/* PED Person */}
                    {hasColumnPermission('quotations', 'pedPerson') && (
                      <td className="p-4">
                        <select
                          disabled={!isAdmin}
                          value={q.pedPerson?._id || q.pedPerson || ''}
                          onChange={(e) => updatePedPerson(q._id, e.target.value)}
                          className="w-full text-[11px] bg-black-50 border border-black-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0e623a] font-bold text-black-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-75"
                        >
                          <option value="">Select Person...</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                          ))}
                        </select>
                      </td>
                    )}

                    {/* Accounts Person */}
                    {hasColumnPermission('quotations', 'accountsPerson') && (
                      <td className="p-4">
                        <select
                          disabled={!isAdmin}
                          value={q.accountsPerson?._id || q.accountsPerson || ''}
                          onChange={(e) => updateAccountsPerson(q._id, e.target.value)}
                          className="w-full text-[11px] bg-black-50 border border-black-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0e623a] font-bold text-black-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-75"
                        >
                          <option value="">Select Person...</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                          ))}
                        </select>
                      </td>
                    )}

                    {/* Action buttons */}
                    {hasColumnPermission('quotations', 'actions') && (
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/quotations/${q._id}`}
                            className="p-2 text-black-500 hover:text-[#0e623a] hover:bg-[#0e623a]/5 rounded-xl transition"
                            title="View & Print Quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/quotations/${q._id}/edit`}
                            className="p-2 text-black-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                            title="Edit Quotation"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(q._id)}
                              disabled={deletingId === q._id}
                              className="p-2 text-black-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                              title="Delete Record"
                            >
                              {deletingId === q._id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredQuotations.length === 0 && (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-black-400 text-xs">
                      No quotation records found matching search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationsDirectory;
