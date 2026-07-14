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
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = sidebarOpen || isHovered;

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (e) => {
    if (window.innerWidth < 768 && e.target.closest('a')) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-[#050907]/95 backdrop-blur-3xl border-r border-white/10 shadow-[4px_0_30px_rgba(0,0,0,0.5)] text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 ${isExpanded ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0 overflow-hidden'}`}>
      {/* Decorative background glows inside sidebar */}
      <div className="absolute top-[-10%] left-[-20%] w-[100%] h-[40%] bg-[#006838]/20 rounded-full blur-[80px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[30%] bg-emerald-600/10 rounded-full blur-[70px] pointer-events-none z-0"></div>

      {/* Brand Logo Header */}
      <div className={`px-0 py-4 flex items-center justify-center w-full relative z-10 border-b border-white/5`}>
        {isExpanded ? (
          <img src="/jb_logo.jpg" alt="JB Logo" className="w-full h-auto object-contain" />
        ) : (
          <img src="/jb_logo.jpg" alt="JB Logo" className="w-12 h-12 object-contain" />
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-3 relative z-10 custom-scrollbar" onClick={handleNavClick}>
        {/* Dashboard */}
        <Link
          to="/"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
            isActive('/') 
              ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
              : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${isActive('/') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>Dashboard</span>
        </Link>

        {/* KPI Insights */}
        <Link
          to="/kpi-insights"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
            isActive('/kpi-insights') 
              ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
              : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${isActive('/kpi-insights') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>KPI Insights</span>
        </Link>

        {/* Projects Directory */}
        <Link
          to="/projects"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-205 ${
            isActive('/projects') 
              ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
              : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          <FolderGit2 className={`w-5 h-5 ${isActive('/projects') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>Projects Directory</span>
        </Link>

        
        {/* Leads Directory (Promoted to Main Item) */}
        <Link
          to="/leads"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 ${
            location.pathname === '/leads' && !location.search
              ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
              : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          <UserPlus className={`w-5 h-5 ${location.pathname === '/leads' && !location.search ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>Leads Directory</span>
        </Link>

        {/* CRD Group */}
        <div>
          <button
            onClick={() => setLeadsMenuOpen(!leadsMenuOpen)}
            className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-white font-bold hover:bg-white/5 hover:text-white rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-5 h-5 text-white group-hover:text-emerald-400 transition-colors" />
              <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>CRD</span>
            </div>
            {isExpanded && <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${leadsMenuOpen ? 'rotate-180' : ''}`} />}
          </button>
          
          {leadsMenuOpen && isExpanded && (
            <div className={`mt-1 space-y-1 ${isExpanded ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/quotations"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/quotations'
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Quotation Records</span>
              </Link>

              <Link
                to="/crd-flow"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>CRD Flow</span>
              </Link>

              <Link
                to="/crd-flow/extra-works"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow/extra-works')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Extra Works Flow</span>
              </Link>

              <Link
                to="/crd-flow/complaints"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow/complaints')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Complaints Flow</span>
              </Link>

              <Link
                to="/crd-flow/bank-loan-history"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow/bank-loan-history')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Bank Loan History</span>
              </Link>

              <Link
                to="/crd-flow/overall-report"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow/overall-report')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Overall Collection Report</span>
              </Link>
            </div>
          )}
        </div>

          {/* Reports Master */}
        <div>
          <button
            onClick={() => setReportsMenuOpen(!reportsMenuOpen)}
            className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-white font-bold hover:bg-white/5 hover:text-white rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-white group-hover:text-emerald-400 transition-colors" />
              <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>Reports Master</span>
            </div>
            {isExpanded && <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${reportsMenuOpen ? 'rotate-180' : ''}`} />}
          </button>
          
          {reportsMenuOpen && isExpanded && (
            <div className={`mt-1 space-y-1 ${isExpanded ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/reports/export"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/reports/export')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Sales Reports</span>
              </Link>
              <Link
                to="/reports/crd"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/reports/crd')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>CRD Reports</span>
              </Link>
            </div>
          )}
        </div>

        {/* Customers Module */}
        <div>
          <Link
            to="/customers"
            onClick={handleNavClick}
            className={`w-full flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 ${
              isActive('/customers')
                ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold'
                : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Users2 className={`w-5 h-5 ${isActive('/customers') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
            <span className={`font-semibold whitespace-nowrap ${isExpanded ? "block" : "hidden"}`}>Customers</span>
          </Link>
        </div>

        {/* Tasks Board Module */}
        <div>
          <Link
            to="/tasks-board"
            onClick={handleNavClick}
            className={`w-full flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 ${
              isActive('/tasks-board')
                ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold'
                : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <ClipboardList className={`w-5 h-5 ${isActive('/tasks-board') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
            <span className={`font-semibold whitespace-nowrap ${isExpanded ? "block" : "hidden"}`}>Tasks Board</span>
          </Link>
        </div>

        {/* Employees Directory */}
        <div>
          <button
            onClick={() => setEmployeeMenuOpen(!employeeMenuOpen)}
            className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-white font-bold hover:bg-white/5 hover:text-white rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <Users2 className="w-5 h-5 text-white group-hover:text-emerald-400 transition-colors" />
              <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>Employees</span>
            </div>
            {isExpanded && <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${employeeMenuOpen ? 'rotate-180' : ''}`} />}
          </button>

          {employeeMenuOpen && isExpanded && (
            <div className={`mt-1 space-y-1 ${isExpanded ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/employees"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                  isActive('/employees')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <Users2 className="w-4 h-4 text-white" />
                <span className={isExpanded ? "block truncate" : "hidden"}>Approve Access</span>
              </Link>
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div>
          <Link
            to="/audit-logs"
            onClick={handleNavClick}
            className={`w-full flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 ${
              isActive('/audit-logs')
                ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold'
                : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <History className={`w-5 h-5 ${isActive('/audit-logs') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
            <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>Audit Logs</span>
          </Link>
        </div>

        {/* Finance & Accounts */}
        <div>
          <button
            onClick={() => setFinanceMenuOpen(!financeMenuOpen)}
            className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-white font-bold hover:bg-white/5 hover:text-white rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-white group-hover:text-emerald-400 transition-colors" />
              <span className={`font-semibold text-sm whitespace-nowrap ${isExpanded ? "block" : "hidden"}`}>Finance & Accounts</span>
            </div>
            {isExpanded && <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${financeMenuOpen ? 'rotate-180' : ''}`} />}
          </button>

          {financeMenuOpen && isExpanded && (
            <div className={`mt-1 space-y-1 ${isExpanded ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/finance/budget-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/budget-planning')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Budget Planning</span>
              </Link>
              
              <Link
                to="/finance/lead-target-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/lead-target-planning')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Lead Target Planning</span>
              </Link>

              <Link
                to="/finance/summary-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/summary-planning')
                    ? 'text-emerald-400 font-extrabold pl-2'
                    : 'text-white hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Summary Planning</span>
              </Link>
            </div>
          )}
        </div>

        {/* Access Control (Admin Only) */}
        {isAdmin && (
          <>
            <Link
              to="/access-control"
              className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
                isActive('/access-control') 
                  ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
                  : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${isActive('/access-control') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
              <span className={isExpanded ? "block truncate" : "hidden"}>Access Control</span>
            </Link>

            <Link
              to="/requests"
              className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
                isActive('/requests') 
                  ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
                  : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <ClipboardList className={`w-5 h-5 ${isActive('/requests') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
              <span className={isExpanded ? "block truncate" : "hidden"}>Requests</span>
            </Link>
          </>
        )}

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
            isActive('/settings') 
              ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
              : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          <Settings2 className={`w-5 h-5 ${isActive('/settings') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>Settings</span>
        </Link>
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-white/5 relative z-10 bg-[#020403]/50 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-white text-[#0e623a] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate leading-tight text-white">{user?.name}</p>
              <span className="text-[11px] text-white font-light block">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-white hover:text-white hover:bg-white/10 rounded-lg transition"
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
