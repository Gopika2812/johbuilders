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
  Loader2
} from 'lucide-react';

const QuotationsDirectory = () => {
  const { token } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchQuotations();
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
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

  const filteredQuotations = quotations.filter(q => {
    const term = searchTerm.toLowerCase();
    return (
      q.customerName.toLowerCase().includes(term) ||
      q.customerPhone.includes(term) ||
      (q.project?.code || '').toLowerCase().includes(term) ||
      (q.project?.name || '').toLowerCase().includes(term)
    );
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
          {/* <p className="text-black-400 text-xs mt-1">Review, generate, edit and print client valuation estimates</p> */}
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
      <div className="bg-white border border-black-150 p-4 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-md">
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
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Quoted Units</th>
                  <th className="p-4">Total Value</th>
                  <th className="p-4">Prepared By</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">CRD Person</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black-100 text-sm">
                {filteredQuotations.map(q => (
                  <tr key={q._id} className="hover:bg-black-50/50 transition duration-150">
                    {/* Customer */}
                    <td className="p-4">
                      <div className="font-bold text-black-800">{q.customerName}</div>
                      <div className="flex items-center gap-1 text-[11px] text-black-400 mt-1">
                        <Phone className="w-3 h-3 text-black-300" />
                        <span>{q.customerPhone}</span>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="p-4">
                      <div className="font-bold text-black-700 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-[#0e623a]/75" />
                        <span>{q.project?.code || 'N/A'}</span>
                      </div>
                      <div className="text-[11px] text-black-400 mt-0.5">{q.project?.name || ''}</div>
                    </td>

                    {/* Quoted Units */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {q.selectedUnits.map(unit => (
                          <span key={unit} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[11px] font-bold">
                            {unit}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-black-400 mt-1">
                        Type: {q.projectType} • Total Area: {q.totalArea} Sq.Ft
                      </div>
                    </td>

                    {/* Total Value */}
                    <td className="p-4">
                      <div className="font-extrabold text-black-800">Rs. {q.totalValue.toLocaleString()}</div>
                      <div className="text-[10px] text-black-400 mt-0.5">Rate: Rs. {q.pricePerSqFt}/Sq.Ft</div>
                    </td>

                    {/* Prepared By */}
                    <td className="p-4">
                      <div className="font-semibold text-black-700">{q.createdBy?.name || 'System'}</div>
                      <div className="text-[11px] text-black-400">{q.createdBy?.role || 'User'}</div>
                    </td>

                    {/* Created Date */}
                    <td className="p-4">
                      <div className="text-xs text-black-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-black-300" />
                        <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* CRD Person */}
                    <td className="p-4">
                      <select
                        value={q.crdPerson?._id || q.crdPerson || ''}
                        onChange={(e) => updateCrdPerson(q._id, e.target.value)}
                        className="w-full text-[11px] bg-black-50 border border-black-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0e623a] font-bold text-black-700 cursor-pointer"
                      >
                        <option value="">Select Person...</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Action buttons */}
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
                        <button
                          onClick={() => handleDelete(q._id)}
                          disabled={deletingId === q._id}
                          className="p-2 text-black-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                          title="Delete Record"
                        >
                          {deletingId === q._id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredQuotations.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-black-400 text-xs">
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
