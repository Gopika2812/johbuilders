import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Building, 
  MapPin, 
  Ruler, 
  DollarSign, 
  ArrowRight, 
  Layers, 
  Search, 
  Calendar, 
  X, 
  Filter, 
  SlidersHorizontal,
  Grid,
  Table as TableIcon,
  Edit,
  CheckCircle2,
  Trash2,
  Plus
} from 'lucide-react';

const ProjectsDictionary = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View Mode Switcher: initial view is 'table'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'

  // Inline Editing States
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    totalLandArea: '',
    pricePerSqFt: '',
    layoutPlanImage: ''
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [projectType, setProjectType] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleStartEdit = (project) => {
    setEditingProjectId(project._id);
    setEditForm({
      name: project.name,
      location: project.location,
      totalLandArea: project.totalLandArea.toString(),
      pricePerSqFt: project.pricePerSqFt.toString(),
      layoutPlanImage: project.layoutPlanImage || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditForm({
      name: '',
      location: '',
      totalLandArea: '',
      pricePerSqFt: '',
      layoutPlanImage: ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          location: editForm.location,
          totalLandArea: Number(editForm.totalLandArea),
          pricePerSqFt: Number(editForm.pricePerSqFt),
          layoutPlanImage: editForm.layoutPlanImage
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setProjects(projects.map(p => p._id === id ? updated : p));
        setEditingProjectId(null);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update project');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error saving project');
    }
  };

  const handleDeleteProject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}"? This will permanently delete all units, booked records, and details associated with it.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProjects(projects.filter(p => p._id !== id));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete project');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error deleting project');
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_URL}/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          setError('Failed to fetch projects database');
        }
      } catch (err) {
        setError('Connection error fetching projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [token]);

  const displayProjectType = (typeVal) => {
    if (Array.isArray(typeVal)) {
      return typeVal.map(t => t === 'House' ? 'Villa' : t).join(', ');
    }
    return typeVal === 'House' ? 'Villa' : typeVal;
  };

  const getTypeBadgeStyle = (type) => {
    const resolved = Array.isArray(type) ? type[0] : type;
    switch (resolved) {
      case 'Plot':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Flat':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'House':
      case 'Villa':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setProjectType('All');
    setFromDate('');
    setToDate('');
  };

  // Filter projects client-side
  const filteredProjects = projects.filter((project) => {
    // 1. Search term filter
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Project type filter
    const matchesType = projectType === 'All' || project.projectType === projectType || (projectType === 'Villa' && project.projectType === 'House');

    // 3. Date range filter
    let matchesDate = true;
    if (project.createdAt) {
      const createdDate = new Date(project.createdAt);
      
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        const checkDate = new Date(createdDate);
        checkDate.setHours(0, 0, 0, 0);
        if (checkDate < from) {
          matchesDate = false;
        }
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        const checkDate = new Date(createdDate);
        checkDate.setHours(0, 0, 0, 0);
        if (checkDate > to) {
          matchesDate = false;
        }
      }
    } else if (fromDate || toDate) {
      matchesDate = false;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const hasActiveFilters = searchTerm !== '' || projectType !== 'All' || fromDate !== '' || toDate !== '';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e623a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Modern Filter Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#0e623a]" />
            <h4 className="font-semibold text-gray-800">Filter Projects</h4>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 transition"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Term */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0e623a] focus:ring-1 focus:ring-[#0e623a] transition"
            />
          </div>

          {/* Project Type Selection */}
          <div>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0e623a] focus:ring-1 focus:ring-[#0e623a] transition"
            >
              <option value="All">All Project Types</option>
              <option value="Plot">Plot Projects</option>
              <option value="Flat">Flat Projects</option>
              <option value="Villa">Villa Projects</option>
            </select>
          </div>

          {/* From Date */}
          <div className="relative">
            <span className="absolute left-3 top-3 text-[10px] font-bold text-gray-400 uppercase pointer-events-none">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full pl-12 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0e623a] focus:ring-1 focus:ring-[#0e623a] transition text-gray-700"
            />
          </div>

          {/* To Date */}
          <div className="relative">
            <span className="absolute left-3 top-3 text-[10px] font-bold text-gray-400 uppercase pointer-events-none">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0e623a] focus:ring-1 focus:ring-[#0e623a] transition text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* View Switcher and Details Header */}
      {filteredProjects.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 border border-gray-100 shadow-sm rounded-2xl text-left">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-800">Registered Projects List ({filteredProjects.length})</span>
            <Link
              to="/projects/register"
              className="px-3 py-1.5 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition flex items-center gap-1 shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Link>
          </div>

          <div className="flex bg-gray-150 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-white text-gray-800 shadow-sm font-bold' : 'text-gray-550 hover:text-gray-800'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Table View (Editable)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
                viewMode === 'card' ? 'bg-white text-gray-800 shadow-sm font-bold' : 'text-gray-550 hover:text-gray-800'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Card Grid</span>
            </button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Building className="w-8 h-8 text-[#0e623a]" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No Projects Found</h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your search criteria or clear the filters to view all projects.
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-[#0e623a] text-white text-sm font-semibold rounded-xl hover:bg-[#0b4d2d] transition"
            >
              Reset Filters
            </button>
          ) : (
            <Link
              to="/projects/register"
              className="inline-block px-6 py-2.5 bg-[#0e623a] text-white text-sm font-semibold rounded-xl hover:bg-[#0b4d2d] transition"
            >
              Register First Project
            </Link>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (INITIAL VIEW & EDITABLE ROW OPTION) */
        <div className="bg-white border border-gray-150 shadow-sm rounded-3xl overflow-hidden text-left animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Project Name</th>
                  <th className="p-4 w-28">Code</th>
                  <th className="p-4 w-32">Type</th>
                  <th className="p-4 w-28">Map Layout</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 w-36">Total Land Area (sq.ft)</th>
                  <th className="p-4 w-36">Price / sq.ft</th>
                  <th className="p-4 w-28 text-center">Total Units</th>
                  <th className="p-4 w-36 text-right">Valuation</th>
                  <th className="p-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {filteredProjects.map((project) => {
                  const isEditing = editingProjectId === project._id;
                  return (
                    <tr key={project._id} className="hover:bg-emerald-50/10 transition align-middle">
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="px-2.5 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none w-full font-bold text-xs"
                          />
                        ) : (
                          <Link to={`/projects/${project._id}`} className="font-extrabold text-[#0e623a] hover:underline text-sm block">
                            {project.name}
                          </Link>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-650">{project.code}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getTypeBadgeStyle(project.projectType)}`}>
                          {displayProjectType(project.projectType)}
                        </span>
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 w-24">
                            <input 
                              type="file" 
                              id={`edit-file-${project._id}`}
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditForm({ ...editForm, layoutPlanImage: reader.result });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById(`edit-file-${project._id}`).click()}
                              className="px-2 py-1 bg-[#0e623a]/10 hover:bg-[#0e623a]/20 text-[#0e623a] text-[10px] font-bold rounded-lg border border-[#bce2cb]"
                            >
                              Upload File
                            </button>
                            {editForm.layoutPlanImage && (
                              <img 
                                src={editForm.layoutPlanImage} 
                                alt="Thumb" 
                                className="w-10 h-10 object-cover rounded border"
                              />
                            )}
                          </div>
                        ) : (
                          project.layoutPlanImage ? (
                            <img 
                              src={project.layoutPlanImage} 
                              alt="Map Layout" 
                              className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                              onClick={() => window.open(project.layoutPlanImage, '_blank')}
                            />
                          ) : (
                            <span className="text-gray-400 italic text-[10px]">No Layout</span>
                          )
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            className="px-2.5 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none w-full text-xs"
                          />
                        ) : (
                          <span className="text-gray-650 font-semibold">{project.location}</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-gray-700">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.totalLandArea}
                            onChange={(e) => setEditForm({ ...editForm, totalLandArea: e.target.value })}
                            className="px-2.5 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none w-full text-xs font-semibold"
                          />
                        ) : (
                          <span>{project.totalLandArea?.toLocaleString()} sq.ft</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-gray-700">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.pricePerSqFt}
                            onChange={(e) => setEditForm({ ...editForm, pricePerSqFt: e.target.value })}
                            className="px-2.5 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none w-full text-xs font-semibold"
                          />
                        ) : (
                          <span>${project.pricePerSqFt} / sq.ft</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-gray-600">{project.units?.length || 0}</td>
                      <td className="p-4 text-right font-extrabold text-[#0e623a]">${project.totalValuation?.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(project._id)}
                                className="px-3 py-1.5 bg-[#0e623a] text-white text-xs font-bold rounded-lg hover:bg-[#0b4d2d] transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(project)}
                                className="p-1.5 text-gray-555 hover:text-[#0e623a] hover:bg-gray-55 rounded-lg transition"
                                title="Edit Project details inline"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProject(project._id, project.name)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="Delete Project permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <Link
                                to={`/projects/${project._id}`}
                                className="px-3 py-1.5 border border-gray-255 rounded-lg text-xs font-bold text-[#0e623a] hover:bg-[#0e623a]/5 transition"
                              >
                                Manage
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD VIEW FORMAT */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {filteredProjects.map((project) => (
            <div
              key={project._id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              {/* Header Info */}
              <div className="p-5 border-b border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getTypeBadgeStyle(project.projectType)}`}>
                    {displayProjectType(project.projectType)}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#0e623a] bg-[#0e623a]/5 px-2 py-0.5 rounded">
                    {project.code}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-gray-800 tracking-tight leading-snug">{project.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span className="truncate text-gray-600">{project.location}</span>
                  </div>
                  {project.createdAt && (
                    <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-1.5">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Registered: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Specs & Metrics */}
              <div className="p-5 bg-gray-50/50 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  {/* Land Area */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Land Area</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-750">
                      <Ruler className="w-3.5 h-3.5 text-gray-400" />
                      <span>{project.totalLandArea.toLocaleString()} sq.ft</span>
                    </div>
                  </div>

                  {/* Units Count */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Units</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-750">
                      <Layers className="w-3.5 h-3.5 text-gray-400" />
                      <span>{project.units?.length || 0} Units</span>
                    </div>
                  </div>

                  {/* Price per SqFt */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Price per sq.ft</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-750">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                      <span>${project.pricePerSqFt} / sq.ft</span>
                    </div>
                  </div>

                  {/* Valuation */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Valuation</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0e623a]">
                      <DollarSign className="w-3.5 h-3.5 text-[#0e623a]/60" />
                      <span>${project.totalValuation?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(project)}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#0e623a]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(project._id, project.name)}
                    className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
                <Link
                  to={`/projects/${project._id}`}
                  className="flex items-center gap-1 text-xs font-bold text-[#0e623a] hover:text-[#0b4d2d] transition group"
                >
                  <span>Manage Inventory</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsDictionary;

