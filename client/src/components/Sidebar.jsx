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
    <aside className={`bg-[#edfbf4] text-[#1e4a3b] flex flex-col h-screen fixed left-0 top-0 z-50 border-none shadow-none transition-all duration-300 ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0 overflow-hidden'}`}>
      {/* Brand Logo Header */}
      <div className={`p-6 border-none flex items-center ${sidebarOpen ? "justify-start" : "justify-center"} gap-3 overflow-hidden`}>
        {sidebarOpen ? (
          <h1 className="font-extrabold text-2xl tracking-tight"><span className="text-[#11c278]">Land</span><span className="text-[#1e4a3b]">ERP</span></h1>
        ) : (
          <h1 className="font-extrabold text-2xl tracking-tight"><span className="text-[#11c278]">L</span></h1>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-4" onClick={handleNavClick}>
        {/* Dashboard */}
        <Link
          to="/"
          className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 rounded-xl transition-all duration-200 ${
            isActive('/') 
              ? 'bg-[#11c278] text-white font-bold shadow-md' 
              : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${isActive('/') ? 'text-white' : 'text-[#1e4a3b]'}`} />
          <span className={sidebarOpen ? "block truncate" : "hidden"}>Dashboard</span>
        </Link>

        {/* KPI Insights */}
        <Link
          to="/kpi-insights"
          className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 rounded-xl transition-all duration-200 ${
            isActive('/kpi-insights') 
              ? 'bg-[#11c278] text-white font-bold shadow-md' 
              : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${isActive('/kpi-insights') ? 'text-white' : 'text-[#1e4a3b]'}`} />
          <span className={sidebarOpen ? "block truncate" : "hidden"}>KPI Insights</span>
        </Link>

        {/* Projects Directory */}
        <Link
          to="/projects"
          className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 rounded-xl transition duration-200 ${
            isActive('/projects') 
              ? 'bg-[#11c278] text-white font-bold shadow-md' 
              : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }`}
        >
          <FolderGit2 className={`w-5 h-5 ${isActive('/projects') ? 'text-white' : 'text-[#1e4a3b]'}`} />
          <span className={sidebarOpen ? "block truncate" : "hidden"}>Projects Directory</span>
        </Link>

        
        {/* Leads Directory (Promoted to Main Item) */}
        <Link
          to="/leads"
          className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 ${
            location.pathname === '/leads' && !location.search
              ? 'bg-[#11c278] text-white font-bold shadow-md' 
              : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }`}
        >
          <UserPlus className={`w-5 h-5 ${location.pathname === '/leads' && !location.search ? 'text-white' : 'text-[#1e4a3b]'}`} />
          <span className={sidebarOpen ? "block truncate" : "hidden"}>Leads Directory</span>
        </Link>

        {/* CRD Group */}
        <div>
          <button
            onClick={() => setLeadsMenuOpen(!leadsMenuOpen)}
            className={`w-full flex items-center ${sidebarOpen ? "justify-between px-4" : "justify-center px-0"} py-3 text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-5 h-5 text-[#1e4a3b]" />
              <span className={`font-semibold ${sidebarOpen ? "block" : "hidden"}`}>CRD</span>
            </div>
            {sidebarOpen && <ChevronDown className={`w-4 h-4 text-[#1e4a3b] transition-transform duration-200 ${leadsMenuOpen ? 'rotate-180' : ''}`} />}
          </button>
          
          {leadsMenuOpen && sidebarOpen && (
            <div className={`mt-1 space-y-1 ${sidebarOpen ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/crd-flow"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>CRD Flow</span>
              </Link>

              <Link
                to="/quotations"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/quotations'
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>Quotation Records</span>
              </Link>

              <Link
                to="/crd-flow/bank-loan-history"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow/bank-loan-history')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>Bank Loan History</span>
              </Link>
            </div>
          )}
        </div>

          {/* Reports Master */}
        <div>
          <button
            onClick={() => setReportsMenuOpen(!reportsMenuOpen)}
            className={`w-full flex items-center ${sidebarOpen ? "justify-between px-4" : "justify-center px-0"} py-3 text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-[#1e4a3b]" />
              <span className={`font-semibold ${sidebarOpen ? "block" : "hidden"}`}>Reports Master</span>
            </div>
            {sidebarOpen && <ChevronDown className={`w-4 h-4 text-[#1e4a3b] transition-transform duration-200 ${reportsMenuOpen ? 'rotate-180' : ''}`} />}
          </button>
          
          {reportsMenuOpen && sidebarOpen && (
            <div className={`mt-1 space-y-1 ${sidebarOpen ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/reports/export"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/reports/export')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>Export Reports</span>
              </Link>
              <Link
                to="/reports/crd"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/reports/crd')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>CRD Reports</span>
              </Link>
            </div>
          )}
        </div>

        {/* Customers Module */}
        <div>
          <Link
            to="/customers"
            onClick={handleNavClick}
            className={`w-full flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 ${
              isActive('/customers')
                ? 'bg-white/10 text-white font-bold'
                : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
            }`}
          >
            <Users2 className="w-5 h-5 text-[#1e4a3b]" />
            <span className={`font-semibold ${sidebarOpen ? "block" : "hidden"}`}>Customers</span>
          </Link>
        </div>

        {/* Employees Directory */}
        <div>
          <button
            onClick={() => setEmployeeMenuOpen(!employeeMenuOpen)}
            className={`w-full flex items-center ${sidebarOpen ? "justify-between px-4" : "justify-center px-0"} py-3 text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <Users2 className="w-5 h-5 text-[#1e4a3b]" />
              <span className={`font-semibold ${sidebarOpen ? "block" : "hidden"}`}>Employees</span>
            </div>
            {sidebarOpen && <ChevronDown className={`w-4 h-4 text-[#1e4a3b] transition-transform duration-200 ${employeeMenuOpen ? 'rotate-180' : ''}`} />}
          </button>

          {employeeMenuOpen && sidebarOpen && (
            <div className={`mt-1 space-y-1 ${sidebarOpen ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/employees"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                  isActive('/employees')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <Users2 className="w-4 h-4 text-[#1e4a3b]" />
                <span className={sidebarOpen ? "block truncate" : "hidden"}>Approve Access</span>
              </Link>
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div>
          <Link
            to="/audit-logs"
            onClick={handleNavClick}
            className={`w-full flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 ${
              isActive('/audit-logs')
                ? 'bg-white/10 text-white font-bold'
                : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
            }`}
          >
            <History className="w-5 h-5 text-[#1e4a3b]" />
            <span className={`font-semibold ${sidebarOpen ? "block" : "hidden"}`}>Audit Logs</span>
          </Link>
        </div>

        {/* Finance & Accounts */}
        <div>
          <button
            onClick={() => setFinanceMenuOpen(!financeMenuOpen)}
            className={`w-full flex items-center ${sidebarOpen ? "justify-between px-4" : "justify-center px-0"} py-3 text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200`}
          >
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-[#1e4a3b]" />
              <span className={`font-semibold text-sm ${sidebarOpen ? "block" : "hidden"}`}>Finance & Accounts</span>
            </div>
            {sidebarOpen && <ChevronDown className={`w-4 h-4 text-[#1e4a3b] transition-transform duration-200 ${financeMenuOpen ? 'rotate-180' : ''}`} />}
          </button>

          {financeMenuOpen && sidebarOpen && (
            <div className={`mt-1 space-y-1 ${sidebarOpen ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
              <Link
                to="/finance/budget-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/budget-planning')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>Budget Planning</span>
              </Link>
              
              <Link
                to="/finance/lead-target-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/lead-target-planning')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>Lead Target Planning</span>
              </Link>

              <Link
                to="/finance/summary-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/summary-planning')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>Summary Planning</span>
              </Link>
            </div>
          )}
        </div>

        {/* Access Control (Admin Only) */}
        {isAdmin && (
          <>
            <Link
              to="/access-control"
              className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 rounded-xl transition-all duration-200 ${
                isActive('/access-control') 
                  ? 'bg-[#11c278] text-white font-bold shadow-md' 
                  : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${isActive('/access-control') ? 'text-white' : 'text-[#1e4a3b]'}`} />
              <span className={sidebarOpen ? "block truncate" : "hidden"}>Access Control</span>
            </Link>

            <Link
              to="/requests"
              className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 rounded-xl transition-all duration-200 ${
                isActive('/requests') 
                  ? 'bg-[#11c278] text-white font-bold shadow-md' 
                  : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
              }`}
            >
              <ClipboardList className={`w-5 h-5 ${isActive('/requests') ? 'text-white' : 'text-[#1e4a3b]'}`} />
              <span className={sidebarOpen ? "block truncate" : "hidden"}>Requests</span>
            </Link>
          </>
        )}

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex items-center gap-3 py-3 ${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 rounded-xl transition-all duration-200 ${
            isActive('/settings') 
              ? 'bg-[#11c278] text-white font-bold shadow-md' 
              : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }`}
        >
          <Settings2 className={`w-5 h-5 ${isActive('/settings') ? 'text-white' : 'text-[#1e4a3b]'}`} />
          <span className={sidebarOpen ? "block truncate" : "hidden"}>Settings</span>
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
              <span className="text-[10px] text-[#1e4a3b] font-light block">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-[#1e4a3b] hover:text-white hover:bg-white/10 rounded-lg transition"
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
