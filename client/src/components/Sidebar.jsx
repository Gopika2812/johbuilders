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
  Coins
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [projectMenuOpen, setProjectMenuOpen] = useState(true);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(true);
  const [leadsMenuOpen, setLeadsMenuOpen] = useState(true);
  const [financeMenuOpen, setFinanceMenuOpen] = useState(true);

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-[#0e623a] text-white flex flex-col h-screen fixed left-0 top-0 z-20 border-r border-[#0b4d2d] shadow-lg">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-lg border border-white/20">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-wider leading-none text-white">BUILDERS</h1>
          <span className="text-xs text-emerald-200 font-light">Real Estate ERP</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-4">
        {/* Dashboard */}
        <Link
          to="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive('/') 
              ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
              : 'text-emerald-100 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${isActive('/') ? 'text-white' : 'text-emerald-300'}`} />
          <span>Dashboard</span>
        </Link>

        {/* Project Master */}
        <div>
          <button
            onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-emerald-100 hover:bg-white/5 hover:text-white rounded-xl transition duration-200"
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-5 h-5 text-emerald-300" />
              <span className="font-semibold">Project Master</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform duration-200 ${projectMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {projectMenuOpen && (
            <div className="pl-8 mt-1 space-y-1">
              {/* Register Project */}
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <Link
                  to="/projects/register"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                    isActive('/projects/register')
                      ? 'text-white font-extrabold border-l-2 border-white pl-2'
                      : 'text-emerald-150 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-300" />
                  <span>Register Project</span>
                </Link>
              )}

              {/* Projects Dictionary */}
              <Link
                to="/projects"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                  isActive('/projects')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                  }`}
              >
                <FolderGit2 className="w-4 h-4 text-emerald-300" />
                <span>Projects Dictionary</span>
              </Link>
            </div>
          )}
        </div>

        {/* Leads Phase */}
        <div>
          <button
            onClick={() => setLeadsMenuOpen(!leadsMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-emerald-100 hover:bg-white/5 hover:text-white rounded-xl transition duration-200"
          >
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-emerald-300" />
              <span className="font-semibold">Leads Phase</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform duration-200 ${leadsMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {leadsMenuOpen && (
            <div className="pl-8 mt-1 space-y-1">
              <Link
                to="/leads"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && !location.search
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Leads Directory</span>
              </Link>

              <Link
                to="/quotations"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/quotations'
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Quotation Records</span>
              </Link>
              
              <Link
                to="/leads?status=New"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('status=New')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>New</span>
              </Link>

              <Link
                to="/leads?status=Assigned"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('status=Assigned')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Assigned</span>
              </Link>

              <Link
                to="/leads?status=Contacted"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('status=Contacted')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Contacted</span>
              </Link>

              <Link
                to="/leads?status=Follow-Up"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('status=Follow-Up')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Followup</span>
              </Link>

              <Link
                to="/leads?status=Site%20Visit"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('status=Site%20Visit')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Site Visit</span>
              </Link>

              <Link
                to="/leads?status=Site%20Visit%20Follow-up"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('status=Site%20Visit%20Follow-up')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Site Visit Followup</span>
              </Link>

              <Link
                to="/leads?status=Qualified"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('status=Qualified') && !location.search.includes('tab=Hot')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Qualified</span>
              </Link>

              <Link
                to="/leads?status=Negotiation"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('status=Negotiation')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Negotiation</span>
              </Link>

              <Link
                to="/leads?status=Booking"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('status=Booking')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Booking</span>
              </Link>

               <Link
                to="/leads?status=Qualified&tab=Hot"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  location.pathname === '/leads' && location.search.includes('tab=Hot')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Hot List</span>
              </Link>

              <Link
                to="/crd-flow"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition ${
                  isActive('/crd-flow')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>CRD Flow</span>
              </Link>

             
            </div>
          )}
        </div>

        {/* Employees Directory */}
        <div>
          <button
            onClick={() => setEmployeeMenuOpen(!employeeMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-emerald-100 hover:bg-white/5 hover:text-white rounded-xl transition duration-200"
          >
            <div className="flex items-center gap-3">
              <Users2 className="w-5 h-5 text-emerald-300" />
              <span className="font-semibold">Employees</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform duration-200 ${employeeMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {employeeMenuOpen && (
            <div className="pl-8 mt-1 space-y-1">
              <Link
                to="/employees"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                  isActive('/employees')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users2 className="w-4 h-4 text-emerald-300" />
                <span>Approve Access</span>
              </Link>
              
              <Link
                to="/employees/history"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                  isActive('/employees/history')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <History className="w-4 h-4 text-emerald-300" />
                <span>Employee History</span>
              </Link>
            </div>
          )}
        </div>

        {/* Finance & Accounts */}
        <div>
          <button
            onClick={() => setFinanceMenuOpen(!financeMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-emerald-100 hover:bg-white/5 hover:text-white rounded-xl transition duration-200"
          >
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-emerald-300" />
              <span className="font-semibold text-sm">Finance & Accounts</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform duration-200 ${financeMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {financeMenuOpen && (
            <div className="pl-8 mt-1 space-y-1">
              <Link
                to="/finance/budget-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/budget-planning')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Budget Planning</span>
              </Link>
              
              <Link
                to="/finance/lead-target-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/lead-target-planning')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Lead Target Planning</span>
              </Link>

              <Link
                to="/finance/summary-planning"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition ${
                  isActive('/finance/summary-planning')
                    ? 'text-white font-extrabold border-l-2 border-white pl-2'
                    : 'text-emerald-150 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Summary Planning</span>
              </Link>
            </div>
          )}
        </div>

        {/* Access Control (Admin Only) */}
        {isAdmin && (
          <Link
            to="/access-control"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive('/access-control') 
                ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
                : 'text-emerald-100 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${isActive('/access-control') ? 'text-white' : 'text-emerald-300'}`} />
            <span>Access Control</span>
          </Link>
        )}

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive('/settings') 
              ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
              : 'text-emerald-100 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings2 className={`w-5 h-5 ${isActive('/settings') ? 'text-white' : 'text-emerald-300'}`} />
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
              <span className="text-[10px] text-emerald-200 font-light block">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition"
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
