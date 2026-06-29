import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import { 
  Building, 
  MapPin, 
  Ruler, 
  DollarSign, 
  Layers, 
  Grid, 
  Table as TableIcon,
  Edit, 
  CheckCircle2, 
  UserPlus, 
  Maximize2,
  Trash2,
  Lock,
  Unlock,
  ChevronLeft,
  Share2,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Trash,
  Play,
  Pause
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

const ProjectDetail = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitStatus, setUnitStatus] = useState('New');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [leadName, setLeadName] = useState('');

  // Resize Modal State
  const [resizeModalOpen, setResizeModalOpen] = useState(false);
  const [resizePlot, setResizePlot] = useState(null);
  const [newSize, setNewSize] = useState('');
  const [redistributionMode, setRedistributionMode] = useState('equal');
  const [updatedPriceSqFt, setUpdatedPriceSqFt] = useState('');

  // Base Pricing Engine State
  const [basePriceInput, setBasePriceInput] = useState('');
  const [priceEditing, setPriceEditing] = useState(false);

  // Marketing Modal State
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [mSourceType, setMSourceType] = useState('');
  const [mVideos, setMVideos] = useState([{ name: '', link: '', status: 'Active', updatedAt: new Date().toISOString() }]);
  const [mPosters, setMPosters] = useState([{ name: '', link: '', status: 'Active', updatedAt: new Date().toISOString() }]);
  const [activeTab, setActiveTab] = useState('project'); // 'project' | 'marketing'
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Marketing Search and Date Filter States
  const [marketingSearch, setMarketingSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const generateTempId = () => 'temp_' + Math.random().toString(36).substr(2, 9) + Date.now();

  useEffect(() => {
    fetchProjectDetails();
  }, [id, token]);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setBasePriceInput(data.pricePerSqFt.toString());

        // Initialize default dates: startDate is project creation date, endDate is today
        if (data.createdAt) {
          setStartDate(new Date(data.createdAt).toISOString().split('T')[0]);
        } else {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        }
        setEndDate(new Date().toISOString().split('T')[0]);

        if (data.marketingInfo) {
          setMSourceType(data.marketingInfo.sourceType || '');
          
          // Sort existing videos and posters by updatedAt descending (newest on top)
          const sortedVideos = [...(data.marketingInfo.videos || [])]
            .map(v => ({ ...v, _id: v._id || generateTempId() }))
            .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
            
          const sortedPosters = [...(data.marketingInfo.posters || [])]
            .map(p => ({ ...p, _id: p._id || generateTempId() }))
            .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

          setMVideos(sortedVideos.length ? sortedVideos : [{ _id: generateTempId(), name: '', link: '', status: 'Active', updatedAt: new Date().toISOString() }]);
          setMPosters(sortedPosters.length ? sortedPosters : [{ _id: generateTempId(), name: '', link: '', status: 'Active', updatedAt: new Date().toISOString() }]);
        }
      } else {
        setError('Failed to fetch project details');
      }
    } catch (err) {
      setError('Connection error fetching details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarketingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/projects/${id}/marketing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceType: mSourceType,
          videos: mVideos.filter(v => v.name || v.link),
          posters: mPosters.filter(p => p.name || p.link)
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setProject(updated);
        setMarketingModalOpen(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update marketing details');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (itemType, itemId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    let updatedVideos = [...(project.marketingInfo?.videos || [])];
    let updatedPosters = [...(project.marketingInfo?.posters || [])];

    if (itemType === 'video') {
      updatedVideos = updatedVideos.map(v => v._id === itemId ? { ...v, status: newStatus } : v);
    } else {
      updatedPosters = updatedPosters.map(p => p._id === itemId ? { ...p, status: newStatus } : p);
    }

    try {
      const response = await fetch(`${API_URL}/projects/${id}/marketing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceType: project.marketingInfo?.sourceType || '',
          videos: updatedVideos,
          posters: updatedPosters
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setProject(updated);
        setMSourceType(updated.marketingInfo?.sourceType || '');
        setMVideos(updated.marketingInfo?.videos?.length ? updated.marketingInfo.videos : [{ name: '', link: '', status: 'Active' }]);
        setMPosters(updated.marketingInfo?.posters?.length ? updated.marketingInfo.posters : [{ name: '', link: '', status: 'Active' }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pricing Engine Update
  const handleUpdateBasePrice = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pricePerSqFt: Number(basePriceInput) })
      });
      if (response.ok) {
        const updated = await response.json();
        setProject(updated);
        setPriceEditing(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update base price');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Booking details submit handler
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/projects/${id}/unit-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unitId: selectedUnit.unitId,
          status: unitStatus,
          customerName,
          customerPhone,
          leadName
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setProject(updated);
        setBookingModalOpen(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update booking status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resize Plots Engine submit handler
  const handleResizeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/projects/${id}/resize-plot`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unitId: resizePlot.unitId,
          newSize: Number(newSize),
          redistributionMode,
          pricePerSqFt: updatedPriceSqFt ? Number(updatedPriceSqFt) : undefined
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setProject(updated);
        setResizeModalOpen(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to resize plot');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Booked':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Under Construction':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Sold Out':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e623a]"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl">
        {error || 'Project data loading error'}
      </div>
    );
  }

  // Calculated land metrics for resizing modal helper
  const lockedPlotsCount = project.units.filter(u => u.isLocked).length;
  const lockedPlotsSize = project.units.filter(u => u.isLocked).reduce((s, u) => s + u.size, 0);

  return (
    <div className="space-y-8">
      {/* Back to Dictionary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/projects" className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-[#0e623a] transition">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#0e623a] bg-[#0e623a]/5 px-2 py-0.5 rounded">
                Prefix: {project.code}
              </span>
              <span className="text-xs font-bold text-gray-400">
                • {project.projectType} Inventory
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
          </div>
        </div>

        {/* Pricing Engine Configurator Panel */}
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Price Per Sq.Ft</span>
            {priceEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={basePriceInput}
                  onChange={(e) => setBasePriceInput(e.target.value)}
                  className="w-24 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm focus:outline-none"
                />
                <button
                  onClick={handleUpdateBasePrice}
                  className="px-2.5 py-1 bg-[#0e623a] text-white text-xs font-semibold rounded hover:bg-[#0b4d2d]"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setBasePriceInput(project.pricePerSqFt.toString());
                    setPriceEditing(false);
                  }}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-[#0e623a]">${project.pricePerSqFt}</span>
                {(user.role === 'Admin' || user.role === 'Manager') && (
                  <button
                    onClick={() => setPriceEditing(true)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#0e623a]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="border-l border-gray-200 h-8"></div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Valuation</span>
            <span className="text-lg font-extrabold text-gray-800">${project.totalValuation?.toLocaleString()}</span>
          </div>
        </div>
      </div>      {/* Tab Switcher Navigation */}
      <div className="flex border-b border-gray-200 bg-white p-1 rounded-t-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('project')}
          className={`flex-1 sm:flex-initial py-3 px-6 text-sm font-bold border-b-2 transition text-center ${
            activeTab === 'project'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Project Details & Inventory
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('marketing')}
          className={`flex-1 sm:flex-initial py-3 px-6 text-sm font-bold border-b-2 transition text-center ${
            activeTab === 'marketing'
              ? 'border-[#0e623a] text-[#0e623a]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Marketing & Promotions
        </button>
      </div>

      {activeTab === 'project' && (
        <>

      {/* Grid vs Table View Controller */}
      <div className="bg-white p-4 border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{project.location}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Ruler className="w-4 h-4 text-gray-400" />
            <span>{project.totalLandArea.toLocaleString()} sq.ft</span>
          </div>
          {project.projectType === 'Plot' && (
            <>
              <span>•</span>
              <span className="font-medium text-amber-600">Remaining Land: {project.remainingLand.toLocaleString()} sq.ft</span>
            </>
          )}
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
              viewMode === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
              viewMode === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Grid / Table Layout Views based on type */}

      {/* 🟢 PLOT PROJECT VIEW */}
      {project.projectType === 'Plot' && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Map/Layout Placeholder Graphic */}
              <div className="bg-white border border-gray-200 p-6 rounded-3xl lg:col-span-1 space-y-4 shadow-sm h-fit">
                <h3 className="text-sm font-bold text-gray-700">Project Layout Map</h3>
                <div className="w-full bg-[#f0f9f4] rounded-2xl flex flex-col items-center justify-center p-6 border border-[#0e623a]/10 min-h-[220px]">
                  <Building className="w-12 h-12 text-[#0e623a]/30 mb-2" />
                  <span className="text-xs font-semibold text-[#0e623a]">{project.code} Master Plan</span>
                  <span className="text-[10px] text-gray-400 mt-1">Grid units generate auto-proportions</span>
                  <div className="grid grid-cols-5 gap-1 w-full mt-4">
                    {project.units.map((unit, idx) => (
                      <div
                        key={idx}
                        className={`h-4 rounded-sm border text-[8px] flex items-center justify-center font-bold ${
                          unit.status === 'New' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                          unit.status === 'Booked' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                          unit.status === 'Under Construction' ? 'bg-purple-100 border-purple-300 text-purple-800' :
                          'bg-red-100 border-red-300 text-red-800'
                        }`}
                        title={unit.unitId}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg border">
                  <strong>Color Legend:</strong>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span>New</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-400"></span>Booked</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500"></span>Build</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500"></span>Sold</span>
                  </div>
                </div>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:col-span-3">
                {project.units.map((unit) => (
                  <div key={unit.unitId} className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 hover:shadow-md transition space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-gray-800">{unit.unitId}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                          {unit.isLocked ? (
                            <span className="flex items-center gap-0.5 text-amber-600 font-bold"><Lock className="w-3 h-3" /> Locked Size</span>
                          ) : (
                            <span className="flex items-center gap-0.5"><Unlock className="w-3 h-3 text-gray-300" /> Dynamic</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(unit.status)}`}>
                        {unit.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-50">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Plot Size</span>
                        <span className="text-sm font-bold text-gray-700">{Math.round(unit.size).toLocaleString()} sq.ft</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Value</span>
                        <span className="text-sm font-bold text-[#0e623a]">${Math.round(unit.price).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUnit(unit);
                          setUnitStatus(unit.status);
                          setCustomerName(unit.customerName || '');
                          setCustomerPhone(unit.customerPhone || '');
                          setLeadName(unit.leadName || '');
                          setBookingModalOpen(true);
                        }}
                        className="flex-1 py-2 text-center border border-gray-200 hover:border-[#0e623a]/20 hover:bg-[#0e623a]/5 rounded-xl text-xs font-bold text-gray-700 hover:text-[#0e623a] transition"
                      >
                        Booking Details
                      </button>

                      {(user.role === 'Admin' || user.role === 'Manager') && (
                        <button
                          onClick={() => {
                            setResizePlot(unit);
                            setNewSize(Math.round(unit.size).toString());
                            setUpdatedPriceSqFt('');
                            setResizeModalOpen(true);
                          }}
                          title="Resize Plot (Trigger Redistribution Engine)"
                          className="px-3 py-2 bg-gray-50 hover:bg-[#0e623a] border border-gray-200 hover:border-[#0e623a] rounded-xl text-gray-600 hover:text-white transition"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-5">Plot ID</th>
                    <th className="p-5">Size (sq.ft)</th>
                    <th className="p-5">Price</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Customer</th>
                    <th className="p-5">Lead Source</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {project.units.map((unit) => (
                    <tr key={unit.unitId} className="hover:bg-gray-50/50">
                      <td className="p-5 font-bold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <span>{unit.unitId}</span>
                          {unit.isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" title="Locked Size" />}
                        </div>
                      </td>
                      <td className="p-5 text-gray-600">{Math.round(unit.size).toLocaleString()} sq.ft</td>
                      <td className="p-5 font-bold text-[#0e623a]">${Math.round(unit.price).toLocaleString()}</td>
                      <td className="p-5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(unit.status)}`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="p-5 text-gray-600">{unit.customerName || '—'}</td>
                      <td className="p-5 text-gray-600">{unit.leadName || '—'}</td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUnit(unit);
                              setUnitStatus(unit.status);
                              setCustomerName(unit.customerName || '');
                              setCustomerPhone(unit.customerPhone || '');
                              setLeadName(unit.leadName || '');
                              setBookingModalOpen(true);
                            }}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:text-[#0e623a] hover:bg-[#0e623a]/5 transition"
                          >
                            Edit Status
                          </button>
                          {(user.role === 'Admin' || user.role === 'Manager') && (
                            <button
                              onClick={() => {
                                setResizePlot(unit);
                                setNewSize(Math.round(unit.size).toString());
                                setUpdatedPriceSqFt('');
                                setResizeModalOpen(true);
                              }}
                              className="p-1.5 bg-gray-50 hover:bg-[#0e623a] text-gray-600 hover:text-white rounded-lg transition"
                              title="Resize Engine"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* 🔵 FLAT PROJECT VIEW */}
      {project.projectType === 'Flat' && (
        <>
          {viewMode === 'grid' ? (
            <div className="space-y-8">
              {/* Group by Floor */}
              {Array.from(new Set(project.units.map(u => u.floor))).sort().map(floor => (
                <div key={floor} className="space-y-4">
                  <h3 className="text-base font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Building className="w-5 h-5 text-[#0e623a]" />
                    <span>{floor}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {project.units.filter(u => u.floor === floor).map(unit => (
                      <div key={unit.unitId} className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 hover:shadow-md transition space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-gray-800">{unit.unitId}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(unit.status)}`}>
                            {unit.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-50">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Size</span>
                            <span className="text-xs font-bold text-gray-700">{Math.round(unit.size).toLocaleString()} sq.ft</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Value</span>
                            <span className="text-xs font-bold text-[#0e623a]">${Math.round(unit.price).toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setUnitStatus(unit.status);
                            setCustomerName(unit.customerName || '');
                            setCustomerPhone(unit.customerPhone || '');
                            setLeadName(unit.leadName || '');
                            setBookingModalOpen(true);
                          }}
                          className="w-full py-2 border border-gray-200 hover:border-[#0e623a]/20 hover:bg-[#0e623a]/5 rounded-xl text-xs font-bold text-gray-700 hover:text-[#0e623a] transition"
                        >
                          Booking Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-5">Flat No</th>
                    <th className="p-5">Floor</th>
                    <th className="p-5">Size (sq.ft)</th>
                    <th className="p-5">Price</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Customer</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {project.units.map((unit) => (
                    <tr key={unit.unitId} className="hover:bg-gray-50/50">
                      <td className="p-5 font-bold text-gray-800">{unit.unitId}</td>
                      <td className="p-5 text-gray-600">{unit.floor}</td>
                      <td className="p-5 text-gray-600">{Math.round(unit.size).toLocaleString()} sq.ft</td>
                      <td className="p-5 font-bold text-[#0e623a]">${Math.round(unit.price).toLocaleString()}</td>
                      <td className="p-5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(unit.status)}`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="p-5 text-gray-600">{unit.customerName || '—'}</td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setUnitStatus(unit.status);
                            setCustomerName(unit.customerName || '');
                            setCustomerPhone(unit.customerPhone || '');
                            setLeadName(unit.leadName || '');
                            setBookingModalOpen(true);
                          }}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:text-[#0e623a] hover:bg-[#0e623a]/5 transition"
                        >
                          Booking Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* 🟠 HOUSE PROJECT VIEW */}
      {project.projectType === 'House' && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {project.units.map(unit => (
                <div key={unit.unitId} className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 hover:shadow-md transition space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-gray-800">{unit.unitId}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(unit.status)}`}>
                      {unit.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-50">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Size</span>
                      <span className="text-xs font-bold text-gray-700">{Math.round(unit.size).toLocaleString()} sq.ft</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Value</span>
                      <span className="text-xs font-bold text-[#0e623a]">${Math.round(unit.price).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUnit(unit);
                      setUnitStatus(unit.status);
                      setCustomerName(unit.customerName || '');
                      setCustomerPhone(unit.customerPhone || '');
                      setLeadName(unit.leadName || '');
                      setBookingModalOpen(true);
                    }}
                    className="w-full py-2 border border-gray-200 hover:border-[#0e623a]/20 hover:bg-[#0e623a]/5 rounded-xl text-xs font-bold text-gray-700 hover:text-[#0e623a] transition"
                  >
                    Booking Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-5">House ID</th>
                    <th className="p-5">Size (sq.ft)</th>
                    <th className="p-5">Price</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Customer</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {project.units.map((unit) => (
                    <tr key={unit.unitId} className="hover:bg-gray-50/50">
                      <td className="p-5 font-bold text-gray-800">{unit.unitId}</td>
                      <td className="p-5 text-gray-600">{Math.round(unit.size).toLocaleString()} sq.ft</td>
                      <td className="p-5 font-bold text-[#0e623a]">${Math.round(unit.price).toLocaleString()}</td>
                      <td className="p-5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(unit.status)}`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="p-5 text-gray-600">{unit.customerName || '—'}</td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setUnitStatus(unit.status);
                            setCustomerName(unit.customerName || '');
                            setCustomerPhone(unit.customerPhone || '');
                            setLeadName(unit.leadName || '');
                            setBookingModalOpen(true);
                          }}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:text-[#0e623a]/10 hover:bg-[#0e623a]/5 transition"
                        >
                          Booking Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      </>
      )}
            {/* Inline Marketing View */}
      {activeTab === 'marketing' && (() => {
        // Filter helper for both lists
        const getFilteredList = (list) => {
          return list.filter(item => {
            const matchesSearch = !marketingSearch || 
              item.name?.toLowerCase().includes(marketingSearch.toLowerCase()) || 
              item.link?.toLowerCase().includes(marketingSearch.toLowerCase());
            
            const itemDate = item.updatedAt ? new Date(item.updatedAt) : new Date();
            const itemTime = itemDate.setHours(0,0,0,0);
            
            const startTime = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
            const endTime = endDate ? new Date(endDate).setHours(23,59,59,999) : null;
            
            const matchesStartDate = !startTime || itemTime >= startTime;
            const matchesEndDate = !endTime || itemTime <= endTime;
            
            return matchesSearch && matchesStartDate && matchesEndDate;
          });
        };

        const filteredVideos = getFilteredList(mVideos);
        const filteredPosters = getFilteredList(mPosters);

        return (
          <div className="bg-white p-6 border border-gray-150 shadow-sm rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Marketing & Campaign Settings</h3>
                <p className="text-xs text-gray-500 mt-1">Configure sources, tracking links, and active/paused statuses.</p>
              </div>
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 animate-pulse shrink-0 self-start sm:self-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Marketing details saved successfully!</span>
                </div>
              )}
            </div>

            {/* Campaign Metrics & Filters Bar */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Search campaigns</label>
                <input
                  type="text"
                  placeholder="Search by campaign name or link URL..."
                  value={marketingSearch}
                  onChange={(e) => setMarketingSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-sm font-semibold text-gray-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-sm font-semibold text-gray-700"
                />
              </div>
            </div>

            <form onSubmit={handleMarketingSubmit} className="space-y-6">
              {/* Source Campaign Selection */}
              <div className="max-w-md">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Promotional Source / Ad Campaign</label>
                <SearchableSelect
                  options={SOURCE_TYPES}
                  value={mSourceType}
                  onChange={setMSourceType}
                  placeholder="Select Ad Source / Campaign"
                />
              </div>

              {/* Video Ads Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#0e623a]" />
                    <span>Video Ads & Reels ({filteredVideos.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMVideos([{ _id: generateTempId(), name: '', link: '', status: 'Active', updatedAt: new Date().toISOString() }, ...mVideos])}
                    className="flex items-center gap-1 text-xs font-bold text-[#0e623a] hover:text-[#0b4d2d] hover:underline transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Video Row
                  </button>
                </div>

                <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500 text-xs">
                        <th className="p-4">Video Name</th>
                        <th className="p-4">Video Link / URL</th>
                        <th className="p-4 w-32">Status</th>
                        <th className="p-4 w-28 text-center">Preview</th>
                        <th className="p-4 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredVideos.map((vid) => (
                        <tr key={vid._id} className={`hover:bg-gray-55/30 transition-colors ${vid.status === 'Paused' ? 'bg-gray-50/50' : ''}`}>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="e.g. Price Announcement Reel"
                              value={vid.name}
                              onChange={(e) => {
                                setMVideos(mVideos.map(v => v._id === vid._id ? { ...v, name: e.target.value } : v));
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] transition text-sm font-medium"
                            />
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              Updated: {vid.updatedAt ? new Date(vid.updatedAt).toLocaleDateString() : 'Just now'}
                            </span>
                          </td>
                          <td className="p-3">
                            <input
                              type="url"
                              placeholder="https://instagram.com/... or https://youtube.com/..."
                              value={vid.link}
                              onChange={(e) => {
                                setMVideos(mVideos.map(v => v._id === vid._id ? { ...v, link: e.target.value } : v));
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] transition text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                setMVideos(mVideos.map(v => v._id === vid._id ? { ...v, status: v.status === 'Paused' ? 'Active' : 'Paused' } : v));
                              }}
                              className={`w-full py-1.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                vid.status === 'Paused'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${vid.status === 'Paused' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                              <span>{vid.status || 'Active'}</span>
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            {vid.link ? (
                              <a
                                href={vid.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#0e623a] hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open URL</span>
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setMVideos(mVideos.filter(v => v._id !== vid._id))}
                              className="text-red-500 hover:text-red-750 p-1.5 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredVideos.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-400 text-xs">
                            No matching video campaigns found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Poster Ads Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#0e623a]" />
                    <span>Poster & Banner Campaigns ({filteredPosters.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMPosters([{ _id: generateTempId(), name: '', link: '', status: 'Active', updatedAt: new Date().toISOString() }, ...mPosters])}
                    className="flex items-center gap-1 text-xs font-bold text-[#0e623a] hover:text-[#0b4d2d] hover:underline transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Poster Row
                  </button>
                </div>

                <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500 text-xs">
                        <th className="p-4">Poster Name</th>
                        <th className="p-4">Poster Link / URL</th>
                        <th className="p-4 w-32">Status</th>
                        <th className="p-4 w-28 text-center">Preview</th>
                        <th className="p-4 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPosters.map((pos) => (
                        <tr key={pos._id} className={`hover:bg-gray-55/30 transition-colors ${pos.status === 'Paused' ? 'bg-gray-50/50' : ''}`}>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="e.g. Launch Discount Flyer"
                              value={pos.name}
                              onChange={(e) => {
                                setMPosters(mPosters.map(p => p._id === pos._id ? { ...p, name: e.target.value } : p));
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] transition text-sm font-medium"
                            />
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              Updated: {pos.updatedAt ? new Date(pos.updatedAt).toLocaleDateString() : 'Just now'}
                            </span>
                          </td>
                          <td className="p-3">
                            <input
                              type="url"
                              placeholder="https://facebook.com/... or https://..."
                              value={pos.link}
                              onChange={(e) => {
                                setMPosters(mPosters.map(p => p._id === pos._id ? { ...p, link: e.target.value } : p));
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-255 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] transition text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                setMPosters(mPosters.map(p => p._id === pos._id ? { ...p, status: p.status === 'Paused' ? 'Active' : 'Paused' } : p));
                              }}
                              className={`w-full py-1.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                pos.status === 'Paused'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${pos.status === 'Paused' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                              <span>{pos.status || 'Active'}</span>
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            {pos.link ? (
                              <a
                                href={pos.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#0e623a] hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open URL</span>
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setMPosters(mPosters.filter(p => p._id !== pos._id))}
                              className="text-red-500 hover:text-red-755 p-1.5 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredPosters.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-400 text-xs">
                            No matching poster campaigns found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Action */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0e623a] text-white rounded-xl text-sm font-bold hover:bg-[#0b4d2d] transition shadow-md flex items-center gap-2"
                >
                  <span>Save Marketing Settings</span>
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* 🔐 MODAL: Booking Status / Customer Approval Details */}
      {bookingModalOpen && selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-[#0e623a] p-6 text-white">
              <h3 className="text-lg font-bold">Booking Details: {selectedUnit.unitId}</h3>
              <p className="text-red-100 text-xs mt-1">Configure customer records and workflow states</p>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              {/* Unit Status */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Workflow Status</label>
                <select
                  value={unitStatus}
                  onChange={(e) => setUnitStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                >
                  <option value="New">New / Available</option>
                  <option value="Booked">Booked</option>
                  <option value="Under Construction">Under Construction</option>
                  <option value="Sold Out">Sold Out</option>
                </select>
                {user.role === 'Site Engineer' && (
                  <span className="text-[10px] text-red-500 mt-1 block">
                    * Site Engineers cannot change status to Booked or Sold Out.
                  </span>
                )}
              </div>

              {/* Customer Details */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Robert Miller"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Customer Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-0199"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                />
              </div>

              {project.projectType === 'Plot' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Lead / Marketing Channel</label>
                  <input
                    type="text"
                    placeholder="e.g. Digital Ad, Broker Referral"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                  />
                </div>
              )}

              {/* Pricing breakdown summary */}
              <div className="p-4 bg-gray-50 rounded-xl border space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Unit Size:</span>
                  <span className="font-semibold text-gray-800">{Math.round(selectedUnit.size).toLocaleString()} sq.ft</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Unit Value Valuation:</span>
                  <span className="font-bold text-[#0e623a]">${Math.round(selectedUnit.price).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🧠 MODAL: Dynamic Plot Resizing Engine */}
      {resizeModalOpen && resizePlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-[#0e623a] p-6 text-white">
              <h3 className="text-lg font-bold">Dynamic Resizing Engine</h3>
              <p className="text-red-100 text-xs mt-1">Recalculate land allocations dynamically</p>
            </div>

            <form onSubmit={handleResizeSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Real-Time Land Equation</span>
                <p className="text-xs text-amber-700 leading-normal">
                  Remaining Land will be updated as:
                  <br />
                  <code className="bg-white/60 px-1 rounded font-mono">Remaining = Total Land - Sum(Locked Plots)</code>
                </p>
                <div className="text-[10px] text-amber-800 mt-2 font-medium">
                  • Total Land: {project.totalLandArea.toLocaleString()} sq.ft
                  <br />
                  • Already Locked Plots: {lockedPlotsCount} plots ({lockedPlotsSize.toLocaleString()} sq.ft)
                </div>
              </div>

              {/* Target Plot Size */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Target Plot Size (sq.ft) for <span className="text-[#0e623a]">{resizePlot.unitId}</span>
                </label>
                <input
                  type="number"
                  required
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  * Submitting will LOCK this plot size and exclude it from future auto-splits.
                </span>
              </div>

              {/* Redistribution Mode */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Redistribution Mode for Unlocked Plots</label>
                <select
                  value={redistributionMode}
                  onChange={(e) => setRedistributionMode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                >
                  <option value="equal">Equal Split Remaining Land</option>
                  <option value="value-based">Proportionate (Value-Based) Split</option>
                  <option value="manual">Manual Adjustment (Only update this plot)</option>
                </select>
              </div>

              {/* Price update */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Update Price Per Sq.Ft (Optional)
                </label>
                <input
                  type="number"
                  placeholder={`Current: $${project.pricePerSqFt}`}
                  value={updatedPriceSqFt}
                  onChange={(e) => setUpdatedPriceSqFt(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResizeModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition"
                >
                  Recalculate Land
                </button>
              </div>
            </form>
              </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
