import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Save, 
  UserCheck, 
  Eye, 
  Edit3, 
  CheckSquare, 
  Square,
  Loader2
} from 'lucide-react';

const AccessControl = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data states
  const [userConfigs, setUserConfigs] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user-permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserConfigs(data);
        if (data.length > 0 && !activeUserId) {
          setActiveUserId(data[0].userId);
        }
      }
    } catch (err) {
      console.error('Error fetching RBAC configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (userId, pageId, field) => {
    setUserConfigs(prev => 
      prev.map(config => {
        if (config.userId !== userId) return config;
        
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
    const activeConfig = userConfigs.find(c => c.userId === activeUserId);
    if (!activeConfig) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/user-permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: activeConfig.userId,
          userName: activeConfig.userName,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find permissions array for active user
  const currentPermissions = userConfigs.find(c => c.userId === activeUserId)?.permissions || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left animate-fadeIn">
      
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-black-100 shadow-sm rounded-3xl">
        <div>
          <h2 className="text-xl font-extrabold text-black-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0e623a]" />
            <span>User-Based Access Control</span>
          </h2>
          {/* <p className="text-xs text-black-500 mt-1">Configure module-level view and edit permissions dynamically per enterprise role</p> */}
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Permissions Saved!
            </span>
          )}
          <button
            onClick={handleSavePermissions}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-black-400 italic">
          Loading Access Control configs...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel - User Selection List */}
          <div className="lg:col-span-4 bg-white border border-black-100 p-5 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-black-450 uppercase tracking-wider block mb-2">Select User</h3>
            <div className="space-y-3">
              {userConfigs.map((config) => {
                const isActive = config.userId === activeUserId;
                return (
                  <button
                    key={config.userId}
                    onClick={() => setActiveUserId(config.userId)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center gap-3 ${
                      isActive 
                        ? 'border-[#0e623a] bg-emerald-50/20 text-[#0e623a] shadow-sm'
                        : 'border-black-100 hover:border-black-250 bg-white text-black-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-[#0e623a]/10' : 'bg-black-50'}`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{config.userName}</h4>
                      {/* <p className="text-[11px] text-black-400 mt-0.5 font-medium">Configure page access privileges</p> */}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel - Page by Page Interactive Matrix */}
          <div className="lg:col-span-8 bg-white border border-black-100 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-black-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-black-800 uppercase tracking-wide">
                  Module Matrix: <span className="text-[#0e623a]">{userConfigs.find(c => c.userId === activeUserId)?.userName}</span>
                </h3>
                {/* <p className="text-[11px] text-black-400 mt-0.5">Toggle View and Edit checkboxes below to customize system routing and capability.</p> */}
              </div>
            </div>

            <div className="overflow-hidden border border-black-150 rounded-2xl shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black-50 border-b border-black-150 font-bold text-black-500 uppercase tracking-wider text-[11px]">
                    <th className="p-4 w-12 text-center">S.NO.</th>
                    <th className="p-4">MODULE/PAGE NAME</th>
                    <th className="p-4 w-32 text-center">CAN VIEW</th>
                    <th className="p-4 w-32 text-center">CAN EDIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black-100 font-sans text-xs">
                  {currentPermissions.map((permission, idx) => (
                    <tr key={permission.pageId} className="hover:bg-black-50/50 transition">
                      <td className="p-4 text-center font-bold text-black-400">{idx + 1}</td>
                      <td className="p-4 font-bold text-black-750 uppercase">{permission.pageName}</td>
                      
                      {/* Can View checkbox */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(activeUserId, permission.pageId, 'canView')}
                          className={`mx-auto p-1.5 rounded-lg border transition-all ${
                            permission.canView 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-black-50 border-black-200 text-black-400'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Can Edit checkbox */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(activeUserId, permission.pageId, 'canEdit')}
                          className={`mx-auto p-1.5 rounded-lg border transition-all ${
                            permission.canEdit
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-black-50 border-black-200 text-black-400'
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
