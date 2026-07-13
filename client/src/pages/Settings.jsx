import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
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
  Palette
} from 'lucide-react';

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
  'Real Estate',
  'Magicbricks',
  'Website',
  'Direct',
  'Old Customer',
  'Reference',
  'Flexboard/Banner',
  'Stall'
];

const SettingsPage = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'marketing'
  
  // Settings values
  const [companyName, setCompanyName] = useState('Builders Real Estate Pvt Ltd');
  const [currency, setCurrency] = useState('USD ($)');
  const [measureUnit, setMeasureUnit] = useState('Square Feet (sq.ft)');
  const [saved, setSaved] = useState(false);

  // Marketing Lead Groups States
  const [leadGroups, setLeadGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [sourceSearch, setSourceSearch] = useState('');
  const [editSourceSearch, setEditSourceSearch] = useState('');
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
  }, []);

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
                                <div className="space-y-1">
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
                                        const visible = SOURCE_TYPES.filter(src => src.toLowerCase().includes(editSourceSearch.toLowerCase()));
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
                                  <div className="max-h-24 overflow-y-auto border border-black-200 rounded p-1 space-y-1">
                                    {SOURCE_TYPES.filter(src => src.toLowerCase().includes(editSourceSearch.toLowerCase())).map(src => (
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
                        const visible = SOURCE_TYPES.filter(src => src.toLowerCase().includes(sourceSearch.toLowerCase()));
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
                      {SOURCE_TYPES.filter(src => src.toLowerCase().includes(sourceSearch.toLowerCase())).every(s => selectedSources.includes(s)) ? 'Toggle Off' : 'Toggle All'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search sources..."
                    value={sourceSearch}
                    onChange={(e) => setSourceSearch(e.target.value)}
                    className="w-full px-3 py-1.5 mb-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold"
                  />
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-black-150 rounded-xl p-3 bg-black-50/50">
                    {SOURCE_TYPES.filter(src => src.toLowerCase().includes(sourceSearch.toLowerCase())).map(src => (
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
      ) : null}
    </div>
  );
};

export default SettingsPage;
