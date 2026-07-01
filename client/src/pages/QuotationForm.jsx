import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  FileText, 
  ArrowLeft, 
  Building, 
  Building2, 
  Home, 
  User, 
  Phone, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const QuotationForm = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // For Edit
  const [searchParams] = useSearchParams();
  const leadIdQuery = searchParams.get('leadId'); // For Create

  const isEdit = !!id;

  // General States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectDetails, setProjectDetails] = useState(null);

  // Form Fields State
  const [leadId, setLeadId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [projectType, setProjectType] = useState('Plot');
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [pricePerSqFt, setPricePerSqFt] = useState(0);
  const [totalArea, setTotalArea] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  
  const [alternativePhone, setAlternativePhone] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankLoanRequired, setBankLoanRequired] = useState('No');
  const [loanAmount, setLoanAmount] = useState(0);
  const [preferredBank, setPreferredBank] = useState('');

  // Fetch initial data
  useEffect(() => {
    if (isEdit) {
      fetchQuotationForEdit();
    } else if (leadIdQuery) {
      fetchLeadForCreate(leadIdQuery);
    } else {
      setError('Lead ID parameter or Quotation ID is required to access this wizard.');
      setLoading(false);
    }
  }, [id, leadIdQuery, token]);

  const fetchQuotationForEdit = async () => {
    try {
      const res = await fetch(`${API_URL}/quotations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeadId(data.lead?._id || data.lead);
        setProjectId(data.project?._id || data.project);
        setCustomerName(data.customerName);
        setCustomerPhone(data.customerPhone);
        setCustomerAddress(data.customerAddress);
        setProjectType(data.projectType);
        setSelectedUnits(data.selectedUnits);
        setPricePerSqFt(data.pricePerSqFt);
        setTotalArea(data.totalArea);
        setTotalValue(data.totalValue);
        setAlternativePhone(data.alternativePhone || '');
        setAadharNumber(data.aadharNumber || '');
        setPanNumber(data.panNumber || '');
        setBankLoanRequired(data.bankLoanRequired || 'No');
        setLoanAmount(data.loanAmount || 0);
        setPreferredBank(data.preferredBank || '');

        // Fetch project metadata to show available layouts
        const projRes = await fetch(`${API_URL}/projects/${data.project?._id || data.project}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjectDetails(projData);
        }
      } else {
        setError('Failed to load quotation for editing');
      }
    } catch (err) {
      setError('Network error loading quotation info');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadForCreate = async (lId) => {
    try {
      const res = await fetch(`${API_URL}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const leads = await res.json();
        const lead = leads.find(l => l._id === lId);
        if (lead) {
          setLeadId(lead._id);
          const pId = lead.project?._id || lead.project;
          setProjectId(pId);
          setCustomerName(lead.name);
          setCustomerPhone(lead.phone);
          setCustomerAddress(lead.address || '');
          setBankLoanRequired(lead.bankLoan || 'No');
          
          // Prepopulate booking info if exists
          if (lead.bookingInfo) {
            setAlternativePhone(lead.bookingInfo.alternativePhone || '');
            setAadharNumber(lead.bookingInfo.aadharNumber || '');
            setPanNumber(lead.bookingInfo.panNumber || '');
            setBankLoanRequired(lead.bookingInfo.hasLoan || lead.bankLoan || 'No');
            if (lead.bookingInfo.loanDetails) {
              setLoanAmount(lead.bookingInfo.loanDetails.amountRequired || 0);
              setPreferredBank(lead.bookingInfo.loanDetails.preferredBank || '');
            }
          }

          // Fetch Project layouts
          const projRes = await fetch(`${API_URL}/projects/${pId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (projRes.ok) {
            const projData = await projRes.json();
            setProjectDetails(projData);
            setProjectType(Array.isArray(projData.projectType) ? (projData.projectType[0] || 'Plot') : (projData.projectType || 'Plot'));
            setPricePerSqFt(projData.pricePerSqFt || 0);
          }
        } else {
          setError('Specified Lead record not found');
        }
      } else {
        setError('Failed to fetch leads library');
      }
    } catch (err) {
      setError('Connection error prepopulating lead details');
    } finally {
      setLoading(false);
    }
  };

  // Recalculate total square feet area when selected units change
  useEffect(() => {
    if (!projectDetails || !projectDetails.units) return;
    const units = projectDetails.units.filter(u => selectedUnits.includes(u.unitId));
    const area = units.reduce((sum, u) => sum + (u.size || 0), 0);
    setTotalArea(Number(area.toFixed(2)));
    
    // Only auto-update totalValue if we aren't editing, or if value was 0
    if (!isEdit || totalValue === 0) {
      const calculatedValuation = units.reduce((sum, u) => sum + (u.price || 0), 0);
      setTotalValue(Number(calculatedValuation.toFixed(2)));
    }
  }, [selectedUnits, projectDetails]);

  // Auto-calculate Total Valuation when totalArea or pricePerSqFt changes
  useEffect(() => {
    const val = Number(totalArea) * Number(pricePerSqFt);
    if (!isNaN(val)) {
      setTotalValue(Number(val.toFixed(2)));
    }
  }, [totalArea, pricePerSqFt]);

  const toggleUnitSelection = (unitId) => {
    if (selectedUnits.includes(unitId)) {
      setSelectedUnits(selectedUnits.filter(id => id !== unitId));
    } else {
      setSelectedUnits([...selectedUnits, unitId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUnits.length === 0) {
      alert('Please select at least one plot/flat/house unit to construct the quotation!');
      return;
    }

    const payload = {
      lead: leadId,
      project: projectId,
      customerName,
      customerPhone,
      customerAddress,
      projectType,
      selectedUnits,
      pricePerSqFt,
      totalArea,
      totalValue: Number(totalValue),
      alternativePhone,
      aadharNumber,
      panNumber,
      bankLoanRequired,
      loanAmount: Number(loanAmount),
      preferredBank
    };

    try {
      const method = isEdit ? 'PUT' : 'POST';
      const endpoint = isEdit ? `${API_URL}/quotations/${id}` : `${API_URL}/quotations`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Automatically advance the Lead status to the specified target status (e.g. Booking) or default to Negotiation
        if (!isEdit) {
          const targetStatus = searchParams.get('targetStatus') || 'Negotiation';
          const leadPayload = { status: targetStatus };
          if (targetStatus === 'Booking') {
            leadPayload.bookingInfo = {
              selectedUnits,
              alternativePhone,
              aadharNumber,
              panNumber,
              hasLoan: bankLoanRequired,
              loanDetails: {
                amountRequired: Number(loanAmount),
                preferredBank,
                loanStatus: 'Initiated'
              }
            };
          }
          await fetch(`${API_URL}/leads/${leadId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leadPayload)
          });
        }
        navigate('/quotations');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to submit quotation request');
      }
    } catch (err) {
      setError('Connection error saving quotation');
    }
  };

  const projectTypesArray = projectDetails?.projectType
    ? (Array.isArray(projectDetails.projectType) ? projectDetails.projectType : [projectDetails.projectType])
    : ['Plot'];

  const getFilteredUnits = (type) => {
    if (!projectDetails || !projectDetails.units) return [];
    if (projectTypesArray.length === 1) {
      return projectDetails.units;
    }
    if (type === 'Flat') {
      return projectDetails.units.filter(u => u.unitType === 'Flat' || u.unitType?.includes('BHK') || (!u.unitType && !projectTypesArray.includes('Plot') && !projectTypesArray.includes('House')));
    }
    if (type === 'Plot') {
      return projectDetails.units.filter(u => u.unitType === 'Plot' || (!u.unitType && (projectTypesArray.includes('Plot') || projectTypesArray.length === 0)));
    }
    if (type === 'House') {
      return projectDetails.units.filter(u => u.unitType === 'House' || u.unitType === 'Villa' || u.unitType?.includes('BHK'));
    }
    return projectDetails.units.filter(u => u.unitType === type);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Breadcrumb Header Bar */}
      <div className="flex items-center justify-between bg-white border border-gray-150 p-4 rounded-3xl shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {isEdit ? 'Update Quotation Draft' : 'Construct New Estimate Quote'}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading form variables and configurations...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Customer Details Header */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-800 border-b pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0e623a]" />
              <span>Customer Information</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Client / Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold text-gray-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-4 py-2.5 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Address</label>
              <textarea
                rows="2"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Street address details..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs text-gray-700"
              />
            </div>
          </div>

          {/* Section 2: Selected Project Metadata */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-800 border-b pb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0e623a]" />
              <span>Project Details</span>
            </h3>
            
            {projectDetails ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Project Name</span>
                  <span className="font-bold text-gray-800 mt-1 block">{projectDetails.name}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Project Code</span>
                  <span className="font-bold text-gray-800 mt-1 block">{projectDetails.code}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Base Rate Sq.Ft</span>
                  <span className="font-bold text-emerald-700 mt-1 block">Rs. {projectDetails.pricePerSqFt}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-red-500">Loading project configuration...</div>
            )}
          </div>

          {/* Section 3: Visual Unit Selector Layout */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0e623a]" />
                <span>Select Available {projectType}(s)</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 text-[#0e623a] border border-[#bce2cb] font-bold px-2 py-0.5 rounded-full">
                {selectedUnits.length} Selected
              </span>
            </div>

            {projectDetails ? (() => {
              const projectTypesArray = projectDetails.projectType
                ? (Array.isArray(projectDetails.projectType) ? projectDetails.projectType : [projectDetails.projectType])
                : ['Plot'];

              return (
                <div className="space-y-6">
                  {/* Tabs for Hybrid Projects */}
                  {projectTypesArray.length > 1 && (
                    <div className="flex bg-gray-100/60 p-1.5 rounded-2xl gap-1.5 w-fit mb-4">
                      {projectTypesArray.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setProjectType(type)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                            projectType === type
                              ? 'bg-[#0e623a] text-white shadow-sm'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {type === 'Plot' ? 'Plots' : type === 'House' ? 'Houses' : 'Flats'}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Real Layout Plan Map Image if configured */}
                  {projectDetails.layoutPlanImage && (
                    <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-full md:w-1/2 rounded-xl overflow-hidden border border-gray-250 bg-white relative inline-block">
                        <img 
                          src={projectDetails.layoutPlanImage} 
                          alt={`${projectDetails.name} Layout Plan`} 
                          className="w-full h-auto object-contain max-h-[300px]"
                        />
                        
                        {/* Interactive pins (filtered to current type selected in tabs) */}
                        {getFilteredUnits(projectType).map((u, idx) => {
                          if (!u.mapCoordinates) return null;
                          const isSelected = selectedUnits.includes(u.unitId);
                          const isBooked = u.status === 'Booked' || u.status === 'Sold Out';
                          
                          const pinColor = isBooked 
                            ? 'bg-yellow-400 border-yellow-600' 
                            : isSelected 
                            ? 'bg-[#0e623a] border-emerald-300 ring-2 ring-emerald-200 scale-125' 
                            : 'bg-emerald-500 border-white hover:scale-120';

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isBooked}
                              onClick={() => toggleUnitSelection(u.unitId)}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center shadow-lg transition duration-150 ${pinColor} cursor-pointer z-10`}
                              style={{ left: `${u.mapCoordinates.x}%`, top: `${u.mapCoordinates.y}%` }}
                              title={`Unit ${u.unitId} (${u.status})`}
                            >
                              <span className="text-[7.5px] text-white font-extrabold">{u.unitId.split('-').pop()}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex-1 space-y-2 text-xs text-gray-555 leading-relaxed text-left">
                        <h4 className="font-extrabold text-gray-800 text-sm">Interactive Project Map</h4>
                        <p>You can click directly on the unit pins on the layout map to select them, or use the selection grid below. Available units are shown in green, selected in dark green, and booked/sold in yellow.</p>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <span className="flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded bg-[#0e623a]"></span>Selected</span>
                          <span className="flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded bg-yellow-400"></span>Booked / Sold</span>
                          <span className="flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded bg-[#10b981]"></span>Available</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Plots Grid */}
                  {projectType === 'Plot' && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {getFilteredUnits('Plot').map(u => {
                        const isSelected = selectedUnits.includes(u.unitId);
                        const isBooked = u.status === 'Booked' || u.status === 'Sold Out';
                        return (
                          <button
                            key={u.unitId}
                            type="button"
                            disabled={isBooked}
                            onClick={() => toggleUnitSelection(u.unitId)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center relative transition min-h-[75px] cursor-pointer ${
                              isBooked
                                ? 'bg-yellow-100 border-yellow-300 text-yellow-800 cursor-not-allowed opacity-90 font-bold'
                                : isSelected
                                ? 'bg-[#0e623a] border-[#0a4d2c] text-white shadow-md font-bold scale-105 ring-2 ring-emerald-300'
                                : 'bg-gradient-to-br from-emerald-50 to-green-150 hover:from-emerald-100 hover:to-green-200 border-emerald-250 text-emerald-800 hover:scale-102'
                            }`}
                          >
                            <div className="text-[9px] uppercase font-semibold text-gray-400">Plot</div>
                            <div className="text-xs font-bold">{u.unitId}</div>
                            <div className="text-[9px] mt-0.5 opacity-80">{Number(u.size).toFixed(2)} Sq.Ft</div>
                            {isSelected && (
                              <span className="absolute top-1 right-1 bg-white text-emerald-800 rounded-full p-0.5 shadow-sm">
                                <Check className="w-2.5 h-2.5 font-bold" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Flats grouped by Floors */}
                  {projectType === 'Flat' && (
                    <div className="space-y-4">
                      {Array.from(new Set(getFilteredUnits('Flat').map(u => u.floor || 'G') || [])).sort().map(floor => (
                        <div key={floor} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-150 space-y-2">
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Floor: {floor}</h5>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {getFilteredUnits('Flat').filter(u => (u.floor || 'G') === floor).map(u => {
                              const isSelected = selectedUnits.includes(u.unitId);
                              const isBooked = u.status === 'Booked' || u.status === 'Sold Out';
                              return (
                                <button
                                  key={u.unitId}
                                  type="button"
                                  disabled={isBooked}
                                  onClick={() => toggleUnitSelection(u.unitId)}
                                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center relative transition cursor-pointer ${
                                    isBooked
                                      ? 'bg-yellow-100 border-yellow-300 text-yellow-800 cursor-not-allowed opacity-90 font-bold'
                                      : isSelected
                                      ? 'bg-[#0e623a] border-[#0a4d2c] text-white shadow-md font-bold scale-105 ring-2 ring-emerald-300'
                                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                                  }`}
                                >
                                  <Building2 className={`w-4 h-4 mb-0.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                                  <div className="text-xs font-bold">{u.unitId}</div>
                                  <div className="text-[9px] mt-0.5 opacity-80">{Number(u.size).toFixed(2)} Sq.Ft</div>
                                  {isSelected && (
                                    <span className="absolute top-1 right-1 bg-white text-[#0e623a] rounded-full p-0.5">
                                      <Check className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Houses Layout */}
                  {projectType === 'House' && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-5 pt-2 justify-center w-full max-w-[1120px] mx-auto">
                      {getFilteredUnits('House').map(u => {
                        const isSelected = selectedUnits.includes(u.unitId);
                        const isBooked = u.status === 'Booked';
                        const isSold = u.status === 'Sold Out';
                        
                        let bgClass = 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-white shadow-[0_3px_8px_rgba(16,185,129,0.15)] hover:shadow-[0_6px_15px_rgba(16,185,129,0.3)] hover:-translate-y-1 hover:scale-105';
                        if (isSold) {
                          bgClass = 'bg-gradient-to-br from-red-500 to-rose-600 border-red-400 text-white shadow-[0_3px_8px_rgba(239,68,68,0.15)] cursor-not-allowed opacity-90';
                        } else if (isBooked) {
                          bgClass = 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 text-white shadow-[0_3px_8px_rgba(245,158,11,0.15)] cursor-not-allowed opacity-90';
                        } else if (isSelected) {
                          bgClass = 'bg-[#0e623a] border-[#0a4d2c] text-white shadow-md font-bold scale-105 ring-2 ring-emerald-300';
                        }
                        
                        return (
                          <button
                            key={u.unitId}
                            type="button"
                            disabled={isSold || isBooked}
                            onClick={() => toggleUnitSelection(u.unitId)}
                            className={`w-[90px] h-[90px] flex flex-col items-center justify-center rounded-2xl text-[13px] font-black tracking-wide border transition-all duration-200 active:scale-95 cursor-pointer gap-1 ${bgClass}`}
                          >
                            <Home className="w-5 h-5 opacity-90" />
                            <span className="leading-none">{u.unitId}</span>
                            {isBooked ? (
                              <span className="text-[8px] font-extrabold uppercase bg-black/20 px-1 rounded truncate max-w-[80px] text-center" title={u.customerName}>
                                {u.customerName || 'Booked'}
                              </span>
                            ) : isSold ? (
                              <span className="text-[8.5px] font-extrabold uppercase bg-black/20 px-1 rounded">Sold</span>
                            ) : (
                              <span className="text-[9.5px] font-bold opacity-85">{u.unitType || 'House'}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()
            : (
              <div className="p-4 text-center text-xs text-gray-400">Loading units layout plans...</div>
            )}
          </div>

          {/* Section 4: Valuation & Price Calculator Form */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-800 border-b pb-2">Valuation Estimates</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Total Area (Sq.Ft)</label>
                <input
                  type="number"
                  disabled
                  value={totalArea ? Number(totalArea).toFixed(2) : ''}
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Rate Per Sq.Ft (Rs)</label>
                <input
                  type="number"
                  value={pricePerSqFt}
                  onChange={(e) => setPricePerSqFt(e.target.value)}
                  onBlur={() => setPricePerSqFt(prev => prev ? Number(Number(prev).toFixed(2)) : 0)}
                  className="w-full px-4 py-2.5 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-gray-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1.5">Total Valuation / Quote Value (Rs)</label>
                <input
                  type="number"
                  required
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  onBlur={() => setTotalValue(prev => prev ? Number(Number(prev).toFixed(2)) : 0)}
                  className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-xs font-bold"
                />
                <span className="text-[9px] text-gray-400 mt-1 block">
                  * This field is fully editable. You can adjust the total valuation value manually.
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Additional Info & Bank Loan */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-800 border-b pb-2">Financial & ID Credentials</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Alternative Contact No</label>
                <input
                  type="text"
                  value={alternativePhone}
                  onChange={(e) => setAlternativePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold text-gray-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Aadhar Number</label>
                <input
                  type="text"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold text-gray-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">PAN Card Number</label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-semibold text-gray-700"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Requires Bank Loan?</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="bankLoanRequired"
                    value="Yes"
                    checked={bankLoanRequired === 'Yes'}
                    onChange={() => setBankLoanRequired('Yes')}
                    className="text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="bankLoanRequired"
                    value="No"
                    checked={bankLoanRequired === 'No'}
                    onChange={() => setBankLoanRequired('No')}
                    className="text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                  />
                  <span>No</span>
                </label>
              </div>

              {bankLoanRequired === 'Yes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Loan Amount Requested (Rs)</label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Preferred Bank</label>
                    <input
                      type="text"
                      value={preferredBank}
                      onChange={(e) => setPreferredBank(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center gap-4 bg-white border border-gray-150 p-4 rounded-3xl shadow-sm">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition shadow-md cursor-pointer"
            >
              {isEdit ? 'Save Quotation Changes' : 'Confirm & Save Quotation'}
            </button>
          </div>

        </form>
      )}
    </div>
  );
};

export default QuotationForm;
