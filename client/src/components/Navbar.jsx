import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, User, Menu, Bell, ClipboardList, CheckCircle2, Clock, LogOut } from 'lucide-react';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, token, logout, getLabel } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [taskNotifications, setTaskNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupLeads, setPopupLeads] = useState([]);
  const [popupTasks, setPopupTasks] = useState([]);

  const dropdownRef = useRef(null);
  const [ignoredLeads, setIgnoredLeads] = useState([]);

  useEffect(() => {
    if (!token) return;

    // Request Notification permission on first user interaction
    const requestPermissionOnInteraction = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      document.removeEventListener('click', requestPermissionOnInteraction);
    };
    document.addEventListener('click', requestPermissionOnInteraction);

    fetchNotifications();
    // Poll every 45 seconds
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [token, ignoredLeads]);

  const fetchNotifications = async () => {
    try {
      const [resAssigned, resFollowUps, resTaskNotifs] = await Promise.all([
        fetch(`${API_URL}/leads/today-assigned`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/leads/due-followups`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/user-tasks/notifications`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      let dataAssigned = [];
      let dataFollowUps = [];
      let dataTasks = [];

      if (resAssigned.ok) dataAssigned = await resAssigned.json();
      if (resFollowUps.ok) dataFollowUps = await resFollowUps.json();
      if (resTaskNotifs.ok) dataTasks = await resTaskNotifs.json();

      // Deduplicate leads
      const combined = [...dataAssigned, ...dataFollowUps];
      const uniqueIds = new Set();
      const uniqueLeads = combined.filter(lead => {
        if (!uniqueIds.has(lead._id)) {
          uniqueIds.add(lead._id);
          return true;
        }
        return false;
      });

      // Filter leads to ONLY those assigned specifically to the logged in user & NOT Booked/Won/Closed
      const assignedToMe = uniqueLeads.filter(lead => {
        const assignedId = typeof lead.assignedTo === 'object' ? lead.assignedTo?._id : lead.assignedTo;
        const isAssignedToUser = assignedId && String(assignedId) === String(user?._id);
        const isBookedOrClosed = ['Booking', 'Won', 'Booked', 'Lost'].includes(lead.status) || lead.isClosed;
        return isAssignedToUser && !isBookedOrClosed;
      });

      setNotifications(assignedToMe);
      setTaskNotifications(dataTasks);

      // Admin / Superadmin does not get lead assignment popups/notifications
      const isSuperadmin = user?.role === 'Superadmin';
      const myLeadsToNotify = isSuperadmin ? [] : assignedToMe;

      // Check ignored leads
      let ignoredIds = [...ignoredLeads];
      try {
        const stored = sessionStorage.getItem('ignored_assignments');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            ignoredIds = Array.from(new Set([...ignoredIds, ...parsed]));
          }
        }
      } catch (e) {
        console.warn('sessionStorage is not accessible', e);
      }
      const newLeads = myLeadsToNotify.filter(lead => !ignoredIds.includes(lead._id));

      if (newLeads.length > 0 || dataTasks.length > 0) {
        setPopupLeads(newLeads);
        setPopupTasks(dataTasks);
        setShowPopup(true);

        // Trigger system notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          let bodyText = '';
          if (dataTasks.length > 0) {
            bodyText += `You have ${dataTasks.length} task(s) assigned to you. `;
          }
          if (newLeads.length > 0) {
            bodyText += `Leads pending action: ${newLeads.map(l => l.name).slice(0, 2).join(', ')}`;
          }

          const notifOptions = {
            body: bodyText,
            icon: '/JB logo.png',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200],
            requireInteraction: true
          };

          try {
            navigator.serviceWorker.getRegistration().then(reg => {
              if (reg) {
                reg.showNotification('New Tasks & Lead Alerts', notifOptions);
              } else {
                new Notification('New Tasks & Lead Alerts', notifOptions);
              }
            });
          } catch (e) {
            new Notification('New Tasks & Lead Alerts', notifOptions);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleIgnorePopup = () => {
    let ignoredIds = [...ignoredLeads];
    try {
      const stored = sessionStorage.getItem('ignored_assignments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          ignoredIds = Array.from(new Set([...ignoredIds, ...parsed]));
        }
      }
    } catch (e) {
      console.warn('sessionStorage is not accessible', e);
    }
    popupLeads.forEach(lead => {
      if (!ignoredIds.includes(lead._id)) {
        ignoredIds.push(lead._id);
      }
    });
    setIgnoredLeads(ignoredIds);
    try {
      sessionStorage.setItem('ignored_assignments', JSON.stringify(ignoredIds));
    } catch (e) {
      console.warn('sessionStorage is not accessible', e);
    }
    setShowPopup(false);
  };

  const handleTaskTakeAction = async (task) => {
    try {
      await fetch(`${API_URL}/user-tasks/${task._id}/action`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTaskNotifications(prev => prev.filter(t => t._id !== task._id));
      setPopupTasks(prev => prev.filter(t => t._id !== task._id));
      setShowPopup(false);
      setShowDropdown(false);
      navigate(`/tasks-board?highlight=${task._id}`);
    } catch (err) {
      console.error('Error executing task action:', err);
    }
  };

  const handleTaskAskMeLater = async (task) => {
    try {
      await fetch(`${API_URL}/user-tasks/${task._id}/snooze`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTaskNotifications(prev => prev.filter(t => t._id !== task._id));
      setPopupTasks(prev => prev.filter(t => t._id !== task._id));
      if (popupLeads.length === 0 && popupTasks.length <= 1) {
        setShowPopup(false);
      }
    } catch (err) {
      console.error('Error snoozing task:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return getLabel ? getLabel('dashboard', 'sidebar', 'Dashboard') : 'Dashboard';
    if (path === '/kpi-insights') return getLabel ? getLabel('kpi_insights', 'sidebar', 'KPI Insights') : 'KPI Insights';
    if (path === '/tasks-board') return getLabel ? getLabel('tasks_board', 'sidebar', 'Task Board') : 'Task Board';
    if (path === '/projects/register') return 'Register New Project';
    if (path === '/projects') return getLabel ? getLabel('projects', 'sidebar', 'Projects Directory') : 'Projects Directory';
    if (path.startsWith('/projects/')) return 'Project Details & Inventory';
    if (path === '/leads') return getLabel ? getLabel('leads', 'sidebar', 'Leads Directory') : 'Leads Directory';
    if (path === '/quotations') return getLabel ? getLabel('quotations', 'sidebar', 'Quotation Records') : 'Quotation Records';
    if (path === '/crd-flow') return getLabel ? getLabel('crd_flow', 'sidebar', 'CRD Flow') : 'CRD Flow';
    if (path === '/crd-flow/extra-works') return getLabel ? getLabel('extra_works', 'sidebar', 'Extra Works Flow') : 'Extra Works Flow';
    if (path === '/crd-flow/bank-loan-history') return getLabel ? getLabel('bank_loan', 'sidebar', 'Bank Loan History') : 'Bank Loan History';
    if (path === '/crd-flow/overall-report') return getLabel ? getLabel('overall_collection', 'sidebar', 'Overall Collection Report') : 'Overall Collection Report';
    if (path === '/reports/export') return getLabel ? getLabel('export_reports', 'sidebar', 'Sales Reports') : 'Sales Reports';
    if (path === '/reports/crd') return getLabel ? getLabel('crd_reports', 'sidebar', 'CRD Reports') : 'CRD Reports';
    if (path === '/employees') return getLabel ? getLabel('employees', 'sidebar', 'Employees') : 'Employees';
    if (path === '/employees/history') return 'Activity Logs & History';
    if (path === '/audit-logs') return getLabel ? getLabel('audit_logs', 'sidebar', 'Audit Logs') : 'Audit Logs';
    if (path === '/settings') return getLabel ? getLabel('settings', 'sidebar', 'System Settings') : 'System Settings';
    if (path === '/finance/summary-planning') return getLabel ? getLabel('summary', 'sidebar', 'Summary Planning') : 'Summary Planning';
    return 'ERP Portal';
  };

  const totalBadgeCount = notifications.length + taskNotifications.length;

  return (
    <>
      <header className={`h-16 bg-transparent border-none flex items-center justify-between px-4 md:px-8 z-30 shadow-sm transition-all duration-300 w-full`}>
        {/* Title & Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-base md:text-xl font-bold text-gray-800 tracking-tight truncate max-w-[180px] sm:max-w-none">{getPageTitle()}</h2>
        </div>

        {/* Profile info / Date status */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <Calendar className="w-4 h-4 text-[#0e623a]" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>

          {/* Bell Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {totalBadgeCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute -right-12 sm:right-0 mt-2.5 w-[320px] sm:w-96 bg-white border border-gray-150 rounded-2xl shadow-xl z-[100] p-4 text-left animate-fadeIn max-h-96 flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                  <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">Notifications & Tasks</span>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 bg-[#0e623a]/10 text-[#0e623a] rounded-full">
                    {totalBadgeCount} Pending
                  </span>
                </div>

                <div className="overflow-y-auto space-y-3 scrollbar-none flex-grow pr-1">
                  {/* Task Notifications Section */}
                  {taskNotifications.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#0e623a] uppercase tracking-wider">
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Assigned Tasks ({taskNotifications.length})</span>
                      </div>
                      {taskNotifications.map(task => (
                        <div 
                          key={task._id}
                          className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl transition text-xs space-y-2"
                        >
                          <div className="font-bold text-gray-850">
                            You were assigned task <span className="text-[#0e623a]">"{task.title}"</span> by {task.assignedBy?.name || 'Admin'}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                            <span>Due Date: {new Date(task.dueDate).toLocaleDateString()}</span>
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold uppercase">{task.status}</span>
                          </div>

                          <div className="flex gap-2 pt-1 border-t border-emerald-100/60">
                            <button
                              onClick={() => handleTaskAskMeLater(task)}
                              className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg transition"
                            >
                              Ask Me Later
                            </button>
                            <button
                              onClick={() => handleTaskTakeAction(task)}
                              className="flex-1 py-1 px-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-[10px] font-bold rounded-lg transition"
                            >
                              Take Action
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lead Notifications Section */}
                  {notifications.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Lead Alerts ({notifications.length})</span>
                      </div>
                      {notifications.map(lead => (
                        <div 
                          key={lead._id}
                          onClick={() => {
                            setShowDropdown(false);
                            navigate(`/leads?search=${encodeURIComponent(lead.name || lead.phone || '')}`);
                          }}
                          className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl cursor-pointer transition text-xs space-y-1"
                        >
                          <div className="flex justify-between font-bold text-gray-850">
                            <span>{lead.name}</span>
                            <span className="text-[10px] text-[#0e623a] bg-[#0e623a]/10 px-1.5 py-0.5 rounded">
                              {lead.project?.code || 'No Proj'}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex justify-between">
                            <span>{lead.leadSource ? `Source: ${lead.leadSource}` : `Next Follow-Up: ${new Date(lead.followUpInfo?.nextFollowUpDate).toLocaleString()}`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalBadgeCount === 0 && (
                    <div className="py-8 text-center text-gray-400 italic text-xs">
                      No pending notifications or task assignments.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="glass-card px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-2 sm:gap-3 pointer-events-auto shadow-sm hover:shadow-md transition-all border border-white/60 bg-white/60 backdrop-blur-xl">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user?.role}</span>
                <span className="text-sm font-black text-black">{user?.name}</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#006838] to-[#008c4a] flex items-center justify-center text-white shadow-inner font-bold text-xs">
                {user?.name?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 sm:p-2.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full transition flex items-center justify-center border border-red-200 cursor-pointer shadow-sm"
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Task & Lead Popup Alert Modal */}
      {showPopup && (popupLeads.length > 0 || popupTasks.length > 0) && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-full max-w-md p-6 text-left animate-fadeIn space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="p-2.5 bg-emerald-50 text-[#0e623a] rounded-2xl">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                  Task & Lead Notifications
                </h3>
                <p className="text-[11px] text-gray-500">Please review assigned tasks and action alerts</p>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {/* Task Assignment Alerts */}
              {popupTasks.map(task => (
                <div key={task._id} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-2 shadow-sm">
                  <div className="flex items-start gap-2">
                    <ClipboardList className="w-4 h-4 text-[#0e623a] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-gray-850">
                        You were assigned task <span className="text-[#0e623a]">"{task.title}"</span> by {task.assignedBy?.name || 'Admin'}
                      </p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                        Due Date: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-emerald-200/60 justify-end">
                    <button
                      onClick={() => handleTaskAskMeLater(task)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Ask Me Later
                    </button>
                    <button
                      onClick={() => handleTaskTakeAction(task)}
                      className="px-4 py-1.5 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                    >
                      Take Action
                    </button>
                  </div>
                </div>
              ))}

              {/* Lead Alerts */}
              {popupLeads.map(lead => (
                <div 
                  key={lead._id}
                  onClick={() => {
                    setShowPopup(false);
                    navigate(`/leads?search=${encodeURIComponent(lead.name || lead.phone || '')}`);
                  }}
                  className="p-3 bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 rounded-2xl text-xs space-y-1 cursor-pointer transition shadow-sm"
                >
                  <div className="flex justify-between font-bold text-gray-850">
                    <span className="text-[#0e623a] font-extrabold hover:underline">{lead.name}</span>
                    <span className="text-[10px] text-[#0e623a] bg-[#0e623a]/10 px-1.5 py-0.5 rounded font-bold">
                      {lead.project?.code || 'No Proj'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 flex justify-between items-center">
                    <span>Phone: {lead.phone}</span>
                    <span className="text-[10px] text-amber-800 font-extrabold flex items-center gap-0.5">
                      Redirect to Lead Directory →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
              <button
                onClick={handleIgnorePopup}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Popup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
