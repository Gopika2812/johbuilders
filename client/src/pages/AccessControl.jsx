import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Save, 
  UserCheck, 
  Eye, 
  Edit3, 
  CheckSquare, 
  Square 
} from 'lucide-react';

const AccessControl = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Data states
  const [roleConfigs, setRoleConfigs] = useState([]);
  const [activeRole, setActiveRole] = useState('Admin');

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/role-permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoleConfigs(data);
      }
    } catch (err) {
      console.error('Error fetching RBAC configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (roleName, pageId, field) => {
    setRoleConfigs(prev => 
      prev.map(config => {
        if (config.role !== roleName) return config;
        
        return {
          ...config,
          permissions: config.permissions.map(p => {
            if (p.pageId !== pageId) return p;
            return {
              ...p,
              [field]: !p[field]
            };
          })
        };
      })
    );
  };

  const handleSavePermissions = async () => {
    const activeConfig = roleConfigs.find(c => c.role === activeRole);
    if (!activeConfig) return;

    try {
      const response = await fetch(`${API_URL}/role-permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: activeConfig.role,
          permissions: activeConfig.permissions
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save permissions configuration.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving permissions.');
    }
  };

  // Find permissions array for active role
  const currentPermissions = roleConfigs.find(c => c.role === activeRole)?.permissions || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left animate-fadeIn">
      
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-gray-100 shadow-sm rounded-3xl">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0e623a]" />
            <span>Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Configure module-level view and edit permissions dynamically per enterprise role</p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Permissions Saved!
            </span>
          )}
          <button
            onClick={handleSavePermissions}
            className="px-5 py-2.5 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 italic">
          Loading Access Control configs...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel - Enterprise Role Selection List */}
          <div className="lg:col-span-4 bg-white border border-gray-100 p-5 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-gray-450 uppercase tracking-wider block mb-2">Select User Role</h3>
            <div className="space-y-3">
              {roleConfigs.map((config) => {
                const isActive = config.role === activeRole;
                return (
                  <button
                    key={config.role}
                    onClick={() => setActiveRole(config.role)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center gap-3 ${
                      isActive 
                        ? 'border-[#0e623a] bg-emerald-50/20 text-[#0e623a] shadow-sm'
                        : 'border-gray-100 hover:border-gray-250 bg-white text-gray-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-[#0e623a]/10' : 'bg-gray-50'}`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{config.role}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Configure page access privileges</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel - Page by Page Interactive Matrix */}
          <div className="lg:col-span-8 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                  Module Matrix: <span className="text-[#0e623a]">{activeRole}</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Toggle View and Edit checkboxes below to customize system routing and capability.</p>
              </div>
            </div>

            <div className="overflow-hidden border border-gray-150 rounded-2xl shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-12 text-center">S.NO.</th>
                    <th className="p-4">MODULE/PAGE NAME</th>
                    <th className="p-4 w-32 text-center">CAN VIEW</th>
                    <th className="p-4 w-32 text-center">CAN EDIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-xs">
                  {currentPermissions.map((permission, idx) => (
                    <tr key={permission.pageId} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-4 font-bold text-gray-750 uppercase">{permission.pageName}</td>
                      
                      {/* Can View checkbox */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(activeRole, permission.pageId, 'canView')}
                          className={`mx-auto p-1.5 rounded-lg border transition-all ${
                            permission.canView 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Can Edit checkbox */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(activeRole, permission.pageId, 'canEdit')}
                          className={`mx-auto p-1.5 rounded-lg border transition-all ${
                            permission.canEdit
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default AccessControl;
