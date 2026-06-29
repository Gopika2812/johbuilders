import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requiredRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f9f4]">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-[#0e623a] mx-auto"></div>
          <p className="mt-4 text-[#0e623a] font-medium">Loading Real Estate ERP...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.isApproved) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m3-13a9 9 0 010 18v-4.5m0-13.5A9 9 0 0112 3v4.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Hello <span className="font-semibold">{user.name}</span>, your registration request is submitted. An Administrator needs to approve your access before you can view the ERP systems.
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 py-3 rounded-lg border border-gray-200">
            Registered Email: {user.email}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 w-full py-3 bg-[#0e623a] text-white rounded-xl font-medium hover:bg-[#0b4d2d] transition"
          >
            Check Status
          </button>
        </div>
      </div>
    );
  }

  // Check roles if required
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
