import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import { sendLeadAssignmentEmail } from '../utils/emailService';
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
  X,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  XCircle
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
  'Follow-Up',
  'Site Visit',
  'Booking',
  'Future Follow-up',
  'Lost'
];

const STATUS_COLORS = {
  'New': { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', dot: 'bg-blue-200' },
  'Assigned': { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', dot: 'bg-purple-200' },
  'Follow-Up': { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700', dot: 'bg-orange-200' },
  'Site Visit': { bg: 'bg-yellow-600', text: 'text-white', border: 'border-yellow-700', dot: 'bg-yellow-200' },
  'Booking': { bg: 'bg-[#0a4c2c]', text: 'text-white', border: 'border-[#c5a059]', dot: 'bg-white' },
  'Future Follow-up': { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', dot: 'bg-indigo-200' },
  'Lost': { bg: 'bg-gray-700', text: 'text-white', border: 'border-gray-800', dot: 'bg-gray-300' },
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

const getContrastClass = (hex) => {
  if (!hex || hex === '#ffffff') return '';
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '' : 'dark-row';
};

const LeadsDirectory = () => {
  const { token, user, hasColumnPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [reopeningId, setReopeningId] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);

  // Filtering / Search States
  const [activeTab, setActiveTab] = useState('All'); // 'All' or specific status
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [assignedFilter, setAssignedFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [bankLoanFilter, setBankLoanFilter] = useState('');
  const [reopenedFilter, setReopenedFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, startDate, endDate, assignedFilter, statusFilter, campaignFilter, categoryFilter, locationFilter, bankLoanFilter, reopenedFilter, projectFilter]);

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
  const [BookedAltPhoneErr, setBookedAltPhoneErr] = useState('');
  const [address, setAddress] = useState('');
  const [profession, setProfession] = useState('');
  const [email, setEmail] = useState('');
  const [leadLocation, setLeadLocation] = useState('');
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
  const [directFollowDate, setDirectFollowDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [directFollowRemarks, setDirectFollowRemarks] = useState('');
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
  const [editBankLoanPercentage, setEditBankLoanPercentage] = useState(0);
  const [editLeadCost, setEditLeadCost] = useState('0');
  const [editProjectLocation, setEditProjectLocation] = useState('');
  const [editActiveAds, setEditActiveAds] = useState([]);
  const [editStatus, setEditStatus] = useState('New');
  const [editLeadCategory, setEditLeadCategory] = useState('Cold');

  // Booked & Quotation Modal States
  const [BookedModalOpen, setBookedModalOpen] = useState(false);
  const [selectedLeadForBooked, setSelectedLeadForBooked] = useState(null);
  const [BookedProjectDetails, setBookedProjectDetails] = useState(null);
  const [selectedBookedUnits, setSelectedBookedUnits] = useState([]);
  const [BookedAltCountryCode, setBookedAltCountryCode] = useState('+91');
  const [BookedAltLocal, setBookedAltLocal] = useState('');
  const [BookedAadhar, setBookedAadhar] = useState('');
  const [BookedPan, setBookedPan] = useState('');
  const [BookedHasLoan, setBookedHasLoan] = useState('No');
  const [loanPercentage, setLoanPercentage] = useState(0);
  const [loanAmount, setLoanAmount] = useState(0);
  const [loanBank, setLoanBank] = useState('');
  const [loanAccountNumber, setLoanAccountNumber] = useState('');
  const [loanStatusNotes, setLoanStatusNotes] = useState('');
  const [customBookedAmount, setCustomBookedAmount] = useState('');
  const [typedBookedUnits, setTypedBookedUnits] = useState('');
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [BookedLoading, setBookedLoading] = useState(false);
  const [editedUnitSizes, setEditedUnitSizes] = useState({});

  useEffect(() => {
    if (BookedProjectDetails && selectedBookedUnits.length > 0) {
      const total = BookedProjectDetails.units
        ?.filter(u => selectedBookedUnits.includes(u.unitId))
        .reduce((sum, u) => {
          const size = editedUnitSizes[u.unitId] !== undefined ? editedUnitSizes[u.unitId] : u.size;
          return sum + (Number(size) || 0) * (BookedProjectDetails.pricePerSqFt || 1);
        }, 0);
      setCustomBookedAmount(total || '');
    } else {
      setCustomBookedAmount('');
    }
  }, [selectedBookedUnits, BookedProjectDetails, editedUnitSizes]);

  // Follow-Up & Completion Modal States
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [selectedLeadForFollow, setSelectedLeadForFollow] = useState(null);
  const [followTargetStatus, setFollowTargetStatus] = useState('Follow-Up');
  const [followMode, setFollowMode] = useState('FollowUp'); // 'FollowUp' | 'Completed'
  const [nextFollowDate, setNextFollowDate] = useState('');
  const [followThrough, setFollowThrough] = useState('Call');
  const [leadCategory, setLeadCategory] = useState('Cold');
  const [followRemarks, setFollowRemarks] = useState('');
  const [closeRemarks, setCloseRemarks] = useState('');
  const [siteVisitAction, setSiteVisitAction] = useState('Keep'); // 'Keep' | 'Move'

  // History Popover State
  const [selectedLeadForHistory, setSelectedLeadForHistory] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Duplicate Check Warning State
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [fetchedDuplicateLeads, setFetchedDuplicateLeads] = useState([]);

  // Extract previously assigned sales representative if present in matching phone numbers
  const previouslyAssignedExecutive = fetchedDuplicateLeads.find(l => l.assignedTo && typeof l.assignedTo === 'object')?.assignedTo;

  // Custom Dropdown Open State
  const [openDropdownLeadId, setOpenDropdownLeadId] = useState(null);

  // Custom Quotation Check Modal State
  const [qtnConfirmOpen, setQtnConfirmOpen] = useState(false);
  const [pendingLeadForBooked, setPendingLeadForBooked] = useState(null);

  // Stage Colors from settings
  const [stageColors, setStageColors] = useState({
    'Booking': '#0a4c2c'
  });
  const [stageTextColors, setStageTextColors] = useState({
    'Booking': '#ffffff'
  });

  useEffect(() => {
    if (token) {
      fetchLeads();
      fetchProjects();
      fetchEmployees();
      fetchQuotations();
      fetchStageColors();
    }
  }, [token]);

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
    setEditBankLoanPercentage(lead.bankLoanPercentage || 0);
    setEditLeadCost(String(lead.leadCost || '0'));
    setEditProjectLocation(lead.projectLocation || '');
    setEditLeadCategory(lead.leadCategory || 'Cold');

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

    if (!editName || !editPhoneLocal || !editAddress || !editLeadSource || !editProjectId || !editStatus || !editLeadCategory) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    if ((user?.role === 'Superadmin' || user?.role === 'Crd team') && !editAssignedToId) {
      setError('Please select an assigned executive.');
      return;
    }
    if (editBankLoan === 'Yes' && (!editBankLoanPercentage || Number(editBankLoanPercentage) <= 0)) {
      setError('Bank Loan Percentage must be a number greater than 0.');
      return;
    }

    const phoneError = validatePhone(editPhoneCountryCode, editPhoneLocal, 'Phone number');
    if (phoneError) {
      setError(phoneError);
      return;
    }
    const editPhone = editPhoneCountryCode === '+' ? `+${editPhoneLocal}` : `${editPhoneCountryCode}${editPhoneLocal}`;

    const adObj = editAdId ? editActiveAds.find(a => a.id === editAdId) : null;

    setIsSubmitting(true);
    const payload = {
      leadType: editLeadType,
      name: editName,
      phone: editPhone,
      address: editAddress,
      bankLoan: editBankLoan,
      bankLoanPercentage: Number(editBankLoanPercentage) || 0,
      project: editProjectId || undefined,
      assignedTo: editAssignedToId || '',
      status: editStatus,
      leadCost: Number(editLeadCost) || 0,
      leadSource: editLeadSource,
      leadCategory: editLeadCategory,
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

        // Send EmailJS notification on employee assignment update
        const prevAssigneeId = selectedLeadForEdit.assignedTo?._id || selectedLeadForEdit.assignedTo || '';
        const newAssigneeId = editAssignedToId || '';
        console.log("Email Notification Check (Update):", { prevAssigneeId, newAssigneeId, emailTriggerEnabled: newAssigneeId && newAssigneeId !== prevAssigneeId });
        if (newAssigneeId && newAssigneeId !== prevAssigneeId) {
          const matchedEmployee = employees.find(emp => emp._id === newAssigneeId);
          console.log("Email Notification Employee (Update):", { employeeFound: !!matchedEmployee, employeeEmail: matchedEmployee?.email });
          if (matchedEmployee && matchedEmployee.email) {
            const proj = projects.find(p => p._id === editProjectId);
            console.log("Triggering EmailJS lead assignment email (Update)...");
            sendLeadAssignmentEmail(
              matchedEmployee,
              { name: editName, phone: editPhoneCountryCode + editPhoneLocal, projectCode: proj ? proj.code : 'N/A' },
              user.name || 'System Admin',
              user.email
            ).catch(e => console.error("EmailJS Error:", e));
          }
        }

        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update lead');
      }
    } catch (err) {
      setError('Error updating lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (lead) => {
    if (!window.confirm(`Are you sure you want to cancel the booking for "${lead.name}"? This will mark the lead as Cancelled.`)) {
      return;
    }
    setError('');
    setSuccessMsg('');
    setStatusChangingId(lead._id);
    try {
      const payload = {
        status: 'Lost',
        isClosed: true,
        closeRemarks: '[Lost at Booking stage] - Cancelled'
      };
      const res = await fetch(`${API_URL}/leads/${lead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg('Booking cancelled successfully!');
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      setError('Connection error cancelling booking');
    } finally {
      setStatusChangingId(null);
    }
  };

  const handleDeleteLead = async (leadId, leadName) => {
    if (!window.confirm(`Are you sure you want to permanently delete lead "${leadName}"?`)) {
      return;
    }
    setError('');
    setSuccessMsg('');
    setDeletingId(leadId);
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
    } finally {
      setDeletingId(null);
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
    } catch (err) { }
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
    } catch (err) { }
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
    } catch (err) { }
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
      const res = await fetch(`${API_URL}/leads/phone/${encodeURIComponent(phone)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const leads = await res.json();
        setFetchedDuplicateLeads(leads || []);
      }
    } catch (err) { }
  };

  useEffect(() => {
    if (fetchedDuplicateLeads.length > 0 && selectedProjectId) {
      let lead = fetchedDuplicateLeads.find(l => l.project && (l.project._id || l.project).toString() === selectedProjectId.toString());
      if (lead) {
        const allowedStatuses = ['Lost', 'Cancelled', 'Booking', 'Won'];
        let isAllowedToReopen = allowedStatuses.includes(lead.status);
        if (!isAllowedToReopen) {
          setDuplicateWarning(lead);
        } else {
          setDuplicateWarning(null);
        }
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [fetchedDuplicateLeads, selectedProjectId]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name || !profession || !email || !address || !leadLocation || !leadSource || !selectedProjectId) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    if (leadType === 'Direct Visit' && (!directFollowRemarks || !directFollowRemarks.trim())) {
      setError('Notes (Narration) is required for Direct Visit.');
      return;
    }
    if ((user?.role === 'Superadmin' || user?.role === 'Crd team') && !assignedToId) {
      setError('Please select an assigned executive.');
      return;
    }

    const phoneError = validatePhone(phoneCountryCode, phoneLocal, 'Phone number');
    if (phoneError) {
      setCreatePhoneErr(phoneError);
      setError(phoneError);
      return;
    }
    setCreatePhoneErr('');
    const phone = phoneCountryCode === '+' ? `+${phoneLocal}` : `${phoneCountryCode}${phoneLocal}`;

    const adObj = selectedAdId ? activeAds.find(a => a.id === selectedAdId) : null;

    setIsSubmitting(true);
    const payload = {
      leadType,
      name,
      profession,
      email,
      location: leadLocation,
      phone,
      address,
      project: selectedProjectId,
      assignedTo: previouslyAssignedExecutive ? previouslyAssignedExecutive._id : ((user?.role === 'Superadmin' || user?.role === 'Crd team') ? assignedToId : user?._id),
      leadCost: Number(leadCost) || 0,
      leadSource: leadSource,
      leadCategory: leadCategory,
      activeAd: leadType === 'Lead' && adObj ? { name: adObj.name, link: adObj.link } : undefined
    };

    if (leadType === 'Direct Visit' && directFollowDate) {
      payload.followUpInfo = {
        nextFollowUpDate: new Date(directFollowDate),
        contactedThrough: 'On Spot',
        remarks: directFollowRemarks
      };
    }

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

        // Send EmailJS notification on lead creation assignment
        const assignedId = payload.assignedTo || '';
        console.log("Email Notification Check (Create):", { assignedId });
        if (assignedId) {
          const matchedEmployee = employees.find(emp => emp._id === assignedId);
          console.log("Email Notification Employee (Create):", { employeeFound: !!matchedEmployee, employeeEmail: matchedEmployee?.email });
          if (matchedEmployee && matchedEmployee.email) {
            const proj = projects.find(p => p._id === selectedProjectId);
            console.log("Triggering EmailJS lead assignment email (Create)...");
            sendLeadAssignmentEmail(
              matchedEmployee,
              { name: payload.name, phone: payload.phone, projectCode: proj ? proj.code : 'N/A' },
              user.name || 'System Admin',
              user.email
            ).catch(e => console.error("EmailJS Error:", e));
          }
        }

        resetForm();
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        if (data.existingLead) {
          setDuplicateWarning(data.existingLead);
        } else {
          setError(data.message || 'Failed to submit lead registration');
        }
      }
    } catch (err) {
      setError('Connection error saving lead record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestReregistration = async () => {
    if (!duplicateWarning) return;
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'LEAD_REREGISTRATION',
          referenceId: duplicateWarning._id,
          narration: `Requested re-registration of lead ${duplicateWarning.name} (Phone: ${duplicateWarning.phone}).`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Approval request sent to Superadmin successfully!');
        setCreateModalOpen(false);
        resetForm();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to submit approval request');
      }
    } catch (err) {
      setError('Connection error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateBooked = async (lead) => {
    setSelectedLeadForBooked(lead);
    setBookedLoading(true);
    setBookedModalOpen(true);

    // Prepopulate base fields
    const parsed = parsePhoneDetails(lead.BookedInfo?.alternativePhone || '');
    setBookedAltCountryCode(parsed.countryCode);
    setBookedAltLocal(parsed.localPhone);
    setBookedAadhar('');
    setBookedPan('');
    setBookedHasLoan(lead.bankLoan || 'No');
    setLoanPercentage(lead.bankLoanPercentage || 0);
    setLeadCategory(lead.leadCategory || 'Cold');
    setLoanAmount(0);
    setLoanBank('');
    setLoanAccountNumber('');
    setLoanStatusNotes('');
    setSelectedBookedUnits([]);
    setTypedBookedUnits('');
    setCustomBookedAmount('');
    setEditedUnitSizes({});

    try {
      const projId = lead.project?._id || lead.project;
      const res = await fetch(`${API_URL}/projects/${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookedProjectDetails(data);
      }
    } catch (err) {
      setError('Failed to load project details for Booked');
    } finally {
      setBookedLoading(false);
    }
  };

  const handleBookedSubmit = async (e) => {
    e.preventDefault();
    if (selectedBookedUnits.length === 0) {
      alert('Please select at least one unit (plot/flat/villa) to confirm Booked!');
      return;
    }

    if (BookedAltLocal) {
      const phoneError = validatePhone(BookedAltCountryCode, BookedAltLocal, 'Alternative Contact');
      if (phoneError) {
        alert(phoneError);
        return;
      }
    }
    const BookedAltPhone = BookedAltLocal ? (BookedAltCountryCode === '+' ? `+${BookedAltLocal}` : `${BookedAltCountryCode}${BookedAltLocal}`) : '';

    const selectedUnitsData = BookedProjectDetails.units.filter(u => selectedBookedUnits.includes(u.unitId));

    const totalArea = selectedUnitsData.reduce((sum, u) => {
      const size = editedUnitSizes[u.unitId] !== undefined ? editedUnitSizes[u.unitId] : u.size;
      return sum + (Number(size) || 0);
    }, 0);

    const calculatedValue = totalArea * (BookedProjectDetails.pricePerSqFt || 1);
    const totalValue = Number(customBookedAmount) || calculatedValue;
    const effectiveRate = totalArea > 0 ? (totalValue / totalArea) : (BookedProjectDetails.pricePerSqFt || 1);

    const unitUpdates = selectedUnitsData.map(u => {
      const editedSize = editedUnitSizes[u.unitId];
      const finalSize = editedSize !== undefined ? Number(editedSize) : u.size;
      return {
        unitId: u.unitId,
        size: finalSize,
        ratePerUom: effectiveRate,
        soldRatePerUom: effectiveRate
      };
    });



    const qtnPayload = {
      lead: selectedLeadForBooked._id,
      project: BookedProjectDetails._id,
      customerName: selectedLeadForBooked.name,
      customerPhone: selectedLeadForBooked.phone,
      customerAddress: selectedLeadForBooked.address,
      projectType: BookedProjectDetails.projectType?.[0] || 'Plot',
      selectedUnits: selectedBookedUnits,
      pricePerSqFt: BookedProjectDetails.pricePerSqFt,
      totalArea: totalArea,
      totalValue: totalValue,
      alternativePhone: BookedAltPhone,
      aadharNumber: BookedAadhar,
      panNumber: BookedPan,
      bankLoanRequired: BookedHasLoan,
      bankLoanPercentage: Number(loanPercentage),
      loanAmount: Number(loanAmount),
      preferredBank: loanBank,
      accountNumber: loanAccountNumber
    };

    const payload = {
      status: 'Booking',
      leadCategory: leadCategory,
      bankLoan: BookedHasLoan,
      bankLoanPercentage: Number(loanPercentage),
      bookingInfo: {
        selectedUnits: selectedBookedUnits,
        alternativePhone: BookedAltPhone,
        aadharNumber: BookedAadhar,
        panNumber: BookedPan,
        hasLoan: BookedHasLoan,
        loanDetails: {
          amountRequired: Number(loanAmount),
          preferredBank: loanBank,
          accountNumber: loanAccountNumber,
          loanStatus: loanStatusNotes || 'Initiated'
        }
      }
    };

    setIsSubmitting(true);
    try {
      // 0. Update Unit Sizes if any edits were made
      if (unitUpdates.length > 0) {
        await fetch(`${API_URL}/projects/${BookedProjectDetails._id}/update-unit-sizes`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ unitUpdates })
        });
      }

      // 1. Create Quotation directly
      const qRes = await fetch(`${API_URL}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(qtnPayload)
      });

      if (!qRes.ok) {
        const data = await qRes.json();
        setError(data.message || 'Failed to generate quotation for Booked');
        return;
      }

      // 2. Update Lead to Booked
      const res = await fetch(`${API_URL}/leads/${selectedLeadForBooked._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setBookedModalOpen(false);
        setSuccessMsg('Booked registered successfully & Quotation Generated!');
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to complete Booked');
      }
    } catch (err) {
      setError('Network error saving Booked details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateFollowUpOrComplete = (lead, targetStatus) => {
    setSelectedLeadForFollow(lead);
    setFollowTargetStatus(targetStatus);

    const hasFollowUp = ['Follow-Up', 'Site Visit', 'Future Follow-up'].includes(targetStatus);

    let initialMode = 'Completed';
    if (targetStatus === 'Site Visit') {
      initialMode = 'SiteVisit';
    } else if (hasFollowUp) {
      initialMode = 'FollowUp';
    }
    setFollowMode(initialMode);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setNextFollowDate(`${year}-${month}-${day}`);
    setFollowThrough('Call');
    setLeadCategory(lead.leadCategory || 'Cold');
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

    if (followMode === 'FollowUp' || followMode === 'SiteVisit') {
      if (!nextFollowDate) {
        alert('Please select the next date!');
        return;
      }

      const selectedDate = new Date(nextFollowDate);
      selectedDate.setHours(0, 0, 0, 0);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      if (selectedDate < currentDate) {
        alert('Please select a valid future date!');
        return;
      }

      if (!followRemarks || !followRemarks.trim()) {
        alert('Follow-up remarks are required!');
        return;
      }

      let finalStatus = followTargetStatus;
      if (followMode === 'SiteVisit') {
        finalStatus = 'Site Visit';
      } else if (followMode === 'FollowUp' && !['Follow-Up', 'Future Follow-up'].includes(followTargetStatus)) {
        finalStatus = 'Follow-Up';
      }

      payload = {
        status: finalStatus,
        followUpInfo: {
          nextFollowUpDate: new Date(nextFollowDate),
          contactedThrough: followThrough,
          remarks: followRemarks
        },
        isClosed: false,
        leadCategory
      };
    } else {
      if (!closeRemarks || !closeRemarks.trim()) {
        alert('Transition / Closing Remarks are required!');
        return;
      }
      payload = {
        status: 'Lost',
        isClosed: true,
        closeRemarks: `[Lost at ${followTargetStatus === 'Lost' ? (selectedLeadForFollow?.status || 'Unknown') : followTargetStatus} stage] - ${closeRemarks}`,
        leadCategory
      };
    }

    setIsSubmitting(true);
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
          setSuccessMsg(`Follow-up scheduled successfully for ${new Date(nextFollowDate).toLocaleDateString()}!`);
        } else {
          setSuccessMsg('Lead has been marked as Lost successfully.');
        }
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to submit follow-up details');
      }
    } catch (err) {
      setError('Connection error updating lead record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenClosedLead = async (lead) => {
    setReopeningId(lead._id);
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
    } finally {
      setReopeningId(null);
    }
  };

  const handleStatusChange = async (leadId, newStatus, isRevert = false) => {
    if (!isRevert && newStatus === 'Booking') {
      const lead = leads.find(l => l._id === leadId);
      if (lead) {
        initiateBooked(lead);
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

    setStatusChangingId(leadId);
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
      setError('Failed to change status');
    } finally {
      setStatusChangingId(null);
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
            <col width="180" />
            <col width="90" />
            <col width="150" />
            <col width="150" />
            <col width="150" />
            <col width="300" />

            <tr style="height: 100px;">
              <td colspan="3" style="background-color: #0e623a; border: none; text-align: center; vertical-align: middle; height: 100px;">
                <img src="${logoPath}" height="80" style="height: 80px; width: auto; display: block; margin: 0 auto;" />
              </td>
              <td colspan="7" class="title-row" style="background-color: #0e623a; border: none; vertical-align: middle; text-align: center; font-size: 16pt; font-weight: 800; color: #ffffff; height: 100px; font-family: 'Segoe UI', sans-serif;">
                LEADS DIRECTORY REPORT
              </td>
            </tr>
            <tr><td colspan="10" style="border:none; height: 15px;"></td></tr>
            
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Contact Number</th>
              <th>Source / Campaign</th>
              <th>Project</th>
              <th>Assigned To</th>
              <th>Assigned By</th>
              <th>Workflow Status</th>
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
        'Booked': 'background-color: #fef9c3; color: #854d0e; font-weight: bold;',
        'Lost': 'background-color: #f3f4f6; color: #374151; font-weight: bold;'
      };

      filteredLeadsList.forEach((lead, index) => {
        const custName = lead.name || '';
        const contactNo = lead.phone || '';
        const sourceStr = lead.leadSource || (lead.leadType === 'Direct Visit' ? 'Direct Visit' : '');
        const projectStr = lead.project?.code || lead.project?.name || '';
        const execName = lead.assignedTo?.name || 'UNASSIGNED';
        const assignerName = lead.assignedBy?.name || '—';
        const wStatus = lead.status || '';

        const regDate = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.') : '';
        const remarksStr = [lead.followUpInfo?.remarks, lead.closeRemarks].filter(Boolean).join(' / ') || '';
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';

        html += `
          <tr ${rowClass}>
            <td class="text-center">${index + 1}</td>
            <td class="text-center">${regDate || '&nbsp;'}</td>
            <td class="text-left bold-label">${custName || '&nbsp;'}</td>
            <td class="text-center">${contactNo ? "'" + contactNo : '&nbsp;'}</td>
            <td class="text-left">${sourceStr || '&nbsp;'}</td>
            <td class="text-center bold-label">${projectStr || '&nbsp;'}</td>
            <td class="text-left">${execName || '&nbsp;'}</td>
            <td class="text-left">${assignerName || '&nbsp;'}</td>
            <td class="text-center" style="${STATUS_EXCEL_STYLES[wStatus] || ''}">${wStatus || '&nbsp;'}</td>
            <td class="text-left">${remarksStr || '&nbsp;'}</td>
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
    setProfession('');
    setEmail('');
    setLeadLocation('');
    setPhoneCountryCode('+91');
    setPhoneLocal('');
    setAddress('');
    setSelectedProjectId('');
    setAssignedToId('');
    setLeadSource('');
    setSelectedAdId('');
    setFetchedAdLink('');
    setProjectLocation('');
    setDuplicateWarning(null);
    setFetchedDuplicateLeads([]);
    setLeadCost('0');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setDirectFollowDate(`${year}-${month}-${day}`);
    setDirectFollowRemarks('');
  };

  // Filter list matching Search & Date & Advanced Filters (excluding Tab)
  const getBaseFilteredLeads = () => {
    return leads.filter(lead => {
      const matchesStatus = !statusFilter || lead.status === statusFilter;

      const matchesSearch = !searchTerm ||
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.project?.code?.toLowerCase().includes(searchTerm.toLowerCase());

      const itemDate = new Date(lead.updatedAt || lead.createdAt);
      const itemTime = itemDate.setHours(0, 0, 0, 0);
      const startTime = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const endTime = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

      const matchesStartDate = !startTime || itemTime >= startTime;
      const matchesEndDate = !endTime || itemTime <= endTime;

      const matchesAssigned = !assignedFilter || lead.assignedTo?._id === assignedFilter;
      const matchesCampaign = !campaignFilter || lead.leadSource === campaignFilter;
      const matchesCategory = !categoryFilter || lead.leadCategory === categoryFilter;
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

      return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate &&
        matchesAssigned && matchesCampaign && matchesCategory && matchesLocation && matchesBankLoan && matchesState && matchesProject;
    });
  };

  const baseFilteredLeads = getBaseFilteredLeads();

  // Apply Tab Filter
  const getFilteredLeads = () => {
    return baseFilteredLeads.filter(lead => {
      let matchesTab = true;
      if (activeTab === 'Lost') {
        matchesTab = lead.status === 'Lost' || (lead.isClosed && lead.status !== 'Won');
      } else if (activeTab !== 'All') {
        matchesTab = lead.status === activeTab && !lead.isClosed;
      }
      return matchesTab;
    });
  };

  const filteredLeadsList = getFilteredLeads();
  const totalItems = filteredLeadsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedLeadsList = filteredLeadsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0e623a]" />
            <span>Leads Directory</span>
          </h1>
          {/* <p className="text-black-500 text-xs mt-1">Store and track lead details, campaigns, allocations, and pipeline status</p> */}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-white border border-black-200 text-black-700 hover:bg-black-50 text-xs font-bold rounded-2xl transition shadow-sm w-full sm:w-auto cursor-pointer"
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

      {/* Filters & Search Menu */}
      <div className="space-y-2 sticky top-16 z-20 bg-black-50/90 backdrop-blur-md py-2">
        <div className="bg-white p-4 border border-black-150 shadow-sm rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Search Lead Name / Phone / Project Code</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-black-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-sm font-semibold text-black-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-sm font-semibold text-black-600"
            />
          </div>
        </div>

        <div className="bg-white p-4 border border-black-150 shadow-sm rounded-3xl grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Assigned Executive */}
          <div className="space-y-1">
            {(user?.role === 'Superadmin' || user?.role === 'Crd team') && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Assigned Executive</label>
                <select
                  value={assignedFilter}
                  onChange={(e) => setAssignedFilter(e.target.value)}
                  className="w-full max-w-full truncate px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-black-700"
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
            <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Workflow Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-black-700"
            >
              <option value="">All Statuses</option>
              {LEAD_STATUSES.map(st => (
                <option key={st} value={st}>{st === 'Booking' ? 'Booked' : st}</option>
              ))}
            </select>
          </div>

          {/* Project Select */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-black-700"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.code}</option>
              ))}
            </select>
          </div>

          {/* Campaign / Source */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Campaign / Source</label>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-black-700"
            >
              <option value="">All Campaigns</option>
              {SOURCE_TYPES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Lead Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block">Lead Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full max-w-full truncate px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs font-bold text-black-700"
            >
              <option value="">All Categories</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Switcher - Leads Phases */}
      <div className="w-full max-w-full overflow-x-auto bg-white border border-black-150 p-1.5 rounded-2xl shadow-sm scrollbar-none">
        <div className="flex gap-1 min-w-max">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${activeTab === 'All'
              ? 'bg-[#0e623a] text-white shadow-sm'
              : 'text-black-500 hover:bg-black-50 hover:text-black-800'
              }`}
          >
            All Leads ({baseFilteredLeads.length})
          </button>
          {LEAD_STATUSES.map(st => {
            let count = 0;
            if (st === 'Lost') {
              count = baseFilteredLeads.filter(l => l.status === 'Lost' || (l.isClosed && l.status !== 'Won')).length;
            } else {
              count = baseFilteredLeads.filter(l => l.status === st && !l.isClosed).length;
            }
            return (
              <button
                key={st}
                onClick={() => setActiveTab(st)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${activeTab === st
                  ? 'bg-[#0e623a] text-white shadow-sm'
                  : 'text-black-500 hover:bg-black-50 hover:text-black-800'
                  }`}
              >
                {st === 'Booking' ? 'Booked' : st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads Main Table */}
      <div className="bg-white border border-black-150 shadow-sm rounded-3xl overflow-visible">
        <div className="overflow-x-auto w-full min-h-[350px]">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-black-50 border-b border-black-150 text-[11px] font-bold text-black-500 uppercase tracking-wider">
                {hasColumnPermission('leads', 'sno') && <th className="px-3 py-2 w-10 text-center">S.No</th>}
                {hasColumnPermission('leads', 'date') && <th className="px-3 py-2">Date</th>}
                {hasColumnPermission('leads', 'customerName') && <th className="px-3 py-2">Customer Name</th>}
                {hasColumnPermission('leads', 'phoneNumber') && <th className="px-3 py-2">Phone Number</th>}
                {hasColumnPermission('leads', 'sourceDetails') && <th className="px-3 py-2">Source Details</th>}
                {hasColumnPermission('leads', 'project') && <th className="px-3 py-2">Project</th>}
                {hasColumnPermission('leads', 'category') && <th className="px-3 py-2 text-center">Category</th>}
                {hasColumnPermission('leads', 'assignedBy') && <th className="px-3 py-2">Assigned By</th>}
                {hasColumnPermission('leads', 'assignedTo') && <th className="px-3 py-2">Assigned To</th>}
                {hasColumnPermission('leads', 'leadStatus') && <th className="px-3 py-2">Lead Status</th>}
                {hasColumnPermission('leads', 'nextFollowup') && <th className="px-3 py-2 text-center">Next Followup</th>}
                {hasColumnPermission('leads', 'actions') && <th className="px-3 py-2 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-black-100 text-sm">
              {paginatedLeadsList.map((lead, index) => {
                const rowColor = lead.isClosed && stageColors['Lost'] && stageColors['Lost'] !== '#ffffff'
                  ? stageColors['Lost']
                  : lead.status === 'Booking'
                    ? stageColors['Booking']
                    : stageColors[lead.leadCategory] || '#ffffff';

                const rowTextColor = lead.isClosed && stageTextColors['Lost']
                  ? stageTextColors['Lost']
                  : lead.status === 'Booking'
                    ? stageTextColors['Booking']
                    : stageTextColors[lead.leadCategory] || '#000000';

                const contrastClass = getContrastClass(rowColor);

                return (
                  <tr
                    key={lead._id}
                    className={`transition duration-150 border-b border-black-100 custom-text-row hover:opacity-90`}
                    style={{ backgroundColor: rowColor, color: rowTextColor }}
                  >
                    {/* S.No */}
                    {hasColumnPermission('leads', 'sno') && (
                      <td className="px-3 py-1.5 border-b border-black-100 text-center">
                        <div className="text-[11px] font-bold text-black-500">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </div>
                      </td>
                    )}

                    {/* Date */}
                    {hasColumnPermission('leads', 'date') && (
                      <td className="px-3 py-1.5 border-b border-black-100">
                        <div className="text-[11px] font-semibold text-black-700 whitespace-nowrap">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB') : '—'}
                        </div>
                      </td>
                    )}

                    {/* Customer */}
                    {hasColumnPermission('leads', 'customerName') && (
                      <td className="px-3 py-1.5 border-b border-black-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-black-800 text-xs">{lead.name}</span>
                          {(lead.isReopened === true || (lead.history && lead.history.some(h => h.note && h.note.toLowerCase().includes('reopened')))) && (
                            <span className="bg-amber-600 border border-amber-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-sm animate-pulse">
                              Reopened
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Phone Number */}
                    {hasColumnPermission('leads', 'phoneNumber') && (
                      <td className="px-3 py-1.5 border-b border-black-100">
                        <div className="flex flex-col gap-1 text-[11px] text-black-500">
                          <div className="flex items-center gap-1 font-semibold">
                            <Phone className="w-3 h-3 text-black-300" />
                            <span>{lead.phone}</span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Source Details */}
                    {hasColumnPermission('leads', 'sourceDetails') && (
                      <td className="px-3 py-1.5 border-b border-black-100">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-semibold text-black-700">{lead.leadSource || (lead.leadType === 'Direct Visit' ? 'Direct Visit' : '—')}</div>
                          {lead.leadType === 'Lead' && lead.activeAd?.name && (
                            <div className="text-[11px] text-black-500 flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="truncate max-w-[120px]">Ad: {lead.activeAd.name}</span>
                                {lead.activeAd.link && (
                                  <a href={lead.activeAd.link} target="_blank" rel="noopener noreferrer" className="text-[#0e623a] hover:underline shrink-0">
                                    <ExternalLink className="w-2.5 h-2.5 inline" />
                                  </a>
                                )}
                              </div>
                              {lead.leadCost > 0 && (
                                <span className="text-[10px] font-extrabold bg-[#0e623a] border border-[#0a4c2c] px-1.5 py-0.5 rounded w-fit">
                                  Cost: ₹{lead.leadCost}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Project */}
                    {hasColumnPermission('leads', 'project') && (
                      <td className="px-3 py-1.5 border-b border-black-100">
                        <div className="text-[11px] font-semibold text-black-700">
                          {projects.find(p => p._id === (lead.project?._id || lead.project))?.code || '—'}
                        </div>
                      </td>
                    )}

                    {/* Lead Category */}
                    {hasColumnPermission('leads', 'category') && (
                      <td className="px-3 py-1.5 border-b border-black-100 text-center">
                        <span className={`px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider`}>{lead.leadCategory || 'Cold'}</span>
                      </td>
                    )}

                    {/* Assigned By */}
                    {hasColumnPermission('leads', 'assignedBy') && (
                      <td className="px-3 py-1.5 border-b border-black-100">
                        <div className="text-[11px] font-semibold text-black-600">
                          {lead.assignedBy?.name || 'Superadmin'}
                        </div>
                      </td>
                    )}

                    {/* Assigned To */}
                    {hasColumnPermission('leads', 'assignedTo') && (
                      <td className="px-3 py-1.5 border-b border-black-100">
                        <div className="text-[11px] font-semibold text-black-800">
                          {lead.assignedTo?.name || 'Unassigned'}
                        </div>
                      </td>
                    )}

                    {/* Workflow Status Dropdown */}
                    {hasColumnPermission('leads', 'leadStatus') && (
                      <td className="px-3 py-1.5 border-b border-black-100">
                        {lead.isClosed ? (
                          <div className="flex flex-col gap-1 items-start">
                            {(() => {
                              const match = lead.closeRemarks?.match(/\[Lost at (.*?) stage\]/);
                              const lostStage = match ? match[1] : null;
                              const displayRemarks = match ? lead.closeRemarks.replace(/\[Lost at .*? stage\] - /, '') : lead.closeRemarks;
                              const isSiteVisit = lostStage === 'Site Visit';
                              const isFollowUp = lostStage === 'Follow-Up' || lostStage === 'Assigned';
                              const isBooking = lostStage === 'Booking';
                              const isHidden = isSiteVisit || isFollowUp || isBooking;
                              return (
                                <>
                                  <span className="px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wider">
                                    {lostStage ? (
                                      isBooking ? 'Booking - Cancelled' :
                                        isSiteVisit ? 'Site Visit - Lost' :
                                          isFollowUp ? 'Follow-Up - Lost' :
                                            `${lostStage} - Lost`
                                    ) : 'Lost'}
                                  </span>
                                  {displayRemarks && !isHidden && (
                                    <div className="text-[11px] text-black-400 italic max-w-[150px] truncate" title={displayRemarks}>
                                      "{displayRemarks}"
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            {(() => {
                              const match = lead.closeRemarks?.match(/\[Lost at (.*?) stage\]/);
                              const lostStage = match ? match[1] : null;
                              if (lostStage === 'Site Visit' || lostStage === 'Follow-Up' || lostStage === 'Assigned') return null; // Don't show reopen option
                              return (
                                <button
                                  onClick={() => handleReopenClosedLead(lead)}
                                  disabled={reopeningId === lead._id}
                                  className="text-[11px] font-bold text-[#0e623a] hover:underline flex items-center gap-1 disabled:opacity-50"
                                >
                                  {reopeningId === lead._id && <Loader2 className="w-3 h-3 animate-spin" />}
                                  Reopen Lead
                                </button>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wider`}>
                              {lead.status === 'Booking' ? 'Booked' : lead.status}
                            </span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Next Followup Date */}
                    {hasColumnPermission('leads', 'nextFollowup') && (
                      <td className="px-3 py-1.5 border-b border-black-100 text-center">
                        <div className="text-[11px] font-semibold text-black-700">
                          {lead.followUpInfo?.nextFollowUpDate
                            ? new Date(lead.followUpInfo.nextFollowUpDate).toLocaleString('en-GB', { dateStyle: 'short' })
                            : '—'}
                        </div>
                      </td>
                    )}

                    {/* Action Triggers: History, Edit & Delete */}
                    {hasColumnPermission('leads', 'actions') && (
                      <td className="px-3 py-1.5 border-b border-black-100 text-center">
                        <div className="relative group inline-block text-left">
                          <button className="p-1.5 text-black-500 hover:bg-black-100 rounded-full transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-6 top-0 mt-0 w-32 bg-white border border-black-150 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1 dropdown-menu">
                            <button
                              onClick={() => {
                                setSelectedLeadForHistory(lead);
                                setHistoryModalOpen(true);
                              }}
                              className="w-full text-left px-4 py-2 text-[11px] font-bold hover:bg-gray-100 flex items-center gap-2"
                              style={{ color: '#374151' }}
                            >
                              <History className="w-3.5 h-3.5" /> History
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(lead)}
                              className="w-full text-left px-4 py-2 text-[11px] font-bold hover:bg-amber-50 flex items-center gap-2"
                              style={{ color: '#d97706' }}
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            {lead.status === 'Booking' && !lead.isClosed && (
                              <button
                                onClick={() => handleCancelBooking(lead)}
                                disabled={statusChangingId === lead._id}
                                className="w-full text-left px-4 py-2 text-[11px] font-bold hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                                style={{ color: '#dc2626' }}
                              >
                                {statusChangingId === lead._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredLeadsList.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-black-400 text-xs">
                    No lead records found matching selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-black-150 gap-4 bg-black-50/50 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-black-500 font-bold">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-black-200 rounded-lg px-2 py-1 text-xs font-bold text-black-700 focus:outline-none focus:border-[#0e623a] bg-white cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="text-xs text-black-500 font-bold">
            Showing {filteredLeadsList.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
          </div>

          <div className="flex gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-black-200 text-black-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white bg-black-50 transition shadow-sm cursor-pointer"
            >
              Prev
            </button>
            <div className="flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg border border-black-200 bg-white text-[#0e623a] shadow-sm">
              {currentPage} / {totalPages}
            </div>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-black-200 text-black-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white bg-black-50 transition shadow-sm cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* 🔐 MODAL: Create New Lead / Direct Visit Form */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-black-100">
            <div className="bg-[#0e623a] p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">New Lead Entries</h3>

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
              <div className="bg-black-50 p-4 rounded-2xl border border-black-150">
                <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block mb-2">Lead Record Category</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-black-700 cursor-pointer">
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
                  <label className="flex items-center gap-2 text-sm font-semibold text-black-700 cursor-pointer">
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

              {/* Name & Profession */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Lead / Customer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Brown"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-black-55 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Profession <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-4 py-3 bg-black-55 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                  <div className={`flex items-center bg-black-55 border rounded-xl focus-within:ring-2 transition-all overflow-hidden ${createPhoneErr ? 'border-red-500 focus-within:ring-red-500' : 'border-black-200 focus-within:ring-[#0e623a] focus-within:border-transparent'}`}>
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => {
                        setPhoneCountryCode(e.target.value);
                        setPhoneLocal('');
                        setCreatePhoneErr('');
                      }}
                      className="bg-transparent pl-4 pr-6 py-3 text-sm font-bold text-black-700 outline-none cursor-pointer border-r border-black-200/80 hover:bg-black-100/50 transition-colors w-24 appearance-none"
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
                      className="flex-grow px-4 py-3 bg-transparent outline-none text-sm text-black-800"
                    />
                  </div>
                  {createPhoneErr && (
                    <p className="text-[11px] text-red-500 font-bold mt-1">{createPhoneErr}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black-55 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm"
                  />
                </div>
              </div>


              {/* Address & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Customer Address <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows="2"
                    placeholder="Street details, pincode..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Location (City/Area) <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows="2"
                    placeholder="e.g. Downtown"
                    value={leadLocation}
                    onChange={(e) => setLeadLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm"
                  />
                </div>
              </div>

              {/* Conditionally rendered details based on Lead Type */}
              {leadType === 'Lead' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Lead Source */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Lead Source <span className="text-red-500">*</span></label>
                      <SearchableSelect
                        options={SOURCE_TYPES}
                        value={leadSource}
                        onChange={setLeadSource}
                        placeholder="Select Ad Source / Campaign"
                      />
                    </div>

                    {/* Project Code selection */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Project Code <span className="text-red-500">*</span></label>
                      <SearchableSelect
                        options={projects.map(p => ({ value: p._id, label: `${p.code} - ${p.name} (${p.projectType})` }))}
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        placeholder="Select Project"
                      />
                    </div>
                  </div>

                  {/* Ads Sub-dropdown (dynamic based on project) */}
                  {selectedProjectId && leadSource === 'Digital Marketing' && (
                    <div className="bg-[#f0f9f4] p-4 rounded-2xl border border-[#bce2cb]/40 space-y-3">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#0e623a] uppercase tracking-wider block mb-1.5">Active Ad Campaign</label>
                        <SearchableSelect
                          options={activeAds.map(ad => ({ value: ad.id, label: `[${ad.type}] ${ad.name} (₹${ad.cost || 0})` }))}
                          value={selectedAdId}
                          onChange={setSelectedAdId}
                          placeholder="Select Active Campaign Ad"
                        />
                        <span className="text-[11px] text-black-400 mt-1 block">
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
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Lead Source <span className="text-red-500">*</span></label>
                      <SearchableSelect
                        options={SOURCE_TYPES}
                        value={leadSource}
                        onChange={setLeadSource}
                        placeholder="Select Ad Source / Campaign"
                      />
                    </div>

                    {/* Project Code selection */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Project Code <span className="text-red-500">*</span></label>
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

              {/* Conditional Direct Visit Fields */}
              {leadType === 'Direct Visit' && (
                <div className="space-y-4 bg-black-50 p-4 rounded-2xl border border-black-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Lead Category <span className="text-red-500">*</span></label>
                      <select
                        value={leadCategory}
                        onChange={(e) => setLeadCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm font-semibold appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                      >
                        <option value="Hot">🔥 Hot</option>
                        <option value="Warm">☀️ Warm</option>
                        <option value="Cold">❄️ Cold</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Next Follow-up Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        min={(() => {
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = String(now.getMonth() + 1).padStart(2, '0');
                          const day = String(now.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })()}
                        required
                        value={directFollowDate}
                        onChange={(e) => setDirectFollowDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm text-black-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Notes (Narration) <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      rows="2"
                      placeholder="Interaction notes..."
                      value={directFollowRemarks}
                      onChange={(e) => setDirectFollowRemarks(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Previously Assigned Executive Warning Banner */}
              {previouslyAssignedExecutive && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Previous Relationship Detected</h4>
                    <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                      This customer is already associated with our sales executive <strong className="text-black-800">{previouslyAssignedExecutive.name}</strong>.
                      To maintain relationship consistency, this lead will be automatically assigned to them.
                    </p>
                  </div>
                </div>
              )}

              {/* Assigned Executive */}
              {(user?.role === 'Superadmin' || user?.role === 'Crd team') && (
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Assigned Executive / Member <span className="text-red-500">*</span></label>
                  {previouslyAssignedExecutive ? (
                    <div className="px-4 py-3 bg-black-50 border border-black-200 rounded-xl text-xs font-bold text-black-700">
                      {previouslyAssignedExecutive.name} ({previouslyAssignedExecutive.role}) [LOCKED]
                    </div>
                  ) : (
                    <SearchableSelect
                      options={employees.map(emp => ({ value: emp._id, label: `${emp.name} (${emp.role})` }))}
                      value={assignedToId}
                      onChange={setAssignedToId}
                      placeholder="Select Executive"
                    />
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-3 border border-black-200 rounded-xl text-xs font-bold text-black-500 hover:bg-black-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Save Lead Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 Duplicate Check Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-black-100 text-center p-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-black-800 mb-2">Lead Entry Blocked</h3>
            <p className="text-sm text-black-600 mb-6 leading-relaxed">
              Cannot create this lead. This lead was assigned to <strong className="text-black-800">{duplicateWarning.assignedTo?.name || duplicateWarning.assignedTo || 'someone'}</strong>.<br />This was in <strong className="text-black-800">{duplicateWarning.status}</strong> stage.
            </p>
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarning(null);
                  setFetchedDuplicateLeads([]);
                  setPhoneLocal('');
                }}
                className="w-full py-3 border border-black-200 rounded-xl text-sm font-bold text-black-600 hover:bg-black-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 MODAL: Edit Lead Record */}
      {editModalOpen && selectedLeadForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-black-100">
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
              <div className="bg-black-50 p-4 rounded-2xl border border-black-150">
                <label className="text-[11px] font-bold text-black-400 uppercase tracking-wider block mb-2 font-extrabold text-[#0e623a]">Lead Record Category [LOCKED]</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-black-700 cursor-not-allowed opacity-70">
                    <input
                      type="radio"
                      name="editLeadType"
                      value="Lead"
                      checked={editLeadType === 'Lead'}
                      disabled
                      className="text-amber-600 focus:ring-amber-600 w-4 h-4 cursor-not-allowed"
                    />
                    <span>Lead (Campaigns & Referrals)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-black-700 cursor-not-allowed opacity-70">
                    <input
                      type="radio"
                      name="editLeadType"
                      value="Direct Visit"
                      checked={editLeadType === 'Direct Visit'}
                      disabled
                      className="text-amber-600 focus:ring-amber-600 w-4 h-4 cursor-not-allowed"
                    />
                    <span>Direct Visit</span>
                  </label>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Lead / Customer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Brown"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-black-55 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                  <div className={`flex items-center bg-black-55 border rounded-xl focus-within:ring-2 transition-all overflow-hidden ${editPhoneErr ? 'border-red-500 focus-within:ring-red-500' : 'border-black-200 focus-within:ring-amber-600 focus-within:border-transparent'}`}>
                    <select
                      value={editPhoneCountryCode}
                      onChange={(e) => {
                        setEditPhoneCountryCode(e.target.value);
                        setEditPhoneLocal('');
                        setEditPhoneErr('');
                      }}
                      className="bg-transparent pl-4 pr-6 py-3 text-sm font-bold text-black-700 outline-none cursor-pointer border-r border-black-200/80 hover:bg-black-100/50 transition-colors w-24 appearance-none"
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
                    <p className="text-[11px] text-red-500 font-bold mt-1">{editPhoneErr}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="text-left">
                <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Customer Address <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows="2"
                  placeholder="Street details, city, pincode..."
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-black-55 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                />
              </div>

              {/* Conditionally rendered details based on Lead Type */}
              {editLeadType === 'Lead' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    {/* Lead Source */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Lead Source <span className="text-red-500">*</span></label>
                      <SearchableSelect
                        options={SOURCE_TYPES}
                        value={editLeadSource}
                        onChange={setEditLeadSource}
                        placeholder="Select Ad Source / Campaign"
                      />
                    </div>

                    {/* Project Code selection */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Project Code <span className="text-red-500">*</span></label>
                      <SearchableSelect
                        options={projects.map(p => ({ value: p._id, label: `${p.code} - ${p.name} (${p.projectType})` }))}
                        value={editProjectId}
                        onChange={setEditProjectId}
                        placeholder="Select Project"
                      />
                    </div>
                  </div>

                  {/* Ads Sub-dropdown (dynamic based on project) */}
                  {editProjectId && editLeadSource === 'Digital Marketing' && (
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
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Lead Source <span className="text-red-500">*</span></label>
                      <SearchableSelect
                        options={SOURCE_TYPES}
                        value={editLeadSource}
                        onChange={setEditLeadSource}
                        placeholder="Select Ad Source / Campaign"
                      />
                    </div>

                    {/* Project Code selection */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Project Code <span className="text-red-500">*</span></label>
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
              <div className="bg-black-50 p-4 rounded-2xl border border-black-150 text-left space-y-3">
                <div>
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-2">Requires Bank Loan?</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm font-semibold text-black-700 cursor-pointer">
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
                    <label className="flex items-center gap-2 text-sm font-semibold text-black-700 cursor-pointer">
                      <input
                        type="radio"
                        name="editBankLoan"
                        value="No"
                        checked={editBankLoan === 'No'}
                        onChange={() => {
                          setEditBankLoan('No');
                          setEditBankLoanPercentage(0);
                        }}
                        className="text-amber-600 focus:ring-amber-600 w-4 h-4"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {editBankLoan === 'Yes' && (
                  <div className="pt-2 border-t border-black-200/50">
                    <label className="text-xs font-semibold text-[#4b5563] block mb-1">Bank Loan Percentage (%) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      placeholder="e.g. 30"
                      value={editBankLoanPercentage}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setEditBankLoanPercentage('');
                        } else {
                          const num = Number(val);
                          if (num >= 0 && num <= 100) setEditBankLoanPercentage(num);
                        }
                      }}
                      onBlur={() => setEditBankLoanPercentage(prev => prev === '' ? 0 : Number(prev))}
                      className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Assigned Executive */}
              {(user?.role === 'Superadmin' || user?.role === 'Crd team') && (
                <div className="flex flex-col text-left">
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Assigned Executive / Member <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    options={employees.map(emp => ({ value: emp._id, label: `${emp.name} (${emp.role})` }))}
                    value={editAssignedToId}
                    onChange={setEditAssignedToId}
                    placeholder="Select Executive"
                  />
                </div>
              )}

              {/* Workflow Status & Lead Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Workflow Status <span className="text-red-500">*</span></label>
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      if (newStatus === 'Schedule Follow-up') {
                        setEditModalOpen(false); // Close edit modal
                        const lead = leads.find(l => l._id === selectedLeadForEdit._id);
                        if (lead) {
                          initiateFollowUpOrComplete(lead, lead.status);
                        }
                        return;
                      }
                      setEditModalOpen(false); // Close edit modal
                      handleStatusChange(selectedLeadForEdit._id, newStatus);
                    }}
                    className="w-full px-4 py-3 bg-black-55 border border-[#d1d5db] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                  >
                    {LEAD_STATUSES.map((status, idx) => {
                      const currentIdx = selectedLeadForEdit ? LEAD_STATUSES.indexOf(selectedLeadForEdit.status) : 0;
                      if (idx < currentIdx && currentIdx !== -1) return null;
                      return <option key={status} value={status}>{status === 'Booking' ? 'Booked' : status}</option>;
                    })}
                    {selectedLeadForEdit && (
                      <option value="Schedule Follow-up">Schedule Follow-up ({selectedLeadForEdit.status})</option>
                    )}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-black-500 uppercase tracking-wider block mb-1.5">Lead Category <span className="text-red-500">*</span></label>
                  <select
                    value={editLeadCategory}
                    onChange={(e) => setEditLeadCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-black-55 border border-black-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                  >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-3 border border-black-200 rounded-xl text-xs font-bold text-black-500 hover:bg-black-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Lead Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔐 MODAL: View History Logs */}
      {historyModalOpen && selectedLeadForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-black-100">
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
                <div className="relative border-l border-black-200 ml-3 space-y-6">
                  {[...selectedLeadForHistory.history].reverse().map((hist, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Timeline dot */}
                      <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0e623a] border-2 border-white ring-4 ring-[#f0f9f4]"></span>

                      <div className="text-xs text-black-400">
                        {hist.timestamp ? new Date(hist.timestamp).toLocaleString() : 'Date unavailable'}
                      </div>
                      <div className="text-sm font-semibold text-black-800 mt-0.5">
                        Status transitioned to: <span className="text-[#0e623a] font-bold">{hist.status}</span>
                      </div>
                      {hist.assignedTo && (
                        <div className="text-xs text-black-500 mt-0.5">
                          Assigned Executive: {hist.assignedTo.name} ({hist.assignedTo.role})
                        </div>
                      )}
                      <div className="text-xs text-black-400 mt-1 italic">
                        Action performed by: {hist.updatedBy?.name || 'System'} ({hist.updatedBy?.role || 'User'})
                      </div>
                      {hist.note && (
                        <div className="mt-2 text-xs bg-green-50 border border-green-200 p-2 rounded-lg text-green-800 font-medium shadow-sm">
                          {hist.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-black-400 text-center py-4">No audit logs available for this lead.</p>
              )}
            </div>

            <div className="p-6 border-t bg-black-50 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-black-200 hover:bg-black-300 text-black-700 font-bold rounded-xl text-xs transition"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 MODAL: Custom Quotation Verification Alert */}
      {qtnConfirmOpen && pendingLeadForBooked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-black-100 animate-scale-in">
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
                To proceed with Booked, a project quotation estimate must be associated with the customer record.
              </p>
            </div>

            <div className="p-6 space-y-4 text-center">
              <p className="text-xs text-black-500 font-semibold leading-relaxed">
                Have you already prepared and finalized a quotation estimate for <strong className="text-black-700">{pendingLeadForBooked.name}</strong>?
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setQtnConfirmOpen(false);
                    initiateBooked(pendingLeadForBooked);
                  }}
                  className="w-full py-3 bg-[#0e623a] hover:bg-[#0b4d2d] text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Yes, Proceed to Booked Wizard</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQtnConfirmOpen(false);
                    navigate(`/quotations/new?leadId=${pendingLeadForBooked._id}&targetStatus=Booked`);
                  }}
                  className="w-full py-3 bg-black-150 hover:bg-black-200 text-black-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
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
        const hasFollowUpOptions = ['Follow-Up', 'Site Visit', 'Future Follow-up'].includes(followTargetStatus);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-black-100">
              <div className="bg-[#0e623a] p-6 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-emerald-300" />
                  <span>
                    {['Follow-Up', 'Site Visit', 'Future Follow-up'].includes(followTargetStatus)
                      ? 'Contacted / Follow-up Actions'
                      : `Transition to ${followTargetStatus}`}
                  </span>
                </h3>
              </div>

              <form onSubmit={handleFollowSubmit} className="p-6 space-y-4">

                {hasFollowUpOptions && (
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFollowMode('FollowUp')}
                      className={`py-3 rounded-xl text-xs font-bold transition ${followMode === 'FollowUp'
                        ? 'bg-[#0e623a] text-white shadow'
                        : 'bg-black-100 text-black-500 hover:bg-black-200'
                        }`}
                    >
                      Schedule Follow-up
                    </button>
                    {followTargetStatus === 'Site Visit' ? (
                      <button
                        type="button"
                        onClick={() => setFollowMode('SiteVisit')}
                        className={`py-3 rounded-xl text-xs font-bold transition ${followMode === 'SiteVisit'
                          ? 'bg-yellow-600 text-white shadow'
                          : 'bg-black-100 text-black-500 hover:bg-black-200'
                          }`}
                      >
                        Move to Site Visit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setFollowModalOpen(false);
                          initiateBooked(selectedLeadForFollow);
                        }}
                        className="py-3 rounded-xl text-xs font-bold transition bg-blue-600 text-white shadow hover:bg-blue-700"
                      >
                        Move to Booking
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFollowMode('Completed')}
                      className={`py-3 rounded-xl text-xs font-bold transition ${followMode === 'Completed'
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-black-100 text-black-500 hover:bg-black-200'
                        }`}
                    >
                      Close Lead (Lost)
                    </button>
                  </div>
                )}

                <div className="space-y-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-black-600 block mb-1">Lead Category <span className="text-red-500">*</span></label>
                    <select
                      value={leadCategory}
                      onChange={(e) => setLeadCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none text-xs font-semibold text-black-600"
                      required
                    >
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </div>
                </div>

                {followMode === 'FollowUp' || followMode === 'SiteVisit' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-black-600 block mb-1">
                        {followMode === 'SiteVisit' ? 'Site Visit Scheduled Date' : 'Next Follow-up Date'}
                      </label>
                      <input
                        type="date"
                        required
                        value={nextFollowDate}
                        min={(() => {
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = String(now.getMonth() + 1).padStart(2, '0');
                          const day = String(now.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })()}
                        onChange={(e) => setNextFollowDate(e.target.value)}
                        className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none text-xs font-semibold text-black-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-black-600 block mb-1">Contacted Through</label>
                      <select
                        value={followThrough}
                        onChange={(e) => setFollowThrough(e.target.value)}
                        className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none text-xs font-semibold text-black-700"
                      >
                        <option value="Call">Call</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="On Spot">On Spot</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-black-600 block mb-1">Follow-up Remarks <span className="text-red-500">*</span></label>
                      <textarea
                        required
                        rows="3"
                        value={followRemarks}
                        onChange={(e) => setFollowRemarks(e.target.value)}
                        placeholder="Add follow-up notes or next steps..."
                        className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none text-xs text-black-700"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-black-600 block mb-1">
                        {!hasFollowUpOptions
                          ? `Remarks / Notes for transitioning to ${followTargetStatus}`
                          : 'Closing Remarks'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows="4"
                        required
                        value={closeRemarks}
                        onChange={(e) => setCloseRemarks(e.target.value)}
                        placeholder={
                          !hasFollowUpOptions
                            ? `Provide details regarding the transition to ${followTargetStatus}...`
                            : "Explain reasons for closing / completion details..."
                        }
                        className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none text-xs text-black-700"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setFollowModalOpen(false)}
                    className="flex-1 py-2.5 border border-black-200 rounded-xl text-xs font-bold text-black-500 hover:bg-black-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-2 disabled:opacity-50 ${followMode === 'FollowUp' ? 'bg-[#0e623a] hover:bg-[#0b4d2d]' : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Action'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
      {/* 🔐 MODAL: Booked & Quotation Creation Wizard */}
      {BookedModalOpen && selectedLeadForBooked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-black-100 my-8">
            <div className="bg-gradient-to-r from-[#0e623a] to-[#0a4d2c] p-6 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span>Create Booked & Quotation Request</span>
              </h3>
              <p className="text-emerald-100 text-xs mt-1">Verify details, select available units, and complete quotation requirements</p>
            </div>

            <form onSubmit={handleBookedSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

              {/* Dropdown Unit Selection */}
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-black-700 uppercase tracking-wider block">
                  Select {BookedProjectDetails?.projectType || 'Unit'} Numbers
                </label>

                <div className="relative">
                  <div
                    onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                    className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl cursor-pointer flex justify-between items-center text-sm text-black-800 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                  >
                    <span className={selectedBookedUnits.length > 0 ? "font-bold text-[#0e623a]" : "text-black-400"}>
                      {selectedBookedUnits.length > 0
                        ? selectedBookedUnits.join(', ')
                        : 'Select available units...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-black-500 transition-transform ${unitDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {unitDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-black-200 rounded-xl shadow-lg max-h-64 flex flex-col overflow-hidden">
                      <div className="p-2 border-b border-black-100 bg-black-50">
                        <input
                          type="text"
                          placeholder="Search units..."
                          value={typedBookedUnits}
                          onChange={(e) => setTypedBookedUnits(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-black-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                        />
                      </div>
                      <div className="overflow-y-auto p-1 max-h-48">
                        {BookedProjectDetails?.units
                          ?.filter(u => u.status !== 'Booked' && u.status !== 'Sold Out')
                          .filter(u => !typedBookedUnits || u.unitId.toLowerCase().includes(typedBookedUnits.toLowerCase()))
                          .map(u => (
                            <label key={u.unitId} className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 cursor-pointer transition rounded-lg">
                              <input
                                type="checkbox"
                                checked={selectedBookedUnits.includes(u.unitId)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBookedUnits([...selectedBookedUnits, u.unitId]);
                                  } else {
                                    setSelectedBookedUnits(selectedBookedUnits.filter(id => id !== u.unitId));
                                  }
                                }}
                                className="text-[#0e623a] focus:ring-[#0e623a] rounded cursor-pointer"
                              />
                              <span className="text-sm font-semibold text-black-700">{u.unitId} <span className="text-xs font-normal text-black-400">({u.size} Sq.Ft)</span></span>
                            </label>
                          ))
                        }
                        {(!BookedProjectDetails?.units || BookedProjectDetails.units.filter(u => u.status !== 'Booked' && u.status !== 'Sold Out').length === 0) && (
                          <div className="px-3 py-3 text-xs text-black-500 text-center">No available units found.</div>
                        )}
                        {(BookedProjectDetails?.units && typedBookedUnits && BookedProjectDetails.units.filter(u => u.status !== 'Booked' && u.status !== 'Sold Out' && u.unitId.toLowerCase().includes(typedBookedUnits.toLowerCase())).length === 0) && (
                          <div className="px-3 py-3 text-xs text-black-500 text-center">No units match your search.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing & Quotation breakdown */}
              {selectedBookedUnits.length > 0 && BookedProjectDetails && (
                <div className="bg-black-50 p-4 rounded-2xl border border-black-150 space-y-2">
                  <h4 className="text-[11px] font-bold text-black-500 uppercase tracking-wider">Quotation Valuation</h4>
                  <div className="text-xs space-y-1 text-black-600">
                    <div className="flex justify-between border-b border-black-150 pb-2">
                      <span>Rate Sq.Ft:</span>
                      <span className="font-semibold text-black-800">
                        Rs. {
                          (() => {
                            const totalArea = BookedProjectDetails.units
                              ?.filter(u => selectedBookedUnits.includes(u.unitId))
                              .reduce((sum, u) => {
                                const size = editedUnitSizes[u.unitId] !== undefined ? editedUnitSizes[u.unitId] : u.size;
                                return sum + (Number(size) || 0);
                              }, 0);

                            if (totalArea && customBookedAmount) {
                              const dynamicRate = Number(customBookedAmount) / totalArea;
                              if (!isNaN(dynamicRate)) {
                                return parseFloat(dynamicRate.toFixed(2)).toLocaleString();
                              }
                            }
                            return BookedProjectDetails.pricePerSqFt?.toLocaleString() || 0;
                          })()
                        }
                      </span>
                    </div>

                    {/* Unit Size Editable List */}
                    <div className="py-2 space-y-2 border-b border-black-150">
                      <span className="text-[10px] font-bold text-black-500 uppercase tracking-wide">Selected Units Area (Editable)</span>
                      <div className="max-h-32 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                        {selectedBookedUnits.map(unitId => {
                          const originalUnit = BookedProjectDetails.units?.find(u => u.unitId === unitId);
                          const currentSize = editedUnitSizes[unitId] !== undefined ? editedUnitSizes[unitId] : (originalUnit?.size || 0);

                          return (
                            <div key={unitId} className="flex justify-between items-center bg-white px-2 py-1.5 rounded-lg border border-black-200 shadow-sm">
                              <span className="font-bold text-[#0e623a]">{unitId}</span>
                              <div className="flex items-center gap-1.5 bg-black-50 px-2 py-1 rounded">
                                <input
                                  type="number"
                                  value={currentSize}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setEditedUnitSizes(prev => ({
                                      ...prev,
                                      [unitId]: isNaN(val) ? '' : val
                                    }));
                                  }}
                                  className="w-16 text-right bg-transparent border-none focus:outline-none focus:ring-0 text-black-900 font-black text-xs"
                                />
                                <span className="text-[10px] text-black-500 font-bold">Sq.Ft</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <span>Total area selected:</span>
                      <span className="font-black text-[#0e623a] text-sm">
                        {BookedProjectDetails.units
                          ?.filter(u => selectedBookedUnits.includes(u.unitId))
                          .reduce((sum, u) => {
                            const size = editedUnitSizes[u.unitId] !== undefined ? editedUnitSizes[u.unitId] : u.size;
                            return sum + (Number(size) || 0);
                          }, 0).toFixed(2)} Sq.Ft
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-black-200 mt-2 pt-2 text-sm font-bold text-black-800 items-center">
                      <span>Total Valuation Cost:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[#0e623a]">Rs.</span>
                        <input
                          type="number"
                          value={customBookedAmount}
                          onChange={(e) => setCustomBookedAmount(e.target.value)}
                          className="w-28 text-right bg-white border border-[#bce2cb] rounded px-2 py-1 text-[#0e623a] focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Basic Details Forms */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-black-700 uppercase tracking-wider border-b pb-1.5">Booked Customer Information</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-black-600 block mb-1">Alternative Contact</label>
                    <div className={`flex items-center bg-black-50 border rounded-xl focus-within:ring-1 transition-all overflow-hidden w-full ${BookedAltPhoneErr ? 'border-red-500 focus-within:ring-red-500' : 'border-black-200 focus-within:ring-[#0e623a] focus-within:border-transparent'}`}>
                      <select
                        value={BookedAltCountryCode}
                        onChange={(e) => {
                          setBookedAltCountryCode(e.target.value);
                          setBookedAltLocal('');
                          setBookedAltPhoneErr('');
                        }}
                        className="bg-transparent pl-3 pr-5 py-2 text-xs font-bold text-black-700 outline-none cursor-pointer border-r border-black-200/80 hover:bg-black-100/50 transition-colors w-20 appearance-none"
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
                        value={BookedAltLocal}
                        onChange={(e) => {
                          handleLocalPhoneChange(e.target.value, BookedAltCountryCode, setBookedAltLocal);
                          setBookedAltPhoneErr('');
                        }}
                        onBlur={() => {
                          if (BookedAltLocal) {
                            const err = validatePhone(BookedAltCountryCode, BookedAltLocal, 'Alternative Contact');
                            setBookedAltPhoneErr(err || '');
                          } else {
                            setBookedAltPhoneErr('');
                          }
                        }}
                        className="flex-grow px-3 py-2 bg-transparent outline-none text-xs text-black-800"
                      />
                    </div>
                    {BookedAltPhoneErr && (
                      <p className="text-[11px] text-red-500 font-bold mt-1">{BookedAltPhoneErr}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black-600 block mb-1">Aadhar Card Number</label>
                    <input
                      type="text"
                      placeholder="12 digit aadhar"
                      value={BookedAadhar}
                      onChange={(e) => setBookedAadhar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black-600 block mb-1">PAN Number</label>
                    <input
                      type="text"
                      placeholder="PAN Number"
                      value={BookedPan}
                      onChange={(e) => setBookedPan(e.target.value.toUpperCase().slice(0, 10))}
                      className="w-full px-3 py-2 bg-black-50 border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                    />
                  </div>

                </div>

                {/* Bank Loan Details Sub-Form */}
                <div className="bg-black-50 p-4 rounded-2xl border border-black-150 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-black-600 uppercase tracking-wider block">Requires Bank Loan Financing?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-xs font-semibold text-black-700 cursor-pointer">
                        <input
                          type="radio"
                          name="BookedHasLoan"
                          value="Yes"
                          checked={BookedHasLoan === 'Yes'}
                          onChange={() => setBookedHasLoan('Yes')}
                          className="text-[#0e623a] focus:ring-[#0e623a]"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs font-semibold text-black-700 cursor-pointer">
                        <input
                          type="radio"
                          name="BookedHasLoan"
                          value="No"
                          checked={BookedHasLoan === 'No'}
                          onChange={() => setBookedHasLoan('No')}
                          className="text-[#0e623a] focus:ring-[#0e623a]"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  {BookedHasLoan === 'Yes' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black-200">
                      <div>
                        <label className="text-[11px] font-semibold text-black-500 block mb-1">Bank Loan Percentage (%)</label>
                        <input
                          type="number"
                          placeholder="e.g. 30"
                          value={loanPercentage}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setLoanPercentage('');
                            } else {
                              const num = Number(val);
                              if (num >= 0 && num <= 100) setLoanPercentage(num);
                            }
                          }}
                          onBlur={() => setLoanPercentage(prev => prev === '' ? 0 : Number(prev))}
                          className="w-full px-3 py-2 bg-white border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-black-500 block mb-1">Loan Amount Required (Rs.)</label>
                        <input
                          type="number"
                          placeholder="e.g. 1500000"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(e.target.value)}
                          onBlur={() => setLoanAmount(prev => prev ? Number(Number(prev).toFixed(2)) : 0)}
                          className="w-full px-3 py-2 bg-white border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-black-500 block mb-1">Preferred Bank name</label>
                        <input
                          type="text"
                          placeholder="e.g. SBI, HDFC"
                          value={loanBank}
                          onChange={(e) => setLoanBank(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-black-500 block mb-1">Account Number</label>
                        <input
                          type="text"
                          placeholder="Bank Account Number"
                          value={loanAccountNumber}
                          onChange={(e) => setLoanAccountNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 bg-white border border-black-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-xs"
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
                  onClick={() => setBookedModalOpen(false)}
                  className="flex-1 py-3 border border-black-200 rounded-xl text-xs font-bold text-black-500 hover:bg-black-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> <span>Processing...</span></>
                  ) : (
                    <><DollarSign className="w-3.5 h-3.5" /> <span>Confirm Booked & Generate Quotation</span></>
                  )}
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
