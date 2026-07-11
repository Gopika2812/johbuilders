import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, User, Menu, Bell } from 'lucide-react';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupLeads, setPopupLeads] = useState([]);
  const dropdownRef = useRef(null);

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
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const [resAssigned, resFollowUps] = await Promise.all([
        fetch(`${API_URL}/leads/today-assigned`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/leads/due-followups`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      let dataAssigned = [];
      let dataFollowUps = [];

      if (resAssigned.ok) dataAssigned = await resAssigned.json();
      if (resFollowUps.ok) dataFollowUps = await resFollowUps.json();

      // Combine and deduplicate
      const combined = [...dataAssigned, ...dataFollowUps];
      const uniqueIds = new Set();
      const uniqueData = combined.filter(lead => {
        if (!uniqueIds.has(lead._id)) {
          uniqueIds.add(lead._id);
          return true;
        }
        return false;
      });

      setNotifications(uniqueData);

      // Check ignored leads
      const ignoredIds = JSON.parse(sessionStorage.getItem('ignored_assignments') || '[]');
      const newLeads = uniqueData.filter(lead => !ignoredIds.includes(lead._id));

      if (newLeads.length > 0) {
        setPopupLeads(newLeads);
        setShowPopup(true);

        // Trigger system-level notification (for lock screen/background)
        if ('Notification' in window && Notification.permission === 'granted') {
          const names = newLeads.map(l => l.name).slice(0, 3).join(', ');
          const more = newLeads.length > 3 ? ' and more...' : '';
          const body = `Please review action for: ${names}${more}`;
          
          try {
            // Try service worker first (better support on Android Chrome)
            navigator.serviceWorker.getRegistration().then(reg => {
              if (reg) {
                reg.showNotification('New Alerts & Follow-ups', { body, vibrate: [200, 100, 200] });
              } else {
                new Notification('New Alerts & Follow-ups', { body });
              }
            });
          } catch (e) {
            new Notification('New Alerts & Follow-ups', { body });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleIgnorePopup = () => {
    const ignoredIds = JSON.parse(sessionStorage.getItem('ignored_assignments') || '[]');
    popupLeads.forEach(lead => {
      if (!ignoredIds.includes(lead._id)) {
        ignoredIds.push(lead._id);
      }
    });
    sessionStorage.setItem('ignored_assignments', JSON.stringify(ignoredIds));
    setShowPopup(false);
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
    if (path === '/') return 'Dashboard';
    if (path === '/projects/register') return 'Register New Project';
    if (path === '/projects') return 'Projects Dictionary';
    if (path.startsWith('/projects/')) return 'Project Details & Inventory';
    if (path === '/employees') return 'Employee Access Directory';
    if (path === '/employees/history') return 'Activity Logs & History';
    if (path === '/audit-logs') return 'Role Access Control (RBAC)';
    if (path === '/settings') return 'System Settings';
    return 'ERP Portal';
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Sales Executive':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Site Engineer':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

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
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white border border-gray-150 rounded-2xl shadow-xl z-[100] p-4 text-left animate-fadeIn max-h-80 flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                  <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">Assignments & Follow-ups</span>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 bg-[#0e623a]/10 text-[#0e623a] rounded-full">
                    {notifications.length} Pending
                  </span>
                </div>
                <div className="overflow-y-auto space-y-2 scrollbar-none flex-grow">
                  {notifications.length > 0 ? (
                    notifications.map(lead => (
                      <div 
                        key={lead._id}
                        onClick={() => {
                          setShowDropdown(false);
                          navigate(`/leads?search=${lead.name}`);
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
                          {(user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Super Admin') && (
                            <span className="font-semibold text-gray-650">Executive: {lead.assignedTo?.name || 'Unassigned'}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                      <div className="py-8 text-center text-gray-400 italic text-xs">
                        No assignments or due follow-ups pending action.
                      </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="text-right">
              <p className="text-xs md:text-sm font-semibold text-gray-800 leading-none">{user?.name}</p>
              <span className={`text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${getRoleBadgeStyle(user?.role)}`}>
                {user?.role}
              </span>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-600 font-semibold shadow-inner">
              <User className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
            </div>
          </div>
        </div>
      </header>

      {/* Today's Assignments Popup Alert Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-full max-w-md p-6 text-left animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-4">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                  New Alerts & Follow-ups
                </h3>
                <p className="text-[11px] text-gray-500">Please review and action these leads</p>
              </div>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {popupLeads.map(lead => (
                <div key={lead._id} className="p-3 bg-amber-50/30 border border-amber-100 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-gray-850">
                    <span>{lead.name}</span>
                    <span className="text-[10px] text-[#0e623a] bg-[#0e623a]/10 px-1.5 py-0.5 rounded">
                      {lead.project?.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 flex justify-between">
                    <span>Phone: {lead.phone}</span>
                    {(user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Super Admin') && (
                      <span className="font-semibold text-gray-650">Assigned To: {lead.assignedTo?.name || 'Unassigned'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end mt-6 pt-3 border-t border-gray-100">
              <button
                onClick={handleIgnorePopup}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-705 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Ignore
              </button>
              <button
                onClick={() => {
                  handleIgnorePopup();
                  navigate('/leads?status=Assigned');
                }}
                className="px-4 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Go to Leads Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
