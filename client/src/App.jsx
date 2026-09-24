import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { PageGuard } from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Lazy-loaded Pages for rapid code splitting and instant bundle loading
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RegisterProject = lazy(() => import('./pages/RegisterProject'));
const ProjectsDictionary = lazy(() => import('./pages/ProjectsDictionary'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const EmployeesDirectory = lazy(() => import('./pages/EmployeesDirectory'));
const EmployeeHistory = lazy(() => import('./pages/EmployeeHistory'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const AccessControl = lazy(() => import('./pages/AccessControl'));
const Requests = lazy(() => import('./pages/Requests'));
const Settings = lazy(() => import('./pages/Settings'));
const LeadsDirectory = lazy(() => import('./pages/LeadsDirectory'));
const QuotationsDirectory = lazy(() => import('./pages/QuotationsDirectory'));
const QuotationForm = lazy(() => import('./pages/QuotationForm'));
const QuotationView = lazy(() => import('./pages/QuotationView'));
const CRDFlow = lazy(() => import('./pages/CRDFlow'));
const CRDFlowDetail = lazy(() => import('./pages/CRDFlowDetail'));
const CRDDashboard = lazy(() => import('./pages/CRDDashboard'));
const BankLoanHistory = lazy(() => import('./pages/BankLoanHistory'));
const CollectionReport = lazy(() => import('./pages/CollectionReport'));
const OverallReport = lazy(() => import('./pages/OverallReport'));
const BudgetPlanning = lazy(() => import('./pages/BudgetPlanning'));
const LeadTargetPlanning = lazy(() => import('./pages/LeadTargetPlanning'));
const SummaryPlanning = lazy(() => import('./pages/SummaryPlanning'));
const ParameterPlanning = lazy(() => import('./pages/ParameterPlanning'));
const KPIInsights = lazy(() => import('./pages/KPIInsights'));
const Customers = lazy(() => import('./pages/Customers'));
const ExportReports = lazy(() => import('./pages/ExportReports'));
const CRDReports = lazy(() => import('./pages/CRDReports'));
const DashboardReports = lazy(() => import('./pages/DashboardReports'));
const ExtraWorks = lazy(() => import('./pages/ExtraWorks'));
const ComplaintsFlow = lazy(() => import('./pages/ComplaintsFlow'));
const TasksBoard = lazy(() => import('./pages/TasksBoard'));

// Portal Pages
const LandingPage = lazy(() => import('./pages/portal/LandingPage'));
const CustomerDashboard = lazy(() => import('./pages/portal/CustomerDashboard'));

const PageLoader = () => (
  <div className="flex h-full min-h-[400px] w-full items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-[#0e623a]"></div>
      <span className="text-xs font-semibold text-black-500 tracking-wide uppercase">Loading View...</span>
    </div>
  </div>
);

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f1f5f9] via-[#f8fafc] to-[#e2e8f0] font-sans selection:bg-[#006838] selection:text-white relative overflow-hidden print:bg-white print:block">
      
      {/* Subtle Glacier Background Elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#006838]/5 rounded-full blur-[120px] pointer-events-none z-0 print:hidden"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none z-0 print:hidden"></div>

      {/* Mobile Sidebar backdrop overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Panel Content Frame */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden relative z-10 transition-all duration-300 ${sidebarOpen ? 'pl-0 md:pl-64' : 'pl-0 md:pl-20'}`}>
        {/* Top Navbar */}
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-2.5 scrollbar-thin relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Landing & Customer Portal Pages */}
            <Route path="/portal" element={<LandingPage />} />
            <Route path="/portal/dashboard" element={<CustomerDashboard />} />

            {/* Public Superadmin/ERP Login Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Main Application Layout Frame */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<PageGuard pageId="dashboard"><Layout><Dashboard /></Layout></PageGuard>} />
              
              {/* Project Modules */}
              <Route path="/projects" element={<PageGuard pageId="projects"><Layout><ProjectsDictionary /></Layout></PageGuard>} />
              <Route path="/projects/register" element={<PageGuard pageId="projects"><Layout><RegisterProject /></Layout></PageGuard>} />
              <Route path="/projects/:id" element={<PageGuard pageId="projects"><Layout><ProjectDetail /></Layout></PageGuard>} />
              
              {/* Employee Directory Modules */}
              <Route path="/employees" element={<PageGuard pageId="employees"><Layout><EmployeesDirectory /></Layout></PageGuard>} />
              <Route path="/employees/history" element={<PageGuard pageId="employees"><Layout><EmployeeHistory /></Layout></PageGuard>} />
              <Route path="/audit-logs" element={<PageGuard pageId="audit_logs"><Layout><AuditLogs /></Layout></PageGuard>} />
              
              {/* Leads Directory Module */}
              <Route path="/leads" element={<PageGuard pageId="leads"><Layout><LeadsDirectory /></Layout></PageGuard>} />
              
              {/* Quotations Module */}
              <Route path="/quotations" element={<PageGuard pageId="quotations"><Layout><QuotationsDirectory /></Layout></PageGuard>} />
              <Route path="/quotations/new" element={<PageGuard pageId="quotations"><Layout><QuotationForm /></Layout></PageGuard>} />
              <Route path="/quotations/:id/edit" element={<PageGuard pageId="quotations"><Layout><QuotationForm /></Layout></PageGuard>} />
              <Route path="/quotations/:id" element={<PageGuard pageId="quotations"><Layout><QuotationView /></Layout></PageGuard>} />

              {/* Customer Relationship (CRD) Flow */}
              <Route path="/crd-dashboard" element={<PageGuard pageId="crd_flow"><Layout><CRDDashboard /></Layout></PageGuard>} />
              <Route path="/crd-flow" element={<PageGuard pageId="crd_flow"><Layout><CRDFlow /></Layout></PageGuard>} />
              <Route path="/crd-flow/:id/details" element={<PageGuard pageId="crd_flow"><Layout><CRDFlowDetail /></Layout></PageGuard>} />
              <Route path="/crd-flow/bank-loan-history" element={<PageGuard pageId="bank_loan"><Layout><BankLoanHistory /></Layout></PageGuard>} />
              <Route path="/crd-flow/collection-report" element={<PageGuard pageId="overall_collection"><Layout><CollectionReport /></Layout></PageGuard>} />
              <Route path="/crd-flow/overall-report" element={<PageGuard pageId="overall_collection"><Layout><OverallReport /></Layout></PageGuard>} />
              <Route path="/crd-flow/extra-works" element={<PageGuard pageId="extra_works"><Layout><ExtraWorks /></Layout></PageGuard>} />
              <Route path="/crd-flow/complaints" element={<PageGuard pageId="complaints_flow"><Layout><ComplaintsFlow /></Layout></PageGuard>} />
              <Route path="/customers" element={<PageGuard pageId="customers"><Layout><Customers /></Layout></PageGuard>} />
              <Route path="/tasks-board" element={<PageGuard pageId="tasks_board"><Layout><TasksBoard /></Layout></PageGuard>} />
              <Route path="/tasks" element={<Navigate to="/tasks-board" replace />} />
              <Route path="/task" element={<Navigate to="/tasks-board" replace />} />
              
              {/* KPI Insights & Conversions */}
              <Route path="/kpi-insights" element={<PageGuard pageId="kpi_insights"><Layout><KPIInsights /></Layout></PageGuard>} />
              
              {/* Reports Master */}
              <Route path="/reports/dashboard" element={<PageGuard pageId="dashboard"><Layout><DashboardReports /></Layout></PageGuard>} />
              <Route path="/reports/export" element={<PageGuard pageId="sales_reports"><Layout><ExportReports /></Layout></PageGuard>} />
              <Route path="/reports/crd" element={<PageGuard pageId="crd_reports"><Layout><CRDReports /></Layout></PageGuard>} />
              
              {/* Finance & Accounts Modules */}
              <Route path="/finance/budget-planning" element={<PageGuard pageId="finance_budget"><Layout><BudgetPlanning /></Layout></PageGuard>} />
              <Route path="/finance/lead-target-planning" element={<PageGuard pageId="finance_lead"><Layout><LeadTargetPlanning /></Layout></PageGuard>} />
              <Route path="/finance/summary-planning" element={<PageGuard pageId="finance_summary"><Layout><SummaryPlanning /></Layout></PageGuard>} />
              <Route path="/finance/parameter-planning" element={<PageGuard pageId="finance_parameter"><Layout><ParameterPlanning /></Layout></PageGuard>} />

              {/* Administration / Utilities */}
              <Route path="/access-control" element={<PageGuard adminOnly><Layout><AccessControl /></Layout></PageGuard>} />
              <Route path="/requests" element={<PageGuard adminOnly><Layout><Requests /></Layout></PageGuard>} />
              <Route path="/settings" element={<PageGuard pageId="settings"><Layout><Settings /></Layout></PageGuard>} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
