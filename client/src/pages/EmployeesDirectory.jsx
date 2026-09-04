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
  Filter,
  UserPlus,
  ShieldPlus,
  Plus,
  Shield,
  Eye,
  EyeOff,
  User as UserIcon,
  Check,
  AlertCircle
} from 'lucide-react';

const DEFAULT_ROLES = ['Superadmin', 'Crd team', 'sales person', 'ped team', 'accounts team'];
const DEFAULT_DEPARTMENTS = ['Sales Team', 'CRD Team', 'Accounts Team', 'Administration (Superadmins)', 'PED Team', 'General'];

const EmployeesDirectory = () => {
  const { token, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [availableRoles, setAvailableRoles] = useState(DEFAULT_ROLES);
  const [availableDepartments, setAvailableDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Add Employee Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sales person',
    department: 'Sales Team',
    password: '',
    isApproved: true
  });
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Role Creation / Management Modal state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [roleSuccess, setRoleSuccess] = useState('');
  const [deletingRole, setDeletingRole] = useState(null);

  // Edit Modal state
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sales person',
    department: 'Sales Team',
    isApproved: true,
    password: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
    fetchDepartments();
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

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const roles = await response.json();
        if (Array.isArray(roles) && roles.length > 0) {
          setAvailableRoles(roles);
        }
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/task-categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map(d => typeof d === 'string' ? d : d.name).filter(Boolean);
          setAvailableDepartments(Array.from(new Set([...DEFAULT_DEPARTMENTS, ...names])));
        }
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Add Employee Handler
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setSavingAdd(true);

    try {
      const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setAddSuccess('Employee added successfully!');
        setMessage(`Successfully added ${addFormData.name} as a team member.`);
        fetchEmployees();
        fetchRoles();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setAddFormData({
            name: '',
            email: '',
            phone: '',
            role: 'sales person',
            password: '',
            isApproved: true
          });
          setAddSuccess('');
        }, 1200);
      } else {
        setAddError(data.message || 'Failed to add employee');
      }
    } catch (err) {
      console.error('Error adding employee:', err);
      setAddError('Connection error while adding employee');
    } finally {
      setSavingAdd(false);
    }
  };

  // Create Role Handler
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setRoleError('Please enter a valid role name');
      return;
    }

    const trimmed = newRoleName.trim();
    if (availableRoles.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      setRoleError(`Role "${trimmed}" already exists.`);
      return;
    }

    setRoleError('');
    setRoleSuccess('');
    setSavingRole(true);

    try {
      const response = await fetch(`${API_URL}/role-permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: trimmed })
      });

      const data = await response.json();

      if (response.ok) {
        setRoleSuccess(`Role "${trimmed}" created successfully!`);
        setMessage(`New role "${trimmed}" has been created.`);
        setNewRoleName('');
        await fetchRoles();
        setTimeout(() => setRoleSuccess(''), 3000);
      } else {
        setRoleError(data.message || 'Failed to create role');
      }
    } catch (err) {
      console.error('Error creating role:', err);
      setRoleError('Connection error while creating role');
    } finally {
      setSavingRole(false);
    }
  };

  // Delete Custom Role Handler
  const handleDeleteRole = async (roleName) => {
    if (!window.confirm(`Are you sure you want to delete role "${roleName}"?`)) {
      return;
    }

    setRoleError('');
    setRoleSuccess('');
    setDeletingRole(roleName);

    try {
      const response = await fetch(`${API_URL}/role-permissions/${encodeURIComponent(roleName)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setRoleSuccess(data.message || `Role "${roleName}" deleted.`);
        setMessage(`Role "${roleName}" deleted.`);
        await fetchRoles();
      } else {
        setRoleError(data.message || 'Failed to delete role');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      setRoleError('Connection error deleting role');
    } finally {
      setDeletingRole(null);
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
      department: emp.department || 'General',
      isApproved: emp.isApproved !== undefined ? emp.isApproved : true,
      password: ''
    });
    setShowEditPassword(false);
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
        fetchRoles();
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
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'All' || emp.role?.toLowerCase() === roleFilter.toLowerCase();
    
    const matchesDept = deptFilter === 'All' || (emp.department || 'General').toLowerCase() === deptFilter.toLowerCase();

    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Approved' && emp.isApproved) || 
      (statusFilter === 'Pending' && !emp.isApproved);

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
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
        <div className="bg-[#0e623a] p-6 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-[#a7d8ff]" />
              <span>Employee Access Directory</span>
            </h3>
            <p className="text-emerald-100 text-xs mt-1">
              Manage team members, roles, contact details, edit permissions, and system access
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-xs bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 font-medium">
              Total Employees: <span className="font-bold text-white">{employees.length}</span>
            </div>

            {user?.role === 'Superadmin' && (
              <>
                {/* Role Creation / Management button */}
                <button
                  onClick={() => setIsRoleModalOpen(true)}
                  className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm backdrop-blur-sm"
                  title="Create or Manage Custom Roles"
                >
                  <ShieldPlus className="w-4 h-4 text-emerald-200" />
                  <span>Role Creation</span>
                </button>

                {/* Add Employee button */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-slate-900" />
                  <span>Add Employee</span>
                </button>
              </>
            )}
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
                className="bg-transparent focus:outline-none font-semibold text-slate-800 capitalize"
              >
                <option value="All">All Roles</option>
                {availableRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
              <span>Dept:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent focus:outline-none font-semibold text-slate-800"
              >
                <option value="All">All Departments</option>
                {availableDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
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
                <th className="p-5">Department</th>
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
                    <td className="p-5">
                      <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full text-xs">
                        {emp.department || 'General'}
                      </span>
                    </td>
                    <td className="p-5">
                      {user?.role === 'Superadmin' ? (
                        <select
                          value={emp.role}
                          onChange={(e) => handleRoleChange(emp._id, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] font-medium text-xs text-slate-800"
                        >
                          {availableRoles.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
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
                        {(user?.role === 'Superadmin' || emp._id === user?._id) && (
                          <button
                            onClick={() => openEditModal(emp)}
                            title="Edit Employee Details"
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}

                        {user?.role === 'Superadmin' && (
                          <>
                            {emp._id === user?._id ? (
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

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#0e623a] p-6 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
                  <UserPlus className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Add New Employee</h3>
                  <p className="text-emerald-100 text-xs">Register a new team member and assign their role</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 rounded-full hover:bg-white/10 transition text-emerald-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4 overflow-y-auto flex-1">
              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{addSuccess}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  />
                </div>
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
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      placeholder="email@johngroup.in"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Department Selection grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Assign Role *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsRoleModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-[#0e623a] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create New Role</span>
                    </button>
                  </div>
                  <select
                    value={addFormData.role}
                    onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  >
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department *</label>
                  <select
                    value={addFormData.department}
                    onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  >
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Initial Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAddPassword ? "text" : "password"}
                    required
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                    placeholder="Min 4 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">The employee will use their Phone/Email and this Password to log in.</p>
              </div>

              {/* Initial Approval Status */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Initial Access Status</label>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    {addFormData.isApproved ? (
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <UserX className="w-5 h-5 text-amber-600" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {addFormData.isApproved ? 'Approved (Active Immediately)' : 'Pending Approval'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {addFormData.isApproved ? 'Employee can log in immediately' : 'Account will require approval before login'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddFormData({ ...addFormData, isApproved: !addFormData.isApproved })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      addFormData.isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {addFormData.isApproved ? 'Approved' : 'Pending'}
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={savingAdd}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdd}
                  className="px-5 py-2 bg-[#0e623a] text-white hover:bg-[#0b4d2d] rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {savingAdd ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Employee...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Add Employee</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Creation & Management Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#0e623a] p-6 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
                  <ShieldPlus className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Role Creation & Management</h3>
                  <p className="text-emerald-100 text-xs">Create custom enterprise roles and manage existing roles</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRoleModalOpen(false)} 
                className="p-1.5 rounded-full hover:bg-white/10 transition text-emerald-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {roleError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{roleError}</span>
                </div>
              )}

              {roleSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{roleSuccess}</span>
                </div>
              )}

              {/* Create New Role Form */}
              <form onSubmit={handleCreateRole} className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>Create New Role</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Enter role name (e.g. Operations Manager)"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                  />
                  <button
                    type="submit"
                    disabled={savingRole || !newRoleName.trim()}
                    className="px-4 py-2.5 bg-[#0e623a] text-white hover:bg-[#0b4d2d] rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {savingRole ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Create Role</span>
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700/80">
                  Newly created roles will immediately become available across employee creation, editing, and filters.
                </p>
              </form>

              {/* Existing Roles List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Existing System & Custom Roles</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {availableRoles.map((roleName) => {
                    const isDefault = DEFAULT_ROLES.some(d => d.toLowerCase() === roleName.toLowerCase());
                    const assignedUsersCount = employees.filter(e => e.role?.toLowerCase() === roleName.toLowerCase()).length;

                    return (
                      <div key={roleName} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50 transition">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${isDefault ? 'bg-[#0e623a]' : 'bg-blue-500'}`} />
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <span>{roleName}</span>
                              {isDefault ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">
                                  Default
                                </span>
                              ) : (
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold border border-blue-100">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {assignedUsersCount} active {assignedUsersCount === 1 ? 'employee' : 'employees'} assigned
                            </div>
                          </div>
                        </div>

                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(roleName)}
                            disabled={deletingRole === roleName || assignedUsersCount > 0}
                            title={assignedUsersCount > 0 ? "Cannot delete role assigned to employees" : "Delete Role"}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {deletingRole === roleName ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* Role & Department Selection grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Active System Role *</label>
                  <select
                    disabled={user?.role !== 'Superadmin'}
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition disabled:opacity-60"
                  >
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {user?.role !== 'Superadmin' && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">Only Superadmin can modify employee system role.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department *</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  >
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password Reset option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reset Password (Optional)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Leave empty to keep existing password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Enter new password if employee lost access or requested reset.</p>
              </div>

              {/* Access Approval Status */}
              {user?.role === 'Superadmin' && (
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
