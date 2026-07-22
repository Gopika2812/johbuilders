import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Users, ShieldAlert, CheckCircle2, XCircle, Trash2, Loader2 } from 'lucide-react';

const EmployeesDirectory = () => {
  const { token, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-medium">
          {message}
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-3xl shadow-sm border border-black-100 overflow-hidden">
        <div className="bg-[#0e623a] p-6 text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-[#a7d8ff]" />
            <span>Employee Access Directory</span>
          </h3>
          {/* <p className="text-red-100 text-xs mt-1">
            Review registration requests, approve platform access, and manage user roles
          </p> */}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black-50 border-b border-black-100 text-xs font-bold text-black-500 uppercase tracking-wider">
                <th className="p-5">Name</th>
                <th className="p-5">Email</th>
                <th className="p-5">Registered On</th>
                <th className="p-5">Active Role</th>
                <th className="p-5">Access Status</th>
                {user.role === 'Superadmin' && <th className="p-5 text-right">Administrative Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-black-50 text-sm">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-black-50/50">
                  <td className="p-5 font-semibold text-black-800">{emp.name}</td>
                  <td className="p-5 text-black-600">{emp.email}</td>
                  <td className="p-5 text-black-500">{new Date(emp.createdAt).toLocaleDateString()}</td>
                  <td className="p-5">
                    {user.role === 'Superadmin' ? (
                      <select
                        value={emp.role}
                        onChange={(e) => handleRoleChange(emp._id, e.target.value)}
                        className="px-2.5 py-1.5 bg-black-50 border border-black-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] font-medium"
                      >
                        <option value="Superadmin">Superadmin</option>
                        <option value="Crd team">Crd team</option>
                        <option value="sales person">sales person</option>
                        <option value="ped team">ped team</option>
                        <option value="accounts team">accounts team</option>
                      </select>
                    ) : (
                      <span className="font-semibold text-black-700 bg-black-100 px-2.5 py-1 rounded-full text-xs">
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
                  {user.role === 'Superadmin' && (
                    <td className="p-5 text-right">
                      {emp._id === user._id ? (
                        <span className="text-xs text-black-400 italic font-light pr-4">Self account</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveToggle(emp._id, emp.isApproved)}
                            disabled={approvingId === emp._id || deletingId === emp._id}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border disabled:opacity-50 flex items-center justify-center gap-1 ${
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
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeesDirectory;
