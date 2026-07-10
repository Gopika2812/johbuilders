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
import BudgetPlanning from './pages/BudgetPlanning';
import LeadTargetPlanning from './pages/LeadTargetPlanning';
import SummaryPlanning from './pages/SummaryPlanning';
import KPIInsights from './pages/KPIInsights';
import Customers from './pages/Customers';
import ExportReports from './pages/ExportReports';
import CRDReports from './pages/CRDReports';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  return (
    <div className="min-h-screen bg-transparent flex relative">
      {/* Mobile Sidebar backdrop overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Panel Content Frame */}
      <div className={`flex-1 flex flex-col min-h-screen relative z-10 w-full max-w-full min-w-0 transition-all duration-300 ${sidebarOpen ? 'pl-0 md:pl-64' : 'pl-0 md:pl-20'}`}>
        {/* Top Navbar */}
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Dynamic Page Views */}
        <main className="flex-grow pt-20 md:pt-24 px-4 md:px-8 pb-12 relative z-10">
          {children}
        </main>
      </div>

      {/* Animated Background Waves */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 select-none">
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-[#0e623a]/5 via-[#a7d8ff]/5 to-transparent"></div>
        {/* Wave 1 */}
        <svg 
          className="absolute bottom-0 left-0 w-[200%] h-48 text-[#0e623a]/10 animate-wave-slow" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z" fill="currentColor" />
        </svg>
        {/* Wave 2 */}
        <svg 
          className="absolute bottom-0 left-0 w-[200%] h-36 text-[#a7d8ff]/15 animate-wave-fast" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path d="M0,40 C180,80 380,0 550,40 C720,80 920,0 1090,40 C1260,80 1460,0 1630,40 L1630,120 L0,120 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Pages */}
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
            <Route path="/customers" element={<Layout><Customers /></Layout>} />
            
            {/* KPI Insights & Conversions */}
            <Route path="/kpi-insights" element={<Layout><KPIInsights /></Layout>} />
            
            {/* Reports Master */}
            <Route path="/reports/export" element={<Layout><ExportReports /></Layout>} />
            <Route path="/reports/crd" element={<Layout><CRDReports /></Layout>} />
            
            {/* Finance & Accounts Modules */}
            <Route path="/finance/budget-planning" element={<Layout><BudgetPlanning /></Layout>} />
            <Route path="/finance/lead-target-planning" element={<Layout><LeadTargetPlanning /></Layout>} />
            <Route path="/finance/summary-planning" element={<Layout><SummaryPlanning /></Layout>} />

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
