import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://johbuilders.onrender.com/api';

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
    hasColumnPermission
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
