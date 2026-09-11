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
  Loader2,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const PAGE_COLUMNS = {
  dashboard: [
    { key: 'fullAccess', label: 'Full Dashboard Access (Superadmin View: All Users & Global Metrics)', defaultFalse: true },
    { key: 'allTasks', label: 'View All Tasks (Across All Users)', defaultFalse: true },
    { key: 'userFilter', label: 'Enable User Filter Dropdown', defaultFalse: true }
  ],
  kpi_insights: [
    { key: 'fullAccess', label: 'Full KPI Insights Access (All Users & Global Metrics)', defaultFalse: true },
    { key: 'userFilter', label: 'Enable User Filter Dropdown', defaultFalse: true }
  ],
  quotations: [
    { key: 'customerDetails', label: 'Customer Details' },
    { key: 'project', label: 'Project' },
    { key: 'quotedUnits', label: 'Quoted Units' },
    { key: 'totalValue', label: 'Total Value' },
    { key: 'preparedBy', label: 'Prepared By' },
    { key: 'createdDate', label: 'Created Date' },
    { key: 'crdPerson', label: 'CRD Person' },
    { key: 'pedPerson', label: 'PED Person' },
    { key: 'accountsPerson', label: 'Accounts Person' },
    { key: 'actions', label: 'Actions' }
  ],
  projects: [
    { key: 'projectName', label: 'Project Name' },
    { key: 'code', label: 'Code' },
    { key: 'type', label: 'Type' },
    { key: 'mapLayout', label: 'Map Layout' },
    { key: 'location', label: 'Location' },
    { key: 'totalLandArea', label: 'Total Land Area' },
    { key: 'pricePerSqFt', label: 'Price / sq.ft' },
    { key: 'totalUnits', label: 'Total Units' },
    { key: 'valuation', label: 'Valuation' },
    { key: 'actions', label: 'Actions' }
  ],
  leads: [
    { key: 'sno', label: 'S.No' },
    { key: 'date', label: 'Date' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'sourceDetails', label: 'Source Details' },
    { key: 'project', label: 'Project' },
    { key: 'category', label: 'Category' },
    { key: 'assignedBy', label: 'Assigned By' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'leadStatus', label: 'Lead Status' },
    { key: 'nextFollowup', label: 'Next Followup' },
    { key: 'actions', label: 'Actions Menu' },
    { key: 'deleteLead', label: '🗑️ Delete Lead Permission (Allow user to permanently delete lead records)', defaultFalse: true }
  ],
  customers: [
    { key: 'sno', label: 'S.No' },
    { key: 'bookingDate', label: 'Booking Date' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'project', label: 'Project' },
    { key: 'units', label: 'Units' },
    { key: 'totalCost', label: 'Total Cost' },
    { key: 'bankLoan', label: 'Bank Loan' },
    { key: 'assignedTo', label: 'Assigned Executive' },
    { key: 'actions', label: 'Actions' }
  ],
  crdFlow: [
    { key: 'sno', label: 'S.No' },
    { key: 'bookingDate', label: 'Booked Date' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'project', label: 'Project' },
    { key: 'units', label: 'Units' },
    { key: 'finalValue', label: 'Final Quotation Value' },
    { key: 'receivedValue', label: 'Received Value' },
    { key: 'pendingValue', label: 'Pending Value' },
    { key: 'assignedPerson', label: 'Assigned Person' },
    { key: 'crdPerson', label: 'CRD Person' },
    { key: 'pedPerson', label: 'PED Person' },
    { key: 'accountsPerson', label: 'Accounts Person' },
    { key: 'actions', label: 'Quick Actions' }
  ],
  complaintsFlow: [
    { key: 'sno', label: 'S.No' },
    { key: 'raisedOn', label: 'Raised On' },
    { key: 'tokenId', label: 'Token ID' },
    { key: 'scope', label: 'Scope' },
    { key: 'sentToPed', label: 'Sent to PED' },
    { key: 'status', label: 'Status' },
    { key: 'completedOn', label: 'Completed On' },
    { key: 'actions', label: 'Action' }
  ]
};

