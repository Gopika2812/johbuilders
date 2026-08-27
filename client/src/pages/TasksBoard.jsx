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
  UserCheck,
  History,
  MessageSquare,
  Send,
  ChevronDown,
  Check,
  Users,
  Building,
  UploadCloud,
  Eye,
  Download,
  Paperclip,
  PauseCircle,
  XCircle
} from 'lucide-react';

const CustomPersonSelector = ({ employees, value, onChange, placeholder = "-- Select Person --" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef(null);

  const selectedEmp = employees.find(e => e._id === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 hover:border-emerald-600 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-[#0e623a] cursor-pointer shadow-xs"
      >
        {selectedEmp ? (
          <div className="flex items-center gap-2 truncate">
            <span className="w-5 h-5 rounded-full bg-[#0e623a] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {selectedEmp.name ? selectedEmp.name.charAt(0).toUpperCase() : 'U'}
            </span>
            <span className="font-bold text-gray-900 truncate">{selectedEmp.name}</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              {selectedEmp.role || 'Staff'}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 font-medium">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[1050] bg-white border border-gray-200 rounded-2xl shadow-xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search user, role or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredEmployees.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400 italic">No matching users found</div>
            ) : (
              filteredEmployees.map(emp => {
                const isSelected = emp._id === value;
                return (
                  <div
                    key={emp._id}
                    onClick={() => {
                      onChange(emp._id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                      <div className="flex flex-col min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-xs truncate">{emp.name}</span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                            {emp.role || 'Staff'}
                          </span>
                        </div>
                        {emp.email && <span className="text-[10px] text-gray-500 truncate">{emp.email}</span>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0e623a] shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Task History & Comments Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState(null);
  const [newCommentNote, setNewCommentNote] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // View Tab Filter State: 'ASSIGNED_TO_ME', 'I_ASSIGNED', 'OTHER_TASKS', 'ALL'
  const [viewTab, setViewTab] = useState('ASSIGNED_TO_ME');

  // Category, Priority & Project Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Categories list & management state
  const [categoriesList, setCategoriesList] = useState([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategoryObj, setEditingCategoryObj] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [projects, setProjects] = useState([]);
  const [projectSelectOption, setProjectSelectOption] = useState('');

  // Attachments & Preview Modal State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState({ open: false, url: '', name: '', taskId: '', attachmentId: '' });

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectName: '',
    dueDate: '',
    assignedTo: '',
    status: 'New',
    priority: 'Medium',
    category: 'General',
    repeatType: 'None',
    reminderInterval: 1,
    attachments: []
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchProjects();
    fetchCategories();
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

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const parseResponseJSON = async (res) => {
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to parse JSON response:', e);
    }
    return null;
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/task-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await parseResponseJSON(res);
        if (data && Array.isArray(data)) setCategoriesList(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCategoryName || !newCategoryName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/task-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      const data = await parseResponseJSON(res);
      if (res.ok && data) {
        await fetchCategories();
        setFormData(prev => ({ ...prev, category: data.name }));
        setNewCategoryName('');
        setSuccessMsg(`Category "${data.name}" created successfully`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data?.message || 'Failed to create category');
      }
    } catch (err) {
      setError(err.message || 'Error creating category');
    }
  };

  const handleUpdateCategory = async (categoryId, updatedName) => {
    if (!updatedName || !updatedName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/task-categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: updatedName.trim() })
      });
      const data = await parseResponseJSON(res);
      if (res.ok) {
        await fetchCategories();
        await fetchTasks(true);
        setEditingCategoryObj(null);
        setSuccessMsg('Category updated successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data?.message || 'Failed to update category');
      }
    } catch (err) {
      setError('Error updating category');
    }
  };

  const handleDeleteCategory = async (categoryId, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/task-categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseResponseJSON(res);
      if (res.ok) {
        await fetchCategories();
        setSuccessMsg(`Category "${catName}" deleted`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data?.message || 'Failed to delete category');
      }
    } catch (err) {
      setError('Error deleting category');
    }
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = 'dgo9lfoyd';
    const uploadPreset = 'Johnbuilders';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to upload image');
    return {
      url: data.secure_url,
      name: file.name
    };
  };

  const handleDirectUpload = async (taskId, files) => {
    if (!files || files.length === 0) return;
    try {
      setUploadingFile(true);
      for (const file of Array.from(files)) {
        const uploaded = await uploadToCloudinary(file);
        const res = await fetch(`${API_URL}/user-tasks/${taskId}/attachments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ url: uploaded.url, name: uploaded.name })
        });
        if (res.ok) {
          const updatedTask = await parseResponseJSON(res);
          if (updatedTask) {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
          }
        }
      }
      setSuccessMsg('Attachment uploaded successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to upload attachment');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (taskId, attachmentId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      const res = await fetch(`${API_URL}/user-tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedTask = await parseResponseJSON(res);
        if (updatedTask) {
          setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        }
        if (previewImageModal.open) {
          setPreviewImageModal({ open: false, url: '', name: '', taskId: '', attachmentId: '' });
        }
        setSuccessMsg('Attachment deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await parseResponseJSON(res);
        setError(data?.message || 'Failed to delete attachment');
      }
    } catch (err) {
      setError('Error deleting attachment');
    }
  };

  const handleModalFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    try {
      setUploadingFile(true);
      const newAtts = [];
      for (const file of Array.from(files)) {
        const uploaded = await uploadToCloudinary(file);
        newAtts.push({ url: uploaded.url, name: uploaded.name });
      }
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newAtts]
      }));
    } catch (err) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setShowCategoryManager(false);
    setEditingCategoryObj(null);
    setNewCategoryName('');
    setProjectSelectOption('');
    setFormData({
      title: '',
      description: '',
      projectName: '',
      dueDate: new Date().toISOString().split('T')[0],
      assignedTo: user?._id || '',
      status: 'New',
      priority: 'Medium',
      category: 'General',
      repeatType: 'None',
      reminderInterval: 1,
      attachments: []
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setShowCategoryManager(false);
    setEditingCategoryObj(null);
    setNewCategoryName('');
    const dateFormatted = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    
    const taskProj = (task.projectName || '').trim();
    if (taskProj) {
      const matchedProj = projects.find(p => p.name?.trim().toLowerCase() === taskProj.toLowerCase());
      setProjectSelectOption(matchedProj ? matchedProj.name : 'Other');
    } else {
      setProjectSelectOption('');
    }

    setFormData({
      title: task.title || '',
      description: task.description || '',
      projectName: taskProj,
      dueDate: dateFormatted,
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      status: task.status || 'New',
      priority: task.priority || 'Medium',
      category: task.category || 'General',
      repeatType: task.repeatType || 'None',
      reminderInterval: task.reminderInterval || 1,
      attachments: task.attachments || []
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
        const data = await parseResponseJSON(res);
        setError(data?.message || 'Failed to save task');
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
        const data = await parseResponseJSON(res);
        setError(data?.message || 'Failed to update status');
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
        const data = await parseResponseJSON(res);
        setError(data?.message || 'Failed to delete task');
      }
    } catch (err) {
      setError('Error deleting task');
    }
  };

  const handleOpenHistoryModal = (task) => {
    setSelectedTaskForHistory(task);
    setNewCommentNote('');
    setHistoryModalOpen(true);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentNote || !newCommentNote.trim() || !selectedTaskForHistory) return;

    try {
      setCommentSubmitting(true);
      const res = await fetch(`${API_URL}/user-tasks/${selectedTaskForHistory._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note: newCommentNote })
      });

      if (res.ok) {
        const updatedTask = await parseResponseJSON(res);
        if (updatedTask) {
          setSelectedTaskForHistory(updatedTask);
          setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        }
        setNewCommentNote('');
        setSuccessMsg('Comment added to task history');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await parseResponseJSON(res);
        setError(data?.message || 'Failed to add comment');
      }
    } catch (err) {
      setError('Error adding comment');
    } finally {
      setCommentSubmitting(false);
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

  const roleNorm = (user?.role || '').toLowerCase().replace(/[\s_-]+/g, '');
  const isSuperAdmin = roleNorm === 'superadmin' || roleNorm === 'admin';

  // Tab Counts
  const assignedToMeCount = tasks.filter(t => (t.assignedTo?._id || t.assignedTo) === user?._id).length;
  const iAssignedCount = tasks.filter(t => (t.assignedBy?._id || t.assignedBy) === user?._id).length;
  const otherTasksCount = tasks.filter(t => (t.assignedTo?._id || t.assignedTo) !== user?._id && (t.assignedBy?._id || t.assignedBy) !== user?._id).length;
  const allTasksCount = tasks.length;

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    const isAssignedToMe = (task.assignedTo?._id || task.assignedTo) === user?._id;
    const isIassigned = (task.assignedBy?._id || task.assignedBy) === user?._id;

    if (viewTab === 'ASSIGNED_TO_ME') {
      if (!isAssignedToMe) return false;
    } else if (viewTab === 'I_ASSIGNED') {
      if (!isIassigned) return false;
    } else if (viewTab === 'OTHER_TASKS') {
      if (isAssignedToMe || isIassigned) return false;
    }

    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (task.title || '').toLowerCase().includes(term) ||
      (task.description || '').toLowerCase().includes(term) ||
      (task.projectName || '').toLowerCase().includes(term) ||
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
    if (statusFilter === 'ON_HOLD') return task.status === 'On Hold';
    if (statusFilter === 'COMPLETED') return task.status === 'Completed';
    if (statusFilter === 'CANCELLED') return task.status === 'Cancelled';
    if (statusFilter === 'OVERDATED') return isOverdated(task);

    if (categoryFilter !== 'ALL' && task.category !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
    if (projectFilter !== 'ALL' && (task.projectName || '').trim() !== projectFilter) return false;

    return true;
  });

  // Sort tasks so newest created/assigned tasks appear at the fresh top
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a._id ? parseInt(a._id.substring(0, 8), 16) * 1000 : 0);
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b._id ? parseInt(b._id.substring(0, 8), 16) * 1000 : 0);
    return timeB - timeA;
  });

  // Calculate Metrics
  const totalCount = tasks.length;
  const newCount = tasks.filter(t => t.status === 'New').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const onHoldCount = tasks.filter(t => t.status === 'On Hold').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const cancelledCount = tasks.filter(t => t.status === 'Cancelled').length;
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'ALL' ? 'bg-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-emerald-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'ALL' ? 'text-emerald-300' : 'text-gray-500'}`}>Total</span>
            <ClipboardList className={`w-3.5 h-3.5 ${statusFilter === 'ALL' ? 'text-emerald-400' : 'text-gray-400'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'ALL' ? 'text-white' : 'text-gray-800'}`}>{totalCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('NEW')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'NEW' ? 'bg-blue-950 text-white border-blue-800 shadow-md ring-2 ring-blue-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'NEW' ? 'text-blue-300' : 'text-blue-600'}`}>New</span>
            <Clock className={`w-3.5 h-3.5 ${statusFilter === 'NEW' ? 'text-blue-300' : 'text-blue-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'NEW' ? 'text-white' : 'text-gray-800'}`}>{newCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'IN_PROGRESS' ? 'bg-amber-950 text-white border-amber-800 shadow-md ring-2 ring-amber-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'IN_PROGRESS' ? 'text-amber-300' : 'text-amber-600'}`}>In Progress</span>
            <Loader2 className={`w-3.5 h-3.5 ${statusFilter === 'IN_PROGRESS' ? 'text-amber-300' : 'text-amber-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'IN_PROGRESS' ? 'text-white' : 'text-gray-800'}`}>{inProgressCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('ON_HOLD')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'ON_HOLD' ? 'bg-purple-950 text-white border-purple-800 shadow-md ring-2 ring-purple-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'ON_HOLD' ? 'text-purple-300' : 'text-purple-600'}`}>On Hold</span>
            <PauseCircle className={`w-3.5 h-3.5 ${statusFilter === 'ON_HOLD' ? 'text-purple-300' : 'text-purple-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'ON_HOLD' ? 'text-white' : 'text-gray-800'}`}>{onHoldCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'COMPLETED' ? 'bg-emerald-900 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'COMPLETED' ? 'text-emerald-300' : 'text-emerald-600'}`}>Completed</span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === 'COMPLETED' ? 'text-emerald-300' : 'text-emerald-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'COMPLETED' ? 'text-white' : 'text-gray-800'}`}>{completedCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('CANCELLED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'CANCELLED' ? 'bg-gray-800 text-white border-gray-700 shadow-md ring-2 ring-gray-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'CANCELLED' ? 'text-gray-300' : 'text-gray-600'}`}>Cancelled</span>
            <XCircle className={`w-3.5 h-3.5 ${statusFilter === 'CANCELLED' ? 'text-gray-300' : 'text-gray-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'CANCELLED' ? 'text-white' : 'text-gray-800'}`}>{cancelledCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('OVERDATED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'OVERDATED' ? 'bg-rose-950 text-white border-rose-800 shadow-md ring-2 ring-rose-600' : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'OVERDATED' ? 'text-rose-300' : 'text-rose-700'}`}>Overdated</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${statusFilter === 'OVERDATED' ? 'text-rose-300' : 'text-rose-600 animate-pulse'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'OVERDATED' ? 'text-white' : 'text-rose-700'}`}>{overdatedCount}</p>
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

      {/* View Tabs: Assigned to Me / I Assigned / Other Tasks (for Superadmin) / All Tasks */}
      <div className="flex items-center gap-2 bg-white border border-gray-150 p-2 rounded-2xl shadow-sm overflow-x-auto">
        <button
          onClick={() => setViewTab('ASSIGNED_TO_ME')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            viewTab === 'ASSIGNED_TO_ME'
              ? 'bg-[#0e623a] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Assigned to Me</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            viewTab === 'ASSIGNED_TO_ME' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {assignedToMeCount}
          </span>
        </button>

        <button
          onClick={() => setViewTab('I_ASSIGNED')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            viewTab === 'I_ASSIGNED'
              ? 'bg-[#0e623a] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>I Assigned</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            viewTab === 'I_ASSIGNED' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {iAssignedCount}
          </span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setViewTab('OTHER_TASKS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
              viewTab === 'OTHER_TASKS'
                ? 'bg-purple-800 text-white shadow-md'
                : 'text-gray-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Other Tasks (All People)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              viewTab === 'OTHER_TASKS' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}>
              {otherTasksCount}
            </span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setViewTab('ALL')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
              viewTab === 'ALL'
                ? 'bg-gray-800 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>All Tasks</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              viewTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              {allTasksCount}
            </span>
          </button>
        )}
      </div>

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
                <option value="ON_HOLD">On Hold ({onHoldCount})</option>
                <option value="COMPLETED">Completed ({completedCount})</option>
                <option value="CANCELLED">Cancelled ({cancelledCount})</option>
                <option value="OVERDATED">Overdated ({overdatedCount})</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500 shrink-0">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
              >
                <option value="ALL">All Categories</option>
                {categoriesList.map(cat => {
                  const catName = typeof cat === 'string' ? cat : cat.name;
                  return (
                    <option key={cat._id || catName} value={catName}>{catName}</option>
                  );
                })}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500 shrink-0">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
              >
                <option value="ALL">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs font-bold text-gray-500 shrink-0">Project:</span>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
              >
                <option value="ALL">All Projects</option>
                {Array.from(new Set([
                  ...projects.map(p => p.name).filter(Boolean),
                  ...tasks.map(t => t.projectName).filter(Boolean)
                ])).sort().map(pName => (
                  <option key={pName} value={pName}>{pName}</option>
                ))}
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

        {/* Task List / Table with 12 Explicit Columns */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-48 space-y-2">
            <Loader2 className="w-8 h-8 text-[#0e623a] animate-spin" />
            <p className="text-xs text-gray-400">Loading Task Board...</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
            <ClipboardList className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-sm font-bold text-gray-600">No tasks found</p>
            <p className="text-xs text-gray-400">Click "Create New Task" above to assign your first task.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 w-10 text-center">S.No</th>
                  <th className="p-3.5 min-w-[140px]">Project Name</th>
                  <th className="p-3.5 min-w-[180px]">Task Title</th>
                  <th className="p-3.5 min-w-[120px]">Task Category</th>
                  <th className="p-3.5 min-w-[140px]">Assigned To</th>
                  <th className="p-3.5 min-w-[130px]">Assigned By</th>
                  <th className="p-3.5 min-w-[90px] text-center">Priority</th>
                  <th className="p-3.5 min-w-[110px]">Assigned Date</th>
                  <th className="p-3.5 min-w-[140px]">Due Date</th>
                  <th className="p-3.5 min-w-[130px] text-center">Status</th>
                  <th className="p-3.5 min-w-[140px] text-center">Attachments</th>
                  <th className="p-3.5 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTasks.map((task, idx) => {
                  const over = isOverdated(task);
                  const isHighlighted = highlightTaskId === task._id;

                  let statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (task.status === 'In Progress') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (task.status === 'On Hold') statusBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                  if (task.status === 'Completed') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (task.status === 'Cancelled') statusBadge = 'bg-gray-100 text-gray-600 border-gray-300';

                  let priorityBadge = 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
                  if (task.priority === 'High') priorityBadge = 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold';
                  if (task.priority === 'Low') priorityBadge = 'bg-gray-100 text-gray-700 border-gray-300 font-semibold';

                  return (
                    <tr 
                      key={task._id} 
                      className={`hover:bg-gray-50/80 transition duration-150 ${isHighlighted ? 'bg-amber-50/60 ring-2 ring-amber-400' : ''}`}
                    >
                      {/* 1. S.No */}
                      <td className="p-3.5 text-center font-bold text-gray-400">{idx + 1}</td>

                      {/* 2. Project Name */}
                      <td className="p-3.5">
                        {task.projectName ? (
                          <div className="flex items-center gap-1.5 font-extrabold text-[#0e623a] bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg w-fit text-xs">
                            <Building className="w-3.5 h-3.5 text-[#0e623a] shrink-0" />
                            <span>{task.projectName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">—</span>
                        )}
                      </td>

                      {/* 3. Task Title */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="font-extrabold text-gray-900 text-sm block">{task.title}</span>
                          {task.description && (
                            <p className="text-gray-500 text-xs line-clamp-2 max-w-xs font-normal">{task.description}</p>
                          )}
                        </div>
                      </td>

                      {/* 4. Task Category */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs rounded-lg inline-block">
                          {task.category || 'General'}
                        </span>
                      </td>

                      {/* 5. Assigned To */}
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

                      {/* 6. Assigned By */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-semibold text-gray-700">{task.assignedBy?.name || 'Admin'}</span>
                        </div>
                      </td>

                      {/* 7. Priority */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider border rounded-lg ${priorityBadge}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>

                      {/* 8. Assigned Date */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-gray-700 font-semibold whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {task.createdAt 
                              ? new Date(task.createdAt).toLocaleDateString('en-GB') 
                              : (task.assignedDate 
                                  ? new Date(task.assignedDate).toLocaleDateString('en-GB') 
                                  : '—')}
                          </span>
                        </div>
                      </td>

                      {/* 9. Due Date */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '—'}</span>
                          </div>

                          {task.repeatType && task.repeatType !== 'None' && (
                            <div className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Repeat Every {task.reminderInterval || 1} {task.repeatType === 'Hourly' ? 'Hr(s)' : 'Day(s)'}</span>
                            </div>
                          )}

                          {over && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Overdated</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 10. Status */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide border focus:outline-none focus:ring-2 focus:ring-[#0e623a] cursor-pointer ${statusBadge}`}
                          >
                            <option value="New">New</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* 11. Attachments (Multiple Image Upload Option via Cloudinary & Delete Option) */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {task.attachments && task.attachments.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[140px]">
                              {task.attachments.map((att, aIdx) => (
                                <div 
                                  key={att._id || aIdx} 
                                  className="relative group shrink-0"
                                  title={att.name || 'View Attachment'}
                                >
                                  <img 
                                    src={att.url} 
                                    alt={att.name || 'Attachment'} 
                                    className="w-8 h-8 rounded-lg object-cover border border-gray-200 shadow-xs cursor-pointer"
                                    onClick={() => setPreviewImageModal({ open: true, url: att.url, name: att.name, taskId: task._id, attachmentId: att._id })}
                                  />
                                  <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImageModal({ open: true, url: att.url, name: att.name, taskId: task._id, attachmentId: att._id })}
                                      className="p-0.5 text-white hover:text-emerald-300 transition cursor-pointer"
                                      title="View Image"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                    {att._id && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteAttachment(task._id, att._id, e)}
                                        className="p-0.5 text-rose-300 hover:text-rose-500 transition cursor-pointer"
                                        title="Delete Attachment"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No files</span>
                          )}

                          <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#0e623a] border border-emerald-200 rounded-lg text-[10px] font-bold cursor-pointer transition shadow-2xs">
                            <UploadCloud className="w-3 h-3" />
                            <span>Upload</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingFile}
                              onChange={(e) => handleDirectUpload(task._id, e.target.files)}
                            />
                          </label>
                        </div>
                      </td>

                      {/* 12. Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenHistoryModal(task)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition flex items-center gap-1 font-bold text-[11px]"
                            title="Reply / Task History"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                            <span>Reply</span>
                          </button>
                          <button
                            onClick={() => handleOpenHistoryModal(task)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Task History & Comments"
                          >
                            <History className="w-4 h-4" />
                          </button>
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
                  rows={2}
                  placeholder="Add detailed task instructions or background context..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                />
              </div>

              {/* Project Name (Select Project from Directory or Custom Others Option) */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#0e623a]" />
                    <span>Project Name</span>
                  </span>
                  <span className="text-[10px] font-normal text-gray-400 italic">Optional</span>
                </label>
                <select
                  value={projectSelectOption}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProjectSelectOption(val);
                    if (val !== 'Other') {
                      setFormData(prev => ({ ...prev, projectName: val }));
                    } else {
                      setFormData(prev => ({ ...prev, projectName: '' }));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                >
                  <option value="">-- Select Project (From Directory) --</option>
                  {projects.map(p => (
                    <option key={p._id || p.code || p.name} value={p.name}>
                      {p.name} {p.code ? `(${p.code})` : ''}
                    </option>
                  ))}
                  <option value="Other">Others (Type Custom Project)</option>
                </select>

                {projectSelectOption === 'Other' && (
                  <div className="mt-2 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Enter custom project name..."
                      value={formData.projectName}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-white border border-emerald-400 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0e623a] shadow-xs"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Assigned Person & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Assigned Person <span className="text-red-500">*</span>
                  </label>
                  <CustomPersonSelector
                    employees={employees}
                    value={formData.assignedTo}
                    onChange={(selectedId) => setFormData({ ...formData, assignedTo: selectedId })}
                    placeholder="-- Select Person --"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Category (Instant Add Option) & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryManager(true)}
                      className="text-[10px] font-extrabold text-[#0e623a] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Manage Categories</span>
                    </button>
                  </div>

                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                  >
                    {categoriesList.map(cat => {
                      const catName = typeof cat === 'string' ? cat : cat.name;
                      return (
                        <option key={cat._id || catName} value={catName}>{catName}</option>
                      );
                    })}
                  </select>
                </div>

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
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Attachments Upload Section */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#0e623a]" />
                    <span>Attachments (Upload Images / Files)</span>
                  </span>
                  <span className="text-[10px] font-normal text-gray-400 italic">Optional</span>
                </label>

                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-2xl cursor-pointer transition">
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 text-[#0e623a] animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-[#0e623a]" />
                    )}
                    <span className="font-semibold text-gray-700 text-xs">
                      {uploadingFile ? 'Uploading images to Cloudinary...' : 'Click to Upload Images / Files'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploadingFile}
                      className="hidden"
                      onChange={(e) => handleModalFileUpload(e.target.files)}
                    />
                  </label>

                  {formData.attachments && formData.attachments.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {formData.attachments.map((att, aIdx) => (
                        <div key={aIdx} className="relative group flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2 py-1 rounded-xl text-xs">
                          <img src={att.url} alt="att" className="w-6 h-6 rounded object-cover" />
                          <span className="max-w-[110px] truncate text-[11px] font-semibold text-gray-700">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              attachments: prev.attachments.filter((_, i) => i !== aIdx)
                            }))}
                            className="text-red-500 hover:text-red-700 p-0.5 ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date & Repeat Reminders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Repeat Reminders
                  </label>
                  <select
                    value={formData.repeatType}
                    onChange={(e) => setFormData({ ...formData, repeatType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                  >
                    <option value="None">No Repeat (One-time)</option>
                    <option value="Hourly">Reminder Every X Hours</option>
                    <option value="Daily">Reminder Every X Days</option>
                  </select>
                </div>
              </div>

              {/* Interval details if repeat is enabled */}
              {formData.repeatType !== 'None' && (
                <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="font-extrabold text-purple-900">
                      Reminder Interval ({formData.repeatType === 'Hourly' ? 'in Hours' : 'in Days'}):
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={formData.reminderInterval}
                      onChange={(e) => setFormData({ ...formData, reminderInterval: Number(e.target.value) })}
                      className="px-3 py-1 bg-white border border-purple-300 rounded-lg text-xs font-extrabold text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                    >
                      {formData.repeatType === 'Hourly' ? (
                        <>
                          <option value="1">1 Hour</option>
                          <option value="2">2 Hours</option>
                          <option value="4">4 Hours</option>
                          <option value="6">6 Hours</option>
                          <option value="12">12 Hours</option>
                        </>
                      ) : (
                        <>
                          <option value="1">1 Day (Daily)</option>
                          <option value="2">2 Days</option>
                          <option value="3">3 Days</option>
                          <option value="7">7 Days (Weekly)</option>
                        </>
                      )}
                    </select>
                    <span className="text-[10px] text-purple-700 font-semibold italic">Until Completed</span>
                  </div>
                </div>
              )}

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

      {/* Task History & Comments / Replies Modal */}
      {historyModalOpen && selectedTaskForHistory && (() => {
        const recipientName = user?._id === selectedTaskForHistory.assignedTo?._id
          ? (selectedTaskForHistory.assignedBy?.name || 'Assigner')
          : (selectedTaskForHistory.assignedTo?.name || 'Assignee');

        return (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#0e623a] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-5 h-5 text-emerald-300" />
                  <div>
                    <h3 className="font-bold text-base">Task Replies & History Log</h3>
                    <p className="text-emerald-100 text-xs truncate max-w-md">{selectedTaskForHistory.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setHistoryModalOpen(false);
                    setSelectedTaskForHistory(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg transition text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Task Info Summary Bar */}
              <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-gray-500 font-medium block text-[10px] uppercase">Assigned To</span>
                    <span className="font-bold text-gray-800">{selectedTaskForHistory.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block text-[10px] uppercase">Assigned By</span>
                    <span className="font-bold text-gray-800">{selectedTaskForHistory.assignedBy?.name || 'Admin'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block text-[10px] uppercase">Status</span>
                    <span className="font-extrabold text-[#0e623a]">{selectedTaskForHistory.status}</span>
                  </div>
                  {selectedTaskForHistory.projectName && (
                    <div>
                      <span className="text-gray-500 font-medium block text-[10px] uppercase">Project</span>
                      <span className="font-extrabold text-[#0e623a] flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {selectedTaskForHistory.projectName}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-gray-500 font-medium block text-[10px] uppercase">Replying To</span>
                  <span className="font-extrabold text-blue-700">{recipientName}</span>
                </div>
              </div>

              {/* History & Replies Timeline Stream */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {(!selectedTaskForHistory.history || selectedTaskForHistory.history.length === 0) ? (
                  <div className="space-y-4">
                    {/* Default fallback timeline item if no history array yet */}
                    <div className="flex gap-3 items-start bg-gray-50 p-3.5 rounded-2xl border border-gray-150">
                      <div className="w-8 h-8 rounded-full bg-[#0e623a]/10 text-[#0e623a] flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedTaskForHistory.assignedBy?.name?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800">{selectedTaskForHistory.assignedBy?.name || 'Admin'}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {selectedTaskForHistory.createdAt ? new Date(selectedTaskForHistory.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Creation'}
                          </span>
                        </div>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-100 text-emerald-800 uppercase">
                          Task Created
                        </span>
                        <p className="text-gray-600 font-medium mt-1">
                          {selectedTaskForHistory.description || `Task created and assigned to ${selectedTaskForHistory.assignedTo?.name || 'user'}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {selectedTaskForHistory.history.slice().reverse().map((item, hIdx) => {
                      const author = item.updatedBy?.name || user?.name || 'System User';
                      const role = item.updatedBy?.role || 'Member';
                      const isReply = item.action?.includes('Reply') || item.action === 'Comment Added';

                      return (
                        <div key={item._id || hIdx} className="relative flex items-start gap-3 pl-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm z-10 ${
                            isReply ? 'bg-blue-600 text-white' : 'bg-[#0e623a] text-white'
                          }`}>
                            {author.slice(0, 2).toUpperCase()}
                          </div>

                          <div className={`flex-1 transition p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                            isReply ? 'bg-blue-50/50 border-blue-200/80' : 'bg-gray-50 border-gray-200/80'
                          }`}>
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-850">{author}</span>
                                <span className="text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                                  {role}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {item.timestamp ? new Date(item.timestamp).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
                              </span>
                            </div>

                            {item.action && (
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded uppercase tracking-wider ${
                                item.action?.includes('Reply') ? 'bg-blue-600 text-white' :
                                item.action === 'Task Created' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {item.action}
                              </span>
                            )}

                            {item.note && (
                              <p className="text-gray-800 font-medium whitespace-pre-wrap leading-relaxed mt-1">
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleAddComment} className="p-4 bg-white border-t border-gray-200 shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#0e623a]" />
                    <span className="font-bold text-xs text-gray-800">
                      Reply to <span className="text-[#0e623a] font-extrabold">{recipientName}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold">Replies will be recorded in task history</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    required
                    placeholder={`Write your reply or update note to ${recipientName}...`}
                    value={newCommentNote}
                    onChange={(e) => setNewCommentNote(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0e623a] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={commentSubmitting || !newCommentNote.trim()}
                    className="px-4 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0 self-end"
                  >
                    {commentSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Manage Task Categories Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-[#0e623a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-300" />
                <h3 className="font-bold text-sm">Manage Task Categories</h3>
              </div>
              <button
                onClick={() => {
                  setShowCategoryManager(false);
                  setEditingCategoryObj(null);
                  setNewCategoryName('');
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Create Category Form */}
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type new category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              {/* Categories List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <p className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">Existing Categories ({categoriesList.length})</p>
                {categoriesList.map(cat => {
                  const catId = cat._id;
                  const catName = typeof cat === 'string' ? cat : cat.name;
                  const isEditing = editingCategoryObj?._id === catId;

                  return (
                    <div 
                      key={catId || catName}
                      className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl gap-2"
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={catName}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCategory(catId, e.target.value);
                            } else if (e.key === 'Escape') {
                              setEditingCategoryObj(null);
                            }
                          }}
                          onBlur={(e) => handleUpdateCategory(catId, e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-white border border-emerald-400 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                        />
                      ) : (
                        <span className="font-extrabold text-gray-800 text-xs truncate">{catName}</span>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => setEditingCategoryObj(cat)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit / Rename Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {catId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(catId, catName)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryManager(false);
                  setEditingCategoryObj(null);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Image Lightbox Preview Modal */}
      {previewImageModal.open && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl relative animate-fadeIn flex flex-col">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs truncate max-w-md">{previewImageModal.name || 'Attachment Preview'}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white transition flex items-center gap-1 text-xs font-bold"
                  title="Open / Download"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>

                {previewImageModal.taskId && previewImageModal.attachmentId && (
                  <button
                    onClick={(e) => handleDeleteAttachment(previewImageModal.taskId, previewImageModal.attachmentId, e)}
                    className="p-1.5 hover:bg-rose-600/40 text-rose-300 hover:text-white rounded-lg transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                    title="Delete Attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}

                <button
                  onClick={() => setPreviewImageModal({ open: false, url: '', name: '', taskId: '', attachmentId: '' })}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-black flex items-center justify-center min-h-[300px] max-h-[75vh]">
              <img 
                src={previewImageModal.url} 
                alt={previewImageModal.name || 'Attachment'} 
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksBoard;
