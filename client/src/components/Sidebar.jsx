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
      className={`glass-sidebar text-emerald-900 flex flex-col h-screen fixed left-0 top-0 z-50 border-none shadow-none transition-all duration-300 ${isExpanded ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0 overflow-hidden'}`}>
      {/* Brand Logo Header */}
      <div className={`p-5 border-none flex items-center justify-center w-full overflow-hidden`}>
        {isExpanded ? (
          <img src="/jb_logo.jpg" alt="JB Logo" className="w-full h-auto max-h-24 object-cover rounded-2xl shadow-sm" />
        ) : (
          <img src="/jb_logo.jpg" alt="JB Logo" className="w-12 h-12 object-cover rounded-xl shadow-sm" />
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-4" onClick={handleNavClick}>
        {/* Dashboard */}
        <Link
          to="/"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
            isActive('/') 
              ? 'bg-[#0e623a] text-white font-bold shadow-md' 
              : 'text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a]'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${isActive('/') ? 'text-white' : 'text-emerald-900'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>Dashboard</span>
        </Link>

        {/* KPI Insights */}
        <Link
          to="/kpi-insights"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
            isActive('/kpi-insights') 
              ? 'bg-[#0e623a] text-white font-bold shadow-md' 
              : 'text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a]'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${isActive('/kpi-insights') ? 'text-white' : 'text-emerald-900'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>KPI Insights</span>
        </Link>

        {/* Projects Directory */}
        <Link
          to="/projects"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-205 ${
            isActive('/projects') 
              ? 'bg-[#0e623a] text-white font-bold shadow-md' 
              : 'text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a]'
          }`}
        >
          <FolderGit2 className={`w-5 h-5 ${isActive('/projects') ? 'text-white' : 'text-emerald-900'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>Projects Directory</span>
        </Link>

        
        {/* Leads Directory (Promoted to Main Item) */}
        <Link
          to="/leads"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 ${
            location.pathname === '/leads' && !location.search
              ? 'bg-[#0e623a] text-white font-bold shadow-md' 
              : 'text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a]'
          }`}
        >
          <UserPlus className={`w-5 h-5 ${location.pathname === '/leads' && !location.search ? 'text-white' : 'text-emerald-900'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>Leads Directory</span>
        </Link>

        {/* CRD Group */}
        <div>
          <button
            onClick={() => setLeadsMenuOpen(!leadsMenuOpen)}
            className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a] rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-5 h-5 text-emerald-900" />
              <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>CRD</span>
            </div>
            {isExpanded && <ChevronDown className={`w-4 h-4 text-emerald-900 transition-transform duration-200 ${leadsMenuOpen ? 'rotate-180' : ''}`} />}
          </button>
          
          {leadsMenuOpen && isExpanded && (
            <div className={`mt-1 space-y-1 ${isExpanded ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/crd-flow"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>CRD Flow</span>
              </Link>

              <Link
                to="/quotations"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/quotations'
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Quotation Records</span>
              </Link>

              <Link
                to="/crd-flow/extra-works"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow/extra-works')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Extra Works Approval</span>
              </Link>

              <Link
                to="/crd-flow/bank-loan-history"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow/bank-loan-history')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Bank Loan History</span>
              </Link>

              <Link
                to="/crd-flow/overall-report"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow/overall-report')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
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
            className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a] rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-900" />
              <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>Reports Master</span>
            </div>
            {isExpanded && <ChevronDown className={`w-4 h-4 text-emerald-900 transition-transform duration-200 ${reportsMenuOpen ? 'rotate-180' : ''}`} />}
          </button>
          
          {reportsMenuOpen && isExpanded && (
            <div className={`mt-1 space-y-1 ${isExpanded ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/reports/export"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/reports/export')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Sales Reports</span>
              </Link>
              <Link
                to="/reports/crd"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/reports/crd')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
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
                ? 'bg-[#0e623a] text-white font-bold shadow-md'
                : 'text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a]'
            }`}
          >
            <Users2 className={`w-5 h-5 ${isActive('/customers') ? 'text-white' : 'text-emerald-900'}`} />
            <span className={`font-semibold whitespace-nowrap ${isExpanded ? "block" : "hidden"}`}>Customers</span>
          </Link>
        </div>

        {/* Employees Directory */}
        <div>
          <button
            onClick={() => setEmployeeMenuOpen(!employeeMenuOpen)}
            className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a] rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <Users2 className="w-5 h-5 text-emerald-900" />
              <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>Employees</span>
            </div>
            {isExpanded && <ChevronDown className={`w-4 h-4 text-emerald-900 transition-transform duration-200 ${employeeMenuOpen ? 'rotate-180' : ''}`} />}
          </button>

          {employeeMenuOpen && isExpanded && (
            <div className={`mt-1 space-y-1 ${isExpanded ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/employees"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                  isActive('/employees')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
                }`}
              >
                <Users2 className="w-4 h-4 text-emerald-900" />
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
                ? 'bg-[#0e623a] text-white font-bold shadow-md'
                : 'text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a]'
            }`}
          >
            <History className={`w-5 h-5 ${isActive('/audit-logs') ? 'text-white' : 'text-emerald-900'}`} />
            <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>Audit Logs</span>
          </Link>
        </div>

        {/* Finance & Accounts */}
        <div>
          <button
            onClick={() => setFinanceMenuOpen(!financeMenuOpen)}
            className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a] rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-emerald-900" />
              <span className={`font-semibold text-sm whitespace-nowrap ${isExpanded ? "block" : "hidden"}`}>Finance & Accounts</span>
            </div>
            {isExpanded && <ChevronDown className={`w-4 h-4 text-emerald-900 transition-transform duration-200 ${financeMenuOpen ? 'rotate-180' : ''}`} />}
          </button>

          {financeMenuOpen && isExpanded && (
            <div className={`mt-1 space-y-1 ${isExpanded ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/finance/budget-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/budget-planning')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Budget Planning</span>
              </Link>
              
              <Link
                to="/finance/lead-target-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/lead-target-planning')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
                }`}
              >
                <span className={isExpanded ? "block truncate" : "hidden"}>Lead Target Planning</span>
              </Link>

              <Link
                to="/finance/summary-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/summary-planning')
                    ? 'text-[#0e623a] font-extrabold pl-2'
                    : 'text-emerald-900 hover:text-[#0e623a] hover:bg-[#0e623a]/10'
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
                  ? 'bg-[#0e623a] text-white font-bold shadow-md' 
                  : 'text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a]'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${isActive('/access-control') ? 'text-white' : 'text-emerald-900'}`} />
              <span className={isExpanded ? "block truncate" : "hidden"}>Access Control</span>
            </Link>

            <Link
              to="/requests"
              className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
                isActive('/requests') 
                  ? 'bg-[#0e623a] text-white font-bold shadow-md' 
                  : 'text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a]'
              }`}
            >
              <ClipboardList className={`w-5 h-5 ${isActive('/requests') ? 'text-white' : 'text-emerald-900'}`} />
              <span className={isExpanded ? "block truncate" : "hidden"}>Requests</span>
            </Link>
          </>
        )}

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
            isActive('/settings') 
              ? 'bg-[#0e623a] text-white font-bold shadow-md' 
              : 'text-emerald-900 hover:bg-[#0e623a]/10 hover:text-[#0e623a]'
          }`}
        >
          <Settings2 className={`w-5 h-5 ${isActive('/settings') ? 'text-white' : 'text-emerald-900'}`} />
          <span className={isExpanded ? "block truncate" : "hidden"}>Settings</span>
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
              <span className="text-[11px] text-emerald-900 font-light block">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-emerald-900 hover:text-white hover:bg-white/10 rounded-lg transition"
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
