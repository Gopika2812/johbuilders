import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Calendar, User } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path === '/projects/register') return 'Register New Project';
    if (path === '/projects') return 'Projects Dictionary';
    if (path.startsWith('/projects/')) return 'Project Details & Inventory';
    if (path === '/employees') return 'Employee Access Directory';
    if (path === '/employees/history') return 'Activity Logs & History';
    if (path === '/access-control') return 'Role Access Control (RBAC)';
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10 shadow-sm">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">{getPageTitle()}</h2>
      </div>

      {/* Profile info / Date status */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <Calendar className="w-4 h-4 text-[#0e623a]" />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800 leading-none">{user?.name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${getRoleBadgeStyle(user?.role)}`}>
              {user?.role}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-600 font-semibold shadow-inner">
            <User className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
