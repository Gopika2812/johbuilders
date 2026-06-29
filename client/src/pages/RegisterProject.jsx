import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { Building, MapPin, Ruler, DollarSign, ListPlus, ShieldAlert, Share2, Video, Image as ImageIcon, Plus, Trash } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

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

const RegisterProject = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [projectType, setProjectType] = useState('Plot');
  const [location, setLocation] = useState('');
  const [totalLandArea, setTotalLandArea] = useState('');
  const [pricePerSqFt, setPricePerSqFt] = useState('');
  const [layoutPlanImage, setLayoutPlanImage] = useState('');

  // Marketing states
  const [sourceType, setSourceType] = useState('');
  const [videos, setVideos] = useState([{ name: '', link: '', status: 'Active' }]);
  const [posters, setPosters] = useState([{ name: '', link: '', status: 'Active' }]);

  // Unit generation variables
  const [initialUnitCount, setInitialUnitCount] = useState('10');
  const [floorCount, setFloorCount] = useState('3');
  const [unitsPerFloor, setUnitsPerFloor] = useState('4');

  // Custom unit import states
  const [generationMode, setGenerationMode] = useState('auto'); // 'auto' | 'import'
  const [pastedData, setPastedData] = useState('');
  const [parsedUnits, setParsedUnits] = useState([]);
  const [importViewMode, setImportViewMode] = useState('table'); // 'table' | 'card'

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateUnitField = (index, field, value) => {
    const updated = [...parsedUnits];
    updated[index][field] = field === 'size' || field === 'price' ? (Number(value) || 0) : value;
    
    // Automatically recalculate price if size changes
    if (field === 'size') {
      updated[index].price = (Number(value) || 0) * (Number(pricePerSqFt) || 2000);
    }
    
    setParsedUnits(updated);
  };

  const handleAddUnitRow = () => {
    setParsedUnits([
      ...parsedUnits,
      {
        unitId: `${code ? code.toUpperCase() : 'UNIT'}-${parsedUnits.length + 1}`,
        floor: 'Floor 1',
        unitType: '2 BHK',
        size: 1000,
        price: 1000 * (Number(pricePerSqFt) || 2000),
        status: 'New',
        remarks: '',
        isLocked: false
      }
    ]);
  };

  const handleDeleteUnitRow = (index) => {
    const updated = parsedUnits.filter((_, idx) => idx !== index);
    setParsedUnits(updated);
  };

  const handlePasteChange = (text) => {
    setPastedData(text);
    if (!text.trim()) {
      setParsedUnits([]);
      return;
    }

    const lines = text.split('\n');
    const units = [];
    let calculatedTotalArea = 0;
    
    lines.forEach((line) => {
      if (!line.trim()) return;
      const cols = line.split(line.includes('\t') ? '\t' : ',').map(c => c.trim());
      
      // Skip header row
      if (cols.some(col => col.toLowerCase().includes('sr no') || col.toLowerCase().includes('unit no') || col.toLowerCase().includes('sub project'))) {
        return;
      }

      if (cols.length < 5) return;

      const floor = cols[2] || '';
      const unitId = cols[3] || '';
      const unitType = cols[4] || '';
      const size = Number(cols[5]) || 0;
      
      let status = 'New';
      const soldConsideration = cols[12];
      const soldRate = cols[11];
      if ((soldConsideration && Number(soldConsideration) > 0) || (soldRate && Number(soldRate) > 0)) {
        status = 'Sold Out';
      }

      if (unitId) {
        units.push({
          unitId,
          floor: floor ? `Floor ${floor}` : '',
          unitType,
          size,
          price: size * (Number(pricePerSqFt) || 2000),
          status,
          remarks: cols[13] || '',
          isLocked: false
        });
        calculatedTotalArea += size;
      }
    });

    setParsedUnits(units);
    if (calculatedTotalArea > 0) {
      setTotalLandArea(calculatedTotalArea.toString());
    }
  };

  const handlePricePerSqFtChange = (val) => {
    setPricePerSqFt(val);
    const numPrice = Number(val) || 0;
    if (parsedUnits.length > 0) {
      const updated = parsedUnits.map(u => ({
        ...u,
        price: u.size * numPrice
      }));
      setParsedUnits(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (user.role !== 'Admin' && user.role !== 'Manager') {
      setError('Unauthorized. Only Admins or Managers can register projects.');
      setLoading(false);
      return;
    }

    const payload = {
      name,
      code: code.toUpperCase().trim(),
      projectType,
      layoutPlanImage,
      location,
      totalLandArea: Number(totalLandArea),
      pricePerSqFt: Number(pricePerSqFt),
      marketingInfo: {
        sourceType,
        videos: videos.filter(v => v.name || v.link),
        posters: posters.filter(p => p.name || p.link)
      }
    };

    if (generationMode === 'import' && parsedUnits.length > 0) {
      payload.units = parsedUnits;
    } else {
      payload.initialUnitCount = Number(initialUnitCount);
      payload.floorCount = Number(floorCount);
      payload.unitsPerFloor = Number(unitsPerFloor);
    }

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project');
      }

      setSuccess(`Project ${data.name} (${data.code}) registered successfully with ${data.units.length} units!`);
      // Redirect to the newly created project dictionary after short delay
      setTimeout(() => {
        navigate('/projects');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to register project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Alert / Badges */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
          {success}
        </div>
      )}

      {/* Main card */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border-2 border-[#0e623a]/40 overflow-hidden shadow-[0_10px_35px_rgba(14,98,58,0.08)] hover:shadow-[0_20px_45px_rgba(14,98,58,0.18)] hover:border-[#0e623a]/60 transition-all duration-500 transform hover:-translate-y-1">
        {/* Header decoration */}
        <div className="bg-[#0e623a]/95 p-8 text-white border-b-2 border-[#0e623a]/40">
          <h2 className="text-2xl font-bold">Register Real Estate Project</h2>
          <p className="text-red-100 text-xs mt-1">Configure project type, location metrics, pricing engines, and automation rules</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Project Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Building className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. JMD Meadows"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/20 border border-[#0e623a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Project Code / Prefix */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Project Code / Prefix</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Building className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. JMD, JLB"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/20 border border-[#0e623a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Project Type */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-[#0e623a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] focus:border-transparent transition"
              >
                <option value="Plot">Plot Project</option>
                <option value="Flat">Flat / Apartment Project</option>
                <option value="House">House Project</option>
              </select>
            </div>

            {/* Layout Plan Map Image */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Layout Plan Map Image</label>
              <div className="flex flex-wrap items-center gap-4 bg-white/20 border border-[#0e623a]/20 p-4 rounded-xl">
                <input 
                  type="file" 
                  id="register-file-upload"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setLayoutPlanImage(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('register-file-upload').click()}
                  className="px-4 py-2.5 bg-[#0e623a] text-white hover:bg-[#0b4d2d] text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Choose Layout Plan Image
                </button>
                {layoutPlanImage ? (
                  <div className="relative">
                    <img 
                      src={layoutPlanImage} 
                      alt="Layout Preview" 
                      className="w-14 h-14 object-cover rounded-xl border border-[#bce2cb]"
                    />
                    <button
                      type="button"
                      onClick={() => setLayoutPlanImage('')}
                      className="absolute -top-1.5 -right-1.5 bg-red-150 hover:bg-red-200 text-red-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic font-semibold">No image selected</span>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Location</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <MapPin className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="City, State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/20 border border-[#0e623a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Total Land Area */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Total Land Area (sq.ft)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Ruler className="w-5 h-5" />
                </span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={totalLandArea}
                  onChange={(e) => setTotalLandArea(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/20 border border-[#0e623a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Price per sq.ft */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Price per sq.ft (MANDATORY)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <DollarSign className="w-5 h-5" />
                </span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150"
                  value={pricePerSqFt}
                  onChange={(e) => handlePricePerSqFtChange(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/20 border border-[#0e623a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#0e623a]/20 my-6" />

          {/* Unit Generation Rules */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-[#0e623a]" />
              <span>Unit Inventory Generation Rules</span>
            </h3>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setGenerationMode('auto')}
                className={`py-3 rounded-2xl text-xs font-bold border transition ${
                  generationMode === 'auto'
                    ? 'bg-[#0e623a] border-[#0e623a] text-white shadow-md'
                    : 'bg-white border-[#0e623a]/20 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Auto-Generate Default Units
              </button>
              <button
                type="button"
                onClick={() => setGenerationMode('import')}
                className={`py-3 rounded-2xl text-xs font-bold border transition ${
                  generationMode === 'import'
                    ? 'bg-[#0e623a] border-[#0e623a] text-white shadow-md'
                    : 'bg-white border-[#0e623a]/20 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Import Custom Specifications (Excel Paste)
              </button>
            </div>

            {generationMode === 'auto' ? (
              <>
                {projectType === 'Plot' && (
                  <div className="bg-white/20 backdrop-blur-sm border-2 border-[#0e623a]/30 rounded-2xl p-6 space-y-4">
                    <p className="text-xs text-gray-600 leading-normal text-left">
                      Plots will be generated using code prefix: <strong>{code ? code.toUpperCase() : 'JMDP'}P1</strong>, <strong>{code ? code.toUpperCase() : 'JMDP'}P2</strong>... The total land area of {totalLandArea || '0'} sq.ft will initially be split equally.
                    </p>
                    <div className="text-left">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Initial Plot Count</label>
                      <input
                        type="number"
                        min="1"
                        value={initialUnitCount}
                        onChange={(e) => setInitialUnitCount(e.target.value)}
                        className="w-32 px-4 py-2.5 bg-white/40 border border-[#0e623a]/20 rounded-xl focus:ring-2 focus:ring-[#0e623a] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {projectType === 'House' && (
                  <div className="bg-white/20 backdrop-blur-sm border-2 border-[#0e623a]/30 rounded-2xl p-6 space-y-4">
                    <p className="text-xs text-gray-600 leading-normal text-left">
                      Houses will be generated using code prefix: <strong>{code ? code.toUpperCase() : 'JMDH'}H1</strong>, <strong>{code ? code.toUpperCase() : 'JMDH'}H2...</strong>
                    </p>
                    <div className="text-left">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Initial House Count</label>
                      <input
                        type="number"
                        min="1"
                        value={initialUnitCount}
                        onChange={(e) => setInitialUnitCount(e.target.value)}
                        className="w-32 px-4 py-2.5 bg-white/40 border border-[#0e623a]/20 rounded-xl focus:ring-2 focus:ring-[#0e623a] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {projectType === 'Flat' && (
                  <div className="bg-white/20 backdrop-blur-sm border-2 border-[#0e623a]/30 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-600">
                        Flats will be generated floor-by-floor in format: <strong>{code ? code.toUpperCase() : 'JLB'}-F1-101</strong>, <strong>{code ? code.toUpperCase() : 'JLB'}-F1-102...</strong>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Number of Floors</label>
                      <input
                        type="number"
                        min="1"
                        value={floorCount}
                        onChange={(e) => setFloorCount(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/40 border border-[#0e623a]/20 rounded-xl focus:ring-2 focus:ring-[#0e623a] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Flats per Floor</label>
                      <input
                        type="number"
                        min="1"
                        value={unitsPerFloor}
                        onChange={(e) => setUnitsPerFloor(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/40 border border-[#0e623a]/20 rounded-xl focus:ring-2 focus:ring-[#0e623a] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm border-2 border-[#0e623a]/30 rounded-2xl p-6 space-y-6 text-left animate-fadeIn">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#0e623a] uppercase tracking-wider">Bulk Import Custom Unit Specifications</h4>
                  <p className="text-[11px] text-gray-500">Copy rows directly from your Excel spreadsheet (including Floor, Unit No, BHK/Type, Size/Area, and Sold details) and paste them below.</p>
                </div>

                <div>
                  <textarea
                    rows="4"
                    placeholder="Paste spreadsheet data here (e.g. 1	Lake Breeze	1	1F1	3 BHK	1357		6200...)"
                    value={pastedData}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    className="w-full p-4 bg-white/50 border border-[#0e623a]/25 focus:border-[#0e623a] focus:outline-none focus:ring-1 focus:ring-[#0e623a] rounded-xl text-xs font-mono"
                  />
                </div>

                {parsedUnits.length > 0 && (
                  <div className="space-y-4">
                    {/* Switcher & Actions Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#0e623a]/10 px-4 py-3 rounded-2xl border border-[#0e623a]/20 gap-4">
                      <div>
                        <span className="text-xs font-extrabold text-[#0e623a] block">Parsed Inventory Verification</span>
                        <span className="text-[10px] font-semibold text-gray-600">
                          Total: {parsedUnits.length} units | Land Area: {totalLandArea} sq.ft | Sold: {parsedUnits.filter(u => u.status === 'Sold Out').length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Table/Card Layout Switcher Toggle */}
                        <div className="flex bg-white p-0.5 rounded-xl border border-gray-200 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setImportViewMode('table')}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition ${
                              importViewMode === 'table' ? 'bg-[#0e623a] text-white shadow-sm' : 'text-gray-550 hover:text-gray-800'
                            }`}
                          >
                            <TableIcon className="w-3.5 h-3.5" />
                            <span>Table (Editable)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setImportViewMode('card')}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition ${
                              importViewMode === 'card' ? 'bg-[#0e623a] text-white shadow-sm' : 'text-gray-550 hover:text-gray-800'
                            }`}
                          >
                            <Grid className="w-3.5 h-3.5" />
                            <span>Cards</span>
                          </button>
                        </div>

                        {/* Add Row Button */}
                        <button
                          type="button"
                          onClick={handleAddUnitRow}
                          className="px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-800 transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Row</span>
                        </button>
                      </div>
                    </div>

                    {/* TABLE INITIAL EDITABLE VIEW */}
                    {importViewMode === 'table' ? (
                      <div className="max-h-[420px] overflow-auto border border-gray-200 rounded-2xl shadow-inner bg-white">
                        <table className="w-full text-left border-collapse min-w-[850px]">
                          <thead className="bg-gray-100 border-b text-gray-500 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                            <tr>
                              <th className="p-3 w-28">Unit No</th>
                              <th className="p-3 w-28">Floor</th>
                              <th className="p-3 w-28">Type (BHK)</th>
                              <th className="p-3 w-28">Area (sq.ft)</th>
                              <th className="p-3 w-32">Calculated Price</th>
                              <th className="p-3 w-32">Status</th>
                              <th className="p-3">Remarks</th>
                              <th className="p-3 w-12 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-sans text-xs">
                            {parsedUnits.map((u, index) => (
                              <tr key={index} className="hover:bg-emerald-50/10 transition">
                                <td className="p-2.5">
                                  <input
                                    type="text"
                                    value={u.unitId}
                                    onChange={(e) => handleUpdateUnitField(index, 'unitId', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none font-bold text-gray-850 text-xs"
                                  />
                                </td>
                                <td className="p-2.5">
                                  <input
                                    type="text"
                                    value={u.floor}
                                    placeholder="e.g. Floor 1"
                                    onChange={(e) => handleUpdateUnitField(index, 'floor', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none text-xs"
                                  />
                                </td>
                                <td className="p-2.5">
                                  <input
                                    type="text"
                                    value={u.unitType}
                                    placeholder="e.g. 3 BHK"
                                    onChange={(e) => handleUpdateUnitField(index, 'unitType', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none text-xs"
                                  />
                                </td>
                                <td className="p-2.5">
                                  <input
                                    type="number"
                                    value={u.size || ''}
                                    onChange={(e) => handleUpdateUnitField(index, 'size', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none text-xs font-semibold"
                                  />
                                </td>
                                <td className="p-2.5">
                                  <input
                                    type="number"
                                    value={u.price || ''}
                                    onChange={(e) => handleUpdateUnitField(index, 'price', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none text-xs font-bold text-[#0e623a]"
                                  />
                                </td>
                                <td className="p-2.5">
                                  <select
                                    value={u.status}
                                    onChange={(e) => handleUpdateUnitField(index, 'status', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none text-xs"
                                  >
                                    <option value="New">Available</option>
                                    <option value="Sold Out">Sold Out</option>
                                    <option value="Booked">Booked</option>
                                    <option value="Under Construction">Under Construction</option>
                                  </select>
                                </td>
                                <td className="p-2.5">
                                  <input
                                    type="text"
                                    value={u.remarks}
                                    placeholder="Remarks/Specs"
                                    onChange={(e) => handleUpdateUnitField(index, 'remarks', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-250 rounded focus:ring-1 focus:ring-[#0e623a] focus:outline-none text-xs"
                                  />
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUnitRow(index)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* CARD LAYOUT VIEW */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto p-1">
                        {parsedUnits.map((u, index) => (
                          <div key={index} className="bg-white p-4 border border-gray-200 rounded-2xl shadow-sm hover:shadow transition space-y-3 relative group">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-gray-800 text-sm">{u.unitId || '—'}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                u.status === 'Sold Out'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {u.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] py-2 border-y border-gray-100">
                              <div>
                                <span className="text-gray-400 block uppercase font-bold tracking-wider">Floor</span>
                                <span className="font-semibold text-gray-700">{u.floor || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block uppercase font-bold tracking-wider">Type</span>
                                <span className="font-semibold text-gray-700">{u.unitType || 'N/A'}</span>
                              </div>
                              <div className="mt-1">
                                <span className="text-gray-400 block uppercase font-bold tracking-wider">Size</span>
                                <span className="font-semibold text-gray-700">{u.size.toLocaleString()} sq.ft</span>
                              </div>
                              <div className="mt-1">
                                <span className="text-gray-400 block uppercase font-bold tracking-wider">Price</span>
                                <span className="font-bold text-[#0e623a]">Rs. {u.price.toLocaleString()}</span>
                              </div>
                            </div>

                            {u.remarks && (
                              <p className="text-[10px] text-gray-500 italic truncate" title={u.remarks}>
                                Note: {u.remarks}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteUnitRow(index)}
                              className="absolute top-2 right-2 p-1 bg-red-50 text-red-550 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200 hover:bg-red-100"
                              title="Delete Unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="border-[#0e623a]/20 my-6" />

          {/* Marketing & Promotional Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#0e623a]" />
              <span>Marketing & Promotional Info</span>
            </h3>

            <div className="bg-white/20 backdrop-blur-sm border-2 border-[#0e623a]/30 rounded-2xl p-6 space-y-6">
              {/* Source Type Selection */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Promotional Source / Ad Campaign</label>
                <SearchableSelect
                  options={SOURCE_TYPES}
                  value={sourceType}
                  onChange={setSourceType}
                  placeholder="Select Ad Source / Campaign"
                />
              </div>

              {/* Videos Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Video Ads / Reels</h4>
                  <button
                    type="button"
                    onClick={() => setVideos([...videos, { name: '', link: '', status: 'Active' }])}
                    className="flex items-center gap-1 text-xs font-bold text-[#0e623a] hover:text-[#0b4d2d] transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Video
                  </button>
                </div>

                <div className="space-y-3">
                  {videos.map((vid, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-white/30 p-3 rounded-xl border border-[#0e623a]/10 relative group">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          placeholder="Video Name (e.g. Launch Reel)"
                          value={vid.name}
                          onChange={(e) => {
                            const updated = [...videos];
                            updated[idx].name = e.target.value;
                            setVideos(updated);
                          }}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] transition"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <input
                          type="url"
                          placeholder="Video Link (https://...)"
                          value={vid.link}
                          onChange={(e) => {
                            const updated = [...videos];
                            updated[idx].link = e.target.value;
                            setVideos(updated);
                          }}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] transition"
                        />
                      </div>
                      {videos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setVideos(videos.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-750 p-1.5 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Posters Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Poster / Banner Ads</h4>
                  <button
                    type="button"
                    onClick={() => setPosters([...posters, { name: '', link: '', status: 'Active' }])}
                    className="flex items-center gap-1 text-xs font-bold text-[#0e623a] hover:text-[#0b4d2d] transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Poster
                  </button>
                </div>

                <div className="space-y-3">
                  {posters.map((pos, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-white/30 p-3 rounded-xl border border-[#0e623a]/10 relative group">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          placeholder="Poster Name (e.g. Launch Offer Banner)"
                          value={pos.name}
                          onChange={(e) => {
                            const updated = [...posters];
                            updated[idx].name = e.target.value;
                            setPosters(updated);
                          }}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] transition"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <input
                          type="url"
                          placeholder="Poster Link (https://...)"
                          value={pos.link}
                          onChange={(e) => {
                            const updated = [...posters];
                            updated[idx].link = e.target.value;
                            setPosters(updated);
                          }}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] transition"
                        />
                      </div>
                      {posters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPosters(posters.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-755 p-1.5 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#0e623a] text-white font-bold rounded-xl shadow-lg hover:bg-[#0b4d2d] hover:shadow-xl transition disabled:opacity-50"
            >
              {loading ? 'Creating Project & Running Generators...' : 'Register Project & Generate Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterProject;
