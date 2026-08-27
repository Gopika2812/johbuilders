import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Loader2, 
  Edit, 
  Search, 
  X, 
  Lock, 
  Phone, 
  Mail, 
  UserCheck, 
  UserX, 
  Save, 
  Filter
} from 'lucide-react';

const EmployeesDirectory = () => {
  const { token, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Edit Modal state
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sales person',
    isApproved: true,
    password: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        setError('Failed to fetch employee list');
      }
    } catch (err) {
      setError('Connection error fetching employees');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveToggle = async (empId, currentApproval) => {
    setMessage('');
    setApprovingId(empId);
    try {
      const response = await fetch(`${API_URL}/employees/${empId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved: !currentApproval })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        fetchEmployees();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update approval status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRoleChange = async (empId, newRole) => {
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/employees/${empId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        fetchEmployees();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to change role');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (empId, empName) => {
    if (!window.confirm(`Are you sure you want to permanently delete employee "${empName}"?`)) {
      return;
    }
    setMessage('');
    setDeletingId(empId);
    try {
      const response = await fetch(`${API_URL}/employees/${empId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        fetchEmployees();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete employee');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error deleting employee');
    } finally {
      setDeletingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setEditFormData({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      role: emp.role || 'sales person',
      isApproved: emp.isApproved !== undefined ? emp.isApproved : true,
      password: ''
    });
    setEditError('');
    setEditSuccess('');
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setEditingEmployee(null);
    setEditError('');
    setEditSuccess('');
  };

  // Save Edit Employee Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    setSavingEdit(true);

    try {
      const response = await fetch(`${API_URL}/employees/${editingEmployee._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setEditSuccess('Employee updated successfully!');
        setMessage(`Successfully updated ${editFormData.name}'s profile.`);
        fetchEmployees();
        setTimeout(() => {
          closeEditModal();
        }, 1000);
      } else {
        setEditError(data.message || 'Failed to update employee details');
      }
    } catch (err) {
      console.error('Error saving employee edit:', err);
      setEditError('Server connection error while saving employee details');
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
    
    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Approved' && emp.isApproved) || 
      (statusFilter === 'Pending' && !emp.isApproved);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e623a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-medium flex justify-between items-center">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#0e623a] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-[#a7d8ff]" />
              <span>Employee Access Directory</span>
            </h3>
            <p className="text-emerald-100 text-xs mt-1">
              Manage team members, roles, contact details, edit permissions, and system access
            </p>
          </div>

          <div className="text-xs bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 font-medium self-start md:self-auto">
            Total Employees: <span className="font-bold text-white">{employees.length}</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent focus:outline-none font-semibold text-slate-800"
              >
                <option value="All">All Roles</option>
                <option value="Superadmin">Superadmin</option>
                <option value="Crd team">CRD Team</option>
                <option value="sales person">Sales Person</option>
                <option value="ped team">PED Team</option>
                <option value="accounts team">Accounts Team</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent focus:outline-none font-semibold text-slate-800"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending / Revoked</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-5">Name & Phone</th>
                <th className="p-5">Email</th>
                <th className="p-5">Registered On</th>
                <th className="p-5">Active Role</th>
                <th className="p-5">Access Status</th>
                <th className="p-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                    No employees matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-5">
                      <div className="font-semibold text-slate-800">{emp.name}</div>
                      {emp.phone && (
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-5 text-slate-600">{emp.email}</td>
                    <td className="p-5 text-slate-500">{new Date(emp.createdAt).toLocaleDateString()}</td>
                    <td className="p-5">
                      {user.role === 'Superadmin' ? (
                        <select
                          value={emp.role}
                          onChange={(e) => handleRoleChange(emp._id, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] font-medium text-xs text-slate-800"
                        >
                          <option value="Superadmin">Superadmin</option>
                          <option value="Crd team">Crd team</option>
                          <option value="sales person">sales person</option>
                          <option value="ped team">ped team</option>
                          <option value="accounts team">accounts team</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                          {emp.role}
                        </span>
                      )}
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        emp.isApproved 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {emp.isApproved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Pending Approval</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        {(user.role === 'Superadmin' || emp._id === user._id) && (
                          <button
                            onClick={() => openEditModal(emp)}
                            title="Edit Employee Details"
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}

                        {user.role === 'Superadmin' && (
                          <>
                            {emp._id === user._id ? (
                              <span className="text-xs text-slate-400 italic font-light px-2">Self Account</span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleApproveToggle(emp._id, emp.isApproved)}
                                  disabled={approvingId === emp._id || deletingId === emp._id}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border disabled:opacity-50 flex items-center justify-center gap-1 ${
                                    emp.isApproved
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {approvingId === emp._id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  {emp.isApproved ? 'Revoke Access' : 'Approve Access'}
                                </button>
                                <button
                                  onClick={() => handleDelete(emp._id, emp.name)}
                                  disabled={deletingId === emp._id || approvingId === emp._id}
                                  title="Delete Employee"
                                  className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 transition border border-transparent hover:border-red-200 disabled:opacity-50 flex items-center justify-center"
                                >
                                  {deletingId === emp._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0e623a] p-6 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Edit Employee Details</h3>
                  <p className="text-emerald-100 text-xs">Update profile, role, status & credentials</p>
                </div>
              </div>
              <button 
                onClick={closeEditModal} 
                className="p-1.5 rounded-full hover:bg-white/10 transition text-emerald-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-medium">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-2xl text-xs font-medium">
                  {editSuccess}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Employee Full Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                />
              </div>

              {/* Email & Phone grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="email@johngroup.in"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Active System Role *</label>
                <select
                  disabled={user.role !== 'Superadmin'}
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition disabled:opacity-60"
                >
                  <option value="Superadmin">Superadmin</option>
                  <option value="Crd team">Crd team</option>
                  <option value="sales person">sales person</option>
                  <option value="ped team">ped team</option>
                  <option value="accounts team">accounts team</option>
                </select>
                {user.role !== 'Superadmin' && (
                  <p className="text-[11px] text-slate-400 mt-1 italic">Only Superadmin can modify employee system role.</p>
                )}
              </div>

              {/* Password Reset option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reset Password (Optional)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Leave empty to keep existing password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Enter new password if employee lost access or requested reset.</p>
              </div>

              {/* Access Approval Status */}
              {user.role === 'Superadmin' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Access Status</label>
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      {editFormData.isApproved ? (
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <UserX className="w-5 h-5 text-amber-600" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {editFormData.isApproved ? 'Approved Access' : 'Access Revoked / Pending'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {editFormData.isApproved ? 'User can log in to dashboard' : 'User access is blocked'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, isApproved: !editFormData.isApproved })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        editFormData.isApproved
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {editFormData.isApproved ? 'Revoke Access' : 'Approve Access'}
                    </button>
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-[#0e623a] text-white hover:bg-[#0b4d2d] rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesDirectory;
