import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { sendTaskAssignmentEmail } from '../utils/emailService';
import DateRangeFilter from '../components/DateRangeFilter';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
  XCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  FileSpreadsheet,
  Share2,
  Copy
} from 'lucide-react';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <div className="flex items-center gap-2 truncate flex-wrap">
            <span className="w-5 h-5 rounded-full bg-[#0e623a] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {selectedEmp.name ? selectedEmp.name.charAt(0).toUpperCase() : 'U'}
            </span>
            <span className="font-bold text-gray-900 truncate">{selectedEmp.name}</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              {selectedEmp.role || 'Staff'}
            </span>
            {selectedEmp.department && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                {selectedEmp.department}
              </span>
            )}
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
              placeholder="Search user, department, role..."
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 text-xs truncate">{emp.name}</span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                            {emp.role || 'Staff'}
                          </span>
                          {emp.department && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
                              {emp.department}
                            </span>
                          )}
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

const SearchableDropdown = ({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  colorScheme = 'emerald',
  allLabel = 'All'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt.id) === String(value));

  const filteredOptions = options.filter(opt =>
    (opt.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.subtext || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colorMap = {
    indigo: {
      btn: 'bg-indigo-50/90 hover:bg-indigo-100/90 border-indigo-200 text-indigo-950 shadow-xs',
      label: 'text-indigo-600',
      valText: 'text-indigo-950 font-black',
      icon: 'text-indigo-600',
      ring: 'focus:ring-indigo-500',
      activeItem: 'bg-indigo-100 text-indigo-900 font-extrabold border border-indigo-300'
    },
    purple: {
      btn: 'bg-purple-50/90 hover:bg-purple-100/90 border-purple-200 text-purple-950 shadow-xs',
      label: 'text-purple-600',
      valText: 'text-purple-950 font-black',
      icon: 'text-purple-600',
      ring: 'focus:ring-purple-500',
      activeItem: 'bg-purple-100 text-purple-900 font-extrabold border border-purple-300'
    },
    blue: {
      btn: 'bg-blue-50/90 hover:bg-blue-100/90 border-blue-200 text-blue-950 shadow-xs',
      label: 'text-blue-600',
      valText: 'text-blue-950 font-black',
      icon: 'text-blue-600',
      ring: 'focus:ring-blue-500',
      activeItem: 'bg-blue-100 text-blue-900 font-extrabold border border-blue-300'
    },
    emerald: {
      btn: 'bg-emerald-50/90 hover:bg-emerald-100/90 border-emerald-200 text-emerald-950 shadow-xs',
      label: 'text-emerald-700',
      valText: 'text-emerald-950 font-black',
      icon: 'text-emerald-700',
      ring: 'focus:ring-emerald-500',
      activeItem: 'bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300'
    }
  };

  const theme = colorMap[colorScheme] || colorMap.emerald;

  return (
    <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs flex items-center justify-between transition cursor-pointer ${theme.btn} focus:outline-none focus:ring-2 ${theme.ring}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {Icon && <Icon className={`w-4 h-4 shrink-0 ${theme.icon}`} />}
          <span className={`text-[11px] font-black uppercase tracking-wider ${theme.label} shrink-0`}>{label}:</span>
          <span className={`truncate ${theme.valText}`}>
            {selectedOption ? selectedOption.name : allLabel}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${theme.icon} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-[1050] bg-white border border-gray-200 rounded-2xl shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150 min-w-[220px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            <div
              onClick={() => {
                onChange('ALL');
                setIsOpen(false);
                setSearchTerm('');
              }}
              className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition text-xs ${
                value === 'ALL' ? theme.activeItem : 'hover:bg-gray-50 text-gray-700 font-semibold'
              }`}
            >
              <span>{allLabel}</span>
              {value === 'ALL' && <Check className="w-4 h-4 text-[#0e623a] shrink-0" />}
            </div>

            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400 italic">No matching results</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = String(opt.id) === String(value);
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition text-xs ${
                      isSelected ? theme.activeItem : 'hover:bg-gray-50 text-gray-800 font-semibold'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="truncate">{opt.name}</span>
                      {opt.subtext && <span className="text-[10px] text-gray-400 truncate">{opt.subtext}</span>}
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

  // View Tab Filter State: 'ALL' (Default), 'ASSIGNED_TO_ME', 'ASSIGNED_TO', 'OTHER_TASKS'
  const [viewTab, setViewTab] = useState('ALL');
  const [assignedToFilter, setAssignedToFilter] = useState('ALL');

  // Department, Priority & Project Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Categories/Departments list & management state
  const [categoriesList, setCategoriesList] = useState([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategoryObj, setEditingCategoryObj] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [projects, setProjects] = useState([]);
  const [projectSelectOption, setProjectSelectOption] = useState('');

  // Attachments & Preview Modal State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState({ open: false, url: '', name: '', taskId: '', attachmentId: '' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  // Row Action Menu (3-dots) State
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Card Details Popup Modal State
  const [cardModal, setCardModal] = useState({ open: false, type: 'ALL', title: '', tasks: [] });
  const [cardModalSearch, setCardModalSearch] = useState('');

  // Email Share Dialog State
  const [emailShareModal, setEmailShareModal] = useState({
    open: false,
    title: '',
    tasks: [],
    recipientEmail: '',
    note: '',
    sending: false,
    copied: false
  });

  const handleCardClick = (type, title, tasksList) => {
    setStatusFilter(type);
    setCardModal({
      open: true,
      type: type,
      title: title,
      tasks: tasksList || []
    });
    setCardModalSearch('');
  };

  const exportModalTasksToExcel = async (tasksToExport, title = 'Tasks_Report') => {
    try {
      if (!tasksToExport || tasksToExport.length === 0) {
        alert('No tasks available to export in this category.');
        return;
      }
      const wb = new ExcelJS.Workbook();
      const sheetName = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30) || 'Tasks_Report';
      const ws = wb.addWorksheet(sheetName);

      // Title Row
      ws.mergeCells('A1:K1');
      const titleCell = ws.getCell('A1');
      titleCell.value = `JOHN BUILDERS - ${title.toUpperCase()}`;
      titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E623A' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 32;

      // Subtitle / Date Row
      ws.mergeCells('A2:K2');
      const subCell = ws.getCell('A2');
      subCell.value = `Generated On: ${new Date().toLocaleString('en-GB')} | Total Tasks: ${tasksToExport.length}`;
      subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF333333' } };
      subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(2).height = 20;

      // Headers Row
      const headers = [
        'S.No',
        'Project Name',
        'Task Title',
        'Description',
        'Department',
        'Assigned To',
        'Assigned By',
        'Priority',
        'Assigned Date',
        'Due Date',
        'Status'
      ];

      const headerRow = ws.addRow(headers);
      headerRow.height = 26;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004D2A' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      });

      // Data Rows
      tasksToExport.forEach((task, idx) => {
        const assignedDateStr = task.createdAt 
          ? new Date(task.createdAt).toLocaleDateString('en-GB') 
          : (task.assignedDate ? new Date(task.assignedDate).toLocaleDateString('en-GB') : '—');
        const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '—';

        const row = ws.addRow([
          idx + 1,
          task.projectName || '—',
          task.title || '—',
          task.description || '—',
          task.category || 'General',
          task.assignedTo?.name || 'Unassigned',
          task.assignedBy?.name || 'Admin',
          task.priority || 'Medium',
          assignedDateStr,
          dueDateStr,
          task.status || 'New'
        ]);

        row.height = 22;
        const isEven = idx % 2 === 0;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { vertical: 'middle', horizontal: [1, 8, 9, 10, 11].includes(colNumber) ? 'center' : 'left' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FBF9' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E5E5' } },
            left: { style: 'thin', color: { argb: 'FFE5E5E5' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E5E5' } },
            right: { style: 'thin', color: { argb: 'FFE5E5E5' } }
          };
        });
      });

      // Column Widths
      ws.columns = [
        { width: 8 },  // S.No
        { width: 20 }, // Project
        { width: 28 }, // Title
        { width: 32 }, // Description
        { width: 16 }, // Department
        { width: 20 }, // Assigned To
        { width: 18 }, // Assigned By
        { width: 12 }, // Priority
        { width: 16 }, // Assigned Date
        { width: 16 }, // Due Date
        { width: 14 }  // Status
      ];

      const buffer = await wb.xlsx.writeBuffer();
      const cleanFileName = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      saveAs(new Blob([buffer]), cleanFileName);
      setSuccessMsg(`Exported ${tasksToExport.length} tasks to Excel successfully!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Failed to export tasks to Excel:', err);
      setError('Failed to export to Excel: ' + (err.message || 'Unknown error'));
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleOpenEmailShare = (title, tasksList) => {
    setEmailShareModal({
      open: true,
      title: title,
      tasks: tasksList,
      recipientEmail: '',
      note: '',
      sending: false,
      copied: false
    });
  };

  const generateTaskSummaryText = (title, tasksList, customNote = '') => {
    let summary = `JOHN BUILDERS - ${title.toUpperCase()}\n`;
    summary += `Date: ${new Date().toLocaleString('en-GB')}\n`;
    summary += `Total Tasks: ${tasksList.length}\n\n`;
    if (customNote.trim()) {
      summary += `Note:\n${customNote.trim()}\n\n`;
    }
    summary += `------------------------------------------------------------\n`;
    tasksList.forEach((t, i) => {
      const assignedDate = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : (t.assignedDate ? new Date(t.assignedDate).toLocaleDateString('en-GB') : '—');
      const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '—';
      summary += `${i + 1}. [${t.status || 'New'}] ${t.title || 'Untitled'}\n`;
      if (t.projectName) summary += `   Project: ${t.projectName}\n`;
      summary += `   Assigned To: ${t.assignedTo?.name || 'Unassigned'} (${t.category || 'General'})\n`;
      summary += `   Due Date: ${dueDate} | Priority: ${t.priority || 'Medium'}\n\n`;
    });
    summary += `------------------------------------------------------------\n`;
    summary += `Sent via John Builders Task Scheduler\n`;
    return summary;
  };

  const handleSendEmailReport = async (e) => {
    e.preventDefault();
    if (!emailShareModal.recipientEmail.trim()) {
      alert('Please enter or select a recipient email address.');
      return;
    }

    try {
      setEmailShareModal(prev => ({ ...prev, sending: true }));
      const subject = `Task Report: ${emailShareModal.title} (${emailShareModal.tasks.length} Tasks) - John Builders`;
      const body = generateTaskSummaryText(emailShareModal.title, emailShareModal.tasks, emailShareModal.note);

      // Launch email client via mailto
      const mailtoUrl = `mailto:${encodeURIComponent(emailShareModal.recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, '_blank');

      setSuccessMsg(`Email client launched with report for ${emailShareModal.recipientEmail}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEmailShareModal(prev => ({ ...prev, open: false, sending: false }));
    } catch (err) {
      console.error('Failed to send email:', err);
      setError('Failed to process email sharing');
      setTimeout(() => setError(''), 4000);
      setEmailShareModal(prev => ({ ...prev, sending: false }));
    }
  };

  const handleCopyEmailReport = (title, tasksList, note) => {
    const text = generateTaskSummaryText(title, tasksList, note);
    navigator.clipboard.writeText(text);
    setEmailShareModal(prev => ({ ...prev, copied: true }));
    setSuccessMsg('Task summary report copied to clipboard!');
    setTimeout(() => {
      setSuccessMsg('');
      setEmailShareModal(prev => ({ ...prev, copied: false }));
    }, 3000);
  };

  useEffect(() => {
    const handleDocClick = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectName: '',
    dueDate: '',
    assignedTo: '',
    status: 'New',
    priority: 'Medium',
    category: 'Sales Team',
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, priorityFilter, projectFilter, viewTab, assignedToFilter, startDate, endDate]);

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
      console.error('Error fetching categories/departments:', err);
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
        setSuccessMsg(`Department "${data.name}" created successfully`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data?.message || 'Failed to create department');
      }
    } catch (err) {
      setError(err.message || 'Error creating department');
    }
  };

  const handleUpdateCategory = async (categoryId, updatedName) => {
    if (!categoryId || categoryId === 'undefined') return;
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
        setSuccessMsg('Department updated successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data?.message || 'Failed to update department');
      }
    } catch (err) {
      setError('Error updating department');
    }
  };

  const handleDeleteCategory = async (categoryId, catName) => {
    if (!categoryId || categoryId === 'undefined') return;
    if (!window.confirm(`Are you sure you want to delete department "${catName}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/task-categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseResponseJSON(res);
      if (res.ok) {
        await fetchCategories();
        setSuccessMsg(`Department "${catName}" deleted`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data?.message || 'Failed to delete department');
      }
    } catch (err) {
      setError('Error deleting department');
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
    const defaultAssignedId = user?._id || (employees.length > 0 ? employees[0]._id : '');
    const assignedEmp = employees.find(emp => emp._id === defaultAssignedId) || user;
    const assignedDept = assignedEmp?.department || user?.department || 'General';
    setFormData({
      title: '',
      description: '',
      projectName: '',
      dueDate: '',
      assignedTo: defaultAssignedId,
      status: 'New',
      priority: 'Medium',
      category: assignedDept,
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

    const assignedId = task.assignedTo?._id || task.assignedTo || '';
    const assignedEmp = employees.find(emp => emp._id === assignedId);
    const assignedDept = assignedEmp?.department || task.assignedTo?.department || task.category || 'General';

    setFormData({
      title: task.title || '',
      description: task.description || '',
      projectName: taskProj,
      dueDate: dateFormatted,
      assignedTo: assignedId,
      status: task.status || 'New',
      priority: task.priority || 'Medium',
      category: assignedDept,
      repeatType: task.repeatType || 'None',
      reminderInterval: task.reminderInterval || 1,
      attachments: task.attachments || []
    });
    setShowModal(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate || !formData.assignedTo) {
      setError('Please fill in all required fields (Title, Assign To, Due Date)');
      return;
    }

    const todayStr = getTodayString();
    if (formData.dueDate <= todayStr) {
      setError('Due date must be a future date (tomorrow onwards). Today or past dates are not allowed.');
      return;
    }

    try {
      setModalLoading(true);
      setError('');
      const url = editingTask ? `${API_URL}/user-tasks/${editingTask._id}` : `${API_URL}/user-tasks`;
      const method = editingTask ? 'PUT' : 'POST';
      const payload = editingTask ? formData : { ...formData, status: 'New' };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedTask = await parseResponseJSON(res);
        await fetchTasks();
        setShowModal(false);
        setSuccessMsg(editingTask ? 'Task updated successfully!' : 'Task created and assigned successfully!');

        // Send EmailJS Task Assignment Notification to the assigned person's registered email
        const assignedPerson = employees.find(emp => emp._id === formData.assignedTo) || (formData.assignedTo === user?._id ? user : null);
        if (assignedPerson && assignedPerson.email) {
          const taskUrl = `${window.location.origin}/tasks-board`;
          sendTaskAssignmentEmail(
            assignedPerson,
            savedTask || {
              title: formData.title,
              description: formData.description,
              projectName: formData.projectName,
              category: formData.category,
              priority: formData.priority,
              dueDate: formData.dueDate
            },
            user?.name || 'System Admin',
            taskUrl
          ).catch(err => console.error('EmailJS task assignment email error:', err));
        }
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
    }

    if (assignedToFilter !== 'ALL' && (task.assignedTo?._id || task.assignedTo) !== assignedToFilter) {
      return false;
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
      const targetDate = task.dueDate ? new Date(task.dueDate) : (task.createdAt ? new Date(task.createdAt) : null);
      if (targetDate && targetDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const targetDate = task.dueDate ? new Date(task.dueDate) : (task.createdAt ? new Date(task.createdAt) : null);
      if (targetDate && targetDate > end) return false;
    }

    if (statusFilter === 'NEW') return task.status === 'New';
    if (statusFilter === 'IN_PROGRESS') return task.status === 'In Progress';
    if (statusFilter === 'PENDING') return task.status === 'New' || task.status === 'In Progress';
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
  const pendingCount = newCount + inProgressCount;
  const onHoldCount = tasks.filter(t => t.status === 'On Hold').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const cancelledCount = tasks.filter(t => t.status === 'Cancelled').length;
  const overdatedCount = tasks.filter(t => isOverdated(t)).length;

  // Pagination calculations (10 tasks per page)
  const totalTasks = sortedTasks.length;
  const totalPages = Math.ceil(totalTasks / tasksPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastTask = safeCurrentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = sortedTasks.slice(indexOfFirstTask, indexOfLastTask);

  return (
    <div className="space-y-3">
      {/* Stats Overview (8 Status Cards in 1 Clean Row) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* 1. Total (Highlighted Dark Green) */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL' 
              ? 'bg-[#003822] text-white border-emerald-700 shadow-md ring-2 ring-emerald-500 scale-[1.02]' 
              : 'bg-[#0e623a] text-white border-[#0e623a] hover:bg-[#003822]'
          }`}
          title="Click to view and filter all tasks"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-emerald-200">Total</span>
            <ClipboardList className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <p className="text-xl font-black mt-1 text-white">{totalCount}</p>
        </div>

        {/* 2. Pending Tasks (Red Colored Highlighted - right after Total) */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PENDING' 
              ? 'bg-[#800d0d] text-white border-rose-600 shadow-md ring-2 ring-rose-500 scale-[1.02]' 
              : 'bg-[#b91c1c] text-white border-[#b91c1c] hover:bg-[#991b1b] shadow-sm'
          }`}
          title="Click to filter Pending tasks (New & In Progress)"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-rose-100">Pending Tasks</span>
            <Clock className="w-3.5 h-3.5 text-rose-200" />
          </div>
          <p className="text-xl font-black mt-1 text-white">{pendingCount}</p>
        </div>

        {/* 3. New */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'NEW' ? 'ALL' : 'NEW')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'NEW' ? 'bg-blue-950 text-white border-blue-800 shadow-md ring-2 ring-blue-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
          title="Click to filter New tasks"
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'NEW' ? 'text-blue-300' : 'text-blue-600'}`}>New</span>
            <Clock className={`w-3.5 h-3.5 ${statusFilter === 'NEW' ? 'text-blue-300' : 'text-blue-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'NEW' ? 'text-white' : 'text-gray-800'}`}>{newCount}</p>
        </div>

        {/* 4. In Progress */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'IN_PROGRESS' ? 'bg-amber-950 text-white border-amber-800 shadow-md ring-2 ring-amber-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
          title="Click to filter In Progress tasks"
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'IN_PROGRESS' ? 'text-amber-300' : 'text-amber-600'}`}>In Progress</span>
            <Loader2 className={`w-3.5 h-3.5 ${statusFilter === 'IN_PROGRESS' ? 'text-amber-300' : 'text-amber-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'IN_PROGRESS' ? 'text-white' : 'text-gray-800'}`}>{inProgressCount}</p>
        </div>

        {/* 5. On Hold */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'ON_HOLD' ? 'ALL' : 'ON_HOLD')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'ON_HOLD' ? 'bg-purple-950 text-white border-purple-800 shadow-md ring-2 ring-purple-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
          title="Click to filter On Hold tasks"
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'ON_HOLD' ? 'text-purple-300' : 'text-purple-600'}`}>On Hold</span>
            <PauseCircle className={`w-3.5 h-3.5 ${statusFilter === 'ON_HOLD' ? 'text-purple-300' : 'text-purple-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'ON_HOLD' ? 'text-white' : 'text-gray-800'}`}>{onHoldCount}</p>
        </div>

        {/* 6. Completed */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'COMPLETED' ? 'bg-emerald-900 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500' : 'bg-white border-gray-150 hover:border-gray-300'}`}
          title="Click to filter Completed tasks"
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'COMPLETED' ? 'text-emerald-300' : 'text-emerald-600'}`}>Completed</span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === 'COMPLETED' ? 'text-emerald-300' : 'text-emerald-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'COMPLETED' ? 'text-white' : 'text-gray-800'}`}>{completedCount}</p>
        </div>

        {/* 7. Cancelled */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'CANCELLED' ? 'ALL' : 'CANCELLED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'CANCELLED' ? 'bg-gray-800 text-white border-gray-700 shadow-md ring-2 ring-gray-600' : 'bg-white border-gray-150 hover:border-gray-300'}`}
          title="Click to filter Cancelled tasks"
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'CANCELLED' ? 'text-gray-300' : 'text-gray-600'}`}>Cancelled</span>
            <XCircle className={`w-3.5 h-3.5 ${statusFilter === 'CANCELLED' ? 'text-gray-300' : 'text-gray-500'}`} />
          </div>
          <p className={`text-xl font-black mt-1 ${statusFilter === 'CANCELLED' ? 'text-white' : 'text-gray-800'}`}>{cancelledCount}</p>
        </div>

        {/* 8. Overdated */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'OVERDATED' ? 'ALL' : 'OVERDATED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'OVERDATED' ? 'bg-rose-950 text-white border-rose-800 shadow-md ring-2 ring-rose-600' : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'}`}
          title="Click to filter Overdated tasks"
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
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View Tabs Bar with Add New Task Button directly opposite */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-150 p-2 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* All Tasks (DEFAULT & HIGHLIGHTED) */}
          <button
            type="button"
            onClick={() => setViewTab('ALL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              viewTab === 'ALL'
                ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-md ring-2 ring-emerald-500/50 scale-[1.02]'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>All Tasks</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              viewTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {allTasksCount}
            </span>
          </button>

          {/* Assigned to Me */}
          <button
            type="button"
            onClick={() => setViewTab('ASSIGNED_TO_ME')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              viewTab === 'ASSIGNED_TO_ME'
                ? 'bg-[#0e623a] text-white shadow-md ring-2 ring-emerald-600/40'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
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

          {/* Assigned to */}
          <button
            type="button"
            onClick={() => setViewTab('I_ASSIGNED')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              viewTab === 'I_ASSIGNED'
                ? 'bg-purple-800 text-white shadow-md ring-2 ring-purple-500/40'
                : 'text-gray-600 hover:bg-purple-50 hover:text-purple-900 border border-gray-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Assigned to</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              viewTab === 'I_ASSIGNED' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}>
              {iAssignedCount}
            </span>
          </button>
        </div>

        {/* Add New Task Button directly opposite */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#006838] to-[#008c4a] hover:from-[#00522c] hover:to-[#00703b] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Search & Filter Toolbar Box */}
      <div className="bg-white border border-gray-150 rounded-2xl p-3.5 shadow-xs space-y-2.5">
        {/* Row 1: Main Search Bar, Date Filtration & Quick Export / Send Email */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#0e623a]" />
            <input
              type="text"
              placeholder="Search tasks by title, description, project, or assignee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0e623a] shadow-xs transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Filtration */}
          <div className="w-full lg:w-auto shrink-0">
            <DateRangeFilter
              fromDate={startDate}
              toDate={endDate}
              onDateChange={(newStart, newEnd) => {
                setStartDate(newStart);
                setEndDate(newEnd);
              }}
              onRefresh={() => fetchTasks()}
            />
          </div>

          {/* Export Excel & Send Email Actions above columns */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => exportModalTasksToExcel(filteredTasks, statusFilter === 'ALL' ? 'All_Tasks_Report' : `${statusFilter}_Tasks_Report`)}
              className="px-3.5 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Export filtered tasks to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenEmailShare(statusFilter === 'ALL' ? 'All Tasks Report' : `${statusFilter} Tasks Report`, filteredTasks)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Share filtered tasks via Email"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </button>
          </div>
        </div>

        {/* Row 2: Exactly 4 Color-Highlighted Searchable Filters (Project, Department, Assigned to, Status) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Project Filter (Indigo Theme) */}
          <SearchableDropdown
            label="Project"
            icon={Building}
            value={projectFilter}
            options={Array.from(new Set([
              ...projects.map(p => p.name).filter(Boolean),
              ...tasks.map(t => t.projectName).filter(Boolean)
            ])).sort().map(pName => ({ id: pName, name: pName }))}
            onChange={(val) => setProjectFilter(val)}
            colorScheme="indigo"
            allLabel="All Projects"
          />

          {/* 2. Department Filter (Purple Theme) */}
          <SearchableDropdown
            label="Department"
            icon={Filter}
            value={categoryFilter}
            options={categoriesList.map(cat => {
              const catName = typeof cat === 'string' ? cat : cat.name;
              return { id: catName, name: catName };
            })}
            onChange={(val) => setCategoryFilter(val)}
            colorScheme="purple"
            allLabel="All Departments"
          />

          {/* 3. Assigned to Filter (Blue Theme) */}
          <SearchableDropdown
            label="Assigned to"
            icon={User}
            value={assignedToFilter}
            options={employees.map(emp => ({
              id: emp._id,
              name: emp.name,
              subtext: emp.role || 'Staff'
            }))}
            onChange={(val) => setAssignedToFilter(val)}
            colorScheme="blue"
            allLabel="All Assignees"
          />

          {/* 4. Status Filter (Emerald Theme) */}
          <SearchableDropdown
            label="Status"
            icon={Clock}
            value={statusFilter}
            options={[
              { id: 'PENDING', name: `Pending (${pendingCount})` },
              { id: 'NEW', name: `New (${newCount})` },
              { id: 'IN_PROGRESS', name: `In Progress (${inProgressCount})` },
              { id: 'ON_HOLD', name: `On Hold (${onHoldCount})` },
              { id: 'COMPLETED', name: `Completed (${completedCount})` },
              { id: 'CANCELLED', name: `Cancelled (${cancelledCount})` },
              { id: 'OVERDATED', name: `Overdated (${overdatedCount})` }
            ]}
            onChange={(val) => setStatusFilter(val)}
            colorScheme="emerald"
            allLabel="All Statuses"
          />
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
          <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="p-2 w-7 text-center">S.No</th>
                    <th className="p-2 min-w-[70px] max-w-[90px]">Project</th>
                    <th className="p-2 min-w-[100px] max-w-[130px]">Task Title</th>
                    <th className="p-2 min-w-[70px] max-w-[85px]">Department</th>
                    <th className="p-2 min-w-[80px] max-w-[105px]">Assigned To</th>
                    <th className="p-2 min-w-[75px] max-w-[90px]">Assigned By</th>
                    <th className="p-2 min-w-[55px] text-center">Priority</th>
                    <th className="p-2 min-w-[75px]">Assigned Date</th>
                    <th className="p-2 min-w-[80px]">Due Date</th>
                    <th className="p-2 min-w-[80px] text-center">Status</th>
                    <th className="p-2 min-w-[70px] text-center">Attachments</th>
                    <th className="p-2 w-8 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentTasks.map((task, idx) => {
                    const over = isOverdated(task);
                    const isHighlighted = highlightTaskId === task._id;
                    const sNo = (safeCurrentPage - 1) * tasksPerPage + idx + 1;

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
                        <td className="p-2 text-center font-bold text-gray-400 text-xs">{sNo}</td>

                        {/* 2. Project Name */}
                        <td className="p-2">
                          {task.projectName ? (
                            <span className="font-bold text-[#0e623a] text-xs block truncate max-w-[90px]" title={task.projectName}>
                              {task.projectName}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">—</span>
                          )}
                        </td>

                        {/* 3. Task Title */}
                        <td className="p-2">
                          <span className="font-bold text-gray-900 text-xs block truncate max-w-[130px]" title={task.title}>
                            {task.title}
                          </span>
                        </td>

                        {/* 4. Department */}
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 border font-extrabold text-[10px] rounded-md inline-block max-w-[85px] truncate ${
                            task.category === 'Sales Team' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                            task.category === 'CRD Team' ? 'bg-purple-50 border-purple-200 text-purple-800' :
                            task.category === 'Accounts Team' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                            task.category === 'Administration (Superadmins)' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                            'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`} title={task.category || 'Sales Team'}>
                            {task.category || 'Sales Team'}
                          </span>
                        </td>

                        {/* 5. Assigned To (No initials avatar badge as requested) */}
                        <td className="p-2">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-xs truncate max-w-[105px]" title={task.assignedTo?.name}>{task.assignedTo?.name || 'Unassigned'}</p>
                            {task.assignedTo?.role && <span className="text-[9px] text-gray-400 font-semibold block truncate max-w-[105px]">{task.assignedTo?.role}</span>}
                          </div>
                        </td>

                        {/* 6. Assigned By */}
                        <td className="p-2">
                          <span className="font-semibold text-gray-700 text-xs truncate block max-w-[90px]" title={task.assignedBy?.name}>{task.assignedBy?.name || 'Admin'}</span>
                        </td>

                        {/* 7. Priority */}
                        <td className="p-2 text-center">
                          <span className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider border rounded ${priorityBadge}`}>
                            {task.priority || 'Medium'}
                          </span>
                        </td>

                        {/* 8. Assigned Date (No calendar icon as requested) */}
                        <td className="p-2">
                          <span className="text-gray-700 font-medium text-xs whitespace-nowrap block">
                            {task.createdAt 
                              ? new Date(task.createdAt).toLocaleDateString('en-GB') 
                              : (task.assignedDate 
                                  ? new Date(task.assignedDate).toLocaleDateString('en-GB') 
                                  : '—')}
                          </span>
                        </td>

                        {/* 9. Due Date (No calendar icon as requested) */}
                        <td className="p-2">
                          <div className="space-y-0.5">
                            <span className="text-gray-800 font-bold text-xs whitespace-nowrap block">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '—'}
                            </span>

                            {task.repeatType && task.repeatType !== 'None' && (
                              <div className="text-[8.5px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1 py-0.2 rounded w-fit whitespace-nowrap">
                                Every {task.reminderInterval || 1} {task.repeatType === 'Hourly' ? 'Hr' : 'Day'}
                              </div>
                            )}

                            {over && (
                              <span className="inline-block px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-300 animate-pulse whitespace-nowrap">
                                OVERDATED
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 10. Status */}
                        <td className="p-2 text-center">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border focus:outline-none focus:ring-1 focus:ring-[#0e623a] cursor-pointer ${statusBadge}`}
                          >
                            <option value="New">New</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* 11. Attachments */}
                        <td className="p-2 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {task.attachments && task.attachments.length > 0 ? (
                              <div className="flex items-center gap-1 flex-wrap justify-center max-w-[80px]">
                                {task.attachments.map((att, aIdx) => (
                                  <div 
                                    key={att._id || aIdx} 
                                    className="relative group shrink-0"
                                    title={att.name || 'View Attachment'}
                                  >
                                    <img 
                                      src={att.url} 
                                      alt={att.name || 'Attachment'} 
                                      className="w-5 h-5 rounded object-cover border border-gray-200 cursor-pointer shadow-2xs"
                                      onClick={() => setPreviewImageModal({ open: true, url: att.url, name: att.name, taskId: task._id, attachmentId: att._id })}
                                    />
                                    <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center gap-0.5 transition">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImageModal({ open: true, url: att.url, name: att.name, taskId: task._id, attachmentId: att._id })}
                                        className="p-0.5 text-white hover:text-emerald-300 transition cursor-pointer"
                                        title="View Image"
                                      >
                                        <Eye className="w-2.5 h-2.5" />
                                      </button>
                                      {att._id && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteAttachment(task._id, att._id, e)}
                                          className="p-0.5 text-rose-300 hover:text-rose-500 transition cursor-pointer"
                                          title="Delete Attachment"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            <label className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-[#0e623a] border border-emerald-200 rounded text-[9px] font-bold cursor-pointer transition shadow-2xs">
                              <UploadCloud className="w-2.5 h-2.5" />
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

                        {/* 12. Actions (3 Dots Menu) */}
                        <td className="p-2 text-center relative action-menu-container">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === task._id ? null : task._id);
                            }}
                            className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition cursor-pointer inline-flex items-center justify-center"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openActionMenuId === task._id && (
                            <div className="absolute right-2 top-8 z-[100] bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-32 text-left animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleOpenHistoryModal(task);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-semibold transition cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Reply</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleOpenHistoryModal(task);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-semibold transition cursor-pointer"
                              >
                                <History className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>History</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleOpenEditModal(task);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-semibold transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Edit</span>
                              </button>
                              <div className="border-t border-gray-100 my-0.5"></div>
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleDeleteTask(task._id);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (10 Tasks per page) */}
            {totalTasks > 0 && (
              <div className="p-3.5 bg-white border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-gray-500 font-bold text-xs">
                  Showing {(safeCurrentPage - 1) * tasksPerPage + 1} to {Math.min(safeCurrentPage * tasksPerPage, totalTasks)} of {totalTasks} tasks
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) {
                          acc.push('...');
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) => {
                        if (p === '...') {
                          return <span key={`dots-${idx}`} className="px-1 text-gray-400 font-bold text-xs">...</span>;
                        }
                        const isCurrent = p === safeCurrentPage;
                        return (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                              isCurrent 
                                ? 'bg-[#0e623a] text-white shadow-xs' 
                                : 'border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                  </div>

                  <button
                    disabled={safeCurrentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Create / Edit Task Modal (Responsive for all laptop viewports) */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#006838] to-[#008c4a] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {editingTask ? 'Edit Task' : 'Create & Assign New Task'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitTask} className="p-6 overflow-y-auto space-y-4 text-xs flex-1 custom-scrollbar">
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
                    Assign To <span className="text-red-500">*</span>
                  </label>
                  <CustomPersonSelector
                    employees={employees}
                    value={formData.assignedTo}
                    onChange={(selectedId) => {
                      const selectedEmp = employees.find(emp => emp._id === selectedId);
                      const empDept = selectedEmp?.department || 'General';
                      setFormData(prev => ({
                        ...prev,
                        assignedTo: selectedId,
                        category: empDept
                      }));
                    }}
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

              {/* Department (Auto Assigned based on selected person) & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Department
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                      <span className="truncate">{formData.category || 'General'}</span>
                    </span>
                    <span className="text-[10px] bg-purple-50 text-purple-800 font-extrabold px-2 py-0.5 rounded border border-purple-200 shrink-0 ml-2">
                      Auto Assigned
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Status
                  </label>
                  {editingTask ? (
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
                  ) : (
                    <div className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>New</span>
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                        Default
                      </span>
                    </div>
                  )}
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
                  <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Due Date <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-emerald-700 font-semibold">(Future date only)</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={getTomorrowString()}
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
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

              {/* Modal Actions (Sticky bottom footer for laptop screens) */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 shrink-0 sticky bottom-0 bg-white z-10">
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

      {/* Manage Departments Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-[#0e623a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-300" />
                <h3 className="font-bold text-sm">Manage Departments</h3>
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
              {/* Create Department Form */}
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type new department name..."
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

              {/* Departments List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <p className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">Existing Departments ({categoriesList.length})</p>
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

      {/* Email Sharing Modal */}

      {/* Email Sharing Sub-Modal */}
      {emailShareModal.open && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-200" />
                <div>
                  <h3 className="font-extrabold text-sm">Share Tasks Report via Email</h3>
                  <p className="text-[10px] text-blue-100">{emailShareModal.title} ({emailShareModal.tasks?.length || 0} Tasks)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailShareModal(prev => ({ ...prev, open: false }))}
                className="p-1 hover:bg-white/20 rounded-lg transition text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmailReport} className="p-6 space-y-4 text-xs">
              {/* Recipient Selector / Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">Recipient Email Address <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter recipient email (e.g. manager@builders.com)..."
                    value={emailShareModal.recipientEmail}
                    onChange={(e) => setEmailShareModal(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />

                  {/* Quick Pick from Team Members */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400">Quick select:</span>
                    {employees.filter(e => e.email).slice(0, 5).map(emp => (
                      <button
                        key={emp._id || emp.email}
                        type="button"
                        onClick={() => setEmailShareModal(prev => ({ ...prev, recipientEmail: emp.email }))}
                        className="px-2 py-0.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 rounded-lg text-[10px] font-semibold transition border border-gray-200 cursor-pointer"
                      >
                        {emp.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Custom Note */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">Optional Message / Note</label>
                <textarea
                  rows={3}
                  placeholder="Add any specific instructions or note to include with the report..."
                  value={emailShareModal.note}
                  onChange={(e) => setEmailShareModal(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              {/* Preview Box */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600 text-[11px]">Report Summary Preview</span>
                  <button
                    type="button"
                    onClick={() => handleCopyEmailReport(emailShareModal.title, emailShareModal.tasks, emailShareModal.note)}
                    className="text-blue-600 hover:text-blue-800 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{emailShareModal.copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 line-clamp-3 font-mono bg-white p-2 rounded border border-gray-150">
                  {generateTaskSummaryText(emailShareModal.title, emailShareModal.tasks, emailShareModal.note)}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEmailShareModal(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailShareModal.sending || !emailShareModal.recipientEmail}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
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
