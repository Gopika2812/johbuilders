import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FolderGit2, 
  Users2, 
  ShieldCheck, 
  Settings2, 
  LogOut, 
  Building2,
  ChevronDown,
  History,
  UserPlus,
  Coins,
  BarChart3,
  ClipboardList,
  FileSpreadsheet
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [projectMenuOpen, setProjectMenuOpen] = useState(true);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(true);
  const [leadsMenuOpen, setLeadsMenuOpen] = useState(true);
  const [financeMenuOpen, setFinanceMenuOpen] = useState(true);
  const [reportsMenuOpen, setReportsMenuOpen] = useState(true);

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (e) => {
    if (e.target.closest('a')) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className={`w-64 bg-[#edfbf4] text-[#4b7a69] flex flex-col h-screen fixed left-0 top-0 z-50 border-none shadow-none transition-transform duration-300 transform ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <h1 className="font-extrabold text-2xl tracking-tight"><span className="text-[#11c278]">Land</span><span className="text-[#1e4a3b]">ERP</span></h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-4" onClick={handleNavClick}>
        {/* Dashboard */}
        <Link
          to="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive('/') 
              ? 'bg-[#11c278] text-white font-bold shadow-md' 
              : 'text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${isActive('/') ? 'text-white' : 'text-[#4b7a69]'}`} />
          <span>Dashboard</span>
        </Link>

        {/* KPI Insights */}
        <Link
          to="/kpi-insights"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive('/kpi-insights') 
              ? 'bg-[#11c278] text-white font-bold shadow-md' 
              : 'text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${isActive('/kpi-insights') ? 'text-white' : 'text-[#4b7a69]'}`} />
          <span>KPI Insights</span>
        </Link>

        {/* Projects Directory */}
        <Link
          to="/projects"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 ${
            isActive('/projects') 
              ? 'bg-white/10 text-white font-bold border-l-4 border-white' 
              : 'text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }`}
        >
          <FolderGit2 className={`w-5 h-5 ${isActive('/projects') ? 'text-white' : 'text-[#4b7a69]'}`} />
          <span>Projects Directory</span>
        </Link>

        {/* Leads Phase */}
        <div>
          <button
            onClick={() => setLeadsMenuOpen(!leadsMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200"
          >
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-[#4b7a69]" />
              <span className="font-semibold">Leads Phase</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#4b7a69] transition-transform duration-200 ${leadsMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {leadsMenuOpen && (
            <div className="pl-8 mt-1 space-y-1">
              <Link
                to="/leads"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && !location.search
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>Leads Directory</span>
              </Link>

              <Link
                to="/quotations"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/quotations'
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>Quotation Records</span>
              </Link>

              <Link
                to="/crd-dashboard"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-dashboard')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>CRD Dashboard</span>
              </Link>
              
              <Link
                to="/crd-flow"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>CRD Flow</span>
              </Link>

              <Link
                to="/crd-flow/bank-loan-history"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow/bank-loan-history')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>Bank Loan History</span>
              </Link>

             
            </div>
          )}
        </div>

        {/* Reports Master */}
        <div>
          <button
            onClick={() => setReportsMenuOpen(!reportsMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-[#4b7a69]" />
              <span className="font-semibold">Reports Master</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#4b7a69] transition-transform duration-200 ${reportsMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {reportsMenuOpen && (
            <div className="pl-8 mt-1 space-y-1">
              <Link
                to="/reports/export"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/reports/export')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>Export Reports</span>
              </Link>
              <Link
                to="/reports/crd"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/reports/crd')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>CRD Reports</span>
              </Link>
            </div>
          )}
        </div>

        {/* Customers Module */}
        <div>
          <Link
            to="/customers"
            onClick={handleNavClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 ${
              isActive('/customers')
                ? 'bg-white/10 text-white font-bold'
                : 'text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278]'
            }`}
          >
            <Users2 className="w-5 h-5 text-[#4b7a69]" />
            <span className="font-semibold">Customers</span>
          </Link>
        </div>

        {/* Employees Directory */}
        <div>
          <button
            onClick={() => setEmployeeMenuOpen(!employeeMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200"
          >
            <div className="flex items-center gap-3">
              <Users2 className="w-5 h-5 text-[#4b7a69]" />
              <span className="font-semibold">Employees</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#4b7a69] transition-transform duration-200 ${employeeMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {employeeMenuOpen && (
            <div className="pl-8 mt-1 space-y-1">
              <Link
                to="/employees"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                  isActive('/employees')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <Users2 className="w-4 h-4 text-[#4b7a69]" />
                <span>Approve Access</span>
              </Link>
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div>
          <Link
            to="/audit-logs"
            onClick={handleNavClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 ${
              isActive('/audit-logs')
                ? 'bg-white/10 text-white font-bold'
                : 'text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278]'
            }`}
          >
            <History className="w-5 h-5 text-[#4b7a69]" />
            <span className="font-semibold">Audit Logs</span>
          </Link>
        </div>

        {/* Finance & Accounts */}
        <div>
          <button
            onClick={() => setFinanceMenuOpen(!financeMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200"
          >
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-[#4b7a69]" />
              <span className="font-semibold text-sm">Finance & Accounts</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#4b7a69] transition-transform duration-200 ${financeMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {financeMenuOpen && (
            <div className="pl-8 mt-1 space-y-1">
              <Link
                to="/finance/budget-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/budget-planning')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>Budget Planning</span>
              </Link>
              
              <Link
                to="/finance/lead-target-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/lead-target-planning')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>Lead Target Planning</span>
              </Link>

              <Link
                to="/finance/summary-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/summary-planning')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#4b7a69] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span>Summary Planning</span>
              </Link>
            </div>
          )}
        </div>

        {/* Access Control (Admin Only) */}
        {isAdmin && (
          <>
            <Link
              to="/access-control"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/access-control') 
                  ? 'bg-[#11c278] text-white font-bold shadow-md' 
                  : 'text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278]'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${isActive('/access-control') ? 'text-white' : 'text-[#4b7a69]'}`} />
              <span>Access Control</span>
            </Link>

            <Link
              to="/requests"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/requests') 
                  ? 'bg-[#11c278] text-white font-bold shadow-md' 
                  : 'text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278]'
              }`}
            >
              <ClipboardList className={`w-5 h-5 ${isActive('/requests') ? 'text-white' : 'text-[#4b7a69]'}`} />
              <span>Requests</span>
            </Link>
          </>
        )}

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive('/settings') 
              ? 'bg-[#11c278] text-white font-bold shadow-md' 
              : 'text-[#4b7a69] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }`}
        >
          <Settings2 className={`w-5 h-5 ${isActive('/settings') ? 'text-white' : 'text-[#4b7a69]'}`} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-white text-[#0e623a] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate leading-tight text-white">{user?.name}</p>
              <span className="text-[10px] text-[#4b7a69] font-light block">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-[#4b7a69] hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
