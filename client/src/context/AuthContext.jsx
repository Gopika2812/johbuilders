import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://johbuilders.onrender.com/api';

export const DEFAULT_PAGE_LABELS = {
  dashboard: {
    sidebar: 'Dashboard',
    title: 'Executive Overview Dashboard',
    subtitle: 'High-level real estate performance, conversion metrics and operational insights'
  },
  kpi_insights: {
    sidebar: 'KPI Insights',
    title: 'Executive KPI & Performance Insights',
    subtitle: 'Strategic conversion analytics, lead generation costs, and target assessments'
  },
  projects: {
    sidebar: 'Projects Directory',
    title: 'Projects Master Directory',
    subtitle: 'Manage property developments, layouts, pricing, and project inventories'
  },
  leads: {
    sidebar: 'Leads Directory',
    title: 'Leads & Enquiries Master Directory',
    subtitle: 'Track customer inquiries, pipeline stages, executive assignments, and logs'
  },
  crd_group: {
    sidebar: 'CRD',
    title: 'CRD Operations',
    subtitle: 'Customer relationship and document management workflow'
  },
  quotations: {
    sidebar: 'Quotation Records',
    title: 'Quotation Records Directory',
    subtitle: 'Review, generate, edit and print client valuation estimates'
  },
  crd_flow: {
    sidebar: 'CRD Flow',
    title: 'CRD Customer Flow & Handover Directory',
    subtitle: 'Customer onboarding, stage verification, payment schedule and handover tracker'
  },
  extra_works: {
    sidebar: 'Extra Works',
    title: 'Extra Works & Customizations Management',
    subtitle: 'Track customer customization requests, estimates, progress and billing'
  },
  bank_loan: {
    sidebar: 'Bank Loan',
    title: 'Bank Loan Coordination Directory',
    subtitle: 'Track customer banking processes, documentation, and disbursement schedules'
  },
  summary: {
    sidebar: 'Summary',
    title: 'Executive Operations & Financial Summary Plan',
    subtitle: 'Monthly performance planning, executive target tracking, and realization summary'
  },
  overall_collection: {
    sidebar: 'Accounts Collection',
    title: 'Financial Accounts & Overall Collections Directory',
    subtitle: 'Monitor receivable collections, installment progress, and financial accounts'
  },
  tasks_board: {
    sidebar: 'Task Scheduler',
    title: 'Task Scheduler & Routine Activities',
    subtitle: 'Manage schedules, routine inspections, and internal team assignments'
  },
  employees: {
    sidebar: 'Employees',
    title: 'Employee Directory & Access Management',
    subtitle: 'Manage team profiles, roles, security permissions, and system access levels'
  },
  audit_logs: {
    sidebar: 'Audit Logs',
    title: 'System Security & Activity Audit Trail',
    subtitle: 'Track system logins, record updates, financial modifications, and audit logs'
  },
  settings: {
    sidebar: 'System Settings',
    title: 'System Settings & Parameters',
    subtitle: 'Configure company profile, lead groups, budget allocation, and navigation labels'
  },
  export_reports: {
    sidebar: 'Export Reports',
    title: 'Executive Reports & Analytics Center',
    subtitle: 'Generate and export executive summaries, excel sheets, and performance reports'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (name, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isApproved: data.isApproved,
        permissions: data.permissions || []
      });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, phone })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isApproved: data.isApproved,
        permissions: data.permissions || []
      });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const isAdmin = user?.role === 'Superadmin';
  const isManager = user?.role === 'Crd team';
  const isSales = user?.role === 'sales person';
  const isSiteEngineer = user?.role === 'ped team';

  const hasPermission = (pageId) => {
    if (pageId === 'tasks_board' || pageId === 'tasksBoard' || pageId === 'tasks') {
      return !!user; // All logged in users can view and edit task board
    }
    if (isAdmin) return true; // Admins see everything
    if (!user || !user.permissions) return false;
    
    let targetPageId = pageId;
    if (pageId === 'crdFlow') targetPageId = 'crd_flow';
    if (pageId === 'complaintsFlow') targetPageId = 'complaints_flow';
    if (pageId === 'extraWorks') targetPageId = 'extra_works';

    let perm = user.permissions.find(p => p.pageId === targetPageId);
    
    // Fallback for complaints_flow / complaintsFlow to use extra_works permissions if missing
    if (!perm && (targetPageId === 'complaints_flow' || targetPageId === 'complaintsFlow')) {
      perm = user.permissions.find(p => p.pageId === 'extra_works');
    }
    
    return perm ? perm.canView : false;
  };

  const hasColumnPermission = (pageId, columnKey) => {
    if (isAdmin) return true; // Admins see all columns
    if (!user || !user.permissions) return false;
    
    let targetPageId = pageId;
    if (pageId === 'crdFlow') targetPageId = 'crd_flow';
    if (pageId === 'complaintsFlow') targetPageId = 'complaints_flow';
    if (pageId === 'extraWorks') targetPageId = 'extra_works';

    let perm = user.permissions.find(p => p.pageId === targetPageId);
    
    // Fallback for complaints_flow / complaintsFlow to use extra_works permissions if missing
    if (!perm && (targetPageId === 'complaints_flow' || targetPageId === 'complaintsFlow')) {
      perm = user.permissions.find(p => p.pageId === 'extra_works');
    }
    
    if (!perm) return false;
    
    // If columns config doesn't exist or is empty, assume true
    if (!perm.columns) return true;
    
    // If the specific column is undefined in the config, default to true, else return its value
    return perm.columns[columnKey] !== undefined ? perm.columns[columnKey] : true;
  };

  // System Settings / Navigation & Page Headings Customization
  const [customLabels, setCustomLabels] = useState(DEFAULT_PAGE_LABELS);

  const fetchSettings = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.customLabels) {
          const merged = { ...DEFAULT_PAGE_LABELS };
          // Handle both Map object and plain JSON from mongo
          const rawLabels = data.customLabels instanceof Map ? Object.fromEntries(data.customLabels) : data.customLabels;
          Object.keys(rawLabels || {}).forEach(k => {
            merged[k] = {
              ...DEFAULT_PAGE_LABELS[k],
              ...rawLabels[k]
            };
          });
          setCustomLabels(merged);
        }
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
  }, [token]);

  const getLabel = (pageKey, field = 'title', fallback = '') => {
    if (!pageKey) return fallback;
    const pageObj = customLabels?.[pageKey] || DEFAULT_PAGE_LABELS[pageKey];
    if (pageObj && pageObj[field] && pageObj[field].trim()) {
      return pageObj[field];
    }
    return DEFAULT_PAGE_LABELS[pageKey]?.[field] || fallback;
  };

  const updateCustomLabels = async (newLabels) => {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customLabels: newLabels })
      });
      if (res.ok) {
        const data = await res.json();
        const rawLabels = data.customLabels instanceof Map ? Object.fromEntries(data.customLabels) : (data.customLabels || newLabels);
        const merged = { ...DEFAULT_PAGE_LABELS };
        Object.keys(rawLabels || {}).forEach(k => {
          merged[k] = {
            ...DEFAULT_PAGE_LABELS[k],
            ...rawLabels[k]
          };
        });
        setCustomLabels(merged);
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, message: errData.message || 'Failed to update custom labels' };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Network error updating custom labels' };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isManager,
    isSales,
    isSiteEngineer,
    isAuthenticated: !!user,
    hasPermission,
    hasColumnPermission,
    customLabels,
    getLabel,
    updateCustomLabels,
    refreshSettings: fetchSettings
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
