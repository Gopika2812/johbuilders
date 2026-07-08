import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  User, 
  Building, 
  Calendar, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronDown,
  SlidersHorizontal,
  FileText,
  UserPlus,
  Home,
  Check,
  DollarSign,
  Building2,
  CalendarClock,
  FileSpreadsheet,
  X
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

const LEAD_STATUSES = [
  'New',
  'Assigned',
  'Contacted',
  'Follow-Up',
  'Site Visit',
  'Site Visit Follow-up',
  'Qualified',
  'Negotiation',
  'Booking',
  'Won',
  'Lost'
];

const STATUS_COLORS = {
  'New': { bg: 'bg-blue-50/70', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  'Assigned': { bg: 'bg-purple-50/70', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  'Contacted': { bg: 'bg-indigo-50/70', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  'Follow-Up': { bg: 'bg-amber-50/70', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Site Visit': { bg: 'bg-rose-50/70', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  'Site Visit Follow-up': { bg: 'bg-pink-50/70', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  'Qualified': { bg: 'bg-teal-50/70', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  'Negotiation': { bg: 'bg-orange-50/70', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  'Booking': { bg: 'bg-yellow-50/70', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  'Won': { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Lost': { bg: 'bg-gray-100', text: 'text-gray-750', border: 'border-gray-300', dot: 'bg-gray-500' },
};

const getPreviousStatus = (lead) => {
  if (!lead.history || lead.history.length < 2) return null;
  // Iterate backward to find the first transition that is different from current status
  for (let i = lead.history.length - 2; i >= 0; i--) {
    if (lead.history[i].status && lead.history[i].status !== lead.status) {
      return lead.history[i].status;
    }
  }
  return null;
};

const parsePhoneDetails = (fullPhone) => {
  if (!fullPhone) return { countryCode: '+91', localPhone: '' };
  const commonCodes = ['+91', '+971', '+44', '+1', '+966', '+965', '+973', '+968', '+974', '+65', '+61'];
  for (const code of commonCodes) {
    if (fullPhone.startsWith(code)) {
      return { countryCode: code, localPhone: fullPhone.slice(code.length) };
    }
  }
  if (fullPhone.startsWith('+')) {
    return { countryCode: '+', localPhone: fullPhone.slice(1) };
  }
  return { countryCode: '+91', localPhone: fullPhone };
};

const validatePhone = (countryCode, localPhone, fieldName = 'Phone number') => {
  if (!localPhone) return `${fieldName} is required!`;
  if (countryCode === '+91' && localPhone.length !== 10) {
    return 'Indian phone number must be exactly 10 digits!';
  }
  if (countryCode === '+1' && localPhone.length !== 10) {
    return 'US/Canada phone number must be exactly 10 digits!';
  }
  if (countryCode === '+971' && localPhone.length !== 9) {
    return 'UAE phone number must be exactly 9 digits!';
  }
  if (countryCode === '+44' && (localPhone.length < 10 || localPhone.length > 11)) {
    return 'UK phone number must be 10 or 11 digits!';
  }
  if (countryCode === '+966' && localPhone.length !== 9) {
    return 'KSA phone number must be exactly 9 digits!';
  }
  if (localPhone.length < 7) {
    return `${fieldName} must have at least 7 digits!`;
  }
  return null;
};

const handleLocalPhoneChange = (val, countryCode, setter) => {
  const digits = val.replace(/\D/g, '');
  if (countryCode === '+91' || countryCode === '+1') {
    setter(digits.slice(0, 10));
  } else if (countryCode === '+971') {
    setter(digits.slice(0, 9));
  } else if (countryCode === '+44') {
    setter(digits.slice(0, 11));
  } else if (countryCode === '+966') {
    setter(digits.slice(0, 9));
  } else {
    setter(digits.slice(0, 15));
  }
};

const LeadsDirectory = () => {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering / Search States
  const [activeTab, setActiveTab] = useState('All'); // 'All' or specific status
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [bankLoanFilter, setBankLoanFilter] = useState('');
  const [reopenedFilter, setReopenedFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Sync activeTab with URL search params status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    if (statusParam) {
      const matchedStatus = LEAD_STATUSES.find(s => s.toLowerCase() === statusParam.toLowerCase());
      if (matchedStatus) {
        setActiveTab(matchedStatus);
      }
    } else {
      setActiveTab('All');
    }
  }, [location.search]);

  // Create Lead Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [leadType, setLeadType] = useState('Lead'); // 'Lead' | 'Direct Visit'
  const [name, setName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [createPhoneErr, setCreatePhoneErr] = useState('');
  const [editPhoneErr, setEditPhoneErr] = useState('');
  const [bookingAltPhoneErr, setBookingAltPhoneErr] = useState('');
  const [address, setAddress] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  
  // Lead-specific fields
  const [leadSource, setLeadSource] = useState('');
  const [activeAds, setActiveAds] = useState([]); // List of active ads from selected project
  const [selectedAdId, setSelectedAdId] = useState('');
  const [fetchedAdLink, setFetchedAdLink] = useState('');

  // Direct Visit-specific fields
  const [projectLocation, setProjectLocation] = useState('');
  const [locations, setLocations] = useState([]); // Unique project locations
  const [bankLoan, setBankLoan] = useState('No');
  const [leadCost, setLeadCost] = useState('0');

  // Edit Lead Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState('+91');
  const [editPhoneLocal, setEditPhoneLocal] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLeadType, setEditLeadType] = useState('Lead');
  const [editProjectId, setEditProjectId] = useState('');
  const [editAssignedToId, setEditAssignedToId] = useState('');
  const [editLeadSource, setEditLeadSource] = useState('');
  const [editAdId, setEditAdId] = useState('');
  const [editBankLoan, setEditBankLoan] = useState('No');
  const [editLeadCost, setEditLeadCost] = useState('0');
  const [editProjectLocation, setEditProjectLocation] = useState('');
  const [editActiveAds, setEditActiveAds] = useState([]);
  const [editStatus, setEditStatus] = useState('New');

  // Booking & Quotation Modal States
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedLeadForBooking, setSelectedLeadForBooking] = useState(null);
  const [bookingProjectDetails, setBookingProjectDetails] = useState(null);
  const [selectedBookingUnits, setSelectedBookingUnits] = useState([]);
  const [bookingAltCountryCode, setBookingAltCountryCode] = useState('+91');
  const [bookingAltLocal, setBookingAltLocal] = useState('');
  const [bookingAadhar, setBookingAadhar] = useState('');
  const [bookingPan, setBookingPan] = useState('');
  const [bookingHasLoan, setBookingHasLoan] = useState('No');
  const [loanAmount, setLoanAmount] = useState(0);
  const [loanBank, setLoanBank] = useState('');
  const [loanStatusNotes, setLoanStatusNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Follow-Up & Completion Modal States
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [selectedLeadForFollow, setSelectedLeadForFollow] = useState(null);
  const [followTargetStatus, setFollowTargetStatus] = useState('Follow-Up');
  const [followMode, setFollowMode] = useState('FollowUp'); // 'FollowUp' | 'Completed'
  const [nextFollowDate, setNextFollowDate] = useState('');
  const [followThrough, setFollowThrough] = useState('Call');
  const [followRemarks, setFollowRemarks] = useState('');
  const [closeRemarks, setCloseRemarks] = useState('');
  const [siteVisitAction, setSiteVisitAction] = useState('Keep'); // 'Keep' | 'Move'

  // History Popover State
  const [selectedLeadForHistory, setSelectedLeadForHistory] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Duplicate Check Warning State
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Custom Dropdown Open State
  const [openDropdownLeadId, setOpenDropdownLeadId] = useState(null);

  // Custom Quotation Check Modal State
  const [qtnConfirmOpen, setQtnConfirmOpen] = useState(false);
  const [pendingLeadForBooking, setPendingLeadForBooking] = useState(null);

  useEffect(() => {
    fetchLeads();
    fetchProjects();
    fetchEmployees();
    fetchQuotations();
  }, [token]);

  // Update active ads dropdown when project changes
  useEffect(() => {
    if (leadType === 'Lead' && selectedProjectId) {
      const proj = projects.find(p => p._id === selectedProjectId);
      if (proj && proj.marketingInfo) {
        const adsList = [];
        if (proj.marketingInfo.videos) {
          proj.marketingInfo.videos
            .filter(v => v.status === 'Active')
            .forEach(v => adsList.push({ id: v._id, name: v.name, link: v.link, type: 'Video', cost: v.cost || 0 }));
        }
        if (proj.marketingInfo.posters) {
          proj.marketingInfo.posters
            .filter(p => p.status === 'Active')
            .forEach(p => adsList.push({ id: p._id, name: p.name, link: p.link, type: 'Poster', cost: p.cost || 0 }));
        }
        setActiveAds(adsList);
      } else {
        setActiveAds([]);
      }
      setSelectedAdId('');
      setFetchedAdLink('');
    }
  }, [selectedProjectId, leadType, projects]);

  // Update link and cost when ad changes
  useEffect(() => {
    if (selectedAdId) {
      const ad = activeAds.find(a => a.id === selectedAdId);
      if (ad) {
        setFetchedAdLink(ad.link);
        setLeadCost(String(ad.cost || 0));
      } else {
        setFetchedAdLink('');
      }
    } else {
      setFetchedAdLink('');
    }
  }, [selectedAdId, activeAds]);

  // Update edit-active ads dropdown when edit project changes
  useEffect(() => {
    if (editLeadType === 'Lead' && editProjectId) {
      const proj = projects.find(p => p._id === editProjectId);
      if (proj && proj.marketingInfo) {
        const adsList = [];
        if (proj.marketingInfo.videos) {
          proj.marketingInfo.videos
            .filter(v => v.status === 'Active')
            .forEach(v => adsList.push({ id: v._id, name: v.name, link: v.link, type: 'Video', cost: v.cost || 0 }));
        }
        if (proj.marketingInfo.posters) {
          proj.marketingInfo.posters
            .filter(p => p.status === 'Active')
            .forEach(p => adsList.push({ id: p._id, name: p.name, link: p.link, type: 'Poster', cost: p.cost || 0 }));
        }
        setEditActiveAds(adsList);
      } else {
        setEditActiveAds([]);
      }
    }
  }, [editProjectId, editLeadType, projects]);

  // Update edit-ad link and cost when edit ad changes
  useEffect(() => {
    if (editAdId) {
      const ad = editActiveAds.find(a => a.id === editAdId);
      if (ad) {
        setEditLeadCost(String(ad.cost || 0));
      }
    }
  }, [editAdId, editActiveAds]);

  const handleOpenEditModal = (lead) => {
    setSelectedLeadForEdit(lead);
    setEditName(lead.name || '');
    const parsed = parsePhoneDetails(lead.phone || '');
    setEditPhoneCountryCode(parsed.countryCode);
    setEditPhoneLocal(parsed.localPhone);
    setEditAddress(lead.address || '');
    setEditLeadType(lead.leadType || 'Lead');
    setEditProjectId(lead.project?._id || lead.project || '');
    setEditAssignedToId(lead.assignedTo?._id || lead.assignedTo || '');
    setEditStatus(lead.status || 'New');
    setEditLeadSource(lead.leadSource || '');
    setEditBankLoan(lead.bankLoan || 'No');
    setEditLeadCost(String(lead.leadCost || '0'));
    setEditProjectLocation(lead.projectLocation || '');

    // Prepopulate ad id if matches ad name
    const proj = projects.find(p => p._id === (lead.project?._id || lead.project));
    let adId = '';
    if (proj && proj.marketingInfo && lead.activeAd?.name) {
      const allAds = [
        ...(proj.marketingInfo.videos || []),
        ...(proj.marketingInfo.posters || [])
      ];
      const matchedAd = allAds.find(a => a.name === lead.activeAd.name);
      if (matchedAd) adId = matchedAd._id;
    }
    setEditAdId(adId);
    setEditModalOpen(true);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const phoneError = validatePhone(editPhoneCountryCode, editPhoneLocal, 'Phone number');
    if (phoneError) {
      setError(phoneError);
      return;
    }
    const editPhone = editPhoneCountryCode === '+' ? `+${editPhoneLocal}` : `${editPhoneCountryCode}${editPhoneLocal}`;

    const adObj = editAdId ? editActiveAds.find(a => a.id === editAdId) : null;
    const isStatusChanged = editStatus !== selectedLeadForEdit.status;

    const payload = {
      leadType: editLeadType,
      name: editName,
      phone: editPhone,
      address: editAddress,
      bankLoan: editBankLoan,
      project: editProjectId || undefined,
      assignedTo: editAssignedToId || '',
      status: isStatusChanged ? selectedLeadForEdit.status : editStatus,
      leadCost: Number(editLeadCost) || 0,
      leadSource: editLeadSource,
      activeAd: editLeadType === 'Lead' && adObj ? { name: adObj.name, link: adObj.link } : { name: '', link: '' }
    };

    try {
      const res = await fetch(`${API_URL}/leads/${selectedLeadForEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg('Lead updated successfully!');
        setEditModalOpen(false);
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 3000);

        if (isStatusChanged) {
          handleStatusChange(selectedLeadForEdit._id, editStatus);
        }
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update lead');
      }
    } catch (err) {
      setError('Error updating lead');
    }
  };

  const handleDeleteLead = async (leadId, leadName) => {
    if (!window.confirm(`Are you sure you want to permanently delete lead "${leadName}"?`)) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSuccessMsg('Lead deleted successfully!');
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete lead');
      }
    } catch (err) {
      setError('Connection error deleting lead record');
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_URL}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      } else {
        setError('Failed to fetch leads directory');
      }
    } catch (err) {
      setError('Connection error loading leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        // Extract unique locations
        const locs = Array.from(new Set(data.map(p => p.location))).filter(Boolean);
        setLocations(locs);
      }
    } catch (err) {}
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Only show approved employees
        setEmployees(data.filter(emp => emp.isApproved));
      }
    } catch (err) {}
  };

  const fetchQuotations = async () => {
    try {
      const res = await fetch(`${API_URL}/quotations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuotations(data);
      }
    } catch (err) {}
  };

  const handlePhoneBlur = async () => {
    if (!phoneLocal) {
      setCreatePhoneErr('Phone number is required!');
      return;
    }
    const validationErr = validatePhone(phoneCountryCode, phoneLocal, 'Phone number');
    if (validationErr) {
      setCreatePhoneErr(validationErr);
      return;
    }
    setCreatePhoneErr('');
    const phone = phoneCountryCode === '+' ? `+${phoneLocal}` : `${phoneCountryCode}${phoneLocal}`;
    try {
      const res = await fetch(`${API_URL}/leads/phone/${phone}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const existingLead = await res.json();
        if (existingLead) {
          setDuplicateWarning(existingLead);
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch (err) {}
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const phoneError = validatePhone(phoneCountryCode, phoneLocal, 'Phone number');
    if (phoneError) {
      setCreatePhoneErr(phoneError);
      setError(phoneError);
      return;
    }
    setCreatePhoneErr('');
    const phone = phoneCountryCode === '+' ? `+${phoneLocal}` : `${phoneCountryCode}${phoneLocal}`;

    const adObj = selectedAdId ? activeAds.find(a => a.id === selectedAdId) : null;

    const payload = {
      leadType,
      name,
      phone,
      address,
      bankLoan,
      project: selectedProjectId,
      assignedTo: (user?.role === 'Admin' || user?.role === 'Manager') ? assignedToId : user?._id,
      leadCost: Number(leadCost) || 0,
      leadSource: leadSource,
      activeAd: leadType === 'Lead' && adObj ? { name: adObj.name, link: adObj.link } : undefined
    };

    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        setCreateModalOpen(false);
        resetForm();
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to submit lead registration');
      }
    } catch (err) {
      setError('Connection error saving lead record');
    }
  };

  const initiateBooking = async (lead) => {
    setSelectedLeadForBooking(lead);
    setBookingLoading(true);
    setBookingModalOpen(true);
    
    // Prepopulate base fields
    const parsed = parsePhoneDetails(lead.bookingInfo?.alternativePhone || '');
    setBookingAltCountryCode(parsed.countryCode);
    setBookingAltLocal(parsed.localPhone);
    setBookingAadhar('');
    setBookingPan('');
    setBookingHasLoan(lead.bankLoan || 'No');
    setLoanAmount(0);
    setLoanBank('');
    setLoanStatusNotes('');
    setSelectedBookingUnits([]);

    try {
      const projId = lead.project?._id || lead.project;
      const res = await fetch(`${API_URL}/projects/${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookingProjectDetails(data);
      }
    } catch (err) {
      setError('Failed to load project details for booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (selectedBookingUnits.length === 0) {
      alert('Please select at least one unit (plot/flat/villa) to confirm booking!');
      return;
    }

    if (bookingAltLocal) {
      const phoneError = validatePhone(bookingAltCountryCode, bookingAltLocal, 'Alternative Contact');
      if (phoneError) {
        alert(phoneError);
        return;
      }
    }
    const bookingAltPhone = bookingAltLocal ? (bookingAltCountryCode === '+' ? `+${bookingAltLocal}` : `${bookingAltCountryCode}${bookingAltLocal}`) : '';
    
    const payload = {
      status: 'Booking',
      bookingInfo: {
        selectedUnits: selectedBookingUnits,
        alternativePhone: bookingAltPhone,
        aadharNumber: bookingAadhar,
        panNumber: bookingPan,
        hasLoan: bookingHasLoan,
        loanDetails: {
          amountRequired: Number(loanAmount),
          preferredBank: loanBank,
          loanStatus: loanStatusNotes || 'Initiated'
        }
      }
    };

    try {
      const res = await fetch(`${API_URL}/leads/${selectedLeadForBooking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setBookingModalOpen(false);
        setSuccessMsg('Booking registered successfully & Quotation Generated!');
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to complete booking');
      }
    } catch (err) {
      setError('Network error saving booking details');
    }
  };

  const initiateFollowUpOrComplete = (lead, targetStatus) => {
    setSelectedLeadForFollow(lead);
    setFollowTargetStatus(targetStatus);
    
    const hasFollowUp = ['Contacted', 'Follow-Up', 'Site Visit', 'Qualified', 'Negotiation'].includes(targetStatus);
    setFollowMode(hasFollowUp ? 'FollowUp' : 'Completed');
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setNextFollowDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    setFollowThrough('Call');
    setFollowRemarks('');
    setCloseRemarks('');
    setSiteVisitAction('Keep');
    setFollowModalOpen(true);
  };

  const handleFollowSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    let payload = {};

    if (followMode === 'FollowUp') {
      if (!nextFollowDate) {
        alert('Please select the next Follow-up date and time!');
        return;
      }
      
      const selectedDateTime = new Date(nextFollowDate).getTime();
      const currentDateTime = new Date().getTime();
      if (selectedDateTime <= currentDateTime) {
        alert('Please select a future date and time for the next Follow-up!');
        return;
      }

      let finalStatus = followTargetStatus;
      if (followTargetStatus === 'Site Visit') {
        finalStatus = siteVisitAction === 'Move' ? 'Site Visit Follow-up' : 'Site Visit';
      } else if (followTargetStatus === 'Qualified') {
        finalStatus = 'Site Visit Follow-up';
      }

      payload = {
        status: finalStatus,
        followUpInfo: {
          nextFollowUpDate: new Date(nextFollowDate),
          contactedThrough: followThrough,
          remarks: followRemarks
        },
        isClosed: false
      };
    } else {
      const shouldClose = ['Contacted', 'Site Visit', 'Lost'].includes(followTargetStatus);
      payload = {
        status: followTargetStatus,
        isClosed: shouldClose,
        closeRemarks: closeRemarks
      };
    }

    try {
      const res = await fetch(`${API_URL}/leads/${selectedLeadForFollow._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFollowModalOpen(false);
        if (followMode === 'FollowUp') {
          setSuccessMsg(`Follow-up scheduled successfully for ${new Date(nextFollowDate).toLocaleString()}!`);
        } else if (followTargetStatus === 'Qualified') {
          setSuccessMsg('Lead advanced to Hot List stage successfully!');
        } else {
          setSuccessMsg(`Deal marked as Completed & Closed under ${followTargetStatus} stage.`);
        }
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to submit follow-up details');
      }
    } catch (err) {
      setError('Connection error updating lead record');
    }
  };

  const handleReopenClosedLead = async (lead) => {
    try {
      const res = await fetch(`${API_URL}/leads/${lead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isClosed: false,
          closeRemarks: '',
          status: lead.assignedTo ? 'Assigned' : 'New',
          isRevert: true
        })
      });
      if (res.ok) {
        fetchLeads();
        setSuccessMsg('Lead reopened successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError('Failed to reopen lead');
    }
  };

  const handleStatusChange = async (leadId, newStatus, isRevert = false) => {
    if (!isRevert && newStatus === 'Booking') {
      const lead = leads.find(l => l._id === leadId);
      if (lead) {
        // Fetch all quotations to verify if one exists for this lead
        try {
          const qRes = await fetch(`${API_URL}/quotations`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (qRes.ok) {
            const quotations = await qRes.json();
            const hasQuotation = quotations.some(q => (q.lead?._id || q.lead) === leadId);
            if (hasQuotation) {
              initiateBooking(lead);
            } else {
              setPendingLeadForBooking(lead);
              setQtnConfirmOpen(true);
            }
          } else {
            // Fallback if API fails
            initiateBooking(lead);
          }
        } catch (err) {
          // Fallback if connection fails
          initiateBooking(lead);
        }
        return;
      }
    }
    if (!isRevert) {
      const lead = leads.find(l => l._id === leadId);
      if (lead) {
        initiateFollowUpOrComplete(lead, newStatus);
        return;
      }
    }
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, isRevert })
      });
      if (res.ok) {
        fetchLeads();
        setSuccessMsg(isRevert ? 'Lead status reverted successfully!' : 'Lead status updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(isRevert ? 'Failed to revert lead status' : 'Failed to update lead status');
    }
  };

  const handleReassign = async (leadId, newAssignedId) => {
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo: newAssignedId })
      });
      if (res.ok) {
        fetchLeads();
        setSuccessMsg('Lead reassigned successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError('Failed to reassign lead');
    }
  };

  const handleProjectChange = async (leadId, newProjectId) => {
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project: newProjectId })
      });
      if (res.ok) {
        fetchLeads();
        setSuccessMsg('Project updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError('Failed to update project');
    }
  };

  const handleExportExcel = () => {
    try {
      if (filteredLeadsList.length === 0) {
        alert('No leads found matching the active filters to export.');
        return;
      }

      const logoPath = window.location.origin + "/jb_logo.jpg";
 
      // Generate styled HTML sheet
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; }
            td, th { border: 1px solid #e2e8f0; padding: 10px 12px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #475569; }
            th { font-weight: bold; background-color: #0b4d2d; color: white; border: 1px solid #0b4d2d; text-align: center; text-transform: uppercase; font-size: 9pt; letter-spacing: 0.5px; }
            .title-row { font-size: 16pt; font-weight: 800; color: #ffffff; letter-spacing: 1.5px; }
            .even-row { background-color: #f4fbf7; }
            .bold-label { font-weight: bold; color: #0f172a; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <!-- Column Width Config for Excel -->
            <col width="60" />
            <col width="100" />
            <col width="180" />
            <col width="140" />
            <col width="100" />
            <col width="180" />
            <col width="90" />
            <col width="150" />
            <col width="150" />
            <col width="150" />
            <col width="140" />
            <col width="300" />

            <tr style="height: 100px;">
              <td colspan="3" style="background-color: #0e623a; border: none; text-align: center; vertical-align: middle; height: 100px;">
                <img src="${logoPath}" height="80" style="height: 80px; width: auto; display: block; margin: 0 auto;" />
              </td>
              <td colspan="9" class="title-row" style="background-color: #0e623a; border: none; vertical-align: middle; text-align: center; font-size: 16pt; font-weight: 800; color: #ffffff; height: 100px; font-family: 'Segoe UI', sans-serif;">
                LEADS DIRECTORY REPORT
              </td>
            </tr>
            <tr><td colspan="12" style="border:none; height: 15px;"></td></tr>
            
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Contact Number</th>
              <th>Lead Type</th>
              <th>Source / Campaign</th>
              <th>Project</th>
              <th>Assigned Person</th>
              <th>Assigned By</th>
              <th>Workflow Status</th>
              <th>Booking Value</th>
              <th>Remarks / Notes</th>
            </tr>
      `;
 
      const STATUS_EXCEL_STYLES = {
        'New': 'background-color: #eff6ff; color: #1e40af; font-weight: bold;',
        'Assigned': 'background-color: #f3e8ff; color: #6b21a8; font-weight: bold;',
        'Contacted': 'background-color: #e0e7ff; color: #3730a3; font-weight: bold;',
        'Follow-Up': 'background-color: #fffbeb; color: #92400e; font-weight: bold;',
        'Site Visit': 'background-color: #fff1f2; color: #9f1239; font-weight: bold;',
        'Site Visit Follow-up': 'background-color: #fdf2f8; color: #9d174d; font-weight: bold;',
        'Qualified': 'background-color: #f0fdf4; color: #166534; font-weight: bold;',
        'Negotiation': 'background-color: #fff7ed; color: #9a3412; font-weight: bold;',
        'Booking': 'background-color: #fef9c3; color: #854d0e; font-weight: bold;',
        'Won': 'background-color: #ecfdf5; color: #065f46; font-weight: bold;',
        'Lost': 'background-color: #f3f4f6; color: #374151; font-weight: bold;'
      };

      filteredLeadsList.forEach((lead, index) => {
        const custName = lead.name || '';
        const contactNo = lead.phone || '';
        const lType = lead.leadType || '';
        const sourceStr = lead.leadSource || (lead.leadType === 'Direct Visit' ? 'Direct Visit' : '');
        const projectStr = lead.project?.code || lead.project?.name || '';
        const execName = lead.assignedTo?.name || 'UNASSIGNED';
        const assignerName = lead.assignedBy?.name || '—';
        const wStatus = lead.status || '';
        
        // Calculate booking value from selected units or finalized quotation value
        let bookingVal = 0;
        const matchedQtn = quotations.find(q => (q.lead?._id || q.lead) === lead._id);
        if (matchedQtn) {
          bookingVal = matchedQtn.totalValue || 0;
        } else if (lead.bookingInfo?.selectedUnits && lead.project?.units) {
          lead.bookingInfo.selectedUnits.forEach(unitId => {
            const unit = lead.project.units.find(u => u.unitId === unitId);
            if (unit) {
              bookingVal += unit.price || 0;
            }
          });
        }
        const bookingValStr = bookingVal > 0 ? `₹ ${bookingVal.toLocaleString()}` : '₹ 0';
        const bookingValColor = bookingVal > 0 ? 'color: #0e623a; font-weight: bold;' : 'color: #94a3b8;';

        const regDate = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.') : '';
        const remarksStr = [lead.followUpInfo?.remarks, lead.closeRemarks].filter(Boolean).join(' / ') || '';
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';
 
        html += `
          <tr ${rowClass}>
            <td class="text-center">${index + 1}</td>
            <td class="text-center">${regDate}</td>
            <td class="text-left bold-label">${custName}</td>
            <td class="text-center">'${contactNo}</td>
            <td class="text-center">${lType}</td>
            <td class="text-left">${sourceStr}</td>
            <td class="text-center bold-label">${projectStr}</td>
            <td class="text-left">${execName}</td>
            <td class="text-left">${assignerName}</td>
            <td class="text-center" style="${STATUS_EXCEL_STYLES[wStatus] || ''}">${wStatus}</td>
            <td class="text-right" style="${bookingValColor}">${bookingValStr}</td>
            <td class="text-left">${remarksStr}</td>
          </tr>
        `;
      });
 
      html += `
          </table>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JB_LEADS_DIRECTORY_REPORT_${new Date().getFullYear()}_${new Date().getMonth() + 1}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting leads directory data');
    }
  };

  const resetForm = () => {
    setName('');
    setPhoneCountryCode('+91');
    setPhoneLocal('');
    setAddress('');
    setBankLoan('No');
    setSelectedProjectId('');
    setAssignedToId('');
    setLeadSource('');
    setSelectedAdId('');
    setFetchedAdLink('');
    setProjectLocation('');
    setDuplicateWarning(null);
    setLeadCost('0');
  };

  // Filter list matching Search & Date & Tab & Advanced Filters
  const getFilteredLeads = () => {
    return leads.filter(lead => {
      let matchesTab = activeTab === 'All';
      if (activeTab === 'Qualified') {
        const wasQualified = lead.status === 'Qualified' || (lead.history && lead.history.some(h => h.status === 'Qualified'));
        matchesTab = wasQualified && !lead.isClosed;
      } else if (activeTab === 'Lost') {
        matchesTab = lead.status === 'Lost' || (lead.isClosed && lead.status !== 'Won');
      } else if (activeTab === 'Won') {
        matchesTab = lead.status === 'Won';
      } else if (activeTab !== 'All') {
        matchesTab = lead.status === activeTab && !lead.isClosed;
      }
      const matchesStatus = !statusFilter || lead.status === statusFilter;
      
      const matchesSearch = !searchTerm || 
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        lead.phone?.includes(searchTerm) ||
        lead.project?.code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const itemDate = new Date(lead.updatedAt || lead.createdAt);
      const itemTime = itemDate.setHours(0,0,0,0);
      const startTime = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
      const endTime = endDate ? new Date(endDate).setHours(23,59,59,999) : null;
      
      const matchesStartDate = !startTime || itemTime >= startTime;
      const matchesEndDate = !endTime || itemTime <= endTime;

      const matchesAssigned = !assignedFilter || lead.assignedTo?._id === assignedFilter;
      const matchesCampaign = !campaignFilter || lead.leadSource === campaignFilter;
      const matchesLocation = !locationFilter || lead.projectLocation === locationFilter || lead.project?.location === locationFilter;
      const matchesBankLoan = !bankLoanFilter || lead.bankLoan === bankLoanFilter;
      const matchesProject = !projectFilter || (lead.project?._id || lead.project) === projectFilter;

      let matchesState = true;
      if (reopenedFilter === 'Open') {
        matchesState = !lead.isClosed;
      } else if (reopenedFilter === 'Closed') {
        matchesState = lead.isClosed;
      } else if (reopenedFilter === 'Reopened') {
        matchesState = lead.isReopened === true || (lead.history && lead.history.some(h => h.note && h.note.toLowerCase().includes('reopened')));
      }

      return matchesTab && matchesStatus && matchesSearch && matchesStartDate && matchesEndDate &&
             matchesAssigned && matchesCampaign && matchesLocation && matchesBankLoan && matchesState && matchesProject;
    });
  };

  const filteredLeadsList = getFilteredLeads();

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0e623a]" />
            <span>Leads Directory</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">Store and track lead details, campaigns, allocations, and pipeline status</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-2xl transition shadow-sm w-full sm:w-auto cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export Excel</span>
          </button>
          
          <button
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-2xl transition shadow-md w-full sm:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Lead</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-1.5 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Switcher - Leads Phases */}
      <div className="w-full max-w-full overflow-x-auto bg-white border border-gray-150 p-1.5 rounded-2xl shadow-sm scrollbar-none">
        <div className="flex gap-1 min-w-max">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'All'
                ? 'bg-[#0e623a] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            All Leads ({leads.length})
          </button>
          {LEAD_STATUSES.map(st => {
            let count = 0;
            if (st === 'Lost') {
              count = leads.filter(l => l.status === 'Lost' || (l.isClosed && l.status !== 'Won')).length;
            } else if (st === 'Won') {
              count = leads.filter(l => l.status === 'Won').length;
            } else if (st === 'Qualified') {
              count = leads.filter(l => (l.status === 'Qualified' || (l.history && l.history.some(h => h.status === 'Qualified'))) && !l.isClosed).length;
            } else {
              count = leads.filter(l => l.status === st && !l.isClosed).length;
            }
            return (
              <button
                key={st}
                onClick={() => setActiveTab(st)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === st
                    ? 'bg-[#0e623a] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                {st === 'Qualified' ? 'Hot List' : st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Search Menu */}
      <div className="space-y-2 sticky top-16 z-20 bg-gray-50/90 backdrop-blur-md py-2">
        <div className="bg-white p-4 border border-gray-150 shadow-sm rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Search Lead Name / Phone / Project Code</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-sm font-semibold text-gray-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-sm font-semibold text-gray-600"
            />
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-150 shadow-sm rounded-3xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
          {/* Assigned Executive */}
          <div className="space-y-1">
          {/* Assigned Executive */}
          {(user?.role === 'Admin' || user?.role === 'Manager') && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Executive</label>
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="w-full max-w-full truncate px-3 py-2 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-gray-700"
              >
                <option value="">All Executives</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}
          </div>

          {/* Workflow Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Workflow Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-gray-700"
            >
              <option value="">All Statuses</option>
              {LEAD_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Project Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-gray-700"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.code}</option>
              ))}
            </select>
          </div>

          {/* Campaign / Source */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Campaign / Source</label>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-gray-700"
            >
              <option value="">All Campaigns</option>
              {SOURCE_TYPES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Project Location */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Project Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-gray-700"
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Requires Bank Loan */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bank Loan</label>
            <select
              value={bankLoanFilter}
              onChange={(e) => setBankLoanFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-gray-700"
            >
              <option value="">All</option>
              <option value="Yes">Requires Loan (Yes)</option>
              <option value="No">No Loan (No)</option>
            </select>
          </div>

          {/* Lead State */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lead State</label>
            <select
              value={reopenedFilter}
              onChange={(e) => setReopenedFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-gray-700"
            >
              <option value="">All Leads</option>
              <option value="Open">Active / Open Only</option>
              <option value="Closed">Closed Only</option>
              <option value="Reopened">Reopened Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Main Table */}
      <div className="bg-white border border-gray-150 shadow-sm rounded-3xl overflow-visible">
        <div className="overflow-x-auto w-full min-h-[350px]">
          <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Customer Details</th>
              <th className="px-3 py-2">Lead Type</th>
              <th className="px-3 py-2">Campaign / Source details</th>
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2">Assigned Executive</th>
              <th className="px-3 py-2">Workflow Status</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredLeadsList.map(lead => (
              <tr 
                key={lead._id} 
                className={`hover:bg-gray-50/50 transition duration-150 ${
                  lead.isClosed 
                    ? 'bg-red-50/70 text-gray-500 opacity-90 border-l-4 border-red-500' 
                    : ''
                }`}
              >
                {/* Date */}
                <td className="px-3 py-1.5 border-b border-gray-100">
                  <div className="text-[10px] font-semibold text-gray-700 whitespace-nowrap">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB') : '—'}
                  </div>
                </td>

                {/* Customer */}
                <td className="px-3 py-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-xs">{lead.name}</span>
                    {(lead.isReopened === true || (lead.history && lead.history.some(h => h.note && h.note.toLowerCase().includes('reopened')))) && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-250 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-sm animate-pulse">
                        Reopened
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                    <Phone className="w-3 h-3 text-gray-300" />
                    <span>{lead.phone}</span>
                  </div>
                  {lead.followUpInfo?.remarks && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#f0f9f4] text-[#0e623a] border border-[#bce2cb] max-w-[180px] truncate block" 
                        title={lead.followUpInfo.remarks}
                      >
                        Notes: {lead.followUpInfo.remarks}
                      </span>
                    </div>
                  )}
                </td>
 
                {/* Lead Type */}
                <td className="px-3 py-1.5 border-b border-gray-100">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    lead.leadType === 'Lead'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    {lead.leadType}
                  </span>
                </td>
 
                {/* Campaign Info */}
                <td className="px-3 py-1.5 border-b border-gray-100">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-semibold text-gray-700">Source: {lead.leadSource || (lead.leadType === 'Direct Visit' ? 'Direct Visit' : '—')}</div>
                    {lead.leadType === 'Lead' && lead.activeAd?.name && (
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <span>Ad: {lead.activeAd.name}</span>
                        {lead.activeAd.link && (
                          <a href={lead.activeAd.link} target="_blank" rel="noopener noreferrer" className="text-[#0e623a] hover:underline">
                            <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </td>
 
                {/* Project */}
                <td className="px-3 py-1.5 border-b border-gray-100">
                  <div className="text-[10px] font-semibold text-gray-700">
                    {projects.find(p => p._id === (lead.project?._id || lead.project))?.code || '—'}
                  </div>
                </td>
 
                {/* Assignment & Reassign Control */}
                <td className="px-3 py-1.5 border-b border-gray-100">
                  <div className="text-[10px] font-semibold text-gray-700">
                    {lead.assignedTo?.name 
                      ? `${lead.assignedTo.name} (${lead.assignedTo.role})` 
                      : 'Unassigned'}
                  </div>
                </td>
 
                {/* Workflow Status Dropdown */}
                <td className="px-3 py-1.5 border-b border-gray-100">
                  {lead.isClosed ? (
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-[9px] font-extrabold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Closed (Completed)
                      </span>
                      {lead.closeRemarks && (
                        <div className="text-[10px] text-gray-400 italic max-w-[150px] truncate" title={lead.closeRemarks}>
                          "{lead.closeRemarks}"
                        </div>
                      )}
                      <button
                        onClick={() => handleReopenClosedLead(lead)}
                        className="text-[10px] font-bold text-[#0e623a] hover:underline"
                      >
                        Reopen Lead
                      </button>
                    </div>
                  ) : (
                    <div className="relative inline-block text-left">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        className={`appearance-none cursor-pointer flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm outline-none ${
                          STATUS_COLORS[lead.status]?.bg || 'bg-gray-50/70'
                        } ${STATUS_COLORS[lead.status]?.text || 'text-gray-700'} ${
                          STATUS_COLORS[lead.status]?.border || 'border-gray-200'
                        }`}
                      >
                        {LEAD_STATUSES.filter((_, idx) => {
                          const currentIdx = LEAD_STATUSES.indexOf(lead.status);
                          return currentIdx === -1 || idx >= currentIdx;
                        }).map(status => (
                          <option key={status} value={status}>
                            {status === 'Qualified' ? 'Hot List' : status}
                          </option>
                        ))}
                      </select>
                      {activeTab === 'Qualified' && lead.status !== 'Qualified' && (
                        <div className="text-[10px] text-emerald-700 font-extrabold mt-1 py-0.5 px-2 bg-emerald-50 rounded border border-emerald-100 text-center">
                          Moved to {lead.status}
                        </div>
                      )}
                    </div>
                  )}
                </td>

                 {/* Action Triggers: History, Edit & Delete */}
                 <td className="px-3 py-1.5 border-b border-gray-100 text-center">
                   <div className="flex items-center justify-center gap-1.5">
                     <button
                       onClick={() => {
                         setSelectedLeadForHistory(lead);
                         setHistoryModalOpen(true);
                       }}
                       className="p-1.5 text-gray-500 hover:text-[#0e623a] hover:bg-[#0e623a]/5 rounded-lg transition cursor-pointer"
                       title="View Lead History Logs"
                     >
                       <History className="w-4 h-4" />
                     </button>
                     <button
                       onClick={() => handleOpenEditModal(lead)}
                       className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                       title="Edit Entire Lead Details"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                       </svg>
                     </button>
                     {(user?.role === 'Admin' || user?.role === 'Manager') && (
                       <button
                         onClick={() => handleDeleteLead(lead._id, lead.name)}
                         className="p-1.5 text-gray-500 hover:text-red-650 hover:bg-red-50 rounded-lg transition cursor-pointer"
                         title="Delete Lead Record"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                       </button>
                     )}
                   </div>
                 </td>
              </tr>
            ))}
            {filteredLeadsList.length === 0 && (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-400 text-xs">
                  No lead records found matching selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* 🔐 MODAL: Create New Lead / Direct Visit Form */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-[#0e623a] p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">New Lead Registration</h3>
                <p className="text-emerald-100 text-xs mt-1">Configure user inquiries, campaigns, and direct site visits</p>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="text-emerald-100 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Lead Type Radio Group */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Lead Record Category</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="leadType"
                      value="Lead"
                      checked={leadType === 'Lead'}
                      onChange={() => {
                        setLeadType('Lead');
                        setDuplicateWarning(null);
                      }}
                      className="text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                    />
                    <span>Lead (Campaigns & Referrals)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="leadType"
                      value="Direct Visit"
                      checked={leadType === 'Direct Visit'}
                      onChange={() => {
                        setLeadType('Direct Visit');
                        setDuplicateWarning(null);
                      }}
                      className="text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                    />
                    <span>Direct Visit</span>
                  </label>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Lead / Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Brown"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                  <div className={`flex items-center bg-gray-55 border rounded-xl focus-within:ring-2 transition-all overflow-hidden ${createPhoneErr ? 'border-red-500 focus-within:ring-red-500' : 'border-gray-200 focus-within:ring-[#0e623a] focus-within:border-transparent'}`}>
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => {
                        setPhoneCountryCode(e.target.value);
                        setPhoneLocal('');
                        setCreatePhoneErr('');
                      }}
                      className="bg-transparent pl-4 pr-6 py-3 text-sm font-bold text-gray-700 outline-none cursor-pointer border-r border-gray-200/80 hover:bg-gray-100/50 transition-colors w-24 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '12px' }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+">Other</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder={phoneCountryCode === '+91' ? '10 digit number' : phoneCountryCode === '+971' ? '9 digit number' : 'Phone number'}
                      value={phoneLocal}
                      onChange={(e) => {
                        handleLocalPhoneChange(e.target.value, phoneCountryCode, setPhoneLocal);
                        setCreatePhoneErr('');
                      }}
                      onBlur={handlePhoneBlur}
                      className="flex-grow px-4 py-3 bg-transparent outline-none text-sm text-gray-800"
                    />
                  </div>
                  {createPhoneErr && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">{createPhoneErr}</p>
                  )}
                </div>
              </div>

              {/* Duplicate check warning */}
              {duplicateWarning && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-2.5 animate-bounce">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-normal">
                    <strong>Notice:</strong> A lead with this phone number already exists: 
                    <br />
                    <span className="font-semibold">{duplicateWarning.name} (Status: {duplicateWarning.status})</span>. 
                    <br />
                    Submitting this form will **REOPEN** and update the existing lead record.
                  </div>
                </div>
              )}

              {/* Address */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Customer Address</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Street details, city, pincode..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm"
                />
              </div>

              {/* Conditionally rendered details based on Lead Type */}
              {leadType === 'Lead' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Lead Source */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Lead Source</label>
                      <SearchableSelect
                        options={SOURCE_TYPES}
                        value={leadSource}
                        onChange={setLeadSource}
                        placeholder="Select Ad Source / Campaign"
                      />
                    </div>

                    {/* Project Code selection */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Project Code</label>
                      <SearchableSelect
                        options={projects.map(p => ({ value: p._id, label: `${p.code} - ${p.name} (${p.projectType})` }))}
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        placeholder="Select Project"
                      />
                    </div>
                  </div>

                  {/* Ads Sub-dropdown (dynamic based on project) */}
                  {selectedProjectId && (
                    <div className="bg-[#f0f9f4] p-4 rounded-2xl border border-[#bce2cb]/40 space-y-3">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#0e623a] uppercase tracking-wider block mb-1.5">Active Ad Campaign</label>
                        <SearchableSelect
                          options={activeAds.map(ad => ({ value: ad.id, label: `[${ad.type}] ${ad.name} (₹${ad.cost || 0})` }))}
                          value={selectedAdId}
                          onChange={setSelectedAdId}
                          placeholder="Select Active Campaign Ad"
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          * Displays only active reels/posters for the selected project code.
                        </span>
                      </div>
                      
                      {fetchedAdLink && (
                        <div className="text-xs text-[#0e623a] flex items-center gap-1.5 font-medium">
                          <span>Auto-fetched Link:</span>
                          <a href={fetchedAdLink} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 font-bold">
                            <span>Open Campaign Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Lead Source */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Lead Source</label>
                      <SearchableSelect
                        options={SOURCE_TYPES}
                        value={leadSource}
                        onChange={setLeadSource}
                        placeholder="Select Ad Source / Campaign"
                      />
                    </div>

                    {/* Project Code selection */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Project Code</label>
                      <SearchableSelect
                        options={projects.map(p => ({ value: p._id, label: `${p.code} - ${p.name} (${p.projectType})` }))}
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        placeholder="Select Project"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Bank Loan Selection */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Requires Bank Loan?</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="bankLoan"
                      value="Yes"
                      checked={bankLoan === 'Yes'}
                      onChange={() => setBankLoan('Yes')}
                      className="text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="bankLoan"
                      value="No"
                      checked={bankLoan === 'No'}
                      onChange={() => setBankLoan('No')}
                      className="text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {/* Assigned Executive */}
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Assigned Executive / Member</label>
                  <SearchableSelect
                    options={employees.map(emp => ({ value: emp._id, label: `${emp.name} (${emp.role})` }))}
                    value={assignedToId}
                    onChange={setAssignedToId}
                    placeholder="Select Executive"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition shadow-md"
                >
                  Save Lead Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔐 MODAL: Edit Lead Record */}
      {editModalOpen && selectedLeadForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-amber-600 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Edit Lead Information</h3>
                <p className="text-amber-100 text-xs mt-1">Modify details for: {selectedLeadForEdit.name}</p>
              </div>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="text-amber-100 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLead} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Lead Type Radio Group */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Lead Record Category</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="editLeadType"
                      value="Lead"
                      checked={editLeadType === 'Lead'}
                      onChange={() => setEditLeadType('Lead')}
                      className="text-amber-600 focus:ring-amber-600 w-4 h-4"
                    />
                    <span>Lead (Campaigns & Referrals)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="editLeadType"
                      value="Direct Visit"
                      checked={editLeadType === 'Direct Visit'}
                      onChange={() => setEditLeadType('Direct Visit')}
                      className="text-amber-600 focus:ring-amber-600 w-4 h-4"
                    />
                    <span>Direct Visit</span>
                  </label>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Lead / Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Brown"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                  <div className={`flex items-center bg-gray-55 border rounded-xl focus-within:ring-2 transition-all overflow-hidden ${editPhoneErr ? 'border-red-500 focus-within:ring-red-500' : 'border-gray-200 focus-within:ring-amber-600 focus-within:border-transparent'}`}>
                    <select
                      value={editPhoneCountryCode}
                      onChange={(e) => {
                        setEditPhoneCountryCode(e.target.value);
                        setEditPhoneLocal('');
                        setEditPhoneErr('');
                      }}
                      className="bg-transparent pl-4 pr-6 py-3 text-sm font-bold text-gray-700 outline-none cursor-pointer border-r border-gray-200/80 hover:bg-gray-100/50 transition-colors w-24 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '12px' }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+">Other</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder={editPhoneCountryCode === '+91' ? '10 digit number' : editPhoneCountryCode === '+971' ? '9 digit number' : 'Phone number'}
                      value={editPhoneLocal}
                      onChange={(e) => {
                        handleLocalPhoneChange(e.target.value, editPhoneCountryCode, setEditPhoneLocal);
                        setEditPhoneErr('');
                      }}
                      onBlur={() => {
                        const err = validatePhone(editPhoneCountryCode, editPhoneLocal, 'Phone number');
                        setEditPhoneErr(err || '');
                      }}
                      className="flex-grow px-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 text-sm"
                    />
                  </div>
                  {editPhoneErr && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">{editPhoneErr}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="text-left">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Customer Address</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Street details, city, pincode..."
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                />
              </div>

              {/* Conditionally rendered details based on Lead Type */}
              {editLeadType === 'Lead' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    {/* Lead Source */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Lead Source</label>
                      <SearchableSelect
                        options={SOURCE_TYPES}
                        value={editLeadSource}
                        onChange={setEditLeadSource}
                        placeholder="Select Ad Source / Campaign"
                      />
                    </div>

                    {/* Project Code selection */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Project Code</label>
                      <SearchableSelect
                        options={projects.map(p => ({ value: p._id, label: `${p.code} - ${p.name} (${p.projectType})` }))}
                        value={editProjectId}
                        onChange={setEditProjectId}
                        placeholder="Select Project"
                      />
                    </div>
                  </div>

                  {/* Ads Sub-dropdown (dynamic based on project) */}
                  {editProjectId && (
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/40 space-y-3 text-left">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1.5">Active Ad Campaign</label>
                        <SearchableSelect
                          options={editActiveAds.map(ad => ({ value: ad.id, label: `[${ad.type}] ${ad.name} (₹${ad.cost || 0})` }))}
                          value={editAdId}
                          onChange={setEditAdId}
                          placeholder="Select Active Campaign Ad"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    {/* Lead Source */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Lead Source</label>
                      <SearchableSelect
                        options={SOURCE_TYPES}
                        value={editLeadSource}
                        onChange={setEditLeadSource}
                        placeholder="Select Ad Source / Campaign"
                      />
                    </div>

                    {/* Project Code selection */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Project Code</label>
                      <SearchableSelect
                        options={projects.map(p => ({ value: p._id, label: `${p.code} - ${p.name} (${p.projectType})` }))}
                        value={editProjectId}
                        onChange={setEditProjectId}
                        placeholder="Select Project"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Bank Loan Selection */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 text-left">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Requires Bank Loan?</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="editBankLoan"
                      value="Yes"
                      checked={editBankLoan === 'Yes'}
                      onChange={() => setEditBankLoan('Yes')}
                      className="text-amber-600 focus:ring-amber-600 w-4 h-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="editBankLoan"
                      value="No"
                      checked={editBankLoan === 'No'}
                      onChange={() => setEditBankLoan('No')}
                      className="text-amber-600 focus:ring-amber-600 w-4 h-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {/* Assigned Executive */}
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <div className="flex flex-col text-left">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Assigned Executive / Member</label>
                  <SearchableSelect
                    options={employees.map(emp => ({ value: emp._id, label: `${emp.name} (${emp.role})` }))}
                    value={editAssignedToId}
                    onChange={setEditAssignedToId}
                    placeholder="Select Executive"
                  />
                </div>
              )}

              {/* Workflow Status */}
              <div className="flex flex-col text-left">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Workflow Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm cursor-pointer appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                >
                  {LEAD_STATUSES.filter((_, idx) => {
                    const currentIdx = LEAD_STATUSES.indexOf(selectedLeadForEdit.status);
                    return currentIdx === -1 || idx >= currentIdx;
                  }).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition shadow-md cursor-pointer"
                >
                  Update Lead Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* 🔐 MODAL: View History Logs */}
      {historyModalOpen && selectedLeadForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-[#0e623a] p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Lead Audit & Transition Logs</h3>
                <p className="text-emerald-100 text-xs mt-1">Track pipeline progress for: {selectedLeadForHistory.name}</p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-emerald-100 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              {selectedLeadForHistory.history?.length > 0 ? (
                <div className="relative border-l border-gray-200 ml-3 space-y-6">
                  {selectedLeadForHistory.history.map((hist, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Timeline dot */}
                      <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0e623a] border-2 border-white ring-4 ring-[#f0f9f4]"></span>
                      
                      <div className="text-xs text-gray-400">
                        {hist.timestamp ? new Date(hist.timestamp).toLocaleString() : 'Date unavailable'}
                      </div>
                      <div className="text-sm font-semibold text-gray-800 mt-0.5">
                        Status transitioned to: <span className="text-[#0e623a] font-bold">{hist.status}</span>
                      </div>
                      {hist.assignedTo && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Assigned Executive: {hist.assignedTo.name} ({hist.assignedTo.role})
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1 italic">
                        Action performed by: {hist.updatedBy?.name || 'System'} ({hist.updatedBy?.role || 'User'})
                      </div>
                      {hist.note && (
                        <div className="mt-2 text-xs bg-gray-50 border p-2 rounded-lg text-gray-600">
                          {hist.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">No audit logs available for this lead.</p>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 MODAL: Custom Quotation Verification Alert */}
      {qtnConfirmOpen && pendingLeadForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-in">
            <div className="bg-[#0e623a] p-6 text-white text-center space-y-2 relative">
              <button
                type="button"
                onClick={() => setQtnConfirmOpen(false)}
                className="absolute top-4 right-4 text-emerald-200 hover:text-white transition p-1 hover:bg-[#0b4d2d] rounded-full"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
              <FileText className="w-12 h-12 text-emerald-300 mx-auto" />
              <h3 className="text-base font-extrabold">Quotation Estimation Required</h3>
              <p className="text-emerald-100 text-xs">
                To proceed with booking, a project quotation estimate must be associated with the customer record.
              </p>
            </div>

            <div className="p-6 space-y-4 text-center">
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                Have you already prepared and finalized a quotation estimate for <strong className="text-gray-700">{pendingLeadForBooking.name}</strong>?
              </p>
              
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setQtnConfirmOpen(false);
                    initiateBooking(pendingLeadForBooking);
                  }}
                  className="w-full py-3 bg-[#0e623a] hover:bg-[#0b4d2d] text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Yes, Proceed to Booking Wizard</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQtnConfirmOpen(false);
                    navigate(`/quotations/new?leadId=${pendingLeadForBooking._id}&targetStatus=Booking`);
                  }}
                  className="w-full py-3 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>No, Redirect to Create Quotation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 MODAL: Follow-Up & Completion Actions */}
      {followModalOpen && selectedLeadForFollow && (() => {
        const hasFollowUpOptions = ['Contacted', 'Follow-Up', 'Site Visit', 'Qualified', 'Negotiation'].includes(followTargetStatus);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100">
              <div className="bg-[#0e623a] p-6 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-emerald-300" />
                  <span>
                    {followTargetStatus === 'Qualified'
                      ? 'Site Visit Follow-up Options'
                      : ['Contacted', 'Follow-Up', 'Site Visit'].includes(followTargetStatus)
                      ? 'Contacted / Follow-up Actions'
                      : `Transition to ${followTargetStatus}`}
                  </span>
                </h3>
                <p className="text-emerald-100 text-xs mt-1">
                  {followTargetStatus === 'Qualified'
                    ? 'Choose to schedule another follow-up or advance this lead to Qualified stage'
                    : ['Contacted', 'Follow-Up', 'Site Visit'].includes(followTargetStatus)
                    ? 'Specify followup schedules or mark the stage as completed'
                    : `Enter remarks or notes to record this stage transition`}
                </p>
              </div>

              <form onSubmit={handleFollowSubmit} className="p-6 space-y-4">
                
                {/* Option Selector Toggle Buttons */}
                {hasFollowUpOptions && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFollowMode('FollowUp')}
                      className={`py-3 rounded-xl text-xs font-bold transition ${
                        followMode === 'FollowUp'
                          ? 'bg-[#0e623a] text-white shadow'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Take Follow-up
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowMode('Completed')}
                      className={`py-3 rounded-xl text-xs font-bold transition ${
                        followMode === 'Completed'
                          ? (followTargetStatus === 'Qualified' ? 'bg-[#0e623a] text-white shadow' : 'bg-red-600 text-white shadow')
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {followTargetStatus === 'Qualified' ? 'Move to Qualified' : 'Completed'}
                    </button>
                  </div>
                )}

                {/* Conditional Subforms */}
                {followMode === 'FollowUp' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Next Follow-up Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={nextFollowDate}
                        min={(() => {
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = String(now.getMonth() + 1).padStart(2, '0');
                          const day = String(now.getDate()).padStart(2, '0');
                          const hours = String(now.getHours()).padStart(2, '0');
                          const minutes = String(now.getMinutes()).padStart(2, '0');
                          return `${year}-${month}-${day}T${hours}:${minutes}`;
                        })()}
                        onChange={(e) => setNextFollowDate(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-xs font-semibold text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Contacted Through</label>
                      <select
                        value={followThrough}
                        onChange={(e) => setFollowThrough(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-xs font-semibold text-gray-700"
                      >
                        <option value="Call">Call</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="On Spot">On Spot</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Follow-up Remarks</label>
                      <textarea
                        rows="3"
                        value={followRemarks}
                        onChange={(e) => setFollowRemarks(e.target.value)}
                        placeholder="Add follow-up notes or next steps..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-xs text-gray-700"
                      />
                    </div>

                    {followTargetStatus === 'Site Visit' && (
                      <div className="bg-[#f0f9f4] p-4 rounded-2xl border border-[#bce2cb]/40 space-y-2">
                        <label className="text-[11px] font-bold text-[#0e623a] uppercase tracking-wider block">
                          Select Pipeline Action After Follow-up
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setSiteVisitAction('Keep')}
                            className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              siteVisitAction === 'Keep'
                                ? 'bg-[#0e623a] text-white shadow-md'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Keep in Site Visit
                          </button>
                          <button
                            type="button"
                            onClick={() => setSiteVisitAction('Move')}
                            className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              siteVisitAction === 'Move'
                                ? 'bg-[#0e623a] text-white shadow-md'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Move to Site Visit Follow-up
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!hasFollowUpOptions ? (
                      <div className={`text-xs p-3 rounded-xl border ${
                        followTargetStatus === 'Lost'
                          ? 'bg-red-50 text-red-800 border-red-100'
                          : followTargetStatus === 'Won'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                          : 'bg-blue-50 text-blue-850 border-blue-150'
                      }`}>
                        <strong>Notice:</strong> This action will update the lead stage to <span className="font-bold">{followTargetStatus}</span>.
                      </div>
                    ) : followTargetStatus === 'Qualified' ? (
                      <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-100">
                        <strong>Note:</strong> Advancing this lead will move it to the <span className="font-bold">Qualified</span> stage and store the record in the <span className="font-bold">Hot List</span>.
                      </div>
                    ) : (
                      <div className="bg-red-50 text-red-800 text-xs p-3 rounded-xl border border-red-100">
                        <strong>Note:</strong> Marking completed will close the deal in <span className="font-bold">{followTargetStatus}</span> stage. It will show in the <span className="font-bold">{followTargetStatus}</span> page with a reddish disabled style.
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        {followTargetStatus === 'Qualified'
                          ? 'Transition Remarks (Optional)'
                          : !hasFollowUpOptions
                          ? `Remarks / Notes for transitioning to ${followTargetStatus} (Optional)`
                          : 'Closing Remarks'}
                      </label>
                      <textarea
                        rows="4"
                        required={['Won', 'Lost', 'Contacted', 'Follow-Up', 'Site Visit'].includes(followTargetStatus)}
                        value={closeRemarks}
                        onChange={(e) => setCloseRemarks(e.target.value)}
                        placeholder={
                          followTargetStatus === 'Qualified'
                            ? "Add any notes about this qualification..."
                            : !hasFollowUpOptions
                            ? `Provide details regarding the transition to ${followTargetStatus}...`
                            : "Explain reasons for closing / completion details..."
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-xs text-gray-700"
                      />
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setFollowModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition shadow ${
                    followMode === 'FollowUp' ? 'bg-[#0e623a] hover:bg-[#0b4d2d]' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Save Action
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}
      {/* 🔐 MODAL: Booking & Quotation Creation Wizard */}
      {bookingModalOpen && selectedLeadForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-100 my-8">
            <div className="bg-gradient-to-r from-[#0e623a] to-[#0a4d2c] p-6 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span>Create Booking & Quotation Request</span>
              </h3>
              <p className="text-emerald-100 text-xs mt-1">Verify details, select available units, and complete quotation requirements</p>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Pre-populated Client & Project Details Header Card */}
              <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Client Information</h4>
                  <div className="text-sm font-bold text-gray-800">{selectedLeadForBooking.name}</div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{selectedLeadForBooking.phone}</span>
                  </div>
                  <div className="text-xs text-gray-500">{selectedLeadForBooking.address}</div>
                </div>

                <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-emerald-100 sm:pl-4">
                  <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Selected Project</h4>
                  <div className="text-sm font-bold text-gray-800">{selectedLeadForBooking.project?.name || 'Loading Project...'}</div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Building className="w-3 h-3 text-emerald-600" />
                    <span>Code: {selectedLeadForBooking.project?.code}</span>
                  </div>
                  {bookingProjectDetails && (
                    <div className="text-[10px] bg-white border px-2 py-0.5 rounded inline-block text-emerald-700 font-bold mt-1">
                      {bookingProjectDetails.projectType} Project • Rs. {bookingProjectDetails.pricePerSqFt}/Sq.Ft
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Interactive Unit Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Select Available {bookingProjectDetails?.projectType || 'Unit'}(s)
                  </label>
                  <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                    {selectedBookingUnits.length} Selected
                  </span>
                </div>

                {bookingLoading ? (
                  <div className="p-8 text-center text-xs text-gray-500">Loading available layout plans and units...</div>
                ) : bookingProjectDetails ? (
                  <div className="space-y-6">
                    {/* Real Layout Plan Map Image if configured */}
                    {bookingProjectDetails.layoutPlanImage && (
                      <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-full md:w-1/2 rounded-xl overflow-hidden border border-gray-250 bg-white cursor-pointer relative group flex items-center justify-center min-h-[200px]">
                          <img 
                            src={bookingProjectDetails.layoutPlanImage} 
                            alt={`${bookingProjectDetails.name} Layout Plan`} 
                            className="max-h-[300px] w-auto object-contain transition group-hover:scale-102"
                            onClick={() => window.open(bookingProjectDetails.layoutPlanImage, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                            <span className="text-xs text-white font-extrabold bg-gray-900/80 px-3 py-1.5 rounded-xl">Click to Expand Layout Plan Map</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-2 text-xs text-gray-550 leading-relaxed text-left">
                          <h4 className="font-extrabold text-gray-800 text-sm">Interactive Project Map</h4>
                          <p>Use the layout map on the left to locate plot positions, roads, and dimensions. Once identified, select the corresponding plot identifiers in the selection panel below.</p>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <span className="flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded bg-[#0e623a]"></span>Selected</span>
                            <span className="flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded bg-yellow-400"></span>Booked / Sold</span>
                            <span className="flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded bg-[#ebfaf1]"></span>Available</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Plots Layout styling - Real representation (grass color, grid boxes) */}
                    {bookingProjectDetails.projectType === 'Plot' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                          {bookingProjectDetails.units?.map(u => {
                            const isSelected = selectedBookingUnits.includes(u.unitId);
                            const isBooked = u.status === 'Booked' || u.status === 'Sold Out';
                            return (
                              <button
                                key={u.unitId}
                                type="button"
                                disabled={isBooked}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedBookingUnits(selectedBookingUnits.filter(id => id !== u.unitId));
                                  } else {
                                    setSelectedBookingUnits([...selectedBookingUnits, u.unitId]);
                                  }
                                }}
                                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center relative transition min-h-[75px] ${
                                  isBooked
                                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800 cursor-not-allowed opacity-90'
                                    : isSelected
                                    ? 'bg-emerald-800 border-emerald-950 text-white shadow-md font-bold scale-105 ring-2 ring-emerald-300'
                                    : 'bg-gradient-to-br from-emerald-50 to-green-150 hover:from-emerald-100 hover:to-green-200 border-emerald-250 text-emerald-800 hover:scale-102'
                                }`}
                              >
                                <div className="text-[10px] uppercase font-semibold text-gray-400">Plot</div>
                                <div className="text-xs font-bold">{u.unitId}</div>
                                <div className="text-[9px] mt-0.5 opacity-80">{Number(u.size).toFixed(2)} Sq.Ft</div>
                                {isSelected && (
                                  <span className="absolute top-1 right-1 bg-white text-emerald-800 rounded-full p-0.5 shadow-sm">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Flats Layout styling - Grouped by floors */}
                    {bookingProjectDetails.projectType === 'Flat' && (
                      <div className="space-y-4">
                        {Array.from(new Set(bookingProjectDetails.units?.map(u => u.floor || 'G') || [])).sort().map(floor => (
                          <div key={floor} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-150 space-y-2">
                            <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Floor: {floor}</h5>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                              {bookingProjectDetails.units?.filter(u => (u.floor || 'G') === floor).map(u => {
                                const isSelected = selectedBookingUnits.includes(u.unitId);
                                const isBooked = u.status === 'Booked' || u.status === 'Sold Out';
                                return (
                                  <button
                                    key={u.unitId}
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedBookingUnits(selectedBookingUnits.filter(id => id !== u.unitId));
                                      } else {
                                        setSelectedBookingUnits([...selectedBookingUnits, u.unitId]);
                                      }
                                    }}
                                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center relative transition ${
                                      isBooked
                                        ? 'bg-yellow-100 border-yellow-300 text-yellow-800 cursor-not-allowed opacity-90'
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

                    {/* Villas Layout styling - House icons */}
                    {(bookingProjectDetails.projectType === 'House' || bookingProjectDetails.projectType === 'Villa' || bookingProjectDetails.projectType?.includes?.('House') || bookingProjectDetails.projectType?.includes?.('Villa')) && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {bookingProjectDetails.units?.map(u => {
                          const isSelected = selectedBookingUnits.includes(u.unitId);
                          const isBooked = u.status === 'Booked' || u.status === 'Sold Out';
                          return (
                            <button
                              key={u.unitId}
                              type="button"
                              disabled={isBooked}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedBookingUnits(selectedBookingUnits.filter(id => id !== u.unitId));
                                } else {
                                  setSelectedBookingUnits([...selectedBookingUnits, u.unitId]);
                                }
                              }}
                              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center relative transition min-h-[90px] ${
                                isBooked
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-800 cursor-not-allowed opacity-90'
                                  : isSelected
                                  ? 'bg-[#0e623a] border-[#0a4d2c] text-white shadow-md font-bold scale-105 ring-2 ring-emerald-300'
                                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <Home className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : 'text-[#0e623a]'}`} />
                              <div className="text-xs font-bold">{u.unitId}</div>
                              <div className="text-[10px] text-gray-400 font-semibold">{Number(u.size).toFixed(2)} Sq.Ft</div>
                              {isSelected && (
                                <span className="absolute top-1.5 right-1.5 bg-white text-[#0e623a] rounded-full p-0.5">
                                  <Check className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">Select project to load available plans.</div>
                )}
              </div>

              {/* Pricing & Quotation breakdown */}
              {selectedBookingUnits.length > 0 && bookingProjectDetails && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quotation Valuation</h4>
                  <div className="text-xs space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span>Rate Sq.Ft:</span>
                      <span className="font-semibold text-gray-800">Rs. {bookingProjectDetails.pricePerSqFt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total area selected:</span>
                      <span className="font-semibold text-gray-800">
                        {bookingProjectDetails.units
                          ?.filter(u => selectedBookingUnits.includes(u.unitId))
                          .reduce((sum, u) => sum + u.size, 0).toFixed(2)} Sq.Ft
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5 text-sm font-bold text-gray-800">
                      <span>Total Valuation Cost:</span>
                      <span className="text-[#0e623a]">
                        Rs. {bookingProjectDetails.units
                          ?.filter(u => selectedBookingUnits.includes(u.unitId))
                          .reduce((sum, u) => sum + u.price, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Basic Details Forms */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1.5">Booking Customer Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Alternative Contact</label>
                    <div className={`flex items-center bg-gray-50 border rounded-xl focus-within:ring-1 transition-all overflow-hidden w-full ${bookingAltPhoneErr ? 'border-red-500 focus-within:ring-red-500' : 'border-gray-200 focus-within:ring-[#0e623a] focus-within:border-transparent'}`}>
                      <select
                        value={bookingAltCountryCode}
                        onChange={(e) => {
                          setBookingAltCountryCode(e.target.value);
                          setBookingAltLocal('');
                          setBookingAltPhoneErr('');
                        }}
                        className="bg-transparent pl-3 pr-5 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer border-r border-gray-200/80 hover:bg-gray-100/50 transition-colors w-20 appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', backgroundSize: '10px' }}
                      >
                        <option value="+91">+91</option>
                        <option value="+971">+971</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+966">+966</option>
                        <option value="+">+</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Alternative Phone No"
                        value={bookingAltLocal}
                        onChange={(e) => {
                          handleLocalPhoneChange(e.target.value, bookingAltCountryCode, setBookingAltLocal);
                          setBookingAltPhoneErr('');
                        }}
                        onBlur={() => {
                          if (bookingAltLocal) {
                            const err = validatePhone(bookingAltCountryCode, bookingAltLocal, 'Alternative Contact');
                            setBookingAltPhoneErr(err || '');
                          } else {
                            setBookingAltPhoneErr('');
                          }
                        }}
                        className="flex-grow px-3 py-2 bg-transparent outline-none text-xs text-gray-800"
                      />
                    </div>
                    {bookingAltPhoneErr && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">{bookingAltPhoneErr}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Aadhar Card Number</label>
                    <input
                      type="text"
                      placeholder="12 digit aadhar"
                      value={bookingAadhar}
                      onChange={(e) => setBookingAadhar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">PAN Number</label>
                    <input
                      type="text"
                      placeholder="PAN Number"
                      value={bookingPan}
                      onChange={(e) => setBookingPan(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                    />
                  </div>
                </div>

                {/* Bank Loan Details Sub-Form */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Requires Bank Loan Financing?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="bookingHasLoan"
                          value="Yes"
                          checked={bookingHasLoan === 'Yes'}
                          onChange={() => setBookingHasLoan('Yes')}
                          className="text-[#0e623a] focus:ring-[#0e623a]"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="bookingHasLoan"
                          value="No"
                          checked={bookingHasLoan === 'No'}
                          onChange={() => setBookingHasLoan('No')}
                          className="text-[#0e623a] focus:ring-[#0e623a]"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  {bookingHasLoan === 'Yes' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 block mb-1">Loan Amount Required (Rs.)</label>
                        <input
                          type="number"
                          placeholder="e.g. 1500000"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(e.target.value)}
                          onBlur={() => setLoanAmount(prev => prev ? Number(Number(prev).toFixed(2)) : 0)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 block mb-1">Preferred Bank name</label>
                        <input
                          type="text"
                          placeholder="e.g. SBI, HDFC"
                          value={loanBank}
                          onChange={(e) => setLoanBank(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 block mb-1">Loan Notes / Status</label>
                        <input
                          type="text"
                          placeholder="e.g. Approved / Processed"
                          value={loanStatusNotes}
                          onChange={(e) => setLoanStatusNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Confirm Booking & Generate Quotation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsDirectory;
