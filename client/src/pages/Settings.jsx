import React, { useState, useEffect } from 'react';
import { useAuth, API_URL, DEFAULT_PAGE_LABELS } from '../context/AuthContext';
import { 
  Settings, 
  User, 
  Building, 
  ShieldAlert, 
  Share2, 
  Plus, 
  Trash2, 
  Edit, 
  SlidersHorizontal,
  Layers,
  DollarSign,
  Loader2,
  Palette,
  Type,
  RotateCcw,
  Search,
  Check,
  Lock,
  LayoutDashboard,
  BarChart3,
  FolderGit2,
  UserPlus,
  FileSpreadsheet,
  ClipboardList,
  Users2,
  History,
  Settings2,
  FileText
} from 'lucide-react';

const PAGE_CONFIG_LIST = [
  { key: 'dashboard', label: 'Dashboard', category: 'Main Navigation', desc: 'Main executive analytics dashboard' },
  { key: 'kpi_insights', label: 'KPI Insights', category: 'Main Navigation', desc: 'Performance conversion KPIs and ROI' },
  { key: 'projects', label: 'Projects Directory', category: 'Main Navigation', desc: 'Real estate properties and plots' },
  { key: 'leads', label: 'Leads Directory', category: 'Main Navigation', desc: 'Customer inquiries and CRM pipeline' },
  { key: 'crd_group', label: 'CRD Menu Header', category: 'CRD Operations', desc: 'CRD Dropdown section menu title in sidebar' },
  { key: 'quotations', label: 'Quotation Records', category: 'CRD Operations', desc: 'Cost estimates and customer quotations' },
  { key: 'crd_flow', label: 'CRD Flow', category: 'CRD Operations', desc: 'Customer verification and handover process' },
  { key: 'extra_works', label: 'Extra Works Flow', category: 'CRD Operations', desc: 'Additional construction and modifications' },
  { key: 'bank_loan', label: 'Bank Loan History', category: 'CRD Operations', desc: 'Bank loan follow-ups and documentation' },
  { key: 'overall_collection', label: 'Overall Collection Report', category: 'CRD Operations', desc: 'Financial collections and receipts tracker' },
  { key: 'export_reports', label: 'Sales Reports', category: 'Reports Master', desc: 'Sales, marketing and executive reports' },
  { key: 'crd_reports', label: 'CRD Reports', category: 'Reports Master', desc: 'CRD operations and handover reports' },
  { key: 'tasks_board', label: 'Task Board', category: 'Operations', desc: 'Team tasks and scheduler' },
  { key: 'employees', label: 'Employees Directory', category: 'Administration', desc: 'User accounts and access approvals' },
  { key: 'audit_logs', label: 'Audit Logs', category: 'Administration', desc: 'System security and action logs' },
  { key: 'summary', label: 'Summary Planning', category: 'Finance & Planning', desc: 'Executive targets and business goals' },
  { key: 'settings', label: 'System Settings', category: 'Administration', desc: 'System configuration and preferences' },
];

const SOURCE_TYPES = [
  'Paper Ad',
  'Railway station Hoardings (Rental)',
  'Local TV',
  'FM Radio',
  'Airport Advertisement - Tuticorin',
  'Hydrogen Balloon',
  'Notice distribution',
  'Unipole',
  'LED board behind park',
  'Pearl Bliss Tuticorin Project',
  'Satellite Channel',
  '99acres',
  'Housing.com',
  'Facebook',
  'Instagram',
  'Youtube',
  'Whatsapp',
  'Real Estate',
  'Magicbricks',
  'Website',
  'Direct',
  'Old Customer',
  'Reference',
  'Mediator',
  'Flexboard/Banner',
  'Stall'
];

