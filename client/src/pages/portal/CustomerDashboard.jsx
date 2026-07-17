import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, CheckCircle, Clock, Plus, Minus, AlertTriangle, X, Loader2, MessageSquareWarning, MessageSquare, Home, Sparkles, Menu, Phone, MapPin, Activity, Wrench, ShieldAlert, FileText, ChevronRight, ChevronDown, ChevronUp, Building, CreditCard, Droplets, Grid, Utensils, Zap, Trees, Layout, Paintbrush, Hammer, Cloud, TrendingUp, Maximize, Package, Copy, LayoutGrid, List, Check, Calendar, Search, Frown } from 'lucide-react';
import { API_URL } from '../../context/AuthContext';

const WelcomePopup = ({ isOpen, onClose, userName, projectName }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 60000);
      
      const duration = 10 * 1000;
      const animationEnd = Date.now() + duration;
      
      // Create shapes from firework emojis
      const sparkler = confetti && confetti.shapeFromText ? confetti.shapeFromText({ text: '🎇', scalar: 3 }) : null;
      const firework = confetti && confetti.shapeFromText ? confetti.shapeFromText({ text: '🎆', scalar: 3 }) : null;
      const star = confetti && confetti.shapeFromText ? confetti.shapeFromText({ text: '✨', scalar: 2 }) : null;
      
      const shapes = [sparkler, firework, star].filter(Boolean);
      // fallback to circles if shapeFromText is missing
      const fallbackShapes = shapes.length > 0 ? shapes : ['circle'];

      const defaults = { startVelocity: 15, spread: 360, ticks: 60, zIndex: 105, shapes: fallbackShapes };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 15 + Math.random() * 15;
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
          colors: ['#ffdd66', '#ffffff', '#ffaa00', '#ffd700'],
          scalar: 1 + Math.random()
        });
      }, 400);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-hidden">
      
      <div className="bg-[#050907] border border-white/10 rounded-[2.5rem] w-full max-w-lg p-10 relative shadow-[0_0_50px_rgba(0,104,56,0.3)] animate-fade-in-up z-[110] text-center">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-[#0a140f] to-[#006838]/20 z-0"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#006838]/30 rounded-full blur-[80px]"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl mb-6">
            <Sparkles className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
          </div>
          
          <h2 className="text-3xl font-serif font-light text-white mb-2">
            Welcome to <span className="font-bold italic text-emerald-400">John Buildwell</span>
          </h2>
          <h3 className="text-xl font-bold text-white mb-6 tracking-wide">{userName}</h3>
          
          <p className="text-gray-400 text-sm font-light leading-relaxed mb-8 max-w-sm mx-auto">
            We are thrilled to have you here. Your dream property at <strong>{projectName}</strong> is in great hands. Track your milestones and stay updated.
          </p>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-[#006838] to-[#008c4a] text-white rounded-2xl font-bold text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(0,104,56,0.4)] flex items-center justify-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" /> EXPLORING DASHBOARD...
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modals
  const [extraWorkModal, setExtraWorkModal] = useState({ open: false, stageIdx: null });
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintsView, setComplaintsView] = useState('table');
  const [copiedToken, setCopiedToken] = useState(false);
  const [complaintSuccessToken, setComplaintSuccessToken] = useState(null);
  const [complaintReviewModal, setComplaintReviewModal] = useState({ open: false, complaintId: null });
  const [complaintReviewNote, setComplaintReviewNote] = useState('');
  
  // Form State
  const [extraName, setExtraName] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintImages, setComplaintImages] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Catalog State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [catalogQuantity, setCatalogQuantity] = useState(1);
  const [catalogForUnit, setCatalogForUnit] = useState('');

  const [customWorkDesc, setCustomWorkDesc] = useState('');
  const [customWorkForUnit, setCustomWorkForUnit] = useState('');

  // Bulk Selection State
  const [bulkSelections, setBulkSelections] = useState({});
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [bulkForUnit, setBulkForUnit] = useState('');

  
  // Requested Works Sub-Tab State
  const [requestedWorksTab, setRequestedWorksTab] = useState('new'); // 'new', 'agreed', 'cancelled'
  const [requestedWorksStartDate, setRequestedWorksStartDate] = useState('');
  const [requestedWorksEndDate, setRequestedWorksEndDate] = useState('');
  const [expandedReqIds, setExpandedReqIds] = useState({});
  const [quotation, setQuotation] = useState(null);
  const [reviewModal, setReviewModal] = useState({ open: false, stageIdx: null, workId: null });
  const [reviewNote, setReviewNote] = useState('');

  // Complaints Filtration State
  const [complaintStartDate, setComplaintStartDate] = useState('');
  const [complaintEndDate, setComplaintEndDate] = useState('');
  const [complaintSearchText, setComplaintSearchText] = useState('');

  const fetchFlow = async () => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      navigate('/portal');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/customer/my-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('Failed to load your project data');
      
      const data = await res.json();
      setFlow(data);
      
      // Also fetch quotation
      try {
        const qRes = await fetch(`${API_URL}/customer/my-quotation`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (qRes.ok) {
          setQuotation(await qRes.json());
        }
      } catch (e) {
        // Quotation might not exist, that's fine
      }
      
      // Check if we should show welcome popup
      if (!sessionStorage.getItem('hasSeenWelcome')) {
        setShowWelcome(true);
        sessionStorage.setItem('hasSeenWelcome', 'true');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlow();
  }, []);

  const handleCopyToken = () => {
    if (complaintSuccessToken) {
      navigator.clipboard.writeText(complaintSuccessToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };



  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUsername');
    sessionStorage.removeItem('hasSeenWelcome');
    navigate('/portal');
  };

  const handleAddExtraWork = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/extra-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: extraName,
          amount: extraAmount
        })
      });
      if (!res.ok) throw new Error('Failed to request extra work');
      
      setExtraWorkModal({ open: false, stageIdx: null });
      setExtraName('');
      setExtraAmount('');
      fetchFlow();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCatalogItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('customerToken');
      const amount = catalogQuantity * (selectedCatalogItem.rate || 0);
      const name = `${selectedCatalogItem.name} (${catalogQuantity} ${selectedCatalogItem.unit})`;
      
      const res = await fetch(`${API_URL}/customer/extra-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          amount: amount,
          forUnit: catalogForUnit || flow.unitId.split(',')[0].trim()
        })
      });
      if (!res.ok) throw new Error('Failed to request extra work');
      
      setCatalogModalOpen(false);
      setSelectedCatalogItem(null);
      setCatalogQuantity(1);
      fetchFlow();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    const selectedIndices = Object.keys(bulkSelections).filter(idx => bulkSelections[idx].selected);
    if (selectedIndices.length === 0) return;

    setSubmitting(true);
    try {
      const itemsPayload = selectedIndices.map(idx => {
        const catalogItem = flow.project.extraWorkCatalog[idx];
        const sel = bulkSelections[idx];
        return {
          name: catalogItem.name,
          category: catalogItem.category,
          unit: catalogItem.unit,
          quantity: sel.quantity,
          rate: catalogItem.rate,
          amount: catalogItem.rate * sel.quantity
        };
      });

      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/bulk-extra-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: itemsPayload, forUnit: bulkForUnit || flow.unitId.split(',')[0].trim() })
      });
      if (!res.ok) throw new Error('Failed to submit extra works request');
      
      setBulkSelections({});
      fetchFlow();
      alert("Items successfully requested! They are now Pending approval from the admin.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerReview = async (e) => {
    e.preventDefault();
    if (!reviewNote.trim()) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/extra-work/${reviewModal.stageIdx}/${reviewModal.workId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: reviewNote })
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setReviewModal({ open: false, stageIdx: null, workId: null });
      setReviewNote('');
      await fetchFlow();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerApprove = async (stageIdx, workId) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/extra-work/${stageIdx}/${workId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve extra work');
      await fetchFlow();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerRemove = async (stageIdx, workId) => {
    if (!window.confirm('Are you sure you want to remove this extra work request?')) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/extra-work/${stageIdx}/${workId}/remove`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove extra work');
      await fetchFlow();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomWorkSubmit = async (e) => {
    e.preventDefault();
      if (!customWorkDesc) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/extra-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `Custom Request: ${customWorkDesc}`,
          amount: 0,
          forUnit: customWorkForUnit || flow.unitId.split(',')[0].trim()
        })
      });
      if (!res.ok) throw new Error('Failed to submit custom request');
      
      setCustomWorkDesc('');
      fetchFlow();
      alert("Custom request submitted! The admin will review it and assign a rate.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = 'dgo9lfoyd';
    const uploadPreset = 'Johnbuilders';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to upload image');
    return data.secure_url;
  };

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const uploadedUrls = [];
      for (const file of complaintImages) {
        const url = await uploadToCloudinary(file);
        uploadedUrls.push(url);
      }

      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/complaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: complaintTitle, description: complaintDesc, images: uploadedUrls })
      });
      if (!res.ok) throw new Error('Failed to submit complaint');
      
      const updatedFlow = await res.json();
      const newComplaint = updatedFlow.complaints[updatedFlow.complaints.length - 1];
      setComplaintSuccessToken(newComplaint.token || 'CMP-UNKNOWN');
      
      setComplaintModalOpen(false);
      setComplaintTitle('');
      setComplaintDesc('');
      setComplaintImages([]);
      setFlow(updatedFlow);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplaintReview = async (e) => {
    e.preventDefault();
    if (!complaintReviewNote.trim()) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/complaint/${complaintReviewModal.complaintId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: complaintReviewNote })
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setComplaintReviewModal({ open: false, complaintId: null });
      setComplaintReviewNote('');
      await fetchFlow();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplaintApprove = async (complaintId) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/complaint/${complaintId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve complaint');
      await fetchFlow();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplaintRemove = async (complaintId) => {
    if (!window.confirm('Are you sure you want to reject this complaint price?')) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('customerToken');
      const res = await fetch(`${API_URL}/customer/complaint/${complaintId}/remove`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to reject complaint');
      await fetchFlow();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const extraWorkCatalog = flow?.project?.extraWorkCatalog || [];
  const catalogCategories = Array.from(new Set(extraWorkCatalog.map(item => item.category)));

  useEffect(() => {
    if (catalogCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(catalogCategories[0]);
    }
  }, [catalogCategories, selectedCategory]);

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#006838]" /></div>;
  if (error || !flow) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong.</h2>
      <p className="text-gray-500 mb-6">{error || 'Could not find your project data.'}</p>
      <button onClick={handleLogout} className="px-6 py-2 bg-gray-900 text-white rounded-full font-bold">Return to Home</button>
    </div>
  );

  // Extract all extra works
  const allExtraWorks = flow?.stages.reduce((acc, stage, idx) => {
    if (stage.extraWorks) {
      stage.extraWorks.forEach(ew => acc.push({ ...ew, stageName: stage.name, stageIdx: idx }));
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f1f5f9] via-[#f8fafc] to-[#e2e8f0] font-sans selection:bg-[#006838] selection:text-white relative overflow-hidden print:bg-white print:block">
      
      {/* Subtle Glacier Background Elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#006838]/5 rounded-full blur-[120px] pointer-events-none z-0 print:hidden"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none z-0 print:hidden"></div>

      <WelcomePopup 
        isOpen={showWelcome} 
        onClose={() => setShowWelcome(false)} 
        userName={flow.lead?.name || 'Valued Client'} 
        projectName={flow.project?.name || 'your project'} 
      />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dark Glassmorphic (Glacier) */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#050907]/95 backdrop-blur-3xl border-r border-white/10 shadow-[4px_0_30px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col print:hidden overflow-hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Decorative background glows inside sidebar */}
        <div className="absolute top-[-10%] left-[-20%] w-[100%] h-[40%] bg-[#006838]/20 rounded-full blur-[80px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[30%] bg-emerald-600/10 rounded-full blur-[70px] pointer-events-none z-0"></div>

        <div className="p-8 flex items-center justify-between relative z-10">
          <div className="text-white font-black text-2xl tracking-tighter">
            JOHN<span className="text-gray-500 font-light">BUILDWELL</span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-8 pb-6 relative z-10">
          <div className="p-4 bg-gradient-to-br from-[#006838] to-[#008c4a] rounded-2xl text-white border border-white/10 shadow-[0_8px_20px_rgba(0,104,56,0.3)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <User className="w-16 h-16" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-widest text-emerald-200 font-bold mb-1">Client Portal</p>
              <h3 className="font-bold text-lg leading-tight truncate text-white">{flow.lead?.name}</h3>
              <p className="text-xs text-emerald-100 truncate mt-1 font-medium">
                {flow.project?.projectType?.[0] || 'Project'} - {flow.project?.code || 'N/A'} | Unit {flow.unitId}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto relative z-10 scrollbar-thin">
          {[
            { id: 'profile', icon: User, label: 'My Profile' },
            // { id: 'quotation', icon: FileText, label: 'My Quotation' },
            { id: 'extraworks', icon: Wrench, label: 'Extra Works' },
            { id: 'requestedworks', icon: FileText, label: 'Requested Extra Works' },
            { id: 'complaints', icon: ShieldAlert, label: 'Complaints' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all group ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-[#006838] to-[#008c4a] text-white shadow-[0_0_20px_rgba(0,104,56,0.4)] border border-[#00a356]/30' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-white' : 'text-gray-500 group-hover:text-emerald-400'}`} />
              {item.label}
              {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto text-emerald-200" />}
            </button>
          ))}
        </nav>

        <div className="p-6 relative z-10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-gray-400 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-xl transition-all shadow-sm group"
          >
            <LogOut className="w-4 h-4 group-hover:text-red-400 text-gray-500 transition-colors" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Top Header Mobile (Glacier Style) */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[#050907]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 shadow-lg">
          <div className="text-white font-black text-xl tracking-tighter">JOHN<span className="text-gray-400 font-light">BUILDWELL</span></div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white/10 rounded-lg text-white shadow-sm border border-white/20 hover:bg-white/20 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scrollbar-thin">
          <div className="w-full space-y-8 animate-fade-in-up">
            
            {/* TAB: MY PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Registered Details Glass Card */}
                  <div className="flex-1 bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#006838]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-[#006838]/10 text-[#006838] rounded-xl"><User className="w-5 h-5" /></div>
                      <h2 className="text-lg font-bold text-gray-900">Registered Details</h2>
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Client Name</p>
                        <p className="font-semibold text-gray-900 text-base">{flow.lead?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Phone</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {flow.lead?.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registered Address</p>
                        <p className="font-semibold text-gray-900 flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 mt-1 shrink-0" /> {flow.lead?.address || 'Not Provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Project Summary Card */}
                  <div className="flex-1 bg-[#006838] text-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,104,56,0.2)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    <div className="absolute -bottom-10 -right-10 opacity-10">
                      <Home className="w-48 h-48" />
                    </div>
                    
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-2">Project Assignment</p>
                      <h2 className="text-3xl font-serif font-light mb-1">{flow.project?.name}</h2>
                      <p className="text-emerald-100 font-medium mb-8">Unit {flow.unitId}</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                          <p className="text-[10px] uppercase text-emerald-200 font-bold mb-1">Total Valuation</p>
                          <p className="font-bold">Rs. {flow.totalOriginalValue?.toLocaleString()}</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                          <p className="text-[10px] uppercase text-emerald-200 font-bold mb-1">Project Status</p>
                          <p className="font-bold flex items-center gap-1"><Activity className="w-4 h-4 text-emerald-300" /> {flow.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complaints Snapshot */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 text-red-500 rounded-xl"><ShieldAlert className="w-5 h-5" /></div>
                      <h2 className="text-lg font-bold text-gray-900">Complaints Status</h2>
                    </div>
                    <button onClick={() => setActiveTab('complaints')} className="text-xs font-bold text-[#006838] hover:underline">View All</button>
                  </div>

                  {(!flow.complaints || flow.complaints.length === 0) ? (
                    <div className="py-6 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-sm text-gray-500 font-medium">No complaints registered. Everything is smooth!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {flow.complaints.slice(0, 3).map((comp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex-1 pr-4">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{comp.title || 'Complaint'}</p>
                            <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{comp.description}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Reported: {new Date(comp.reportedAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg shrink-0 ${
                            comp.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            comp.status === 'In Progress' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {comp.status || 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Construction Milestones */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                  <div className="p-6 md:p-8 flex items-center gap-3 border-b border-gray-100">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Current Project Status</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Track the exact status of your construction stages.</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4 md:px-8 font-bold">Milestone Stage</th>
                          <th className="p-4 text-center font-bold">Payment Date On</th>
                          <th className="p-4 text-center font-bold">Payment Status</th>
                          <th className="p-4 text-center font-bold">Project Status Date On</th>
                          <th className="p-4 text-center font-bold">Project Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {flow.stages?.map((stage, idx) => {
                          const stagePaid = stage.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
                          const totalAmt = stage.amount + (stage.extraWorks?.reduce((s, e) => s + e.amount, 0) || 0);
                          const isCompleted = stage.isCompleted || stagePaid >= totalAmt;

                          return (
                            <tr key={idx} className="hover:bg-white transition bg-white/40">
                              <td className="p-4 md:px-8">
                                <div className="font-bold text-gray-900">{stage.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{stage.percentage}% of total value</div>
                              </td>
                              <td className="p-4 text-center text-sm font-medium text-gray-600">
                                {stage.payments?.length > 0 
                                  ? new Date(Math.max(...stage.payments.map(p => new Date(p.date)))).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                  : '--'}
                              </td>
                              <td className="p-4 text-center">
                                {stagePaid >= totalAmt ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#006838] text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                    <CheckCircle className="w-3.5 h-3.5" /> Completed
                                  </span>
                                ) : stagePaid > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                    Partial
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-center text-sm font-medium text-gray-600">
                                {stage.completedDate
                                  ? new Date(stage.completedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : '--'}
                              </td>
                              <td className="p-4 text-center">
                                {stage.isCompleted ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#006838] text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                    <CheckCircle className="w-3.5 h-3.5" /> Completed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                                    <Clock className="w-3.5 h-3.5" /> In Progress
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: QUOTATION */}
            {activeTab === 'quotation' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between print:hidden">
                  <div>
                    <h1 className="text-3xl font-serif font-light text-gray-900">My Quotation</h1>
                    <p className="text-sm text-gray-500 mt-1">View your official project quotation preview.</p>
                  </div>
                </div>

                {!quotation ? (
                  <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100">
                    <p className="text-gray-500">Official quotation details not available yet.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-150 rounded-3xl p-8 shadow-sm space-y-8 print:shadow-none print:border-none print:p-0">
                    {/* Brand Header */}
                    <div className="flex justify-between items-start border-b pb-6">
                      <div>
                        <h1 className="text-2xl font-black text-[#0e623a] tracking-tight">JOHN BUILDWELL CONSTRUCTIONS</h1>
                        <p className="text-xs text-gray-400 mt-1">Premium Builders & Real Estate Developers</p>
                        <div className="text-[11px] text-gray-500 mt-2 space-y-0.5">
                          <div>Corporate Office: Bypass Road, Vannarpettai</div>
                          <div>Tirunelveli, Tamil Nadu - 627003</div>
                          <div>Contact: +91 94432 83634 | info@johnbuildwell.com</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <h2 className="text-xl font-bold text-gray-700">VALUATION ESTIMATE</h2>
                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                          <div><strong>Quote Ref:</strong> JB/QTN/{quotation._id?.substring(18).toUpperCase() || 'N/A'}</div>
                          <div><strong>Date:</strong> {new Date(quotation.createdAt).toLocaleDateString()}</div>
                          <div><strong>Valid Until:</strong> {new Date(new Date(quotation.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} (30 Days)</div>
                        </div>
                      </div>
                    </div>

                    {/* Client Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-6">
                      <div>
                        <h3 className="text-xs font-bold text-[#0e623a] uppercase tracking-wider block mb-2">Prepared For:</h3>
                        <div className="space-y-1.5">
                          <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{quotation.customerName}</span>
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{quotation.customerPhone}</span>
                          </div>
                          {quotation.customerAddress && (
                            <div className="text-xs text-gray-500 flex items-start gap-1.5">
                              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                              <span>{quotation.customerAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-[#0e623a] uppercase tracking-wider block mb-2">Project Association:</h3>
                        <div className="space-y-1.5">
                          <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{quotation.project?.name || 'Project Reference'}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <strong>Project Code:</strong> {quotation.project?.code || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            <strong>Project Type:</strong> {quotation.projectType}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quotation Valuation Table */}
                    <div className="space-y-2 overflow-x-auto pb-4">
                      <h3 className="text-xs font-bold text-[#0e623a] uppercase tracking-wider min-w-[600px]">Itemized Valuation Estimate:</h3>
                      <table className="w-full text-left border border-gray-150 rounded-2xl overflow-hidden min-w-[600px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500">
                            <th className="p-4">Description</th>
                            <th className="p-4">Type</th>
                            <th className="p-4 text-right">Units Selected</th>
                            <th className="p-4 text-right">Area (Sq.Ft)</th>
                            <th className="p-4 text-right">Rate / Sq.Ft</th>
                            <th className="p-4 text-right">Total Price</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
                          <tr>
                            <td className="p-4 font-semibold text-gray-800">
                              Proposed Layout Booking Valuation
                            </td>
                            <td className="p-4">{quotation.projectType}</td>
                            <td className="p-4 text-right font-bold">{quotation.selectedUnits?.join(', ') || flow.unitId}</td>
                            <td className="p-4 text-right">{quotation.totalArea} Sq.Ft</td>
                            <td className="p-4 text-right">Rs. {(quotation.pricePerSqFt || 0).toLocaleString()}</td>
                            <td className="p-4 text-right font-bold text-gray-800">Rs. {(quotation.totalValue || 0).toLocaleString()}</td>
                          </tr>
                          {/* Total Cost summary Row */}
                          <tr className="bg-emerald-50/20 font-bold border-t border-gray-200">
                            <td colSpan="5" className="p-4 text-right text-[#0e623a]">Base Valuation Cost:</td>
                            <td className="p-4 text-right text-base text-[#0e623a]">Rs. {(quotation.totalValue || 0).toLocaleString()}</td>
                          </tr>

                          {allExtraWorks.filter(ew => ['Sent to Customer', 'Client Approved', 'Added to CRD'].includes(ew.status)).length > 0 && (
                            <>
                              <tr className="bg-gray-50 border-t border-gray-200">
                                <td colSpan="6" className="p-4 font-bold text-gray-600 text-[10px] uppercase tracking-wider">
                                  Approved / Requested Extra Works
                                </td>
                              </tr>
                              {allExtraWorks.filter(ew => ['Sent to Customer', 'Client Approved', 'Added to CRD'].includes(ew.status)).map((work, idx) => (
                                <tr key={work._id || idx}>
                                  <td className="p-4" colSpan="2">
                                    <div className="font-semibold text-gray-800">{work.ewId ? `${work.ewId} - ` : ''}{work.name}</div>
                                    <div className="text-[10px] text-gray-500">{work.category} • {work.stageName}</div>
                                  </td>
                                  <td className="p-4 text-right font-bold">{work.quantity} {work.unit}</td>
                                  <td className="p-4 text-right" colSpan="2">
                                    {work.rate > 0 ? `Rs. ${work.rate.toLocaleString()}` : 'TBD'}
                                  </td>
                                  <td className="p-4 text-right font-bold text-gray-800">
                                    {work.amount > 0 ? `Rs. ${work.amount.toLocaleString()}` : 'TBD'}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-emerald-50/20 font-bold border-t border-gray-200">
                                <td colSpan="5" className="p-4 text-right text-[#0e623a]">Extra Works Total:</td>
                                <td className="p-4 text-right text-base text-[#0e623a]">Rs. {allExtraWorks.filter(ew => ['Sent to Customer', 'Client Approved', 'Added to CRD'].includes(ew.status)).reduce((sum, ew) => sum + (ew.amount || 0), 0).toLocaleString()}</td>
                              </tr>
                            </>
                          )}

                          {allExtraWorks.filter(ew => ['Sent to Customer', 'Client Approved', 'Added to CRD'].includes(ew.status)).length > 0 && (
                            <tr className="bg-[#0e623a] text-white font-bold border-t-2 border-[#0b4d2d]">
                              <td colSpan="5" className="p-4 text-right uppercase tracking-wider">Grand Total Valuation:</td>
                              <td className="p-4 text-right text-lg">Rs. {(quotation.totalValue + allExtraWorks.filter(ew => ['Sent to Customer', 'Client Approved', 'Added to CRD'].includes(ew.status)).reduce((sum, ew) => sum + (ew.amount || 0), 0)).toLocaleString()}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Customer ID & Bank Loan Info */}
                    {(quotation.alternativePhone || quotation.aadharNumber || quotation.panNumber || quotation.bankLoanRequired === 'Yes') && (
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                        <h3 className="text-[11px] font-bold text-[#0e623a] uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#0e623a]/75" />
                          <span>Financial details & Credentials</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          {quotation.alternativePhone && (
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Alt Phone</span>
                              <span className="font-semibold text-gray-700">{quotation.alternativePhone}</span>
                            </div>
                          )}
                          {quotation.aadharNumber && (
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Aadhar Card</span>
                              <span className="font-semibold text-gray-700">{quotation.aadharNumber}</span>
                            </div>
                          )}
                          {quotation.panNumber && (
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">PAN Card</span>
                              <span className="font-semibold text-gray-700">{quotation.panNumber}</span>
                            </div>
                          )}
                        </div>

                        {quotation.bankLoanRequired === 'Yes' && (
                          <div className="border-t pt-3 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Required Bank Loan</span>
                              <span className="font-semibold text-gray-700">Yes</span>
                            </div>
                            {quotation.loanAmount > 0 && (
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Loan amount / preferred bank</span>
                                <span className="font-semibold text-gray-700">Rs. {(quotation.loanAmount || 0).toLocaleString()} ({quotation.preferredBank || 'Any Bank'})</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Terms and Signature Footer */}
                    <div className="pt-12 grid grid-cols-2 gap-8 text-xs border-t">
                      <div>
                        <h4 className="font-bold text-[#0e623a]">Terms & Conditions:</h4>
                        <ul className="list-disc pl-4 mt-2 space-y-1 text-gray-400 text-[11px]">
                          <li>This is an estimate quotation copy valid for 30 days from date of issue.</li>
                          <li>Final pricing depends on plot dimensions at physical site registration.</li>
                          <li>Installment schedules must follow project payment milestone policies.</li>
                        </ul>
                      </div>
                      <div className="text-right flex flex-col justify-end items-end space-y-12">
                        <div className="text-[11px] text-gray-400">Authorized Signature, John Buildwell ERP</div>
                        <div className="border-t border-gray-300 w-48 pt-1 text-xs text-gray-700 font-bold">John Buildwell Developers</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: EXTRA WORKS */}
            {activeTab === 'extraworks' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-serif font-light text-gray-900">Extra Works Shop</h1>
                    <p className="text-sm text-gray-500 mt-1">Browse and request custom additions for your dream property.</p>
                  </div>
                </div>

                {extraWorkCatalog.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-12 text-center shadow-sm">
                    <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Catalog Available</h3>
                    <p className="text-gray-500 text-sm mt-1">Your builder hasn't published any standard extra works for this project yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Category Sidebar */}
                    <div className="w-full md:w-64 flex-shrink-0">
                      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-4 shadow-sm sticky top-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Categories</h3>
                        <div className="space-y-1">
                          {catalogCategories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                                selectedCategory === cat 
                                  ? 'bg-[#006838] text-white shadow-lg shadow-[#006838]/20' 
                                  : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setSelectedCategory('Other Requirements');
                            }}
                            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 mt-2 border border-dashed ${
                              selectedCategory === 'Other Requirements' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm' 
                                : 'text-gray-500 hover:bg-white/80 border-gray-200'
                            }`}
                          >
                            + Other Requirements
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Catalog Grid */}
                    <div className="flex-1">
                      {selectedCategory === 'Other Requirements' ? (
                        <div className="bg-white/60 backdrop-blur-xl border border-emerald-100 rounded-[2rem] p-8 shadow-sm flex flex-col">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                              <Plus className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">Custom Work Request</h3>
                              <p className="text-sm text-gray-500">Need something not in the catalog? Tell us what you need.</p>
                            </div>
                          </div>
                          
                          <form onSubmit={handleCustomWorkSubmit} className="space-y-5 bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Work Description / Sub Category</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Install custom Italian marble in living room..."
                                value={customWorkDesc}
                                onChange={(e) => setCustomWorkDesc(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#006838]/20 focus:border-[#006838] transition"
                              />
                            </div>
                            {flow.unitId && flow.unitId.includes(',') && (
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Unit</label>
                                <select
                                  value={customWorkForUnit || flow.unitId.split(',')[0].trim()}
                                  onChange={(e) => setCustomWorkForUnit(e.target.value)}
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#006838]/20 focus:border-[#006838] transition"
                                >
                                  {flow.unitId.split(',').map(u => <option key={u.trim()} value={u.trim()}>Unit {u.trim()}</option>)}
                                </select>
                              </div>
                            )}

                            <div className="pt-2">
                              <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00522c] transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                              >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Custom Request'}
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
                        {extraWorkCatalog.filter(item => item.category === selectedCategory).map((item) => {
                          const absoluteIdx = extraWorkCatalog.findIndex(c => c === item);
                          const isSelected = bulkSelections[absoluteIdx]?.selected || false;
                          
                          const getCategoryIcon = (cat) => {
                            const c = (cat || '').toLowerCase();
                            if (c.includes('bath') || c.includes('plumb')) return <Droplets className="w-10 h-10 opacity-40 text-blue-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('tile')) return <Grid className="w-10 h-10 opacity-40 text-amber-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('kitchen')) return <Utensils className="w-10 h-10 opacity-40 text-orange-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('elect')) return <Zap className="w-10 h-10 opacity-40 text-yellow-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('landscape') || c.includes('garden')) return <Trees className="w-10 h-10 opacity-40 text-emerald-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('floor')) return <Layout className="w-10 h-10 opacity-40 text-indigo-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('paint')) return <Paintbrush className="w-10 h-10 opacity-40 text-pink-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('civil') || c.includes('fabrication')) return <Hammer className="w-10 h-10 opacity-40 text-gray-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('ceiling')) return <Cloud className="w-10 h-10 opacity-40 text-cyan-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('staircase')) return <TrendingUp className="w-10 h-10 opacity-40 text-purple-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            if (c.includes('balcony')) return <Maximize className="w-10 h-10 opacity-40 text-teal-600 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                            return <Package className="w-10 h-10 opacity-40 text-[#006838] group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />;
                          };
                          
                          return (
                            <div key={absoluteIdx} className={`bg-white/60 backdrop-blur-xl border ${isSelected ? 'border-[#006838] shadow-lg shadow-[#006838]/20' : 'border-white/60'} rounded-[2rem] p-6 transition-all duration-500 group relative overflow-hidden flex flex-col`}>
                              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-4">
                                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    {item.unit}
                                  </span>
                                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50 flex-shrink-0">
                                    {getCategoryIcon(item.category)}
                                  </div>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">{item.name}</h4>
                              </div>
                              
                              <div className="mt-6 pt-4 border-t border-gray-100 flex items-end justify-between min-h-[4rem]">
                                <div>
                                  {item.rate > 0 && (
                                    <>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Estimated Rate</p>
                                      <p className="text-xl font-black text-[#006838]">
                                        Rs. {item.rate.toLocaleString()}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <button 
                                  onClick={() => {
                                    setBulkSelections(prev => {
                                      const current = prev[absoluteIdx] || { selected: false, quantity: 1, stageIdx: '' };
                                      return {
                                        ...prev,
                                        [absoluteIdx]: {
                                          ...current,
                                          selected: !current.selected,
                                          stageIdx: current.stageIdx === '' ? (flow.stages.findIndex(s => !s.isCompleted) !== -1 ? flow.stages.findIndex(s => !s.isCompleted) : '') : current.stageIdx
                                        }
                                      };
                                    });
                                  }}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg shrink-0 ${isSelected ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-900 text-white hover:bg-[#006838]'}`}
                                >
                                  {isSelected ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Floating Action Bar for Bulk Selection */}
                {Object.values(bulkSelections).some(s => s.selected) && (
                  <div className="fixed top-6 right-8 bg-gray-900 backdrop-blur-xl border border-gray-800 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 z-50 animate-fade-in-up hover:-translate-y-1 transition-transform shadow-[#006838]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#006838] text-white flex items-center justify-center font-black text-lg shadow-lg">
                        {Object.values(bulkSelections).filter(s => s.selected).length}
                      </div>
                    </div>
                    <button 
                      onClick={() => setPreviewModalOpen(true)} 
                      className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-[#006838] hover:text-white transition shadow-sm whitespace-nowrap"
                    >
                      Review & Request
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: REQUESTED WORKS */}
            {activeTab === 'requestedworks' && (() => {
              const filteredRequestedWorks = allExtraWorks.filter(ew => {
                if (requestedWorksTab === 'new') {
                  if (['Client Approved', 'Added to CRD', 'Rejected', 'Removed by Client', 'Cancelled by Superadmin'].includes(ew.status)) return false;
                }
                if (requestedWorksTab === 'agreed') {
                  if (!['Client Approved', 'Added to CRD'].includes(ew.status)) return false;
                }
                if (requestedWorksTab === 'cancelled') {
                  if (!['Rejected', 'Removed by Client', 'Cancelled by Superadmin'].includes(ew.status)) return false;
                }
                if (requestedWorksTab === 'history') {
                  // Show all in history, no status filter
                }
                if (requestedWorksStartDate && requestedWorksEndDate) {
                  const ewDate = new Date(ew.addedAt);
                  const start = new Date(requestedWorksStartDate);
                  const end = new Date(requestedWorksEndDate);
                  end.setHours(23, 59, 59, 999);
                  if (ewDate < start || ewDate > end) return false;
                }
                return true;
              }).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

              const groupedRequestedWorks = Object.values(filteredRequestedWorks.reduce((acc, ew) => {
                const id = ew.ewId || `NO_ID_${ew._id}`;
                if (!acc[id]) {
                  acc[id] = {
                    ewId: id,
                    displayId: ew.ewId,
                    addedAt: ew.addedAt,
                    category: 'Multiple Categories',
                    items: [],
                    totalAmount: 0,
                    status: ew.status
                  };
                }
                acc[id].items.push(ew);
                acc[id].totalAmount += (ew.amount || 0);
                return acc;
              }, {})).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

              return (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-serif font-light text-gray-900">Requested Extra Works</h1>
                    <p className="text-sm text-gray-500 mt-1">Track the status of all your custom requests.</p>
                  </div>
                  
                  {/* Filters & Sub-Tabs */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-white/60 p-1.5 rounded-xl shadow-sm">
                      <input
                        type="date"
                        value={requestedWorksStartDate}
                        onChange={(e) => setRequestedWorksStartDate(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#006838]"
                      />
                      <span className="text-xs text-gray-400 font-bold">to</span>
                      <input
                        type="date"
                        value={requestedWorksEndDate}
                        onChange={(e) => setRequestedWorksEndDate(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#006838]"
                      />
                    </div>

                    {/* Sub-Tabs */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-1 rounded-2xl inline-flex shadow-sm">
                      <button
                        onClick={() => setRequestedWorksTab('new')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
                          requestedWorksTab === 'new' 
                            ? 'bg-[#006838] text-white shadow-md' 
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        New
                        {allExtraWorks.filter(ew => ew.status === 'Sent to Customer').length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                      </button>
                      <button
                        onClick={() => setRequestedWorksTab('agreed')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          requestedWorksTab === 'agreed' 
                            ? 'bg-[#006838] text-white shadow-md' 
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Agreed
                      </button>
                      <button
                        onClick={() => setRequestedWorksTab('cancelled')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          requestedWorksTab === 'cancelled' 
                            ? 'bg-[#006838] text-white shadow-md' 
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Cancelled
                      </button>
                      <button
                        onClick={() => setRequestedWorksTab('history')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          requestedWorksTab === 'history' 
                            ? 'bg-[#006838] text-white shadow-md' 
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        History
                      </button>
                    </div>
                  </div>
                </div>

                {filteredRequestedWorks.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-12 text-center shadow-sm">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">
                      No {requestedWorksTab} requests found
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      You don't have any {requestedWorksTab} extra works at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-1 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#006838] text-white text-[10px] tracking-wider border-b border-[#00512c]">
                          <tr>
                            <th className="p-4 w-16 text-center font-bold uppercase">S.No</th>
                            <th className="p-4 font-bold uppercase">Req ID</th>
                            <th className="p-4 font-bold uppercase">Date</th>
                            <th className="p-4 font-bold uppercase">Project</th>
                            <th className="p-4 font-bold uppercase">Unit No</th>
                            <th className="p-4 font-bold uppercase">Category</th>
                            <th className="p-4 font-bold uppercase">Extra Work</th>
                            <th className="p-4 text-right font-bold uppercase">Est. Amount</th>
                            <th className="p-4 text-center font-bold uppercase">{requestedWorksTab === 'new' ? 'Action' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                          {groupedRequestedWorks.map((group, idx) => (
                            <React.Fragment key={idx}>
                              <tr 
                                className="hover:bg-emerald-50/30 transition cursor-pointer bg-white"
                                onClick={() => setExpandedReqIds(prev => ({ ...prev, [group.ewId]: !prev[group.ewId] }))}
                              >
                                <td className="p-4 text-center text-gray-400 font-bold flex items-center justify-center gap-2">
                                  {idx + 1}
                                  {expandedReqIds[group.ewId] ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </td>
                                <td className="p-4 text-xs font-bold text-[#006838]">{group.displayId || '-'}</td>
                                <td className="p-4 text-xs font-bold text-gray-600">{new Date(group.addedAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                  <div className="font-bold text-gray-900">{flow.project?.code || '-'}</div>
                                  <div className="text-[10px] text-gray-500 uppercase">{flow.project?.projectType || '-'}</div>
                                </td>
                                <td className="p-4 text-xs font-bold text-emerald-600">{flow.unitId || '-'}</td>
                                <td className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{group.items.length === 1 ? group.items[0].category : 'Multiple'}</td>
                                <td className="p-4"><div className="font-bold text-gray-900">{group.items.length} Items Requested</div></td>
                                <td className="p-4 text-right font-black text-[#006838]">Rs. {group.totalAmount.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                  <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border bg-gray-50 text-gray-600 border-gray-200">
                                    {group.items.length === 1 ? group.items[0].status || 'Pending' : 'Grouped Request'}
                                  </span>
                                </td>
                              </tr>
                              {expandedReqIds[group.ewId] && group.items.map((ew, childIdx) => (
                                <tr key={`${idx}-${childIdx}`} className="bg-gray-50/50 hover:bg-white transition border-l-4 border-[#006838]">
                                  <td className="p-4 text-center text-gray-400 font-bold text-xs">{idx + 1}.{childIdx + 1}</td>
                                  <td className="p-4 text-xs font-bold text-[#006838]/50">↳ {ew.ewId || '-'}</td>
                                  <td className="p-4 text-xs font-bold text-gray-400">{new Date(ew.addedAt).toLocaleDateString()}</td>
                                  <td className="p-4"></td>
                                  <td className="p-4"></td>
                                  <td className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{ew.category || 'General'}</td>
                                  <td className="p-4">
                                    <div className="font-bold text-gray-900">{ew.name}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">Qty: {ew.quantity || 1} {ew.unit ? `x ${ew.unit}` : ''} @ Rs. {ew.rate || 0}</div>
                                  </td>
                                  <td className="p-4 text-right font-black text-[#006838]">Rs. {(ew.amount || 0).toLocaleString()}</td>
                                  <td className="p-4 text-center flex items-center justify-center gap-2">
                                    {requestedWorksTab === 'new' ? (
                                      (ew.status === 'Sent to Customer' || ew.status === 'PED Approved') ? (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleCustomerApprove(ew.stageIdx, ew._id)}
                                            disabled={submitting}
                                            title="I Agree"
                                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 border border-emerald-100 shadow-sm"
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => setReviewModal({ open: true, stageIdx: ew.stageIdx, workId: ew._id })}
                                            disabled={submitting}
                                            title="Review / Negotiate Price"
                                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 border border-blue-100 shadow-sm"
                                          >
                                            <MessageSquare className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleCustomerRemove(ew.stageIdx, ew._id)}
                                            disabled={submitting}
                                            title="Remove Request"
                                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 border border-red-100 shadow-sm"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                          <CheckCircle className="w-3 h-3" /> {ew.status === 'Client Approved' ? 'I Agreed' : ew.status}
                                        </span>
                                      )
                                    ) : (
                                      ['Approved', 'Client Approved', 'Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed'].includes(ew.status) ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                          <CheckCircle className="w-3 h-3" /> {ew.status === 'Client Approved' ? 'I Agreed' : ew.status === 'Added to CRD' ? 'Work Order Issued' : ['Execution Sent to PED'].includes(ew.status) ? 'Execution Pending' : ew.status}
                                        </span>
                                      ) : ew.status === 'Rejected' || ew.status === 'Removed by Client' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider border border-red-100">
                                          <X className="w-3 h-3" /> {ew.status}
                                        </span>
                                      ) : ew.status === 'Sent to Customer' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                          <AlertTriangle className="w-3 h-3" /> Action Required
                                        </span>
                                      ) : (ew.status === 'Pending' || ew.status === 'PED Approved' || !ew.status) ? (
                                        <div className="flex items-center gap-2">
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                                            <Clock className="w-3 h-3" /> {ew.status === 'PED Approved' ? 'Pending' : (ew.status || 'Pending')}
                                          </span>
                                          <button 
                                            onClick={() => handleCustomerRemove(ew.stageIdx, ew._id)}
                                            disabled={submitting}
                                            title="Remove Request"
                                            className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-100">
                                          <Clock className="w-3 h-3" /> {ew.status}
                                        </span>
                                      )
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredRequestedWorks.filter(ew => requestedWorksTab === 'new' && ew.status === 'Sent to Customer').length > 0 && (
                      <div className="p-4 bg-white/40 border-t border-gray-100 flex flex-wrap items-center justify-end gap-4">
                        <button
                          onClick={() => setActiveTab('quotation')}
                          className="px-5 py-2 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2 text-sm shadow-sm"
                        >
                          <FileText className="w-4 h-4" /> Preview Quotation
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              setSubmitting(true);
                              const worksToApprove = allExtraWorks.filter(ew => ew.status === 'Sent to Customer');
                              for (const work of worksToApprove) {
                                await fetch(`${API_URL}/customer/extra-work/${work.stageIdx}/${work._id}/approve`, {
                                  method: 'POST',
                                  headers: { Authorization: `Bearer ${localStorage.getItem('customerToken')}` }
                                });
                              }
                              await fetchFlow();
                            } catch (err) {
                              alert('Failed to approve some items');
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                          disabled={submitting}
                          className="px-5 py-2 bg-[#006838] text-white font-bold rounded-lg hover:bg-[#00522c] transition flex items-center gap-2 shadow-sm text-sm disabled:opacity-50"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> I Agree to All & Send</>}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );})()}

            {/* TAB: COMPLAINTS */}
            {activeTab === 'complaints' && (() => {
              const filteredComplaints = flow.complaints?.filter(comp => {
                let matchesDate = true;
                if (complaintStartDate && complaintEndDate) {
                  const compDate = new Date(comp.reportedAt);
                  const start = new Date(complaintStartDate);
                  const end = new Date(complaintEndDate);
                  end.setHours(23, 59, 59, 999);
                  matchesDate = compDate >= start && compDate <= end;
                }
                const matchesSearch = !complaintSearchText || 
                  comp.description.toLowerCase().includes(complaintSearchText.toLowerCase()) || 
                  (comp.token && comp.token.toLowerCase().includes(complaintSearchText.toLowerCase()));
                return matchesDate && matchesSearch;
              }).sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)) || [];

              return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-serif font-light text-gray-900">Complaints</h1>
                    <p className="text-sm text-gray-500 mt-1">Track issues or raise new concerns.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-white/60 backdrop-blur-xl border border-white/60 p-1 rounded-xl shadow-sm">
                      <button 
                        onClick={() => setComplaintsView('table')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition ${complaintsView === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <List className="w-4 h-4" /> Table
                      </button>
                      <button 
                        onClick={() => setComplaintsView('cards')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition ${complaintsView === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <LayoutGrid className="w-4 h-4" /> Cards
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-white/60 p-1.5 rounded-xl shadow-sm px-3">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search complaints..."
                        value={complaintSearchText}
                        onChange={(e) => setComplaintSearchText(e.target.value)}
                        className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-gray-700 w-32 md:w-48 placeholder-gray-400"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-white/60 p-1.5 rounded-xl shadow-sm">
                      <input
                        type="date"
                        value={complaintStartDate}
                        onChange={(e) => setComplaintStartDate(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-400 font-bold">to</span>
                      <input
                        type="date"
                        value={complaintEndDate}
                        onChange={(e) => setComplaintEndDate(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <button 
                      onClick={() => setComplaintModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#ED1C24] text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Raise Complaint
                    </button>
                  </div>
                </div>

                {complaintsView === 'table' ? (
                  <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden animate-fade-in-up">
                    <div className="overflow-x-auto pb-2">
                      <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                        <thead className="bg-[#006838] text-white">
                          <tr>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center w-16">S.No</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Token</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Project</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Units</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Complaints</th>
                            <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-wider">Est. Amount</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">Status / Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                          {filteredComplaints.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="px-6 py-12 text-center text-gray-500 font-medium">
                                {flow.complaints?.length === 0 ? "You haven't reported any issues. We're glad everything is perfect!" : "No complaints found for the selected date range."}
                              </td>
                            </tr>
                          ) : (
                            filteredComplaints.map((comp, idx) => (
                              <tr key={idx} className="hover:bg-emerald-50/50 transition-colors cursor-pointer" onClick={() => setSelectedComplaint(comp)}>
                                <td className="px-6 py-4 text-center text-gray-400 font-bold">{idx + 1}</td>
                                <td className="px-6 py-4 font-mono font-bold text-[#006838]">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedComplaint(comp); }}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm"
                                    title="View Details & History"
                                  >
                                    <Activity className="w-3.5 h-3.5" />
                                    {comp.token || '-'}
                                  </button>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{new Date(comp.reportedAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{flow.project?.name || 'N/A'}</td>
                                <td className="px-6 py-4 font-bold text-emerald-600">{flow.unitId}</td>
                                <td className="px-6 py-4 text-gray-800 whitespace-normal min-w-[250px]">
                                  <div className="font-bold mb-1">{comp.title || 'Complaint'}</div>
                                  <div>{comp.description}</div>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-[#006838]">
                                  {comp.pedPrice > 0 ? `Rs. ${comp.pedPrice.toLocaleString()}` : (['Pending', 'Sent to PED'].includes(comp.status) ? 'TBD' : 'Rs. 0')}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {comp.status === 'Sent to Customer' ? (
                                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => handleComplaintApprove(comp._id)}
                                        disabled={submitting}
                                        title="I Agree"
                                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 border border-emerald-100 shadow-sm"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setComplaintReviewModal({ open: true, complaintId: comp._id })}
                                        disabled={submitting}
                                        title="Review / Negotiate Price"
                                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 border border-blue-100 shadow-sm"
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleComplaintRemove(comp._id)}
                                        disabled={submitting}
                                        title="Reject"
                                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 border border-red-100 shadow-sm"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
                                      ['Completed', 'Client Approved', 'Feedback Received'].includes(comp.status) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      comp.status === 'Sent to Client (Completed)' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                      ['In Progress', 'Start Work', 'Execution Sent to PED', 'Returned to CRD'].includes(comp.status) ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      ['Rejected', 'Removed by Client'].includes(comp.status) ? 'bg-red-50 text-red-600 border-red-100' :
                                      'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                      {comp.status === 'Client Approved' ? 'I Agreed' : comp.status || 'Pending'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
                    {filteredComplaints.length === 0 ? (
                      <div className="col-span-full bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-12 text-center text-gray-500 font-medium shadow-sm">
                        {flow.complaints?.length === 0 ? "You haven't reported any issues. We're glad everything is perfect!" : "No complaints found for the selected date range."}
                      </div>
                    ) : (
                      filteredComplaints.map((comp, idx) => (
                        <div key={idx} className="bg-[#050907]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_8px_30px_rgba(0,104,56,0.15)] overflow-hidden hover:shadow-[0_15px_40px_rgba(0,104,56,0.25)] hover:-translate-y-1 transition-all duration-300 relative group flex flex-col cursor-pointer" onClick={() => setSelectedComplaint(comp)}>
                          {/* Decorative Glacier Glows */}
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#006838]/30 rounded-full blur-[50px] pointer-events-none transition-all group-hover:bg-[#006838]/40"></div>
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                          
                          <div className="p-6 pb-0 flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">#{String(idx + 1).padStart(3, '0')}</span>
                            {comp.status === 'Sent to Customer' ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleComplaintApprove(comp._id)}
                                  disabled={submitting}
                                  title="I Agree"
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 border border-emerald-500/30 shadow-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setComplaintReviewModal({ open: true, complaintId: comp._id })}
                                  disabled={submitting}
                                  title="Review / Negotiate Price"
                                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 border border-blue-500/30 shadow-sm"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleComplaintRemove(comp._id)}
                                  disabled={submitting}
                                  title="Reject"
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 border border-red-500/30 shadow-sm"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-xl border shadow-sm ${
                                ['Completed', 'Client Approved', 'Feedback Received'].includes(comp.status) ? 'bg-[#006838]/20 text-emerald-400 border-emerald-500/30' :
                                ['In Progress', 'Start Work', 'Execution Sent to PED', 'Returned to CRD'].includes(comp.status) ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                comp.status === 'Sent to Client (Completed)' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                ['Rejected', 'Removed by Client'].includes(comp.status) ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                'bg-white/5 text-gray-400 border-white/10'
                              }`}>
                                {comp.status === 'Client Approved' ? 'I Agreed' : comp.status || 'Pending'}
                              </span>
                            )}
                          </div>
                          
                          <div className="p-6 relative z-10 flex-1 flex flex-col">
                            <h4 className="text-white text-lg font-bold mb-2 leading-tight">{comp.title || 'Complaint'}</h4>
                            <p className="text-gray-200 text-sm font-medium leading-relaxed mb-6 flex-1">{comp.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
                              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                {new Date(comp.reportedAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                <Building className="w-3.5 h-3.5 text-gray-500" />
                                Unit {flow.unitId}
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-white">
                              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Est. Amount</span>
                              <span className="font-bold text-emerald-400">
                                {comp.pedPrice > 0 ? `Rs. ${comp.pedPrice.toLocaleString()}` : (['Pending', 'Sent to PED'].includes(comp.status) ? 'TBD' : 'Rs. 0')}
                              </span>
                            </div>
                          </div>

                          <div className="bg-[#006838]/10 border-t border-white/10 p-4 flex items-center justify-between relative z-10 mt-auto">
                            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Tracking Token</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-black text-emerald-400 tracking-widest bg-[#050907] px-3 py-1 rounded-md shadow-sm border border-[#006838]/30">
                                {comp.token || '-'}
                              </span>
                              {comp.token && (
                                <button 
                                  onClick={() => { navigator.clipboard.writeText(comp.token); alert('Token copied!'); }}
                                  className="w-7 h-7 rounded flex items-center justify-center bg-[#050907] text-gray-400 border border-white/10 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-[#006838]/20 transition-all shadow-sm"
                                  title="Copy Token"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );})()}

          </div>
        </div>
      </main>

      {/* Extra Work Modal */}
      {extraWorkModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">Request Customization</h3>
              <button onClick={() => setExtraWorkModal({ open: false, stageIdx: null })} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddExtraWork} className="p-8 space-y-5">
              <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">You are requesting custom additional work.</p>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">What do you want to customize?</label>
                <input type="text" required value={extraName} onChange={e => setExtraName(e.target.value)} placeholder="e.g., Premium Italian Tiles" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:border-[#006838] focus:ring-2 focus:ring-[#006838]/10 transition shadow-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Estimated Budget (Rs)</label>
                <input type="number" required value={extraAmount} onChange={e => setExtraAmount(e.target.value)} placeholder="e.g., 50000" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:border-[#006838] focus:ring-2 focus:ring-[#006838]/10 transition shadow-sm" />
              </div>
              <button type="submit" disabled={submitting} className="w-full py-4 mt-4 bg-[#006838] hover:bg-[#00512c] text-white rounded-xl font-bold text-sm tracking-wide transition shadow-lg shadow-[#006838]/30 flex justify-center">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review / Negotiate Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">Add Notes for Review</h3>
              <button onClick={() => setReviewModal({ open: false, stageIdx: null, workId: null })} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCustomerReview} className="p-8 space-y-5">
              <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">Ask questions or request price negotiation for this item.</p>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Your Notes <span className="text-red-500">*</span></label>
                <textarea required value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="e.g., Can we do this for Rs. 40,000?" rows="4" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:border-[#006838] focus:ring-2 focus:ring-[#006838]/10 transition shadow-sm resize-none"></textarea>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm tracking-wide transition shadow-lg shadow-blue-600/30 flex justify-center">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Review Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Review / Negotiate Modal */}
      {complaintReviewModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">Add Notes for Review</h3>
              <button onClick={() => setComplaintReviewModal({ open: false, complaintId: null })} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleComplaintReview} className="p-8 space-y-5">
              <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">Ask questions or request price negotiation for this complaint.</p>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Your Notes <span className="text-red-500">*</span></label>
                <textarea required value={complaintReviewNote} onChange={e => setComplaintReviewNote(e.target.value)} placeholder="e.g., Can we fix this for free?" rows="4" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:border-[#006838] focus:ring-2 focus:ring-[#006838]/10 transition shadow-sm resize-none"></textarea>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm tracking-wide transition shadow-lg shadow-blue-600/30 flex justify-center">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Review Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Success Modal */}
      {complaintSuccessToken && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          
          {/* Custom Emoji Burst */}
          <div className="absolute inset-0 pointer-events-none z-[80] flex items-center justify-center overflow-hidden">
            {Array.from({ length: 25 }).map((_, i) => {
              const angle = (i / 25) * Math.PI * 2;
              const distance = 100 + Math.random() * 200;
              const tx = Math.cos(angle) * distance;
              const ty = Math.sin(angle) * distance - 50; // shift up slightly
              const rot = Math.random() * 360 - 180;
              return (
                <div 
                  key={i} 
                  className="absolute animate-emoji-burst text-4xl drop-shadow-lg"
                  style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, '--rot': `${rot}deg` }}
                >
                  😢
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up text-center relative p-10 border border-white/20">
            {/* Decorative BG */}
            <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-50px] right-[-50px] w-[150px] h-[150px] bg-[#006838]/10 rounded-full blur-[60px] pointer-events-none z-0"></div>
            
            <button onClick={() => setComplaintSuccessToken(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition z-10 shadow-sm"><X className="w-5 h-5" /></button>
            
            <div className="relative z-10 w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-red-100 to-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100 animate-sad-pop">
              <Frown className="w-12 h-12 md:w-16 md:h-16 relative z-10" />
              <div className="absolute top-[45%] left-[35%] w-2 h-3 bg-blue-400 rounded-full animate-tear z-20"></div>
              <div className="absolute top-[45%] right-[35%] w-2 h-3 bg-blue-400 rounded-full animate-tear-delayed z-20"></div>
            </div>
            
            <h3 className="font-bold text-2xl text-gray-900 mb-3 relative z-10 tracking-tight">We're sorry to hear that!</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed relative z-10">
              Your complaint has been safely submitted to the <strong className="text-gray-900">John Buildwell CRD Team</strong>. Please save your tracking token below to monitor your status.
            </p>
            
            <div className="relative z-10 bg-gray-50/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-5 mb-8 flex items-center justify-between shadow-sm group hover:border-emerald-200 transition-colors">
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Token</p>
                <p className="text-3xl font-mono font-black text-[#006838] tracking-widest">{complaintSuccessToken}</p>
              </div>
              <button 
                onClick={handleCopyToken}
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-[#006838] hover:border-emerald-100 hover:bg-emerald-50 transition-all active:scale-95"
                title="Copy Token"
              >
                {copiedToken ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            
            <button 
              onClick={() => setComplaintSuccessToken(null)}
              className="relative z-10 w-full py-4 bg-gradient-to-r from-[#006838] to-[#004d2a] hover:from-[#00512c] hover:to-[#003b20] text-white rounded-xl font-bold tracking-wide transition shadow-xl shadow-[#006838]/20 flex items-center justify-center gap-2"
            >
              Okay, Got it
            </button>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up border border-red-100">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-lg text-red-600 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Raise a Complaint</h3>
              <button onClick={() => setComplaintModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRaiseComplaint} className="p-8 space-y-5">
              <p className="text-sm text-gray-500 mb-6 bg-red-50 p-4 rounded-xl border border-red-100 text-red-800 font-medium">Please describe your concern. Our team will look into it immediately.</p>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Complaint Title</label>
                <input required value={complaintTitle} onChange={e => setComplaintTitle(e.target.value)} placeholder="Short title for your issue..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition shadow-sm mb-4" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Description of Issue</label>
                <textarea required value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} placeholder="Describe your issue in detail..." rows="5" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition shadow-sm resize-none"></textarea>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Attach Images (Optional)</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={e => setComplaintImages(Array.from(e.target.files))}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 transition"
                />
                {complaintImages.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500">{complaintImages.length} image(s) selected</p>
                )}
              </div>
              <button type="submit" disabled={submitting} className="w-full py-4 mt-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm tracking-wide transition shadow-lg shadow-red-600/30 flex justify-center">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Complaint'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Selected Complaint Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => setSelectedComplaint(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-xl text-gray-900">Complaint Details</h3>
              <button onClick={() => setSelectedComplaint(null)} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="mb-6">
                <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border mb-4 ${
                  selectedComplaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  selectedComplaint.status === 'In Progress' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {selectedComplaint.status || 'Pending'}
                </span>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedComplaint.title || 'Complaint'}</h4>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{selectedComplaint.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1">Token</p>
                  <p className="font-mono font-bold text-[#006838]">{selectedComplaint.token || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1">Date Reported</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedComplaint.reportedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div className="mb-6">
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-3">Attached Images</p>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {selectedComplaint.images.map((imgUrl, i) => (
                      <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 block">
                        <img src={imgUrl} alt={`Attachment ${i+1}`} className="w-32 h-32 object-cover rounded-xl border border-gray-200 shadow-sm hover:opacity-80 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-3">Activity History</p>
                {(() => {
                  const hiddenActions = [
                    'Sent to PED',
                    'Sent to Customer',
                    'Complaint Assigned',
                    'Execution Sent to PED',
                    'Execution Status Updated'
                  ];
                  const compHistory = flow?.history?.filter(h => 
                    h.notes && 
                    h.notes.includes(selectedComplaint.token) &&
                    !hiddenActions.some(hidden => h.action.includes(hidden))
                  ) || [];
                  
                  if (compHistory.length === 0) return <p className="text-sm text-gray-500 italic">No activity yet.</p>;
                  return (
                    <div className="relative border-l-2 border-emerald-200 ml-2 space-y-4">
                      {compHistory.map((h, i) => (
                        <div key={i} className="relative pl-5">
                          <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#006838] border-4 border-white shadow-sm" />
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-gray-800 text-sm">
                                {h.action === 'PED Pricing Updated' ? 'Price Quoted / Updated' : h.action}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                {new Date(h.timestamp || h.date).toLocaleString('en-GB', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit', hour12: true
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                              {h.action === 'PED Pricing Updated' ? 
                                h.notes.replace(/PED team updated price/i, 'Team updated price') : 
                                h.notes}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Catalog Request Modal */}
      {catalogModalOpen && selectedCatalogItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-light text-gray-900">Request Item</h3>
                <button onClick={() => setCatalogModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{selectedCatalogItem.category}</p>
                <p className="font-bold text-gray-900 mb-2">{selectedCatalogItem.name}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Rate: <span className="font-bold text-gray-900">Rs. {selectedCatalogItem.rate?.toLocaleString() || 0}</span> / {selectedCatalogItem.unit}</span>
                </div>
              </div>

              <form onSubmit={handleRequestCatalogItem} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity ({selectedCatalogItem.unit})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={catalogQuantity}
                    onChange={(e) => setCatalogQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#006838]/20 focus:border-[#006838] transition"
                  />
                </div>
                {flow.unitId && flow.unitId.includes(',') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Unit</label>
                    <select
                      value={catalogForUnit || flow.unitId.split(',')[0].trim()}
                      onChange={(e) => setCatalogForUnit(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#006838]/20 focus:border-[#006838] transition"
                    >
                      {flow.unitId.split(',').map(u => <option key={u.trim()} value={u.trim()}>Unit {u.trim()}</option>)}
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Estimated</p>
                    <p className="text-lg font-black text-[#006838]">
                      Rs. {(catalogQuantity * (selectedCatalogItem.rate || 0)).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00522c] transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BULK PREVIEW MODAL */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewModalOpen(false)}></div>
          <div className="relative bg-[#f8fafc] w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
            <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Review Requested Works</h3>
                  <p className="text-sm text-gray-500">Please assign quantities and billing stages.</p>
                </div>
                {flow.unitId && flow.unitId.includes(',') && (
                  <div className="ml-6 border-l border-gray-200 pl-6 hidden md:block">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Select Unit</label>
                    <select
                      value={bulkForUnit || flow.unitId.split(',')[0].trim()}
                      onChange={(e) => setBulkForUnit(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[#006838]"
                    >
                      {flow.unitId.split(',').map(u => <option key={u.trim()} value={u.trim()}>Unit {u.trim()}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              <div className="space-y-4">
                {Object.keys(bulkSelections).filter(idx => bulkSelections[idx].selected).length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-bold">No items selected.</div>
                ) : (
                  Object.keys(bulkSelections).filter(idx => bulkSelections[idx].selected).map(idx => {
                    const item = flow.project.extraWorkCatalog[idx];
                    const sel = bulkSelections[idx];
                    return (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">{item.category}</span>
                          <h4 className="text-sm font-bold text-gray-900 mt-1">{item.name}</h4>
                          <div className="text-xs text-gray-500 mt-1">Rate: {item.rate > 0 ? `Rs. ${item.rate.toLocaleString()}` : 'TBD'} / {item.unit}</div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                          <div className="w-24">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Quantity</label>
                            <input 
                              type="number" 
                              min="1"
                              value={sel.quantity}
                              onChange={(e) => {
                                setBulkSelections(prev => ({
                                  ...prev,
                                  [idx]: { ...sel, quantity: Number(e.target.value) }
                                }));
                              }}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#006838]/20 focus:border-[#006838]"
                            />
                          </div>
                          <button 
                            onClick={() => {
                              setBulkSelections(prev => {
                                const newSelections = { ...prev };
                                newSelections[idx].selected = false;
                                return newSelections;
                              });
                            }}
                            className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors md:mt-4 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Estimated Amount</p>
                <p className="text-xl font-black text-[#006838]">
                  Rs. {Object.keys(bulkSelections).filter(idx => bulkSelections[idx].selected).reduce((acc, idx) => acc + (flow.project.extraWorkCatalog[idx].rate * bulkSelections[idx].quantity), 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  handleBulkSubmit();
                  setPreviewModalOpen(false);
                }}
                disabled={submitting || Object.keys(bulkSelections).filter(idx => bulkSelections[idx].selected).length === 0}
                className="px-8 py-3 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00522c] transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send to CRD Team'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
