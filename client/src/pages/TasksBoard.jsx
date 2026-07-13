import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { ClipboardList, Search, AlertCircle, Clock, CheckCircle, BellRing, Loader2 } from 'lucide-react';

const TasksBoard = () => {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [token, startDate, endDate]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/tasks`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        setError('Failed to fetch tasks');
      }
    } catch (err) {
      setError('Connection error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (flowId, complaintId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${flowId}/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchTasks();
        setSuccessMsg('Task status updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Connection error updating status');
    }
  };

  const newPendingTasks = tasks.filter(t => t.status === 'Pending' && t.assignedTo === user?._id);

  const filteredTasks = tasks.filter(task => {
    const search = searchTerm.toLowerCase();
    return (task.customerName || '').toLowerCase().includes(search) ||
           (task.description || '').toLowerCase().includes(search) ||
           (task.assignedPersonName || '').toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#0e623a]" />
            <span>Assigned Tasks Board</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">Manage and update the status of your assigned tasks.</p>
        </div>
      </div>

      {newPendingTasks.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-xl shadow-sm flex items-start gap-3 animate-pulse">
          <BellRing className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold">New Tasks Assigned</h3>
            <p className="text-xs font-semibold mt-1">You have {newPendingTasks.length} new 'Pending' task(s) assigned to you. Please review and start work.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, task, or assigned person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
            />
          </div>

          {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none w-full sm:w-auto"
              />
              <span className="text-gray-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none w-full sm:w-auto"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 text-[#0e623a] animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-bold">No tasks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="p-4 w-12 text-center">S.No</th>
                  <th className="p-4">Assigned Date</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Task Description</th>
                  {(user?.role === 'Admin' || user?.role === 'Super Admin') && <th className="p-4">Assigned To</th>}
                  <th className="p-4">Risk Level</th>
                  <th className="p-4 text-center">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((task, idx) => {
                  let statusColor = 'bg-amber-50 border-amber-200 text-amber-800';
                  if (task.status === 'In Progress' || task.status === 'Start Work') statusColor = 'bg-blue-50 border-blue-200 text-blue-800';
                  if (task.status === 'Resolved' || task.status === 'Completed') statusColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';

                  let riskColor = 'bg-gray-50 border-gray-200 text-gray-700';
                  if (task.riskLevel === 'High') riskColor = 'bg-red-50 border-red-200 text-red-700';
                  if (task.riskLevel === 'Medium') riskColor = 'bg-orange-50 border-orange-200 text-orange-700';
                  if (task.riskLevel === 'Low') riskColor = 'bg-emerald-50 border-emerald-200 text-emerald-700';

                  return (
                    <tr key={task.complaintId} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-4 font-bold text-gray-600">
                        {new Date(task.reportedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{task.customerName}</p>
                        <p className="text-[10px] text-gray-500 font-semibold">{task.projectName} - Unit {task.unitId}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-800 max-w-xs">{task.description}</p>
                      </td>
                      {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                        <td className="p-4">
                          {task.assignedPersonName ? (
                            <span className="font-bold text-gray-700">{task.assignedPersonName}</span>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                      )}
                      <td className="p-4">
                        {task.riskLevel ? (
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${riskColor}`}>
                            {task.riskLevel}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border whitespace-nowrap mb-1 ${statusColor}`}>
                            {task.status}
                          </span>
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task.flowId, task.complaintId, e.target.value)}
                            className="w-32 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Start Work">Start Work</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksBoard;
