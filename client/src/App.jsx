import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RegisterProject from './pages/RegisterProject';
import ProjectsDictionary from './pages/ProjectsDictionary';
import ProjectDetail from './pages/ProjectDetail';
import EmployeesDirectory from './pages/EmployeesDirectory';
import EmployeeHistory from './pages/EmployeeHistory';
import AuditLogs from './pages/AuditLogs';
import AccessControl from './pages/AccessControl';
import Requests from './pages/Requests';
import Settings from './pages/Settings';
import LeadsDirectory from './pages/LeadsDirectory';
import QuotationsDirectory from './pages/QuotationsDirectory';
import QuotationForm from './pages/QuotationForm';
import QuotationView from './pages/QuotationView';
import CRDFlow from './pages/CRDFlow';
import CRDFlowDetail from './pages/CRDFlowDetail';
import CRDDashboard from './pages/CRDDashboard';
import BankLoanHistory from './pages/BankLoanHistory';
import CollectionReport from './pages/CollectionReport';
import OverallReport from './pages/OverallReport';
import BudgetPlanning from './pages/BudgetPlanning';
import LeadTargetPlanning from './pages/LeadTargetPlanning';
import SummaryPlanning from './pages/SummaryPlanning';
import ParameterPlanning from './pages/ParameterPlanning';
import KPIInsights from './pages/KPIInsights';
import Customers from './pages/Customers';
import ExportReports from './pages/ExportReports';
import CRDReports from './pages/CRDReports';
import ExtraWorks from './pages/ExtraWorks';
import ComplaintsFlow from './pages/ComplaintsFlow';
import TasksBoard from './pages/TasksBoard';

// Portal Pages
import LandingPage from './pages/portal/LandingPage';
import CustomerDashboard from './pages/portal/CustomerDashboard';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

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
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scrollbar-thin relative z-10">
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
        <Routes>
          {/* Public Landing & Customer Portal Pages */}
          <Route path="/portal" element={<LandingPage />} />
          <Route path="/portal/dashboard" element={<CustomerDashboard />} />

          {/* Public Superadmin/ERP Login Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Main Application Layout Frame */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            
            {/* Project Modules */}
            <Route path="/projects" element={<Layout><ProjectsDictionary /></Layout>} />
            <Route path="/projects/register" element={<Layout><RegisterProject /></Layout>} />
            <Route path="/projects/:id" element={<Layout><ProjectDetail /></Layout>} />
            
            {/* Employee Directory Modules */}
            <Route path="/employees" element={<Layout><EmployeesDirectory /></Layout>} />
            <Route path="/employees/history" element={<Layout><EmployeeHistory /></Layout>} />
            <Route path="/audit-logs" element={<Layout><AuditLogs /></Layout>} />
            
            {/* Leads Directory Module */}
            <Route path="/leads" element={<Layout><LeadsDirectory /></Layout>} />
            
            {/* Quotations Module */}
            <Route path="/quotations" element={<Layout><QuotationsDirectory /></Layout>} />
            <Route path="/quotations/new" element={<Layout><QuotationForm /></Layout>} />
            <Route path="/quotations/:id/edit" element={<Layout><QuotationForm /></Layout>} />
            <Route path="/quotations/:id" element={<Layout><QuotationView /></Layout>} />

            {/* Customer Relationship (CRD) Flow */}
            <Route path="/crd-dashboard" element={<Layout><CRDDashboard /></Layout>} />
            <Route path="/crd-flow" element={<Layout><CRDFlow /></Layout>} />
            <Route path="/crd-flow/:id/details" element={<Layout><CRDFlowDetail /></Layout>} />
            <Route path="/crd-flow/bank-loan-history" element={<Layout><BankLoanHistory /></Layout>} />
            <Route path="/crd-flow/collection-report" element={<Layout><CollectionReport /></Layout>} />
            <Route path="/crd-flow/overall-report" element={<Layout><OverallReport /></Layout>} />
            <Route path="/crd-flow/extra-works" element={<Layout><ExtraWorks /></Layout>} />
            <Route path="/crd-flow/complaints" element={<Layout><ComplaintsFlow /></Layout>} />
            <Route path="/customers" element={<Layout><Customers /></Layout>} />
            <Route path="/tasks-board" element={<Layout><TasksBoard /></Layout>} />
            
            {/* KPI Insights & Conversions */}
            <Route path="/kpi-insights" element={<Layout><KPIInsights /></Layout>} />
            
            {/* Reports Master */}
            <Route path="/reports/export" element={<Layout><ExportReports /></Layout>} />
            <Route path="/reports/crd" element={<Layout><CRDReports /></Layout>} />
            
            {/* Finance & Accounts Modules */}
            <Route path="/finance/budget-planning" element={<Layout><BudgetPlanning /></Layout>} />
            <Route path="/finance/lead-target-planning" element={<Layout><LeadTargetPlanning /></Layout>} />
            <Route path="/finance/summary-planning" element={<Layout><SummaryPlanning /></Layout>} />
            <Route path="/finance/parameter-planning" element={<Layout><ParameterPlanning /></Layout>} />

            {/* Administration / Utilities */}
            <Route path="/access-control" element={<Layout><AccessControl /></Layout>} />
            <Route path="/requests" element={<Layout><Requests /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
