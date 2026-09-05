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
  const { user, logout, isAdmin, hasPermission, getLabel } = useAuth();
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
      className={`bg-[#050907]/95 backdrop-blur-3xl border-r border-white/10 shadow-[4px_0_30px_rgba(0,0,0,0.5)] text-white flex flex-col h-[100dvh] max-h-[100dvh] fixed left-0 top-0 bottom-0 z-50 transition-all duration-300 ${isExpanded ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0 overflow-hidden'}`}>
      {/* Decorative background glows inside sidebar */}
      <div className="absolute top-[-10%] left-[-20%] w-[100%] h-[40%] bg-[#006838]/20 rounded-full blur-[80px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[30%] bg-emerald-600/10 rounded-full blur-[70px] pointer-events-none z-0"></div>

      {/* Brand Logo Header */}
      <div className={`px-4 py-3 flex items-center justify-center w-full relative z-10 border-b border-white/10 shrink-0`}>
        {isExpanded ? (
          <img src="/logo_white.jpg" alt="JB Logo" className="h-14 w-auto max-w-[160px] object-contain rounded-xl shadow-sm" />
        ) : (
          <img src="/logo_white.jpg" alt="JB Logo" className="w-10 h-10 object-contain rounded-lg" />
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 min-h-0 px-4 py-6 overflow-y-auto space-y-3 relative z-10 custom-scrollbar" onClick={handleNavClick}>
        {/* Dashboard */}
        {hasPermission('dashboard') && (
          <Link
            to="/"
            className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
              isActive('/') 
                ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
                : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${isActive('/') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
            <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('dashboard', 'sidebar', 'Dashboard') : 'Dashboard'}</span>
          </Link>
        )}

        {/* KPI Insights */}
        {hasPermission('kpi_insights') && (
          <Link
            to="/kpi-insights"
            className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
              isActive('/kpi-insights') 
                ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
                : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${isActive('/kpi-insights') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
            <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('kpi_insights', 'sidebar', 'KPI Insights') : 'KPI Insights'}</span>
          </Link>
        )}

        {/* Projects Directory */}
        {hasPermission('projects') && (
          <Link
            to="/projects"
            className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-205 ${
              isActive('/projects') 
                ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
                : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <FolderGit2 className={`w-5 h-5 ${isActive('/projects') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
            <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('projects', 'sidebar', 'Projects Directory') : 'Projects Directory'}</span>
          </Link>
        )}

        {/* Leads Directory */}
        {hasPermission('leads') && (
          <Link
            to="/leads"
            className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 ${
              location.pathname === '/leads' && !location.search
                ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
                : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <UserPlus className={`w-5 h-5 ${location.pathname === '/leads' && !location.search ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
            <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('leads', 'sidebar', 'Leads Directory') : 'Leads Directory'}</span>
          </Link>
        )}

        {/* CRD Group */}
        {(hasPermission('quotations') || hasPermission('crd_flow') || hasPermission('extra_works') || hasPermission('bank_loan') || hasPermission('overall_collection')) && (
          <div>
            <button
              onClick={() => setLeadsMenuOpen(!leadsMenuOpen)}
              className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-white font-bold hover:bg-white/5 hover:text-white rounded-xl transition duration-200`}
            >
              <div className="flex items-center gap-3">
                <FolderGit2 className="w-5 h-5 text-white group-hover:text-emerald-400 transition-colors" />
                <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>{getLabel ? getLabel('crd_group', 'sidebar', 'CRD') : 'CRD'}</span>
              </div>
              {isExpanded && <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${leadsMenuOpen ? 'rotate-180' : ''}`} />}
            </button>
            
            {leadsMenuOpen && isExpanded && (
              <div className={`mt-1 space-y-1 ${isExpanded ? "pl-8" : "pl-0 flex flex-col items-center"}`}>
                {hasPermission('quotations') && (
                  <Link
                    to="/quotations"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                      location.pathname === '/quotations'
                        ? 'text-emerald-400 font-extrabold pl-2'
                        : 'text-white hover:text-emerald-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('quotations', 'sidebar', 'Quotation Records') : 'Quotation Records'}</span>
                  </Link>
                )}

                {hasPermission('crd_flow') && (
                  <Link
                    to="/crd-flow"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                      isActive('/crd-flow')
                        ? 'text-emerald-400 font-extrabold pl-2'
                        : 'text-white hover:text-emerald-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('crd_flow', 'sidebar', 'CRD Flow') : 'CRD Flow'}</span>
                  </Link>
                )}

                {hasPermission('extra_works') && (
                  <Link
                    to="/crd-flow/extra-works"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                      isActive('/crd-flow/extra-works')
                        ? 'text-emerald-400 font-extrabold pl-2'
                        : 'text-white hover:text-emerald-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('extra_works', 'sidebar', 'Extra Works Flow') : 'Extra Works Flow'}</span>
                  </Link>
                )}

                {hasPermission('complaints_flow') && (
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
                )}

                {hasPermission('bank_loan') && (
                  <Link
                    to="/crd-flow/bank-loan-history"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                      isActive('/crd-flow/bank-loan-history')
                        ? 'text-emerald-400 font-extrabold pl-2'
                        : 'text-white hover:text-emerald-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('bank_loan', 'sidebar', 'Bank Loan History') : 'Bank Loan History'}</span>
                  </Link>
                )}

                {hasPermission('overall_collection') && (
                  <Link
                    to="/crd-flow/overall-report"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                      isActive('/crd-flow/overall-report')
                        ? 'text-emerald-400 font-extrabold pl-2'
                        : 'text-white hover:text-emerald-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('overall_collection', 'sidebar', 'Overall Collection Report') : 'Overall Collection Report'}</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reports Master */}
        {(hasPermission('sales_reports') || hasPermission('crd_reports') || hasPermission('dashboard_reports') || hasPermission('dashboard')) && (
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
                  to="/reports/dashboard"
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                    isActive('/reports/dashboard')
                      ? 'text-emerald-400 font-extrabold pl-2'
                      : 'text-white hover:text-emerald-400 hover:bg-white/5'
                  }`}
                >
                  <span className={isExpanded ? "block truncate" : "hidden"}>Dashboard Reports</span>
                </Link>
                {hasPermission('sales_reports') && (
                  <Link
                    to="/reports/export"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                      isActive('/reports/export')
                        ? 'text-emerald-400 font-extrabold pl-2'
                        : 'text-white hover:text-emerald-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('export_reports', 'sidebar', 'Sales Reports') : 'Sales Reports'}</span>
                  </Link>
                )}
                {hasPermission('crd_reports') && (
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
                )}
              </div>
            )}
          </div>
        )}

        {/* Customers Module */}
        {hasPermission('customers') && (
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
        )}

        {/* Tasks Board Module */}
        {hasPermission('tasks_board') && (
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
              <span className={`font-semibold whitespace-nowrap ${isExpanded ? "block" : "hidden"}`}>{getLabel ? getLabel('tasks_board', 'sidebar', 'Task Board') : 'Task Board'}</span>
            </Link>
          </div>
        )}

        {/* Employees Directory */}
        {hasPermission('employees') && (
          <div>
            <button
              onClick={() => setEmployeeMenuOpen(!employeeMenuOpen)}
              className={`w-full flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-3 text-white font-bold hover:bg-white/5 hover:text-white rounded-xl transition duration-200`}
            >
              <div className="flex items-center gap-3">
                <Users2 className="w-5 h-5 text-white group-hover:text-emerald-400 transition-colors" />
                <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>{getLabel ? getLabel('employees', 'sidebar', 'Employees') : 'Employees'}</span>
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
        )}

        {/* Audit Logs */}
        {hasPermission('audit_logs') && (
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
              <span className={`font-semibold ${isExpanded ? "block" : "hidden"}`}>{getLabel ? getLabel('audit_logs', 'sidebar', 'Audit Logs') : 'Audit Logs'}</span>
            </Link>
          </div>
        )}

        {/* Finance & Accounts */}
        {(hasPermission('finance_budget') || hasPermission('finance_lead') || hasPermission('finance_summary')) && (
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
                {hasPermission('finance_budget') && (
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
                )}
                
                {hasPermission('finance_lead') && (
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
                )}

                {hasPermission('finance_summary') && (
                  <Link
                    to="/finance/summary-planning"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                      isActive('/finance/summary-planning')
                        ? 'text-emerald-400 font-extrabold pl-2'
                        : 'text-white hover:text-emerald-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('summary', 'sidebar', 'Summary Planning') : 'Summary Planning'}</span>
                  </Link>
                )}
                {hasPermission('Finance & Accounts', 'read') && (
                  <Link
                    to="/finance/parameter-planning"
                    className={`block px-4 py-2.5 text-sm transition-all duration-200 rounded-lg ${
                      isActive('/finance/parameter-planning')
                        ? 'text-emerald-400 font-extrabold pl-2'
                        : 'text-white hover:text-emerald-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={isExpanded ? "block truncate" : "hidden"}>Parameter Planning</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Access Control (Superadmin Only) */}
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
        {hasPermission('settings') && (
          <Link
            to="/settings"
            className={`flex items-center gap-3 py-3 ${isExpanded ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition-all duration-200 ${
              isActive('/settings') 
                ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30 font-bold' 
                : 'text-white hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Settings2 className={`w-5 h-5 ${isActive('/settings') ? 'text-white' : 'text-white group-hover:text-emerald-400'}`} />
            <span className={isExpanded ? "block truncate" : "hidden"}>{getLabel ? getLabel('settings', 'sidebar', 'Settings') : 'Settings'}</span>
          </Link>
        )}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-3.5 pb-8 md:pb-3.5 border-t border-white/10 relative z-20 bg-[#020403]/95 backdrop-blur-md shrink-0 mt-auto sticky bottom-0">
        <div className="flex items-center justify-between gap-2">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-white text-[#0e623a] flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm border border-emerald-600/30">
                  {user?.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="font-semibold text-sm truncate leading-tight text-white" title={user?.name}>{user?.name}</p>
                  <span className="text-[11px] text-white/70 font-light block truncate">{user?.role}</span>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 px-2.5 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600/30 rounded-xl transition flex items-center gap-1.5 shrink-0 border border-red-500/30 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={logout}
                className="p-2.5 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600/30 rounded-xl transition flex items-center justify-center shrink-0 border border-red-500/30 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