const AccessControl = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data states
  const [userConfigs, setUserConfigs] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPageId, setExpandedPageId] = useState(null);

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
            const nextVal = !p[field];
            const updated = {
              ...p,
              [field]: nextVal
            };
            if (pageId === 'dashboard' && field === 'canEdit') {
              updated.columns = {
                ...(p.columns || {}),
                fullAccess: nextVal,
                allTasks: nextVal,
                userFilter: nextVal
              };
            }
            if (pageId === 'kpi_insights' && field === 'canEdit') {
              updated.columns = {
                ...(p.columns || {}),
                fullAccess: nextVal,
                userFilter: nextVal
              };
            }
            return updated;
          })
        };
      })
    );
  };

  const handleToggleColumnPermission = (userId, pageId, columnKey) => {
    setUserConfigs(prev => 
      prev.map(config => {
        if (config.userId !== userId) return config;
        
        const colDef = PAGE_COLUMNS[pageId]?.find(c => c.key === columnKey);
        const defaultVal = colDef?.defaultFalse ? false : true;

        return {
          ...config,
          permissions: config.permissions.map(p => {
            if (p.pageId !== pageId) return p;
            
            const currentColumns = p.columns || {};
            const isEnabled = currentColumns[columnKey] !== undefined ? currentColumns[columnKey] : (colDef?.defaultFalse ? false : defaultVal);
            const nextVal = !isEnabled;
            const updatedCols = {
              ...currentColumns,
              [columnKey]: nextVal
            };

            let nextCanEdit = p.canEdit;
            if (pageId === 'dashboard' && columnKey === 'fullAccess') {
              nextCanEdit = nextVal;
            }
            if (pageId === 'kpi_insights' && columnKey === 'fullAccess') {
              nextCanEdit = nextVal;
            }
            
            return {
              ...p,
              canEdit: nextCanEdit,
              columns: updatedCols
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
    <div className="w-full mx-auto space-y-6 text-left animate-fadeIn">
      
      {/* Top Actions Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 bg-white p-4 border border-black-100 shadow-sm rounded-3xl">
        <div className="flex items-center gap-3 ml-auto">
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
          <div className="lg:col-span-3 bg-white border border-black-100 p-5 rounded-3xl shadow-sm flex flex-col max-h-[800px]">
            <div className="mb-4 space-y-3">
              <h3 className="text-xs font-extrabold text-black-450 uppercase tracking-wider block">Select User</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black-400" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black-50 border border-black-150 rounded-xl text-xs focus:outline-none focus:border-[#0e623a] focus:ring-1 focus:ring-[#0e623a] transition-all"
                />
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin flex-1">
              {userConfigs.filter(config => config.userName.toLowerCase().includes(searchQuery.toLowerCase())).map((config) => {
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
                    <div className="w-full text-left">
                      <h4 className="text-xs font-bold">{config.userName}</h4>
                      <p className="text-[10px] text-emerald-600 mt-0.5 font-bold uppercase tracking-wider">{config.userRole}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel - Page by Page Interactive Matrix */}
          <div className="lg:col-span-9 bg-white border border-black-100 p-6 rounded-3xl shadow-sm space-y-6">
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
                    <React.Fragment key={permission.pageId}>
                      <tr className="hover:bg-black-50/50 transition">
                        <td className="p-4 text-center font-bold text-black-400">{idx + 1}</td>
                        <td className="p-4 font-bold text-black-750 uppercase">
                          <div className="flex items-center gap-2">
                            {PAGE_COLUMNS[permission.pageId] && (
                              <button 
                                onClick={() => setExpandedPageId(expandedPageId === permission.pageId ? null : permission.pageId)}
                                className="p-1 hover:bg-black-100 rounded text-black-500 transition"
                              >
                                {expandedPageId === permission.pageId ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            )}
                            {permission.pageName}
                          </div>
                        </td>
                        
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
                      
                      {/* Expanded Columns row */}
                      {expandedPageId === permission.pageId && PAGE_COLUMNS[permission.pageId] && (
                        <tr className="bg-black-50/30">
                          <td colSpan="4" className="p-4">
                            <div className="bg-white border border-black-150 rounded-2xl p-5 shadow-sm ml-8">
                              <h4 className="text-[11px] font-extrabold text-black-450 uppercase tracking-wider mb-4 border-b border-black-100 pb-2">
                                Column Level Access for {permission.pageName}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  {PAGE_COLUMNS[permission.pageId].map(col => {
                                    const defaultVal = col.defaultFalse ? false : true;
                                    const isEnabled = permission.columns?.[col.key] !== undefined 
                                      ? Boolean(permission.columns[col.key]) 
                                      : (col.defaultFalse ? false : defaultVal);
                                  return (
                                    <button
                                      key={col.key}
                                      onClick={() => handleToggleColumnPermission(activeUserId, permission.pageId, col.key)}
                                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        isEnabled 
                                          ? 'border-[#0e623a] bg-emerald-50/20 shadow-sm'
                                          : 'border-black-200 bg-black-50 opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      <div className={`p-1 rounded ${isEnabled ? 'bg-[#0e623a] text-white' : 'bg-black-200 text-black-500'}`}>
                                        {isEnabled ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                      </div>
                                      <span className={`text-[11px] font-bold ${isEnabled ? 'text-black-800' : 'text-black-500'}`}>
                                        {col.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
