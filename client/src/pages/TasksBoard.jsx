import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  User, 
  Calendar,
  X,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserCheck
} from 'lucide-react';

const TasksBoard = () => {
  const { token, user } = useAuth();
  const location = useLocation();

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Highlighted Task ID from query param (if coming from notification)
  const queryParams = new URLSearchParams(location.search);
  const highlightTaskId = queryParams.get('highlight');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: '',
    status: 'New'
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();

    const intervalId = setInterval(() => {
      fetchTasks(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [token, startDate, endDate]);

  const fetchTasks = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      let url = `${API_URL}/user-tasks`;
      const queryParts = [];
      if (startDate) queryParts.push(`startDate=${startDate}`);
      if (endDate) queryParts.push(`endDate=${endDate}`);
      if (queryParts.length > 0) {
        url += `?${queryParts.join('&')}`;
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

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      assignedTo: user?._id || '',
      status: 'New'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    const dateFormatted = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    setFormData({
      title: task.title || '',
      description: task.description || '',
      dueDate: dateFormatted,
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      status: task.status || 'New'
    });
    setShowModal(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate || !formData.assignedTo) {
      setError('Please fill in all required fields (Title, Due Date, Assigned Person)');
      return;
    }

    try {
      setModalLoading(true);
      setError('');
      const url = editingTask ? `${API_URL}/user-tasks/${editingTask._id}` : `${API_URL}/user-tasks`;
      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchTasks();
        setShowModal(false);
        setSuccessMsg(editingTask ? 'Task updated successfully!' : 'Task created and assigned successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save task');
      }
    } catch (err) {
      setError('Error saving task');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/user-tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        setSuccessMsg('Status updated successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Error updating status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`${API_URL}/user-tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
        setSuccessMsg('Task deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete task');
      }
    } catch (err) {
      setError('Error deleting task');
    }
  };

  // Helper to check if task is overdue ("overdated")
  const isOverdated = (task) => {
    if (task.status === 'Completed') return false;
    if (!task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (task.title || '').toLowerCase().includes(term) ||
      (task.description || '').toLowerCase().includes(term) ||
      (task.assignedTo?.name || '').toLowerCase().includes(term) ||
      (task.assignedBy?.name || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const due = new Date(task.dueDate);
      if (due < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const due = new Date(task.dueDate);
      if (due > end) return false;
    }

    if (statusFilter === 'NEW') return task.status === 'New';
    if (statusFilter === 'IN_PROGRESS') return task.status === 'In Progress';
    if (statusFilter === 'COMPLETED') return task.status === 'Completed';
    if (statusFilter === 'OVERDATED') return isOverdated(task);

    return true;
  });

  // Calculate Metrics
  const totalCount = tasks.length;
  const newCount = tasks.filter(t => t.status === 'New').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const overdatedCount = tasks.filter(t => isOverdated(t)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-[#0e623a]" />
            <span>Task Board</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            {user?.role === 'Superadmin' 
              ? 'Create, assign, and manage all team tasks with due date monitoring & overdue notifications.'
              : 'Create tasks for any team member, and track tasks assigned to or created by you.'}
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#006838] to-[#008c4a] hover:from-[#00522c] hover:to-[#00703b] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'ALL' ? 'bg-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-emerald-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase ${statusFilter === 'ALL' ? 'text-emerald-300' : 'text-gray-500'}`}>Total Tasks</span>
            <ClipboardList className={`w-4 h-4 ${statusFilter === 'ALL' ? 'text-emerald-400' : 'text-gray-400'}`} />
          </div>
          <p className={`text-2xl font-black mt-2 ${statusFilter === 'ALL' ? 'text-white' : 'text-gray-800'}`}>{totalCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('NEW')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'NEW' ? 'bg-blue-950 text-white border-blue-800 shadow-md ring-2 ring-blue-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase ${statusFilter === 'NEW' ? 'text-blue-300' : 'text-blue-600'}`}>New</span>
            <Clock className={`w-4 h-4 ${statusFilter === 'NEW' ? 'text-blue-300' : 'text-blue-500'}`} />
          </div>
          <p className={`text-2xl font-black mt-2 ${statusFilter === 'NEW' ? 'text-white' : 'text-gray-800'}`}>{newCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'IN_PROGRESS' ? 'bg-amber-950 text-white border-amber-800 shadow-md ring-2 ring-amber-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase ${statusFilter === 'IN_PROGRESS' ? 'text-amber-300' : 'text-amber-600'}`}>In Progress</span>
            <Loader2 className={`w-4 h-4 ${statusFilter === 'IN_PROGRESS' ? 'text-amber-300' : 'text-amber-500'}`} />
          </div>
          <p className={`text-2xl font-black mt-2 ${statusFilter === 'IN_PROGRESS' ? 'text-white' : 'text-gray-800'}`}>{inProgressCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'COMPLETED' ? 'bg-emerald-900 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase ${statusFilter === 'COMPLETED' ? 'text-emerald-300' : 'text-emerald-600'}`}>Completed</span>
            <CheckCircle2 className={`w-4 h-4 ${statusFilter === 'COMPLETED' ? 'text-emerald-300' : 'text-emerald-500'}`} />
          </div>
          <p className={`text-2xl font-black mt-2 ${statusFilter === 'COMPLETED' ? 'text-white' : 'text-gray-800'}`}>{completedCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('OVERDATED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'OVERDATED' ? 'bg-rose-950 text-white border-rose-800 shadow-md ring-2 ring-rose-600' : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase ${statusFilter === 'OVERDATED' ? 'text-rose-300' : 'text-rose-700'}`}>Overdated</span>
            <AlertTriangle className={`w-4 h-4 ${statusFilter === 'OVERDATED' ? 'text-rose-300' : 'text-rose-600 animate-pulse'}`} />
          </div>
          <p className={`text-2xl font-black mt-2 ${statusFilter === 'OVERDATED' ? 'text-white' : 'text-rose-700'}`}>{overdatedCount}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, or assignees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs font-bold text-gray-500 shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
              >
                <option value="ALL">All Statuses ({totalCount})</option>
                <option value="NEW">New ({newCount})</option>
                <option value="IN_PROGRESS">In Progress ({inProgressCount})</option>
                <option value="COMPLETED">Completed ({completedCount})</option>
                <option value="OVERDATED">Overdated ({overdatedCount})</option>
              </select>
            </div>

            {/* Date Range Filtration */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <Calendar className="w-4 h-4 text-[#0e623a] shrink-0 ml-1" />
              <span className="text-[11px] font-bold text-gray-500 hidden sm:inline">Due:</span>
              <input
                type="date"
                title="From Due Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
              />
              <span className="text-xs font-bold text-gray-400">to</span>
              <input
                type="date"
                title="To Due Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="px-2 py-1 text-[10px] font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                  title="Clear Date Filter"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task List / Table */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-48 space-y-2">
            <Loader2 className="w-8 h-8 text-[#0e623a] animate-spin" />
            <p className="text-xs text-gray-400">Loading Task Board...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
            <ClipboardList className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-sm font-bold text-gray-600">No tasks found</p>
            <p className="text-xs text-gray-400">Click "Create New Task" above to assign your first task.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 font-extrabold uppercase tracking-wider">
                  <th className="p-3.5 w-12 text-center">S.No</th>
                  <th className="p-3.5 min-w-[180px]">Task Title & Details</th>
                  <th className="p-3.5 min-w-[150px]">Assigned Person</th>
                  <th className="p-3.5 min-w-[130px]">Assigned By</th>
                  <th className="p-3.5 min-w-[120px]">Due Date</th>
                  <th className="p-3.5 min-w-[140px] text-center">Status</th>
                  <th className="p-3.5 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((task, idx) => {
                  const over = isOverdated(task);
                  const isHighlighted = highlightTaskId === task._id;

                  let statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (task.status === 'In Progress') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (task.status === 'Completed') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  return (
                    <tr 
                      key={task._id} 
                      className={`hover:bg-gray-50/80 transition duration-150 ${isHighlighted ? 'bg-amber-50/60 ring-2 ring-amber-400' : ''}`}
                    >
                      <td className="p-3.5 text-center font-bold text-gray-400">{idx + 1}</td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-850 text-sm">{task.title}</p>
                          {task.description && (
                            <p className="text-gray-500 text-xs line-clamp-2 max-w-sm font-normal">{task.description}</p>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0e623a]/10 text-[#0e623a] flex items-center justify-center font-black text-xs shrink-0">
                            {task.assignedTo?.name?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{task.assignedTo?.name || 'Unassigned'}</p>
                            <span className="text-[10px] text-gray-400 font-semibold">{task.assignedTo?.role}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold text-gray-700">{task.assignedBy?.name || 'Admin'}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>

                          {over && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Overdated</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide border focus:outline-none focus:ring-2 focus:ring-[#0e623a] cursor-pointer ${statusBadge}`}
                          >
                            <option value="New">New</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Task"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Create / Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#006838] to-[#008c4a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {editingTask ? 'Edit Task' : 'Create & Assign New Task'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitTask} className="p-6 space-y-4 text-xs">
              {/* Task Title */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter clear task title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Add detailed task instructions or background context..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Assigned Person */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Assigned Person <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                >
                  <option value="">-- Select Person --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.role}) - {emp.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTask ? 'Update Task' : 'Assign Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksBoard;