const SettingsPage = () => {
  const { user, token, isAdmin, customLabels, updateCustomLabels } = useAuth();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'marketing' | 'visuals' | 'navigation'
  
  // Settings values
  const [companyName, setCompanyName] = useState('Builders Real Estate Pvt Ltd');
  const [currency, setCurrency] = useState('USD ($)');
  const [measureUnit, setMeasureUnit] = useState('Square Feet (sq.ft)');
  const [saved, setSaved] = useState(false);

  // Dynamic Navigation & Page Headings
  const [editableLabels, setEditableLabels] = useState({});
  const [isSavingLabels, setIsSavingLabels] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [labelSaveSuccess, setLabelSaveSuccess] = useState(false);
  const [labelError, setLabelError] = useState('');

  useEffect(() => {
    if (customLabels) {
      setEditableLabels(JSON.parse(JSON.stringify(customLabels)));
    }
  }, [customLabels]);

  const handleLabelChange = (pageKey, field, value) => {
    setEditableLabels(prev => ({
      ...prev,
      [pageKey]: {
        ...(prev[pageKey] || DEFAULT_PAGE_LABELS[pageKey] || {}),
        [field]: value
      }
    }));
  };

  const handleResetSinglePage = (pageKey) => {
    if (!DEFAULT_PAGE_LABELS[pageKey]) return;
    setEditableLabels(prev => ({
      ...prev,
      [pageKey]: { ...DEFAULT_PAGE_LABELS[pageKey] }
    }));
  };

  const handleResetAllToDefaults = () => {
    if (!isAdmin) {
      alert('Access Denied: Only Superadmin can reset page navigation names.');
      return;
    }
    if (window.confirm('Are you sure you want to restore all sidebar menu names and page headings back to default values?')) {
      setEditableLabels(JSON.parse(JSON.stringify(DEFAULT_PAGE_LABELS)));
    }
  };

  const handleSaveLabels = async (e) => {
    if (e) e.preventDefault();
    if (!isAdmin) {
      alert('Access Denied: Only Superadmin users are authorized to customize sidebar menu names and page headings.');
      return;
    }
    setIsSavingLabels(true);
    setLabelError('');
    setLabelSaveSuccess(false);
    try {
      const res = await updateCustomLabels(editableLabels);
      if (res.success) {
        setLabelSaveSuccess(true);
        setTimeout(() => setLabelSaveSuccess(false), 3000);
      } else {
        setLabelError(res.message || 'Failed to save navigation labels');
      }
    } catch (err) {
      setLabelError(err.message || 'Error updating labels');
    } finally {
      setIsSavingLabels(false);
    }
  };

  // Marketing Lead Groups States
  const [leadGroups, setLeadGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [sourceSearch, setSourceSearch] = useState('');
  const [editSourceSearch, setEditSourceSearch] = useState('');
  const [allSources, setAllSources] = useState(SOURCE_TYPES);
  const [customSourceInput, setCustomSourceInput] = useState('');
  const [editCustomSourceInput, setEditCustomSourceInput] = useState('');

  // Edit mode for groups
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editGroupForm, setEditGroupForm] = useState({ name: '', sources: [] });

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const [savingEditGroupId, setSavingEditGroupId] = useState(null);

  // Stage Colors
  const [stageColors, setStageColors] = useState({
    'Hot': '#ffffff',
    'Warm': '#ffffff',
    'Cold': '#ffffff',
    'New': '#ffffff',
    'Assigned': '#ffffff',
    'Follow-Up': '#ffffff',
    'Site Visit': '#ffffff',
    'Booking': '#0a4c2c',
    'Future Follow-up': '#ffffff',
    'Lost': '#ffffff',
  });
  const [stageTextColors, setStageTextColors] = useState({
    'Hot': '#000000',
    'Warm': '#000000',
    'Cold': '#000000',
    'New': '#000000',
    'Assigned': '#000000',
    'Follow-Up': '#000000',
    'Site Visit': '#000000',
    'Booking': '#ffffff',
    'Future Follow-up': '#000000',
    'Lost': '#000000',
  });
  const [isSavingColors, setIsSavingColors] = useState(false);

  useEffect(() => {
    fetchLeadGroups();
    fetchStageColors();
    fetchAllSystemSources();
  }, []);

  const fetchAllSystemSources = async () => {
    try {
      const res = await fetch(`${API_URL}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let dbSources = [];
      if (res.ok) {
        const leadsData = await res.json();
        dbSources = leadsData.map(l => l.leadSource).filter(Boolean);
      }
      
      const groupSources = leadGroups.flatMap(g => g.sources || []);
      const merged = Array.from(new Set([...SOURCE_TYPES, ...dbSources, ...groupSources])).filter(Boolean);
      setAllSources(merged);
    } catch (err) {
      console.error('Error fetching system lead sources:', err);
    }
  };

  const handleAddCustomSource = () => {
    const trimmed = customSourceInput.trim();
    if (!trimmed) return;
    if (!allSources.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setAllSources(prev => [...prev, trimmed]);
    }
    if (!selectedSources.includes(trimmed)) {
      setSelectedSources(prev => [...prev, trimmed]);
    }
    setCustomSourceInput('');
  };

  const handleAddEditCustomSource = () => {
    const trimmed = editCustomSourceInput.trim();
    if (!trimmed) return;
    if (!allSources.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setAllSources(prev => [...prev, trimmed]);
    }
    if (!editGroupForm.sources.includes(trimmed)) {
      setEditGroupForm(prev => ({
        ...prev,
        sources: [...prev.sources, trimmed]
      }));
    }
    setEditCustomSourceInput('');
  };

  const fetchStageColors = async () => {
    try {
      const response = await fetch(`${API_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.stageColors) {
          setStageColors(prev => ({ ...prev, ...data.stageColors }));
        }
        if (data.stageTextColors) {
          setStageTextColors(prev => ({ ...prev, ...data.stageTextColors }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStageColors = async (e) => {
    e.preventDefault();
    setIsSavingColors(true);
    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stageColors, stageTextColors })
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingColors(false);
    }
  };

  const fetchLeadGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/lead-groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLeadGroups(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsCreatingGroup(true);
    try {
      const response = await fetch(`${API_URL}/lead-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: groupName,
          sources: selectedSources
        })
      });

      if (response.ok) {
        const newGroup = await response.json();
        setLeadGroups([newGroup, ...leadGroups]);
        setGroupName('');
        setSelectedSources([]);
        setSourceSearch('');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to create group');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marketing group?')) return;
    setDeletingGroupId(id);
    try {
      const response = await fetch(`${API_URL}/lead-groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setLeadGroups(leadGroups.filter(g => g._id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleStartEditGroup = (group) => {
    setEditingGroupId(group._id);
    setEditSourceSearch('');
    setEditGroupForm({
      name: group.name,
      sources: group.sources || []
    });
  };

  const handleSaveEditGroup = async (id) => {
    setSavingEditGroupId(id);
    try {
      const response = await fetch(`${API_URL}/lead-groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editGroupForm)
      });
      if (response.ok) {
        const updated = await response.json();
        setLeadGroups(leadGroups.map(g => g._id === id ? updated : g));
        setEditingGroupId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEditGroupId(null);
    }
  };

  const toggleSourceSelection = (source, isEdit = false) => {
    if (isEdit) {
      const current = editGroupForm.sources.includes(source)
        ? editGroupForm.sources.filter(s => s !== source)
        : [...editGroupForm.sources, source];
      setEditGroupForm({ ...editGroupForm, sources: current });
    } else {
      const current = selectedSources.includes(source)
        ? selectedSources.filter(s => s !== source)
        : [...selectedSources, source];
      setSelectedSources(current);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-semibold animate-pulse">
          System configurations saved successfully!
        </div>
      )}

      {/* Tab Swapping Switcher Navigation */}
      <div className="flex border-b border-black-200 bg-white p-1 rounded-t-2xl shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex-1 sm:flex-initial py-3.5 px-6 text-sm font-bold border-b-2 transition text-center flex items-center justify-center gap-2 ${
            activeTab === 'general'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-black-550 hover:text-black-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>General Settings</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('marketing')}
          className={`flex-1 sm:flex-initial py-3.5 px-6 text-sm font-bold border-b-2 transition text-center flex items-center justify-center gap-2 ${
            activeTab === 'marketing'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-black-550 hover:text-black-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Lead Groups & Budget Planning</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('visuals')}
          className={`flex-1 sm:flex-initial py-3.5 px-6 text-sm font-bold border-b-2 transition text-center flex items-center justify-center gap-2 ${
            activeTab === 'visuals'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-black-550 hover:text-black-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Visual & Stage Colors</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('navigation')}
          className={`flex-1 sm:flex-initial py-3.5 px-6 text-sm font-bold border-b-2 transition text-center flex items-center justify-center gap-2 ${
            activeTab === 'navigation'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-black-550 hover:text-black-800'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Sidebar & Page Headings</span>
          {!isAdmin && <Lock className="w-3.5 h-3.5 text-amber-500 ml-0.5" title="Superadmin Access Only" />}
        </button>
      </div>

      {activeTab === 'general' ? (
        <div className="bg-white rounded-b-3xl shadow-sm border border-black-100 overflow-hidden animate-fadeIn">
          <div className="bg-[#0e623a] p-6 text-white text-left">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#a7d8ff]" />
              <span>System Settings & Parameters</span>
            </h3>
            {/* <p className="text-red-100 text-xs mt-1">
              Configure profile info, default metrics, currencies, and company details
            </p> */}
          </div>

          <form onSubmit={handleSaveGeneral} className="p-8 space-y-8">
            {/* Section 1: User profile */}
            <div className="space-y-4 text-left">
              <h4 className="text-sm font-bold text-black-800 border-b pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-[#0e623a]" />
                <span>Personal Profile</span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block mb-2">Display Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || ''}
                    className="w-full px-4 py-3 bg-black-50 border border-black-200 rounded-xl text-black-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block mb-2">Active Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-3 bg-black-50 border border-black-200 rounded-xl text-black-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <span className="text-[11px] text-black-400 flex items-center gap-1.5 mt-1 font-light">
                <ShieldAlert className="w-3.5 h-3.5" />
                Profile information is managed by your database administrator.
              </span>
            </div>

            {/* Section 2: Company settings */}
            <div className="space-y-4 text-left">
              <h4 className="text-sm font-bold text-black-800 border-b pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#0e623a]" />
                <span>Company Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block mb-2">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block mb-2">Measuring Unit System</label>
                  <select
                    value={measureUnit}
                    onChange={(e) => setMeasureUnit(e.target.value)}
                    className="w-full px-4 py-3 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  >
                    <option value="Square Feet (sq.ft)">Square Feet (sq.ft)</option>
                    <option value="Square Yards (sq.yd)">Square Yards (sq.yd)</option>
                    <option value="Acres (ac)">Acres (ac)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block mb-2">Default Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="INR (₹)">INR (₹)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition block"
            >
              Save Settings Parameters
            </button>
          </form>
        </div>
      ) : activeTab === 'marketing' ? (
        /* Tab 2: Marketing Lead Groups & Budget Planning */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left animate-fadeIn">
          {/* List of groups */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 border border-black-100 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-black-800 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#0e623a]" />
                <span>Active Lead Source Groups & Budgets</span>
              </h3>

              <div className="overflow-x-auto border border-black-200 rounded-2xl shadow-inner bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-black-50 border-b border-black-200 font-bold text-black-500 uppercase tracking-wider text-[11px]">
                      <th className="p-4">Group Name</th>
                      <th className="p-4">Lead Sources</th>
                      <th className="p-4 w-24 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black-150 font-sans">
                    {leadGroups.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-black-400 italic">
                          No Lead Groups configured yet. Create one on the right side!
                        </td>
                      </tr>
                    ) : (
                      leadGroups.map((group) => {
                        const isEditing = editingGroupId === group._id;
                        return (
                          <tr key={group._id} className="hover:bg-emerald-50/10 transition">
                            <td className="p-4 font-bold text-black-850">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editGroupForm.name}
                                  onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                                  className="px-2 py-1 bg-black-50 border rounded focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold"
                                />
                              ) : (
                                group.name
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <input
                                      type="text"
                                      placeholder="Filter..."
                                      value={editSourceSearch}
                                      onChange={(e) => setEditSourceSearch(e.target.value)}
                                      className="px-2 py-0.5 bg-black-50 border rounded text-[11px] w-full focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const visible = allSources.filter(src => src.toLowerCase().includes(editSourceSearch.toLowerCase()));
                                        const allVisibleSelected = visible.every(s => editGroupForm.sources.includes(s));
                                        let updated;
                                        if (allVisibleSelected) {
                                          updated = editGroupForm.sources.filter(s => !visible.includes(s));
                                        } else {
                                          updated = Array.from(new Set([...editGroupForm.sources, ...visible]));
                                        }
                                        setEditGroupForm({ ...editGroupForm, sources: updated });
                                      }}
                                      className="text-[10px] font-bold text-[#0e623a] hover:underline whitespace-nowrap px-1 bg-emerald-50 rounded"
                                    >
                                      Toggle All
                                    </button>
                                  </div>
                                  <div className="max-h-28 overflow-y-auto border border-black-200 rounded p-1.5 space-y-1">
                                    {allSources.filter(src => src.toLowerCase().includes(editSourceSearch.toLowerCase())).map(src => (
                                      <label key={src} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={editGroupForm.sources.includes(src)}
                                          onChange={() => toggleSourceSelection(src, true)}
                                          className="rounded text-[#0e623a] focus:ring-[#0e623a] scale-90"
                                        />
                                        <span>{src}</span>
                                      </label>
                                    ))}
                                  </div>
                                  <div className="flex gap-1 pt-1">
                                    <input
                                      type="text"
                                      placeholder="Add custom source..."
                                      value={editCustomSourceInput}
                                      onChange={(e) => setEditCustomSourceInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddEditCustomSource();
                                        }
                                      }}
                                      className="px-2 py-1 bg-white border border-black-200 rounded text-[11px] w-full focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleAddEditCustomSource}
                                      className="px-2 py-1 bg-[#0e623a] text-white rounded text-[10px] font-bold hover:bg-[#0b4d2d]"
                                    >
                                      +Add
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                                  {group.sources?.map(src => (
                                    <span key={src} className="px-1.5 py-0.5 bg-black-100 text-black-600 rounded text-[10px] font-semibold">
                                      {src}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditGroup(group._id)}
                                      disabled={savingEditGroupId === group._id}
                                      className="px-2 py-1 bg-[#0e623a] text-white rounded text-[11px] font-bold hover:bg-[#0b4d2d] disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                      {savingEditGroupId === group._id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingGroupId(null)}
                                      className="px-2 py-1 bg-black-150 text-black-600 rounded text-[11px] font-bold hover:bg-black-200"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditGroup(group)}
                                      className="p-1 text-black-400 hover:text-[#0e623a] hover:bg-black-100 rounded"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteGroup(group._id)}
                                      disabled={deletingGroupId === group._id}
                                      className="p-1 text-black-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                    >
                                      {deletingGroupId === group._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Creation Sidebar Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 border border-black-100 rounded-3xl shadow-sm space-y-4 h-fit">
              <div className="border-b pb-3">
                <h3 className="text-base font-bold text-black-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#0e623a]" />
                  <span>Create Lead Group</span>
                </h3>
                <p className="text-[11px] text-black-500 mt-1">Bundle specific channels and define dynamic budgets.</p>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block mb-1.5">Group Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Social Media"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider">Select Lead Sources</label>
                    <button
                      type="button"
                      onClick={() => {
                        const visible = allSources.filter(src => src.toLowerCase().includes(sourceSearch.toLowerCase()));
                        const allVisibleSelected = visible.every(s => selectedSources.includes(s));
                        let updated;
                        if (allVisibleSelected) {
                          updated = selectedSources.filter(s => !visible.includes(s));
                        } else {
                          updated = Array.from(new Set([...selectedSources, ...visible]));
                        }
                        setSelectedSources(updated);
                      }}
                      className="text-[11px] font-bold text-[#0e623a] hover:underline"
                    >
                      {allSources.filter(src => src.toLowerCase().includes(sourceSearch.toLowerCase())).every(s => selectedSources.includes(s)) ? 'Toggle Off' : 'Toggle All'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search sources..."
                    value={sourceSearch}
                    onChange={(e) => setSourceSearch(e.target.value)}
                    className="w-full px-3 py-1.5 mb-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold"
                  />
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-black-150 rounded-xl p-3 bg-black-50/50 mb-3">
                    {allSources.filter(src => src.toLowerCase().includes(sourceSearch.toLowerCase())).map(src => (
                      <label key={src} className="flex items-center gap-2 text-xs text-black-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(src)}
                          onChange={() => toggleSourceSelection(src)}
                          className="rounded text-[#0e623a] focus:ring-[#0e623a] border-black-300"
                        />
                        <span>{src}</span>
                      </label>
                    ))}
                  </div>

                  {/* Add Custom Source Option */}
                  <div className="pt-2.5 border-t border-black-150 space-y-1.5">
                    <label className="text-[10px] font-bold text-black-450 uppercase tracking-wider block">Add Custom Lead Source</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter custom lead source..."
                        value={customSourceInput}
                        onChange={(e) => setCustomSourceInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSource();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSource}
                        className="px-3 py-1.5 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingGroup}
                  className="w-full py-2.5 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create & Save Group'}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : activeTab === 'visuals' ? (
        <div className="bg-white rounded-b-3xl shadow-sm border border-black-100 overflow-hidden animate-fadeIn">
          <div className="bg-[#0e623a] p-6 text-white text-left">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#a7d8ff]" />
              <span>Visual & Stage Row Colors</span>
            </h3>
            <p className="text-emerald-100 text-xs mt-1">
              Customize the background and text colors of the rows in the Leads Directory based on their status or category.
            </p>
          </div>

          <form onSubmit={handleSaveStageColors} className="p-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.keys(stageColors).map((stage) => (
                <div key={stage} className="bg-black-50 p-4 rounded-2xl border border-black-150 flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-bold text-black-600 uppercase tracking-wider block">{stage}</label>
                    <div className="flex gap-2 text-[10px] text-black-400 font-semibold mt-0.5">
                      <span>Bg: {stageColors[stage]}</span>
                      <span>| Text: {stageTextColors[stage]}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      title="Background Color"
                      value={stageColors[stage] || '#ffffff'}
                      onChange={(e) => setStageColors(prev => ({ ...prev, [stage]: e.target.value }))}
                      className="w-8 h-8 p-0 border-0 rounded cursor-pointer overflow-hidden"
                    />
                    <input
                      type="color"
                      title="Text Color"
                      value={stageTextColors[stage] || '#000000'}
                      onChange={(e) => setStageTextColors(prev => ({ ...prev, [stage]: e.target.value }))}
                      className="w-8 h-8 p-0 border-0 rounded cursor-pointer overflow-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-black-150 pt-6">
              <button
                type="submit"
                disabled={isSavingColors}
                className="px-8 py-3 bg-[#0e623a] text-white rounded-xl text-sm font-bold hover:bg-[#0b4d2d] transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isSavingColors ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Color Configuration
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'navigation' ? (
        <div className="bg-white rounded-b-3xl shadow-sm border border-black-100 overflow-hidden animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-[#0e623a] p-6 text-white text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Type className="w-5 h-5 text-emerald-200" />
                  <span>Sidebar Menu Names & Page Headings</span>
                </h3>
                <p className="text-emerald-100 text-xs mt-1 max-w-2xl">
                  Customize the navigation names shown in the left sidebar and the main title/subtitle shown at the top of each page.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleResetAllToDefaults}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-white/20 shrink-0 self-start sm:self-auto cursor-pointer"
                  title="Reset all names to default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All to Defaults</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Superadmin Permission Notification */}
            {!isAdmin ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-start gap-3 text-sm">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Superadmin Access Required</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Only Superadmin accounts have permission to modify sidebar menu names and page titles. You are currently viewing in read-only mode.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 p-3.5 rounded-2xl flex items-center gap-3 text-xs font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Superadmin access granted. You can edit any sidebar label or page heading below. Changes take effect immediately across all users upon saving.</span>
              </div>
            )}

            {labelSaveSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Navigation labels and page headings saved successfully!</span>
              </div>
            )}

            {labelError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span>{labelError}</span>
              </div>
            )}

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search page (e.g. Quotation, Leads, CRD, Reports, Dashboard...)"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0e623a]/30 focus:border-[#0e623a]"
              />
            </div>

            {/* Page Configuration Cards */}
            <div className="space-y-4">
              {PAGE_CONFIG_LIST
                .filter(item => {
                  if (!navSearch.trim()) return true;
                  const q = navSearch.toLowerCase();
                  const currentObj = editableLabels[item.key] || DEFAULT_PAGE_LABELS[item.key] || {};
                  return (
                    item.label.toLowerCase().includes(q) ||
                    item.category.toLowerCase().includes(q) ||
                    (currentObj.sidebar || '').toLowerCase().includes(q) ||
                    (currentObj.title || '').toLowerCase().includes(q)
                  );
                })
                .map((page) => {
                  const currentObj = editableLabels[page.key] || DEFAULT_PAGE_LABELS[page.key] || {};
                  const defaultObj = DEFAULT_PAGE_LABELS[page.key] || {};
                  const isModified = 
                    (currentObj.sidebar && currentObj.sidebar !== defaultObj.sidebar) ||
                    (currentObj.title && currentObj.title !== defaultObj.title) ||
                    (currentObj.subtitle && currentObj.subtitle !== defaultObj.subtitle);

                  return (
                    <div 
                      key={page.key} 
                      className={`p-5 rounded-2xl border transition-all duration-200 ${
                        isModified 
                          ? 'bg-emerald-50/30 border-emerald-200/80 shadow-sm' 
                          : 'bg-gray-50/70 border-gray-200/70 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-gray-200/60">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 bg-[#0e623a]/10 text-[#0e623a] text-[11px] font-bold rounded-lg uppercase tracking-wider">
                            {page.category}
                          </span>
                          <span className="text-sm font-extrabold text-gray-900">
                            {page.label}
                          </span>
                          {isModified && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md">
                              Customized
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleResetSinglePage(page.key)}
                            className="text-xs text-gray-500 hover:text-[#0e623a] font-semibold flex items-center gap-1 self-start sm:self-auto transition cursor-pointer"
                            title="Reset this page to default"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset to Default</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sidebar Label Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                            Sidebar Menu Name
                          </label>
                          <input
                            type="text"
                            disabled={!isAdmin}
                            placeholder={defaultObj.sidebar || page.label}
                            value={currentObj.sidebar || ''}
                            onChange={(e) => handleLabelChange(page.key, 'sidebar', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0e623a]/30 focus:border-[#0e623a] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition"
                          />
                          <p className="text-[11px] text-gray-400 mt-1">Default: <span className="text-gray-600 font-medium">{defaultObj.sidebar || page.label}</span></p>
                        </div>

                        {/* Page Heading Title Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                            Page Heading Title
                          </label>
                          <input
                            type="text"
                            disabled={!isAdmin}
                            placeholder={defaultObj.title || page.label}
                            value={currentObj.title || ''}
                            onChange={(e) => handleLabelChange(page.key, 'title', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0e623a]/30 focus:border-[#0e623a] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition"
                          />
                          <p className="text-[11px] text-gray-400 mt-1">Default: <span className="text-gray-600 font-medium">{defaultObj.title || page.label}</span></p>
                        </div>

                        {/* Page Subtitle / Description Input */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                            Page Subtitle / Description (Optional)
                          </label>
                          <input
                            type="text"
                            disabled={!isAdmin}
                            placeholder={defaultObj.subtitle || ''}
                            value={currentObj.subtitle || ''}
                            onChange={(e) => handleLabelChange(page.key, 'subtitle', e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e623a]/30 focus:border-[#0e623a] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Bottom Save Action Bar */}
            {isAdmin && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
                <p className="text-xs text-gray-500">
                  Click save to persist all custom sidebar names and headings.
                </p>

                <button
                  type="button"
                  onClick={handleSaveLabels}
                  disabled={isSavingLabels}
                  className="w-full sm:w-auto px-8 py-3 bg-[#0e623a] text-white rounded-xl text-sm font-bold hover:bg-[#0b4d2d] transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {isSavingLabels ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Navigation & Headings</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SettingsPage;
