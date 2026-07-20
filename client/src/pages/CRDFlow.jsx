import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Building, 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  Plus, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Printer, 
  AlertCircle, 
  Paperclip,
  Check,
  BookOpen,
  History,
  Clock,
  Trash,
  ArrowRightCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Layers,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react';

const defaultStagesTemplate = [
  { name: 'On Booking', percentage: 5 },
  { name: 'Agreement & Deed Regn.', percentage: 35 },
  { name: 'On completion of the Foundation', percentage: 10 },
  { name: 'On completion of Stilt Floor Slab', percentage: 10 },
  { name: 'On completion of First Floor Roof Slab', percentage: 10 },
  { name: 'On completion of Second Floor Roof Slab', percentage: 10 },
  { name: 'On completion of Third Floor Roof Slab', percentage: 10 },
  { name: 'On Completion of Fourth Floor Roof Slab', percentage: 5 },
  { name: 'On Completion of Fifth Floor Roof Slab', percentage: 3 },
  { name: 'Extra Works', percentage: 0 },
  { name: 'On Handing Over', percentage: 2 }
];

// Helper to convert number to Indian words
function numberToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4]]) + 'Hundred ' : '';
  str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : '';
  return str.trim() ? str + 'Rupees Only' : 'Zero Rupees';
}

const CRDFlow = () => {
  const { token, user, hasColumnPermission } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [flows, setFlows] = useState([]);
  const [users, setUsers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Current active flow details
  const [activeFlow, setActiveFlow] = useState(null);
  
  // Stages configuration if not initialized
  const [excelStages, setExcelStages] = useState([]);
  const [fileName, setFileName] = useState('');
  
  // Extra work input
  const [extraWorkName, setExtraWorkName] = useState('');
  const [extraWorkAmount, setExtraWorkAmount] = useState('');
  const [extraWorkStageIdx, setExtraWorkStageIdx] = useState(null);
  
  // Payment split input
  const [paymentStageIdx, setPaymentStageIdx] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Customer Transfer');
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Bank details input
  const [acNo, setAcNo] = useState('');
  const [acName, setAcName] = useState('');
  const [bankName, setBankName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanBank, setLoanBank] = useState('');

  // Filters
  const [filterProjectCode, setFilterProjectCode] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [actionMenuId, setActionMenuId] = useState(null);

  // Dual Mode amounts
  const [dualTransferAmount, setDualTransferAmount] = useState('');
  const [dualLoanAmount, setDualLoanAmount] = useState('');

  // 5 PDFs for stage 2
  const [pdfFiles, setPdfFiles] = useState(['', '', '', '', '']);

  // Demand Letter modal
  const [demandLetterStageIdx, setDemandLetterStageIdx] = useState(null);

  // Document Preview modal
  const [previewingDoc, setPreviewingDoc] = useState(null);

  // Completion Notes Modal
  const [completeStageIdx, setCompleteStageIdx] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelNarration, setCancelNarration] = useState('');

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [sheetPreviewModalOpen, setSheetPreviewModalOpen] = useState(false);
  const [expandedStages, setExpandedStages] = useState({});
  const [extraWorkDetailsModal, setExtraWorkDetailsModal] = useState(null);

  const toggleStage = (idx) => {
    setExpandedStages(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    fetchProjectsAndBookings();
  }, [token]);

  useEffect(() => {
    if (activeFlow) {
      setFlows(prev => {
        const idx = prev.findIndex(f => f._id === activeFlow._id);
        if (idx !== -1) {
          const newFlows = [...prev];
          newFlows[idx] = activeFlow;
          return newFlows;
        }
        return [...prev, activeFlow];
      });
    }
  }, [activeFlow]);

  const fetchProjectsAndBookings = async () => {
    try {
      setLoading(true);
      const projRes = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leadRes = await fetch(`${API_URL}/leads?status=Booking,Cancelled&crdView=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const flowsRes = await fetch(`${API_URL}/crd-flow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const quotRes = await fetch(`${API_URL}/quotations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersRes = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (projRes.ok && leadRes.ok) {
        const projData = await projRes.json();
        const leadData = await leadRes.json();
        setProjects(projData);
        setBookings(leadData);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      }
      if (flowsRes.ok) {
        const flowsData = await flowsRes.json();
        setFlows(flowsData);
      }
      if (quotRes.ok) {
        const quotData = await quotRes.json();
        setQuotations(quotData);
      }
    } catch (err) {
      setError('Connection error fetching master items');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projId) => {
    setSelectedProjectId(projId);
    setSelectedBookingId('');
    setActiveFlow(null);
    setExcelStages([]);
    setFileName('');
  };

  const autoInitializeFlow = async (leadId) => {
    const selectedBooking = bookings.find(b => b._id === leadId);
    if (!selectedBooking) return;
    const projId = selectedBooking.project?._id || selectedBooking.project;
    
    try {
      // Get the project to see if there is a master CRD format
      const res = await fetch(`${API_URL}/projects/${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch project');
      const projectData = await res.json();
      
      const quot = quotations.find(q => (q.lead?._id || q.lead) === leadId);
      const valuation = quot ? quot.totalValue : (selectedBooking?.bookingInfo?.selectedUnits?.length 
        ? selectedBooking.bookingInfo.selectedUnits.length * (projectData.pricePerSqFt || 2000) * 1000
        : 2500000);
      
      let sumAmount = 0;
      const parsedStages = defaultStagesTemplate.map((stage, idx) => {
        let amount = Math.round((stage.percentage / 100) * valuation);
        if (idx === defaultStagesTemplate.length - 1) {
          amount = valuation - sumAmount;
        } else {
          sumAmount += amount;
        }
        return {
          name: stage.name,
          percentage: stage.percentage,
          amount: amount
        };
      });
      
      const payload = {
        leadId: leadId,
        projectId: projId,
        unitId: selectedBooking.bookingInfo?.selectedUnits?.join(', ') || 'JMDP1',
        stages: parsedStages,
        totalOriginalValue: valuation
      };
      
      const initRes = await fetch(`${API_URL}/crd-flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (initRes.ok) {
        const newFlow = await initRes.json();
        setActiveFlow(newFlow);
        setSuccess('Milestone payment workflow initialized successfully!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setError('Error automatically initializing CRD flow');
    }
  };

  const handleBookingSelect = async (leadId) => {
    setSelectedBookingId(leadId);
    setActiveFlow(null);
    setExcelStages([]);
    setFileName('');
    if (!leadId) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow/booking/${leadId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data._id) {
          setActiveFlow(data);
        } else {
          await autoInitializeFlow(leadId);
        }
      } else if (res.status === 404) {
          await autoInitializeFlow(leadId);
      }
    } catch (err) {
      setError('Error loading booking milestone stages');
    } finally {
      setLoading(false);
    }
  };

  // Simulate parsing the Excel stage configuration
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const selectedBooking = bookings.find(b => b._id === selectedBookingId);
      const quot = quotations.find(q => (q.lead?._id || q.lead) === selectedBookingId);
      const valuation = quot ? quot.totalValue : (selectedBooking?.bookingInfo?.selectedUnits?.length 
        ? selectedBooking.bookingInfo.selectedUnits.length * (selectedBooking.project?.pricePerSqFt || 2000) * 1000
        : 2500000);
      
      let sumAmount = 0;
      const parsed = defaultStagesTemplate.map((stage, idx) => {
        let amount = Math.round((stage.percentage / 100) * valuation);
        if (idx === defaultStagesTemplate.length - 1) {
          amount = valuation - sumAmount;
        } else {
          sumAmount += amount;
        }
        return {
          name: stage.name,
          percentage: stage.percentage,
          amount: amount
        };
      });
      setExcelStages(parsed);
    }
  };

  const handleLoadPresetTemplate = () => {
    setFileName('Preset_Stages_Template.xlsx');
    const selectedBooking = bookings.find(b => b._id === selectedBookingId);
    const quot = quotations.find(q => (q.lead?._id || q.lead) === selectedBookingId);
    const valuation = quot ? quot.totalValue : (selectedBooking?.bookingInfo?.selectedUnits?.length 
      ? selectedBooking.bookingInfo.selectedUnits.length * 1500 * 2000 
      : 3500000);
    
    let sumAmount = 0;
    const parsed = defaultStagesTemplate.map((stage, idx) => {
      let amount = Math.round((stage.percentage / 100) * valuation);
      if (idx === defaultStagesTemplate.length - 1) {
        amount = valuation - sumAmount;
      } else {
        sumAmount += amount;
      }
      return {
        name: stage.name,
        percentage: stage.percentage,
        amount: amount
      };
    });
    setExcelStages(parsed);
  };

    const handleLoadMasterCRDFormat = async () => {
    const selectedBooking = bookings.find(b => b._id === selectedBookingId);
    if (!selectedBooking) return;
    const projId = selectedBooking.project?._id || selectedBooking.project;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/projects/${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const projectData = await res.json();
        if (projectData.crdFlowSheet && projectData.crdFlowSheet.link) {
          setFileName(projectData.crdFlowSheet.name || 'Master_CRD_Format.xlsx');
          
          // Simulate parsing the master excel sheet
          const quot = quotations.find(q => (q.lead?._id || q.lead) === selectedBookingId);
          const valuation = quot ? quot.totalValue : (selectedBooking?.bookingInfo?.selectedUnits?.length 
            ? selectedBooking.bookingInfo.selectedUnits.length * (projectData.pricePerSqFt || 2000) * 1000
            : 2500000);
          
          let sumAmount = 0;
          const parsed = defaultStagesTemplate.map((stage, idx) => {
            let amount = Math.round((stage.percentage / 100) * valuation);
            if (idx === defaultStagesTemplate.length - 1) {
              amount = valuation - sumAmount;
            } else {
              sumAmount += amount;
            }
            return {
              name: stage.name,
              percentage: stage.percentage,
              amount: amount
            };
          });
          setExcelStages(parsed);
          setSuccess('Loaded Project Master CRD Format successfully!');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('No Master CRD Flow Format found for this project. Please upload it in Project Details.');
          setTimeout(() => setError(''), 4000);
        }
      }
    } catch (err) {
      setError('Error loading Master CRD Format');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeFlow = async () => {
    const selectedBooking = bookings.find(b => b._id === selectedBookingId);
    if (!selectedBooking) return;

    const totalValuation = excelStages.reduce((sum, s) => sum + s.amount, 0);

    const payload = {
      leadId: selectedBookingId,
      projectId: selectedBooking.project?._id || selectedBooking.project,
      unitId: selectedBooking.bookingInfo?.selectedUnits?.join(', ') || 'JMDP1',
      stages: excelStages,
      totalOriginalValue: totalValuation
    };

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setActiveFlow(data);
        setSuccess('Milestone payment workflow initialized successfully!');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to initialize milestone flow');
      }
    } catch (err) {
      setError('Connection error initializing flow');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExtraWork = async (e) => {
    e.preventDefault();
    if (!extraWorkName || !extraWorkAmount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/crd-flow/${activeFlow._id}/stage/${extraWorkStageIdx}/extra-work`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: extraWorkName,
          amount: Number(extraWorkAmount)
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setActiveFlow(updated);
        setExtraWorkName('');
        setExtraWorkAmount('');
        setExtraWorkStageIdx(null);
        setSuccess('Extra work added & total valuation updated!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error adding extra work');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertExtraWork = async (stageIdx, workId) => {
    if (!window.confirm("Are you sure you want to revert/remove this extra work? This will deduct the split amounts from the current and next stages.")) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/crd-flow/${activeFlow._id}/stage/${stageIdx}/extra-work/${workId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveFlow(updated);
        setSuccess('Extra work reverted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to revert extra work');
      }
    } catch (err) {
      setError('Error reverting extra work');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoPrepareDocs = () => {
    if (!activeFlow) return;
    const customerName = activeFlow.lead?.name?.replace(/\s+/g, '_') || 'Customer';
    const projCode = activeFlow.project?.code || 'PROJECT';
    const unitId = activeFlow.unitId?.replace(/\s+/g, '_') || 'UNIT';

    const prepared = [
      `${projCode}_Agreement_of_Sale_${customerName}_Unit_${unitId}.pdf`,
      `${projCode}_Construction_Agreement_${customerName}_Unit_${unitId}.pdf`,
      `${projCode}_Deed_of_Sale_Draft_${customerName}_Unit_${unitId}.pdf`,
      `${projCode}_Stamped_Property_Schedule_${customerName}_Unit_${unitId}.pdf`,
      `${projCode}_Registration_Challan_${customerName}_Unit_${unitId}.pdf`
    ];
    setPdfFiles(prepared);
    setSuccess('All 5 registration documents auto-prepared successfully!');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleSingleFileUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newPdfs = [...pdfFiles];
      newPdfs[index] = file.name;
      setPdfFiles(newPdfs);
    }
  };

  const handlePDFSubmit = async (stageIdx) => {
    // Stage 2 completion logic: requires 5 PDFs
    if (pdfFiles.filter(f => f.trim() !== '').length < 5) {
      alert('Please fill out/upload all 5 PDFs for the Agreement & Deed registration stage!');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/crd-flow/${activeFlow._id}/stage/${stageIdx}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uploadedPdfs: pdfFiles, completionNotes })
      });

      if (res.ok) {
        const updated = await res.json();
        setActiveFlow(updated);
        setSuccess('Stage completed successfully with uploaded documents!');
        setCompletionNotes('');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError('Failed to complete stage document check');
    }
  };

  const handleStageComplete = async (stageIdx) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/crd-flow/${activeFlow._id}/stage/${stageIdx}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completionNotes })
      });

      if (res.ok) {
        const updated = await res.json();
        setActiveFlow(updated);
        setSuccess('Stage marked as completed!');
        setCompleteStageIdx(null);
        setCompletionNotes('');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError('Error completing stage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (e) => {
    e.preventDefault();
    if (!cancelNarration.trim()) {
      alert('Narration is required to request cancellation');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/crd-flow/${activeFlow._id}/cancel-request`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ narration: cancelNarration })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveFlow(updated);
        setSuccess('Cancellation request sent successfully!');
        setCancelModalOpen(false);
        setCancelNarration('');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await res.json();
        alert(data.message || 'Error requesting cancellation');
      }
    } catch (err) {
      setError('Failed to request cancellation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnPayment = async () => {
    if (!window.confirm('Are you sure you want to return the payment and make the unit available?')) return;
    try {
      const res = await fetch(`${API_URL}/crd-flow/${activeFlow._id}/return-payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveFlow(updated);
        setSuccess('Payment returned successfully. Units freed up.');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await res.json();
        alert(data.message || 'Error returning payment');
      }
    } catch (err) {
      setError('Failed to return payment');
    }
  };

  const handleToggleBankLoan = async (currentStatus) => {
    const newStatus = currentStatus === 'Yes' ? 'No' : 'Yes';
    try {
      const res = await fetch(`${API_URL}/leads/${selectedBookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bankLoan: newStatus })
      });
      if (res.ok) {
        setBookings(bookings.map(b => b._id === selectedBookingId ? { ...b, bankLoan: newStatus } : b));
        setSuccess(`Bank Loan requirement updated to ${newStatus}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update Bank Loan status');
      }
    } catch (err) {
      setError('Connection error updating Bank Loan status');
    }
  };

  const handleUpdateAssignedTo = async (newUserId) => {
    try {
      const res = await fetch(`${API_URL}/leads/${selectedBookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo: newUserId })
      });
      if (res.ok) {
        const updatedLead = await res.json();
        
        // Update bookings state
        setBookings(bookings.map(b => b._id === selectedBookingId ? { ...b, assignedTo: updatedLead.lead?.assignedTo || newUserId } : b));
        
        // Update flows state (since some places might read lead from flow)
        setFlows(flows.map(f => f.lead?._id === selectedBookingId ? { 
            ...f, 
            lead: { ...f.lead, assignedTo: updatedLead.lead?.assignedTo || newUserId } 
        } : f));
        
        setSuccess('Assigned Executive updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update Assigned Executive');
      }
    } catch (err) {
      setError('Connection error updating Assigned Executive');
    }
  };

  const handleToggleStageCompletion = async (stageIdx, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/crd-flow/${activeFlow._id}/stage/${stageIdx}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      if (res.ok) {
        const updatedRes = await fetch(`${API_URL}/crd-flow/booking/${selectedBookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const updated = await updatedRes.json();
        setActiveFlow(updated);
        setSuccess(`Stage marked as ${!currentStatus ? 'Completed' : 'In Progress'}`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error toggling stage completion');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();

    let payload = {};
    if (paymentMethod === 'Dual Mode') {
      payload = {
        payments: [
          { method: 'Customer Transfer', amount: Number(dualTransferAmount), details: {} },
          { method: 'Bank Loan', amount: Number(dualLoanAmount), details: {} }
        ]
      };
    } else {
      payload = {
        method: paymentMethod,
        amount: Number(paymentAmount),
        details: {}
      };
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/crd-flow/${activeFlow._id}/stage/${paymentStageIdx}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedRes = await fetch(`${API_URL}/crd-flow/booking/${selectedBookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const updated = await updatedRes.json();
        
        setActiveFlow(updated);
        setPaymentStageIdx(null);
        setPaymentAmount('');
        setPdfFiles(['', '', '', '', '']);
        setSuccess('Payment submitted successfully!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError('Error posting payment details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStageTotal = (stage) => {
    return stage.amount;
  };

  const getStagePaid = (stage) => {
    return stage.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  };

  const getPendingPreviousStages = (idx) => {
    const pendingStages = [];
    if (!activeFlow) return pendingStages;
    for (let j = 0; j < idx; j++) {
      const stage = activeFlow.stages[j];
      const due = stage.amount;
      const paid = stage.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const pending = due - paid;
      if (pending > 0) {
        pendingStages.push({
          name: stage.name,
          percentage: stage.percentage,
          pending: pending,
          total: due,
          paid: paid
        });
      }
    }
    return pendingStages;
  };

  const triggerPrintDemandLetter = () => {
    window.print();
  };

  const filteredBookings = bookings.filter(b => !selectedProjectId || (b.project?._id || b.project) === selectedProjectId);

  const selectedBookingDetails = bookings.find(b => b._id === selectedBookingId);
  const hasBankLoanSelected = selectedBookingDetails && (selectedBookingDetails.bankLoan === 'Yes' || selectedBookingDetails.bookingInfo?.bankLoan === 'Yes' || selectedBookingDetails.bookingInfo?.hasLoan === 'Yes');
  
  const totalReceived = activeFlow
    ? activeFlow.stages.reduce((sum, stage) => sum + (stage.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0), 0)
    : 0;
  const totalPending = activeFlow
    ? Math.max(0, activeFlow.totalCurrentValue - totalReceived)
    : 0;

  if (loading && !activeFlow && flows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0e623a]" />
        <p className="text-sm font-medium text-gray-500">Loading CRD flows...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full mx-auto px-4 lg:px-8">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-black-150 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-black-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0e623a]" />
            <span>CRD Flow: Milestone Payment Crd team</span>
          </h1>
         
        </div>


      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Conditionally Render: Leads Directory OR Active Stage Stepper */}
      
      <div className="bg-white border border-black-150 p-6 rounded-3xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-black-800">Booked Leads Directory</h2>
           
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Project Code Filter */}
            <div>
              <select
                value={filterProjectCode}
                onChange={(e) => setFilterProjectCode(e.target.value)}
                className="px-3 py-2 bg-black-50 border border-black-250 rounded-xl text-xs font-semibold text-black-700 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
              >
                <option value="">All Projects</option>
                {Array.from(new Set(projects.map(p => p.code).filter(Boolean))).map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="px-3 py-2 bg-black-50 border border-black-250 rounded-xl text-xs font-semibold text-black-700 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                title="From Date"
              />
              <span className="text-xs text-black-500 font-bold">to</span>
              <input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className="px-3 py-2 bg-black-50 border border-black-250 rounded-xl text-xs font-semibold text-black-700 focus:outline-none focus:ring-1 focus:ring-[#0e623a]"
                title="To Date"
              />
            </div>

            {/* Reset Filters */}
            {(filterProjectCode || filterFromDate || filterToDate) && (
              <button
                onClick={() => { setFilterProjectCode(''); setFilterFromDate(''); setFilterToDate(''); }}
                className="text-xs font-bold text-red-600 hover:text-red-800 transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Booked Leads Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-black-50 text-black-500 font-bold uppercase tracking-wider border-b">
              <tr>
                {hasColumnPermission('crdFlow', 'sno') && <th className="p-4">S.No</th>}
                {hasColumnPermission('crdFlow', 'bookingDate') && <th className="p-4">Booking Date</th>}
                {hasColumnPermission('crdFlow', 'customerName') && <th className="p-4">Customer Name</th>}
                {hasColumnPermission('crdFlow', 'phoneNumber') && <th className="p-4">Phone Number</th>}
                {hasColumnPermission('crdFlow', 'project') && <th className="p-4">Project</th>}
                {hasColumnPermission('crdFlow', 'units') && <th className="p-4">Units</th>}
                {hasColumnPermission('crdFlow', 'finalValue') && <th className="p-4">Final Quotation Value</th>}
                {hasColumnPermission('crdFlow', 'receivedValue') && <th className="p-4">Received Value</th>}
                {hasColumnPermission('crdFlow', 'pendingValue') && <th className="p-4">Pending Value</th>}
                {hasColumnPermission('crdFlow', 'assignedPerson') && <th className="p-4">Assigned Person</th>}
                {hasColumnPermission('crdFlow', 'crdPerson') && <th className="p-4">CRD Person</th>}
                {hasColumnPermission('crdFlow', 'actions') && <th className="p-4 text-center">Quick Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-black-50">
              {bookings
                .filter(lead => {
                  if (filterProjectCode && lead.project?.code !== filterProjectCode) return false;
                  const bookingStr = new Date(lead.bookingInfo?.bookingDate || lead.createdAt).toLocaleDateString('en-CA');
                  if (filterFromDate && bookingStr < filterFromDate) return false;
                  if (filterToDate && bookingStr > filterToDate) return false;
                  if (user?.role !== 'Superadmin' && user?.role !== 'Crd team') {
                    const quot = quotations.find(q => (q.lead?._id || q.lead) === lead._id);
                    if (quot?.crdPerson?.name !== user.name && quot?.crdPerson?._id !== user.name && quot?.crdPerson?._id !== user._id) {
                      return false;
                    }
                  }
                  return true;
                })
                .map((lead, index) => {
                  const flow = (activeFlow && (activeFlow.lead?._id || activeFlow.lead) === lead._id) 
                    ? activeFlow 
                    : flows.find(f => (f.lead?._id || f.lead) === lead._id);
                  const quot = quotations.find(q => (q.lead?._id || q.lead) === lead._id);
                  const value = flow ? flow.totalCurrentValue : (quot ? quot.totalValue : null);
                  const isSelected = selectedBookingId === lead._id;
                  
                  const received = flow 
                    ? flow.stages.reduce((sum, stage) => sum + (stage.payments?.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0) || 0), 0) 
                    : 0;
                  const pending = value !== null ? Math.max(0, value - received) : null;
                  
                  return (
                    <React.Fragment key={lead._id}>
                      <tr 
                        className={`transition cursor-pointer ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-black-50/50'}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedBookingId(null);
                            setActiveFlow(null);
                          } else {
                            handleBookingSelect(lead._id);
                          }
                        }}
                      >
                        {hasColumnPermission('crdFlow', 'sno') && <td className="p-4">{index + 1}</td>}
                        {hasColumnPermission('crdFlow', 'bookingDate') && (
                          <td className="p-4 text-black-600">
                            {new Date(lead.bookingInfo?.bookingDate || lead.createdAt).toLocaleDateString('en-GB')}
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'customerName') && (
                          <td className="p-4">
                            <div className="font-bold text-black-800">{lead.name}</div>
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'phoneNumber') && (
                          <td className="p-4">
                            <div className="font-semibold text-black-700">{lead.phone}</div>
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'project') && (
                          <td className="p-4">
                            <div className="font-semibold text-black-700">
                              {lead.project?.name || lead.project?.code || 'N/A'}
                            </div>
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'units') && (
                          <td className="p-4">
                            <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block">
                              {lead.bookingInfo?.selectedUnits?.join(', ') || 'N/A'}
                            </div>
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'finalValue') && (
                          <td className="p-4">
                            {value !== null ? (
                              <div className="text-blue-800 font-black text-sm">
                                Rs. {value.toLocaleString()}
                              </div>
                            ) : (
                              <span className="text-black-400 text-sm">N/A</span>
                            )}
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'receivedValue') && (
                          <td className="p-4">
                            {value !== null ? (
                              <div className="text-emerald-800 font-black text-sm">
                                Rs. {received.toLocaleString()}
                              </div>
                            ) : (
                              <span className="text-black-400 text-sm">N/A</span>
                            )}
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'pendingValue') && (
                          <td className="p-4">
                            {value !== null ? (
                              <div className="text-rose-800 font-black text-sm">
                                Rs. {(pending || 0).toLocaleString()}
                              </div>
                            ) : (
                              <span className="text-black-400 text-sm">N/A</span>
                            )}
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'assignedPerson') && (
                          <td className="p-4">
                            <div className="font-semibold text-black-800 text-xs">
                              {lead.assignedTo?.name || (typeof lead.assignedTo === 'string' ? users.find(u => u._id === lead.assignedTo)?.name : null) || 'Unassigned'}
                            </div>
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'crdPerson') && (
                          <td className="p-4">
                            <div className="font-semibold text-[#0e623a] text-xs">
                              {quot?.crdPerson?.name || 'Unassigned'}
                            </div>
                          </td>
                        )}
                        {hasColumnPermission('crdFlow', 'actions') && (
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (actionMenuId === lead._id) {
                                    setActionMenuId(null);
                                  } else {
                                    setActionMenuId(lead._id);
                                  }
                                }}
                                className="p-1.5 text-black-500 hover:text-emerald-700 bg-black-50 hover:bg-emerald-50 rounded transition cursor-pointer"
                                title="Quick Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {actionMenuId === lead._id && (() => {
                                const menuFlow = flows.find(f => (f.lead?._id || f.lead) === lead._id);
                                
                                return (
                                  <div 
                                    className="absolute right-8 top-1/2 -translate-y-1/2 w-48 bg-white border border-black-200 shadow-xl z-50 rounded-xl flex flex-col p-1 text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* View Payment */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionMenuId(null);
                                        if (selectedBookingId !== lead._id) {
                                          handleBookingSelect(lead._id);
                                        }
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-black-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition"
                                    >
                                      <Layers className="w-4 h-4" /> View Payment
                                    </button>

                                    {/* Get Payment */}
                                    {menuFlow && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveFlow(menuFlow);
                                          const firstUncompletedIdx = menuFlow.stages.findIndex(s => !(s.isCompleted || getStagePaid(s) >= getStageTotal(s)));
                                          const idx = firstUncompletedIdx >= 0 ? firstUncompletedIdx : 0;
                                          setPaymentStageIdx(idx);
                                          const thisStagePending = Math.max(0, getStageTotal(menuFlow.stages[idx]) - getStagePaid(menuFlow.stages[idx]));
                                          const arrears = menuFlow.stages.slice(0, idx).reduce((sum, s) => sum + Math.max(0, getStageTotal(s) - getStagePaid(s)), 0);
                                          setPaymentAmount((thisStagePending + arrears).toString());
                                          const hasBankLoanMenu = lead.bankLoan === 'Yes' || lead.bookingInfo?.bankLoan === 'Yes' || lead.bookingInfo?.hasLoan === 'Yes';
                                          setPaymentMethod(hasBankLoanMenu ? 'Bank Loan' : 'Customer Transfer');
                                          setActionMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-black-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition"
                                      >
                                        <DollarSign className="w-4 h-4" /> Get Payment
                                      </button>
                                    )}
                                    
                                    {/* Demand Letter */}
                                    {menuFlow && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveFlow(menuFlow);
                                          setDemandLetterStageIdx(0);
                                          setActionMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-black-700 hover:bg-blue-50 hover:text-blue-800 rounded-lg transition"
                                      >
                                        <Printer className="w-4 h-4" /> Demand Letter
                                      </button>
                                    )}

                                    {/* Cancel Lead */}
                                    {menuFlow && menuFlow.status === 'Active' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveFlow(menuFlow);
                                          setCancelModalOpen(true);
                                          setActionMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-800 rounded-lg transition"
                                      >
                                        <Trash className="w-4 h-4" /> Cancel Lead
                                      </button>
                                    )}

                                    {selectedBookingId === lead._id && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBookingId(null);
                                          setActiveFlow(null);
                                          setActionMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-black-500 hover:bg-black-100 hover:text-black-800 rounded-lg transition border-t border-black-100 mt-1 pt-2"
                                      >
                                        <ChevronUp className="w-4 h-4" /> Close Details
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                        )}
                      </tr>
                      

                    </React.Fragment>
                  );
                })}

              {bookings.filter(lead => {
                if (filterProjectCode && lead.project?.code !== filterProjectCode) return false;
                const bookingStr = new Date(lead.bookingInfo?.bookingDate || lead.createdAt).toLocaleDateString('en-CA');
                if (filterFromDate && bookingStr < filterFromDate) return false;
                if (filterToDate && bookingStr > filterToDate) return false;
                if (user?.role !== 'Superadmin' && user?.role !== 'Crd team') {
                  const quot = quotations.find(q => (q.lead?._id || q.lead) === lead._id);
                  if (quot?.crdPerson?.name !== user.name && quot?.crdPerson?._id !== user._id) {
                    return false;
                  }
                }
                return true;
              }).length === 0 && (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-black-400">
                    No matching booked leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
{/* Stage Details Modal */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-black-100">
             {/* Header */}
             <div className="bg-[#0e623a] p-4 text-white flex justify-between items-center shrink-0">
               <h3 className="font-bold flex items-center gap-2 text-lg">
                 <Layers className="w-5 h-5 text-emerald-300" />
                 <span>Stage Details & Milestone Payments</span>
               </h3>
               <button 
                 onClick={() => { setSelectedBookingId(''); setActiveFlow(null); }}
                 className="text-white hover:text-emerald-200 transition cursor-pointer"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             {/* Body */}
             <div className="p-6 bg-black-50 flex-1 overflow-y-auto">
                {/* Auto Initializing Flow State */}
                {!activeFlow ? (
                  <div className="bg-white border border-black-150 p-12 rounded-3xl shadow-sm space-y-6 text-center flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e623a]"></div>
                    <div className="max-w-md mx-auto space-y-2 mt-4">
                      <h3 className="text-sm font-bold text-black-800">Initializing CRD Master Format...</h3>
                      <p className="text-xs text-black-500">Automatically setting up the milestone payment schedules for this booking.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-black-150 p-6 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-black-800 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-[#0e623a]" />
                          Milestone Breakdown
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeFlow.credentials && (
                          <div className="flex flex-col mr-4 border-r border-black-150 pr-4">
                            <span className="text-[9px] font-bold text-black-400 uppercase tracking-widest mb-1">Customer Portal Access</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-black-600 font-semibold">User: <span className="font-mono bg-black-50 px-1.5 py-0.5 rounded text-black-800 border border-black-200 select-all">{activeFlow.credentials.username}</span></span>
                              <span className="text-[11px] text-black-600 font-semibold">Pass: <span className="font-mono bg-black-50 px-1.5 py-0.5 rounded text-black-800 border border-black-200 select-all">{activeFlow.credentials.password}</span></span>
                            </div>
                          </div>
                        )}
                        {/* Extra Works button removed per user request */}
                        <button
                          onClick={() => {
                            setPaymentStageIdx(0);
                            const thisStagePending = Math.max(0, getStageTotal(activeFlow.stages[0]) - getStagePaid(activeFlow.stages[0]));
                            const arrears = getPendingPreviousStages(0).reduce((sum, s) => sum + s.pending, 0);
                            const totalAmt = thisStagePending + arrears;
                            setPaymentAmount(totalAmt.toString());
                            const pct = activeFlow?.lead?.bankLoanPercentage || selectedBookingDetails?.bankLoanPercentage || 50;
                            const loanAmt = Math.round(totalAmt * (pct / 100));
                            const transferAmt = totalAmt - loanAmt;
                            setDualTransferAmount(transferAmt.toString());
                            setDualLoanAmount(loanAmt.toString());
                            setPaymentMethod(hasBankLoanSelected ? 'Bank Loan' : 'Customer Transfer');
                          }}
                          className="px-4 py-2 bg-[#0e623a] text-white font-bold text-[11px] rounded-xl hover:bg-[#0b4d2d] transition shadow cursor-pointer flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Log Payment
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-black-50 text-black-500 font-bold uppercase tracking-wider border-y">
                          <tr>
                            <th className="p-4 w-12">#</th>
                            <th className="p-4">Milestone Stage</th>
                            <th className="p-4 text-right">Stage Value</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Received</th>
                            <th className="p-4 text-right">Pending</th>
                            <th className="p-4 text-center">Payment Action</th>
                            <th className="p-4 text-center">Stage Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black-100">
                          {activeFlow.stages.map((stage, idx) => {
                            const stageTotal = getStageTotal(stage);
                            const stagePaid = getStagePaid(stage);
                            const isPaidInFull = stagePaid >= stageTotal;

                            return (
                              <React.Fragment key={idx}>
                                <tr className={`hover:bg-black-50/50 transition ${isPaidInFull ? 'bg-emerald-50/10' : ''}`}>
                                  <td className="p-4 font-bold text-black-400">{idx + 1}</td>
                                  <td className="p-4 cursor-pointer hover:bg-black-100/50 rounded transition group" onClick={() => toggleStage(idx)}>
                                    <div className="font-bold text-black-800 flex items-center gap-2">
                                      {stage.name}
                                      {stage.extraWorks && stage.extraWorks.length > 0 && (
                                        expandedStages[idx] ? <ChevronDown className="w-4 h-4 text-black-400 group-hover:text-black-600" /> : <ChevronRight className="w-4 h-4 text-black-400 group-hover:text-black-600" />
                                      )}
                                    </div>
                                    <div className="text-[11px] text-black-400">
                                      {stage.percentage === 5 
                                        ? 'Token advance + 5% of total value' 
                                        : `${stage.percentage}% of total value`}
                                    </div>
                                  </td>
                                  <td className="p-4 text-right font-semibold text-black-700">
                                    Rs. {stageTotal.toLocaleString()}
                                    {stage.extraWorks && stage.extraWorks.length > 0 && (
                                      <div className="text-[10px] text-blue-600 mt-0.5">+ Extra Works</div>
                                    )}
                                  </td>
                                  <td className="p-4 text-center">
                                    {stagePaid > 0 && (
                                      <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${isPaidInFull ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {isPaidInFull ? 'Paid' : 'Partial'}
                                      </span>
                                    )}
                                    <span className={`block ${stagePaid > 0 ? 'mt-1.5' : ''} px-2 py-1 rounded text-[11px] font-bold uppercase ${stage.isCompleted ? 'bg-emerald-100 text-[#0e623a]' : 'bg-amber-100 text-amber-800'}`}>
                                      {stage.isCompleted ? 'Completed' : 'In Progress'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right font-bold text-emerald-600">
                                    Rs. {stagePaid.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-right font-bold text-rose-600">
                                    Rs. {Math.max(0, stageTotal - stagePaid).toLocaleString()}
                                  </td>
                                  <td className="p-4 text-center">
                                    {isPaidInFull ? (
                                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-extrabold uppercase border border-emerald-200 shadow-sm inline-block w-24">
                                        Paid
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPaymentStageIdx(idx);
                                          const thisStagePending = Math.max(0, getStageTotal(stage) - getStagePaid(stage));
                                          const arrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                                          const totalAmt = thisStagePending + arrears;
                                          setPaymentAmount(totalAmt.toString());
                                          const pct = activeFlow?.lead?.bankLoanPercentage || selectedBookingDetails?.bankLoanPercentage || 50;
                                          const loanAmt = Math.round(totalAmt * (pct / 100));
                                          const transferAmt = totalAmt - loanAmt;
                                          setDualTransferAmount(transferAmt.toString());
                                          setDualLoanAmount(loanAmt.toString());
                                          setPaymentMethod(hasBankLoanSelected ? 'Bank Loan' : 'Customer Transfer');
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition w-24 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer border border-blue-200"
                                      >
                                        Pay
                                      </button>
                                    )}
                                  </td>
                                  <td className="p-4 text-center">
                                    {stage.isCompleted ? (
                                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#0e623a] text-[11px] font-extrabold uppercase border border-emerald-200 shadow-sm inline-block w-24">
                                        Completed
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStageCompletion(idx, stage.isCompleted)}
                                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition w-24 cursor-pointer border bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                                      >
                                        Complete
                                      </button>
                                    )}
                                  </td>
                                </tr>
                                {/* Extra works rows if any */}
                                {expandedStages[idx] && stage.extraWorks && stage.extraWorks.map((ew, ewIdx) => (
                                  <tr key={`ew-${idx}-${ewIdx}`} className="bg-blue-50/30">
                                    <td className="p-2 border-l-2 border-blue-400"></td>
                                    <td className="p-2 text-[11px] text-black-600 flex items-center gap-2">
                                      <ChevronRight className="w-3 h-3 text-blue-400" />
                                      <button onClick={() => setExtraWorkDetailsModal(ew)} className="font-mono text-blue-700 font-bold hover:underline cursor-pointer">
                                        {ew.ewId || '-'}
                                      </button>
                                      <span className="font-bold border-l pl-2 border-black-200">{ew.name}</span>
                                    </td>
                                    <td className="p-2 text-right text-[11px] font-semibold text-black-700">Rs. {ew.amount.toLocaleString()}</td>
                                    <td colSpan="5"></td>
                                  </tr>
                                ))}
                                {/* Payments breakdown if any */}
                                {stage.payments && stage.payments.length > 0 && (
                                  <tr className="bg-black-50/50">
                                    <td></td>
                                    <td colSpan="7" className="p-2">
                                      <div className="flex flex-wrap gap-2">
                                        {stage.payments.map((p, pIdx) => (
                                          <div key={`p-${idx}-${pIdx}`} className="flex items-center gap-1.5 bg-white border border-black-200 px-2 py-1 rounded text-[10px] shadow-sm">
                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                            <span className="font-semibold text-black-700">Rs. {p.amount.toLocaleString()}</span>
                                            <span className="text-black-400 border-l border-black-200 pl-1.5 ml-0.5">{new Date(p.date).toLocaleDateString('en-GB')}</span>
                                            <span className="text-blue-600 font-bold border-l border-black-200 pl-1.5 ml-0.5">{p.mode}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-black-50 border-t border-black-200">
                          <tr>
                            <td colSpan="2" className="p-4 text-right font-black text-black-800 uppercase text-[11px] tracking-wider">Total CRD Value</td>
                            <td className="p-4 text-right font-black text-[#0e623a] text-sm">Rs. {(() => {
                              const totalWithExtra = activeFlow.stages.reduce((sum, s) => sum + getStageTotal(s), 0);
                              return totalWithExtra.toLocaleString();
                            })()}</td>
                            <td colSpan="5"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

{/* Extra Work Modal dialog */}
      {extraWorkStageIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-black-100">
            <div className="bg-[#0e623a] p-6 text-white relative">
              <button 
                type="button" 
                onClick={() => setExtraWorkStageIdx(null)}
                className="absolute top-4 right-4 text-emerald-100 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-300" />
                <span>Add Extra Works Adjustment</span>
              </h3>
              <p className="text-emerald-100 text-xs mt-1">Specify additional project customization work</p>
            </div>

            <form onSubmit={handleAddExtraWork} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-black-600 block mb-1">Select Milestone Stage</label>
                <select
                  value={extraWorkStageIdx}
                  onChange={(e) => setExtraWorkStageIdx(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-black-50 border border-black-250 rounded-xl text-sm font-semibold text-black-800"
                >
                  {activeFlow?.stages.map((stage, idx) => {
                    const thisStagePending = Math.max(0, getStageTotal(stage) - getStagePaid(stage));
                    const arrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                    if (thisStagePending <= 0 && arrears <= 0) return null;
                    return (
                      <option key={idx} value={idx}>Stage {idx + 1}: {stage.name}</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-black-600 block mb-1">Extra Work Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Tiles upgrade, Additional electrical points"
                  value={extraWorkName}
                  onChange={(e) => setExtraWorkName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black-50 border border-black-250 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-black-600 block mb-1">Chargeable Amount (Rs)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 45000"
                  value={extraWorkAmount}
                  onChange={(e) => setExtraWorkAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black-50 border border-black-250 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setExtraWorkStageIdx(null)}
                  className="flex-1 py-3 border border-black-200 rounded-xl text-xs font-bold text-black-500 hover:bg-black-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Work to Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Split Modal Dialog */}
      {paymentStageIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-black-100">
            <div className="bg-[#0e623a] p-6 text-white relative shrink-0">
              <button 
                type="button" 
                onClick={() => setPaymentStageIdx(null)}
                className="absolute top-4 right-4 text-emerald-100 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-300" />
                <span>Submit Milestone Split Payment</span>
              </h3>
              <p className="text-emerald-100 text-xs mt-1">Register customer transfers or loan payments</p>
            </div>

            <form onSubmit={handleMakePayment} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-black-600 block mb-1">Select Milestone Stage to Credit</label>
                  <select
                    value={paymentStageIdx}
                    onChange={(e) => {
                      const newIdx = Number(e.target.value);
                      setPaymentStageIdx(newIdx);
                      
                      const thisStagePending = Math.max(0, getStageTotal(activeFlow.stages[newIdx]) - getStagePaid(activeFlow.stages[newIdx]));
                      const arrears = getPendingPreviousStages(newIdx).reduce((sum, s) => sum + s.pending, 0);
                      const totalAmt = thisStagePending + arrears;
                      setPaymentAmount(totalAmt.toString());
                      
                      if (paymentMethod === 'Dual Mode') {
                        const pct = activeFlow?.lead?.bankLoanPercentage || selectedBookingDetails?.bankLoanPercentage || 50;
                        const loanAmt = Math.round(totalAmt * (pct / 100));
                        const transferAmt = totalAmt - loanAmt;
                        setDualTransferAmount(transferAmt.toString());
                        setDualLoanAmount(loanAmt.toString());
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-black-50 border border-black-250 rounded-xl text-sm font-semibold text-black-800"
                  >
                    {activeFlow?.stages.map((stage, idx) => {
                      const thisStagePending = Math.max(0, getStageTotal(stage) - getStagePaid(stage));
                      const arrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                      if (thisStagePending <= 0 && arrears <= 0) return null;
                      const arrearsText = arrears > 0 ? ` + Arrears: Rs. ${arrears.toLocaleString()}` : '';
                      return (
                        <option key={idx} value={idx}>Stage {idx + 1}: {stage.name} (Pending: Rs. {thisStagePending.toLocaleString()}{arrearsText})</option>
                      );
                    })}
                  </select>
                  {paymentStageIdx !== null && paymentStageIdx < (activeFlow?.stages?.length || 0) - 1 && (
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newIdx = paymentStageIdx + 1;
                          setPaymentStageIdx(newIdx);
                          const thisStagePending = Math.max(0, getStageTotal(activeFlow.stages[newIdx]) - getStagePaid(activeFlow.stages[newIdx]));
                          const arrears = getPendingPreviousStages(newIdx).reduce((sum, s) => sum + s.pending, 0);
                          const totalAmt = thisStagePending + arrears;
                          setPaymentAmount(totalAmt.toString());
                          
                          if (paymentMethod === 'Dual Mode') {
                            const pct = activeFlow?.lead?.bankLoanPercentage || selectedBookingDetails?.bankLoanPercentage || 50;
                            const loanAmt = Math.round(totalAmt * (pct / 100));
                            const transferAmt = totalAmt - loanAmt;
                            setDualTransferAmount(transferAmt.toString());
                            setDualLoanAmount(loanAmt.toString());
                          }
                        }}
                        className="text-[11px] text-purple-600 font-bold hover:text-purple-800 flex items-center gap-1 transition cursor-pointer bg-purple-50 px-2 py-1 rounded"
                      >
                       
                      </button>
                    </div>
                  )}
                </div>
                {hasBankLoanSelected ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Customer Transfer')}
                      className={`py-2.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                        paymentMethod === 'Customer Transfer'
                          ? 'bg-[#0e623a] text-white shadow'
                          : 'bg-black-100 text-black-500 hover:bg-black-200'
                      }`}
                    >
                      Customer Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Bank Loan')}
                      className={`py-2.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                        paymentMethod === 'Bank Loan'
                          ? 'bg-[#0e623a] text-white shadow'
                          : 'bg-black-100 text-black-500 hover:bg-black-200'
                      }`}
                    >
                      Bank Loan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('Dual Mode');
                        const totalAmt = Number(paymentAmount) || 0;
                        const pct = activeFlow?.lead?.bankLoanPercentage || selectedBookingDetails?.bankLoanPercentage || 50;
                        const loanAmt = Math.round(totalAmt * (pct / 100));
                        const transferAmt = totalAmt - loanAmt;
                        setDualTransferAmount(transferAmt.toString());
                        setDualLoanAmount(loanAmt.toString());
                      }}
                      className={`py-2.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                        paymentMethod === 'Dual Mode'
                          ? 'bg-[#0e623a] text-white shadow'
                          : 'bg-black-100 text-black-500 hover:bg-black-200'
                      }`}
                    >
                      Dual Mode
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 flex items-center justify-center">
                    <button
                      type="button"
                      disabled
                      className="py-2.5 w-full rounded-xl text-[11px] font-bold transition text-center bg-[#0e623a] text-white shadow cursor-default"
                    >
                      Customer Transfer
                    </button>
                  </div>
                )}

                {paymentMethod !== 'Dual Mode' ? (
                  <div>
                    <label className="text-xs font-semibold text-black-600 block mb-1">Paid Amount (Rs)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black-50 border border-black-250 rounded-xl text-sm font-bold text-black-800"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-black-770 block mb-1">Customer Transfer Amt (Rs)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 200000"
                        value={dualTransferAmount}
                        onChange={(e) => setDualTransferAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-black-50 border rounded-xl text-xs font-bold text-black-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#0e623a] block mb-1">Bank Loan Amt (Rs)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 300000"
                        value={dualLoanAmount}
                        onChange={(e) => setDualLoanAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0e623a]/5 border border-[#0e623a]/20 rounded-xl text-xs font-bold text-[#0e623a]"
                      />
                    </div>
                  </div>
                )}

              </div>

              <div className="flex gap-3 p-6 border-t bg-black-50/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setPaymentStageIdx(null)}
                  className="flex-1 py-3 border border-black-200 rounded-xl text-xs font-bold text-black-500 hover:bg-black-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d] transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Payment Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demand Letter Screen Preview Modal Dialog */}
      {demandLetterStageIdx !== null && activeFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-black-250 my-8">
            <div className="bg-[#0e623a] p-4 text-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider">Demand Letter Preview</span>
              <button 
                onClick={() => setDemandLetterStageIdx(null)}
                className="text-white hover:text-black-200 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Screen View Padded Document Container */}
            <div className="p-6 bg-black-50 max-h-[70vh] overflow-y-auto">
              <div className="p-8 bg-white border border-black-250 rounded-2xl shadow-sm text-black-900 font-serif leading-relaxed text-xs">
                {/* Header Company Logo */}
                <div className="flex justify-between items-start border-b-2 border-[#0e623a] pb-4 mb-6">
                  <div>
                    <div className="text-xl font-black tracking-wider text-[#0e623a]">JOHN BUILDWELL</div>
                    <div className="text-[10px] text-black-400 font-sans tracking-widest uppercase mt-0.5">Since 2007</div>
                  </div>
                  <div className="text-right text-[11px] text-black-500 font-sans">
                    Date: {new Date().toLocaleDateString('en-GB')}
                  </div>
                </div>

                {/* To Address block */}
                <div className="space-y-1 mb-6 font-sans text-[11px]">
                  <div>To,</div>
                  <div className="font-bold text-black-800">{activeFlow.lead?.name}</div>
                  <div>{activeFlow.lead?.address}</div>
                  <div>Phone: {activeFlow.lead?.phone}</div>
                </div>

                {/* Subject */}
                <div className="mb-6 text-[12px]">
                  <span className="font-bold">Subject:</span> Payment Request Letter for <strong>{activeFlow.lead?.name}</strong> – <strong>"{activeFlow.project?.name}"</strong>, Plot/Unit No: <strong>{activeFlow.unitId}</strong>
                </div>

                {/* Letter Paragraphs */}
                {(() => {
                  const pendingPrev = getPendingPreviousStages(demandLetterStageIdx);
                  const currentStageTotal = getStageTotal(activeFlow.stages[demandLetterStageIdx]);
                  const prevPendingTotal = pendingPrev.reduce((sum, s) => sum + s.pending, 0);
                  const grandTotalRequested = currentStageTotal + prevPendingTotal;

                  return (
                    <div className="space-y-4 text-black-700 mb-6 font-sans text-[11px] leading-relaxed">
                      <p>Dear Sir,</p>
                      <p>
                        We are writing to inform you that the <strong className="text-black-900">{activeFlow.stages[demandLetterStageIdx].name} ({activeFlow.stages[demandLetterStageIdx].percentage}%)</strong> milestone has been successfully completed for Unit No. <strong className="text-black-900">{activeFlow.unitId}</strong> in our premium project <strong className="text-black-900">"{activeFlow.project?.name}"</strong>, located at {activeFlow.project?.location || 'Palayamkottai, Tirunelveli'}.
                      </p>
                      
                      {pendingPrev.length > 0 && (
                        <div className="bg-red-50/50 border border-red-200 p-4 rounded-xl my-4 text-black-800">
                          <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block mb-2">Previous Outstanding Balances:</span>
                          <table className="w-full text-left text-[10px] border-collapse">
                            <thead>
                              <tr className="border-b border-red-200">
                                <th className="pb-1 text-black-500">Milestone Stage</th>
                                <th className="pb-1 text-right text-black-500">Stage Total</th>
                                <th className="pb-1 text-right text-black-500">Amount Paid</th>
                                <th className="pb-1 text-right text-black-500 font-bold">Balance Due</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingPrev.map((prev, pIdx) => (
                                <tr key={pIdx} className="border-b border-red-100/50">
                                  <td className="py-1 font-semibold">{prev.name} ({prev.percentage}%)</td>
                                  <td className="py-1 text-right text-black-650">Rs. {prev.total.toLocaleString()}</td>
                                  <td className="py-1 text-right text-black-650">Rs. {prev.paid.toLocaleString()}</td>
                                  <td className="py-1 text-right font-bold text-red-750">Rs. {prev.pending.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-2 text-right font-bold text-red-800 text-[11px]">
                            Total Previous Outstanding: Rs. {prevPendingTotal.toLocaleString()}/-
                          </div>
                        </div>
                      )}

                      <p>
                        As per the project's schedule and agreements, we kindly request you to release the payment of <strong className="text-[#0e623a]">Rs. {grandTotalRequested.toLocaleString()}/-</strong> (<em>{numberToWords(grandTotalRequested)}</em>) towards the completed milestone work.
                        {pendingPrev.length > 0 && ` This total includes the current milestone request of Rs. ${currentStageTotal.toLocaleString()}/- and the accumulated previous outstanding balance of Rs. ${prevPendingTotal.toLocaleString()}/-.`}
                      </p>
                      <p>Please do the needful and credit the payment to our official account details below:</p>
                    </div>
                  );
                })()}

                {/* Corporate Bank accounts info */}
                <div className="bg-black-50 p-4 border rounded-2xl space-y-1 text-[11px] font-sans mb-6">
                  <div className="grid grid-cols-3">
                    <span className="text-black-400 font-bold uppercase">Name:</span>
                    <span className="col-span-2 font-bold text-black-700">John Buildwell India Private Limited</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-black-400 font-bold uppercase">Bank Name:</span>
                    <span className="col-span-2 font-bold text-black-700">Axis Bank Ltd, Palayamkottai</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-black-400 font-bold uppercase">A/C No:</span>
                    <span className="col-span-2 font-bold text-black-700 tracking-wider">914030011343603</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-black-400 font-bold uppercase">IFSC NO:</span>
                    <span className="col-span-2 font-bold text-black-700 tracking-wider">UTIB0002095</span>
                  </div>
                </div>

                {/* Sign off and footer */}
                <div className="flex justify-between items-end pt-4 font-sans text-[11px]">
                  <div>
                    <div className="text-black-400 uppercase font-bold text-[9px]">Prepared By</div>
                    <div className="font-bold text-black-700 mt-4">Customer Relation Crd team</div>
                    <div className="text-black-400 italic mt-0.5">(Mrs. J. Mary)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-black-400 uppercase font-bold text-[9px]">For John Buildwell India (P) Ltd.</div>
                    <div className="mt-8 border-t border-dashed border-black-400 w-32 pt-1 text-black-400 italic">Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom print trigger toolbar */}
            <div className="p-4 bg-black-50 border-t flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setDemandLetterStageIdx(prev => Math.max(0, prev - 1))}
                  disabled={demandLetterStageIdx === 0}
                  className={`px-3 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1 ${demandLetterStageIdx === 0 ? 'text-black-300 bg-black-50 border-black-100 cursor-not-allowed' : 'text-black-600 hover:bg-black-200 cursor-pointer'}`}
                >
                  &larr; Prev Stage
                </button>
                <button
                  onClick={() => setDemandLetterStageIdx(prev => Math.min(activeFlow.stages.length - 1, prev + 1))}
                  disabled={demandLetterStageIdx === activeFlow.stages.length - 1}
                  className={`px-3 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1 ${demandLetterStageIdx === activeFlow.stages.length - 1 ? 'text-black-300 bg-black-50 border-black-100 cursor-not-allowed' : 'text-black-600 hover:bg-black-200 cursor-pointer'}`}
                >
                  Next Stage &rarr;
                </button>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDemandLetterStageIdx(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-black-500 hover:bg-black-100 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={triggerPrintDemandLetter}
                  className="px-5 py-2 bg-[#0e623a] text-white text-xs font-bold rounded-xl hover:bg-[#0b4d2d] transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Demand Letter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Document Preview Modal */}
      {previewingDoc !== null && activeFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-black-250 my-8">
            <div className="bg-[#0e623a] p-4 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">Official Document Prepared Draft</span>
                <span className="text-sm font-extrabold mt-0.5 block">{previewingDoc.title}</span>
              </div>
              <button 
                onClick={() => setPreviewingDoc(null)}
                className="text-white hover:text-black-200 font-extrabold text-lg px-2"
              >
                ✕
              </button>
            </div>

            {/* Document Draft Body */}
            <div className="p-6 bg-black-100 max-h-[70vh] overflow-y-auto">
              <div className="p-8 bg-white border border-black-200 rounded-2xl shadow-sm text-black-800 font-serif leading-relaxed text-xs space-y-6 text-left">
                
                {/* Stamp Duty / Bond paper Style Header */}
                <div className="border-4 border-double border-[#0e623a] p-4 text-center space-y-1 bg-emerald-50/20">
                  <div className="text-sm font-bold uppercase tracking-widest text-emerald-800">Government of Tamil Nadu</div>
                  <div className="text-[19px] font-black uppercase text-[#0e623a] tracking-wider">Stamp Duty India Certificate</div>
                  <div className="text-[11px] text-black-500 font-sans tracking-wide">Certificate No: TN-DL914380184B | Stamp Amount: Rs. 100/-</div>
                  <div className="text-[10px] text-black-400 font-sans italic">Prepared automatically under builders automated deed registration software</div>
                </div>

                {/* Main Heading */}
                <div className="text-center font-extrabold text-sm uppercase tracking-wide text-black-900 border-b pb-2">
                  {previewingDoc.title.toUpperCase()}
                </div>

                {/* Dynamic Content depending on document index */}
                {previewingDoc.index === 0 && (
                  <div className="space-y-4 text-justify text-black-700">
                    <p>
                      THIS AGREEMENT OF SALE is entered into on this <strong>{new Date().toLocaleDateString('en-GB')}</strong> at Tirunelveli.
                    </p>
                    <p className="font-semibold text-black-800">BETWEEN:</p>
                    <p>
                      <strong>JOHN BUILDWELL INDIA PRIVATE LIMITED</strong>, having its registered office at Palayamkottai, Tirunelveli, represented herein by its authorized director, hereinafter referred to as the <strong>"DEVELOPER / VENDOR"</strong> of the ONE PART.
                    </p>
                    <p className="font-semibold text-black-800">AND:</p>
                    <p>
                      <strong>{activeFlow.lead?.name}</strong>, residing at {activeFlow.lead?.address || 'N/A'}, hereinafter referred to as the <strong>"PURCHASER"</strong> of the OTHER PART.
                    </p>
                    <p>
                      WHEREAS the Developer is the sole owner and developer of the residential/commercial project named <strong>"{activeFlow.project?.name}"</strong> located at {activeFlow.project?.location}.
                    </p>
                    <p>
                      AND WHEREAS the Purchaser has agreed to buy and the Developer has agreed to sell the unit/plot designated as <strong>Unit No: {activeFlow.unitId}</strong> having a total valuation of <strong>Rs. {activeFlow.totalOriginalValue.toLocaleString()}/-</strong> (<em>{numberToWords(activeFlow.totalOriginalValue)}</em>).
                    </p>
                    <p className="font-bold text-black-800 uppercase text-[11px] tracking-wider">TERMS AND CONDITIONS:</p>
                    <ol className="list-decimal pl-5 space-y-2 font-sans text-[11px]">
                      <li>The Purchaser shall pay the balance payment in accordance with the construction stages and payment schedules initialized in the CRD Flow Crd team.</li>
                      <li>The possession of the unit will be handed over to the Purchaser only upon complete settlement of all dues including core value and additional extra work adjustments.</li>
                      <li>Registration fees, stamp duty, and legal document charges are entirely payable by the Purchaser.</li>
                    </ol>
                  </div>
                )}

                {previewingDoc.index === 1 && (
                  <div className="space-y-4 text-justify text-black-700">
                    <p>
                      THIS CONSTRUCTION AGREEMENT is entered into on this <strong>{new Date().toLocaleDateString('en-GB')}</strong>.
                    </p>
                    <p>
                      BY AND BETWEEN <strong>JOHN BUILDWELL INDIA PRIVATE LIMITED</strong> (Developer) and <strong>{activeFlow.lead?.name}</strong> (Client).
                    </p>
                    <p>
                      WHEREAS the Developer has proposed to construct a residential flat/villa on <strong>Unit No: {activeFlow.unitId}</strong> in the project <strong>"{activeFlow.project?.name}"</strong>.
                    </p>
                    <p>
                      NOW IT IS MUTUALLY AGREED BETWEEN THE PARTIES AS FOLLOWS:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 font-sans text-[11px]">
                      <li><strong>Scope of Work:</strong> The Developer agrees to build and complete the construction of the unit conforming to standard design specifications.</li>
                      <li><strong>Payment Schedule:</strong> The client will make stage-wise payments linked to construction progress. Stage 2 (Agreement & Deed) value is set at <strong>Rs. {activeFlow.stages[1]?.amount.toLocaleString()}/-</strong> (<em>{numberToWords(activeFlow.stages[1]?.amount || 0)}</em>).</li>
                      <li><strong>Delay Interest:</strong> Any delayed payment from the scheduled completion date of a milestone will attract interest at 12% per annum.</li>
                    </ol>
                  </div>
                )}

                {previewingDoc.index === 2 && (
                  <div className="space-y-4 text-justify text-black-700">
                    <p>
                      <strong>DRAFT DEED OF SALE</strong>
                    </p>
                    <p>
                      This Deed of Sale is made on this <strong>{new Date().toLocaleDateString('en-GB')}</strong> by <strong>JOHN BUILDWELL INDIA PRIVATE LIMITED</strong> (Vendor) in favor of <strong>{activeFlow.lead?.name}</strong> (Vendee).
                    </p>
                    <p>
                      The Vendor hereby transfers, conveys, and sells all rights, titles, and interests in the property described under the schedule below unto the Vendee for a total consideration of <strong>Rs. {activeFlow.totalOriginalValue.toLocaleString()}/-</strong>.
                    </p>
                    <p>
                      The Vendor acknowledges receipt of booking and initial stages payments and agrees to execute absolute conveyance deed upon final payment receipt.
                    </p>
                  </div>
                )}

                {previewingDoc.index === 3 && (
                  <div className="space-y-4 text-justify text-black-700">
                    <p>
                      <strong>SCHEDULE OF PROPERTY (STAMPED)</strong>
                    </p>
                    <p>
                      All that piece and parcel of land/building situated at {activeFlow.project?.location}, bearing <strong>Unit No: {activeFlow.unitId}</strong> under Survey Numbers belonging to <strong>"{activeFlow.project?.name}"</strong>.
                    </p>
                    <table className="w-full border-collapse border border-black-300 text-[11px] mt-2 font-sans">
                      <thead>
                        <tr className="bg-black-100">
                          <th className="border p-2">Boundary Direction</th>
                          <th className="border p-2">Bordering Property Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-bold">North By:</td>
                          <td className="border p-2">Developer's Open Space reservation park / Walkway</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-bold">South By:</td>
                          <td className="border p-2">40 Feet wide internal layout tar road</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-bold">East By:</td>
                          <td className="border p-2">Plot/Unit No. {parseInt(activeFlow.unitId) + 1 || 'Adjacent Unit'}</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-bold">West By:</td>
                          <td className="border p-2">Plot/Unit No. {parseInt(activeFlow.unitId) - 1 || 'Adjacent Unit'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {previewingDoc.index === 4 && (
                  <div className="space-y-4 text-justify text-black-700 font-sans text-[11px]">
                    <div className="bg-emerald-50/50 p-4 border border-dashed border-emerald-300 rounded-xl">
                      <div className="font-bold text-center text-[#0e623a] text-xs uppercase mb-2">E-Challan State Bank of India Receipt</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><strong>GRN Number:</strong> MH091480108390A</div>
                        <div><strong>Transaction Date:</strong> {new Date().toLocaleDateString('en-GB')}</div>
                        <div><strong>Department:</strong> Inspector General of Registration</div>
                        <div><strong>Payment Mode:</strong> Net Banking</div>
                        <div><strong>Sub-Registrar Office:</strong> Tirunelveli Joint SRO</div>
                        <div><strong>Registration Stamp Duty Paid:</strong> Rs. 15,200/-</div>
                      </div>
                    </div>
                    <p className="font-serif text-xs">
                      This NOC (No Objection Certificate) confirms that <strong>JOHN BUILDWELL INDIA PRIVATE LIMITED</strong> has obtained all structural and local panchayat clearances for construction of Unit {activeFlow.unitId} under Project {activeFlow.project?.name}.
                    </p>
                  </div>
                )}

                {/* Footer Signatures */}
                <div className="flex justify-between items-end pt-12 border-t font-sans text-[11px]">
                  <div>
                    <div className="font-bold text-black-700">For VENDOR / DEVELOPER</div>
                    <div className="mt-8 border-t border-dashed border-black-300 w-32 pt-1 text-black-400 italic">Authorized Signatory</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-black-700">For PURCHASER / CLIENT</div>
                    <div className="mt-8 border-t border-dashed border-black-300 w-32 pt-1 text-black-400 italic">Signature of Purchaser</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-black-50 border-t flex justify-between items-center">
              <span className="text-[11px] text-black-400 font-mono">File reference: {previewingDoc.filename}</span>
              <button
                onClick={() => setPreviewingDoc(null)}
                className="px-5 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
              >
                Close Draft Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only Document Node (Hidden on Screen via CSS, displayed only when printed) */}
      {demandLetterStageIdx !== null && activeFlow && (
        <div className="print-only-document">
          <div className="printable-area">
            {/* Header Company Logo */}
            <div className="flex justify-between items-start border-b-2 border-[#0e623a] pb-6 mb-6">
              <div>
                <div className="text-2xl font-black tracking-wider text-[#0e623a]">JOHN BUILDWELL</div>
                <div className="text-[11px] text-black-400 font-sans tracking-widest uppercase mt-0.5">Since 2007</div>
              </div>
              <div className="text-right text-xs text-black-500 font-sans">
                Date: {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>

            {/* To Address block */}
            <div className="space-y-1 mb-6 font-sans text-xs">
              <div>To,</div>
              <div className="font-bold text-sm text-black-800">{activeFlow.lead?.name}</div>
              <div>{activeFlow.lead?.address}</div>
              <div>Phone: {activeFlow.lead?.phone}</div>
            </div>

            {/* Subject */}
            <div className="mb-6">
              <span className="font-bold">Subject:</span> Payment Request Letter for <strong>{activeFlow.lead?.name}</strong> – <strong>"{activeFlow.project?.name}"</strong>, Plot/Unit No: <strong>{activeFlow.unitId}</strong>
            </div>

            {/* Letter Paragraphs */}
            <div className="space-y-4 text-black-700 mb-8 font-sans text-xs leading-relaxed">
              <p>Dear Sir,</p>
              <p>
                We are writing to inform you that the <strong className="text-black-900">{activeFlow.stages[demandLetterStageIdx].name} ({activeFlow.stages[demandLetterStageIdx].percentage}%)</strong> milestone has been successfully completed for Unit No. <strong className="text-black-900">{activeFlow.unitId}</strong> in our premium project <strong className="text-black-900">"{activeFlow.project?.name}"</strong>, located at {activeFlow.project?.location || 'Palayamkottai, Tirunelveli'}.
              </p>
              <p>
                As per the project's schedule and agreements, we kindly request you to release the corresponding stage payment of <strong className="text-[#0e623a]">Rs. {getStageTotal(activeFlow.stages[demandLetterStageIdx]).toLocaleString()}/-</strong> (<em>{numberToWords(getStageTotal(activeFlow.stages[demandLetterStageIdx]))}</em>) towards the completed milestone work.
              </p>
              <p>Please do the needful and credit the payment to our official account details below:</p>
            </div>

            {/* Corporate Bank accounts info */}
            <div className="bg-black-50 p-4 border rounded-2xl space-y-1 text-xs font-sans mb-8">
              <div className="grid grid-cols-3">
                <span className="text-black-400 font-bold uppercase">Name:</span>
                <span className="col-span-2 font-bold text-black-700">John Buildwell India Private Limited</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-black-400 font-bold uppercase">Bank Name:</span>
                <span className="col-span-2 font-bold text-black-700">Axis Bank Ltd, Palayamkottai</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-black-400 font-bold uppercase">A/C No:</span>
                <span className="col-span-2 font-bold text-black-700 tracking-wider">914030011343603</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-black-400 font-bold uppercase">IFSC NO:</span>
                <span className="col-span-2 font-bold text-black-700 tracking-wider">UTIB0002095</span>
              </div>
            </div>

            {/* Sign off and footer */}
            <div className="flex justify-between items-end pt-8 font-sans text-xs">
              <div>
                <div className="text-black-400 uppercase font-bold text-[10px]">Prepared By</div>
                <div className="font-bold text-black-700 mt-4">Customer Relation Crd team</div>
                <div className="text-black-400 italic mt-0.5">(Mrs. J. Mary)</div>
              </div>
              <div className="text-right">
                <div className="text-black-400 uppercase font-bold text-[10px]">For John Buildwell India (P) Ltd.</div>
                <div className="mt-8 border-t border-dashed border-black-400 w-40 pt-1 text-black-400 italic">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styled Printable styles strictly used in CSS layout mapping */}
      <style>{`
        @media screen {
          .print-only-document {
            display: none !important;
          }
        }
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          /* Hide sidebar, navigation menus, and non-printable elements */
          #root, aside, nav, header, .no-print, button, .top-navbar, svg {
            display: none !important;
          }
          /* Reset root layout padding, background, margins */
          body, html {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
          }
          .print-only-document {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-area {
            display: block !important;
            box-sizing: border-box !important;
            width: calc(100% - 3cm) !important;
            min-height: calc(29.7cm - 3cm) !important;
            margin: 1.5cm !important;
            padding: 2cm !important;
            border: 3px double #0e623a !important; /* Premium green double border */
            box-shadow: none !important;
            background: white !important;
            font-family: Georgia, serif !important;
            font-size: 14px !important;
            line-height: 1.6 !important;
            color: #000 !important;
          }
          .border-b-2 {
            border-bottom-width: 2px !important;
            border-color: #0e623a !important;
          }
        }
      `}</style>

      {/* Complete Stage Modal */}
      {completeStageIdx !== null && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              type="button" 
              onClick={() => { setCompleteStageIdx(null); setCompletionNotes(''); }}
              className="absolute top-4 right-4 text-black-400 hover:text-black-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-black-800 mb-4">Complete Stage</h2>
            <p className="text-sm text-black-600 mb-4">Please provide conversation notes or narration for this stage completion.</p>
            <textarea
              className="w-full border border-black-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0e623a]"
              rows="4"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Enter notes..."
            ></textarea>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setCompleteStageIdx(null); setCompletionNotes(''); }}
                className="px-4 py-2 text-black-600 font-semibold hover:bg-black-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStageComplete(completeStageIdx)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white font-bold rounded-lg transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Completion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-red-100 relative">
            <button 
              type="button" 
              onClick={() => { setCancelModalOpen(false); setCancelNarration(''); }}
              className="absolute top-4 right-4 text-black-400 hover:text-black-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Cancel CRD Plan
            </h2>
            <p className="text-sm text-black-600 mb-4">This will send a cancellation request to the Superadmin. Please provide a detailed narration.</p>
            <textarea
              className="w-full border border-red-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-600 bg-red-50"
              rows="4"
              value={cancelNarration}
              onChange={(e) => setCancelNarration(e.target.value)}
              placeholder="Why is this plan being cancelled?..."
            ></textarea>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setCancelModalOpen(false); setCancelNarration(''); }}
                className="px-4 py-2 text-black-600 font-semibold hover:bg-black-100 rounded-lg transition"
              >
                Abort
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] flex flex-col relative">
            <button 
              type="button" 
              onClick={() => setHistoryModalOpen(false)}
              className="absolute top-4 right-4 text-black-400 hover:text-black-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-black-800 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-[#0e623a]" /> CRD Flow History
            </h2>
            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
              {activeFlow?.history?.length > 0 ? (
                activeFlow.history.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="bg-black-50 border border-black-200 p-4 rounded-xl flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs uppercase">
                        {entry.user ? entry.user.slice(0, 2) : 'SY'}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-black-800">{entry.action}</h4>
                      <p className="text-sm text-black-600 mt-1">{entry.notes}</p>
                      <div className="text-xs text-black-400 mt-2 font-medium">
                        {new Date(entry.date).toLocaleString()} • {entry.user || 'System'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-black-500 py-6">No history available yet.</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-black-200 hover:bg-black-300 text-black-800 font-bold rounded-lg transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Sheet Preview Modal */}
      {sheetPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#0e623a] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                <h2 className="text-lg font-bold">Master CRD Flow Format Preview</h2>
              </div>
              <button onClick={() => setSheetPreviewModalOpen(false)} className="text-emerald-200 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-black-50">
              <div className="bg-white border border-black-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black-100 border-b border-black-200 text-black-600 font-bold">
                    <tr>
                      <th className="p-4 border-r border-black-200 w-16 text-center">#</th>
                      <th className="p-4 border-r border-black-200">Construction Stage / Milestone</th>
                      <th className="p-4 text-center w-24">Payment %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black-100">
                    {defaultStagesTemplate.map((stage, idx) => (
                      <tr key={idx} className="hover:bg-black-50/50">
                        <td className="p-4 border-r border-black-200 text-center font-bold text-black-400">{idx + 1}</td>
                        <td className="p-4 border-r border-black-200 font-semibold text-black-700">{stage.name}</td>
                        <td className="p-4 text-center font-bold text-[#0e623a]">{stage.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 border-t border-black-100 bg-white flex justify-end">
               <button onClick={() => setSheetPreviewModalOpen(false)} className="px-5 py-2 bg-black-100 hover:bg-black-200 text-black-700 font-bold rounded-xl transition">
                 Close Preview
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Extra Work Details Popup */}
      {extraWorkDetailsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-black-100">
            <div className="bg-[#0e623a] p-6 text-white relative">
              <button 
                type="button" 
                onClick={() => setExtraWorkDetailsModal(null)}
                className="absolute top-4 right-4 text-emerald-100 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span>Extra Work Details</span>
              </h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-black-400 font-bold uppercase tracking-wider mb-1">Work ID (Req ID)</div>
                  <div className="font-mono font-bold text-black-800">{extraWorkDetailsModal.ewId || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-black-400 font-bold uppercase tracking-wider mb-1">Estimated Value</div>
                  <div className="font-bold text-black-800 text-base">Rs. {extraWorkDetailsModal.amount?.toLocaleString()}</div>
                </div>
                
                <div className="col-span-2 border-t border-black-100 pt-3">
                  <div className="text-xs text-black-400 font-bold uppercase tracking-wider mb-2 text-center bg-black-50 py-1 rounded">Timeline & Dates</div>
                  <div className="space-y-3 mt-3">
                    <div className="flex justify-between items-center border-b border-black-50 pb-2">
                      <span className="text-black-600 font-semibold">Estimated Date (PED Created):</span>
                      <span className="font-bold text-black-800">{extraWorkDetailsModal.pricingDate ? new Date(extraWorkDetailsModal.pricingDate).toLocaleDateString('en-GB') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-black-50 pb-2">
                      <span className="text-black-600 font-semibold">Sent to PED Team Date:</span>
                      <span className="font-bold text-black-800">{extraWorkDetailsModal.sentToPedDate ? new Date(extraWorkDetailsModal.sentToPedDate).toLocaleDateString('en-GB') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-black-50 pb-2">
                      <span className="text-black-600 font-semibold">Customer Approval On:</span>
                      <span className="font-bold text-emerald-700">{extraWorkDetailsModal.customerApprovalDate ? new Date(extraWorkDetailsModal.customerApprovalDate).toLocaleDateString('en-GB') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-black-50 pb-2">
                      <span className="text-black-600 font-semibold">Sent to Accounts Date:</span>
                      <span className="font-bold text-blue-700">{extraWorkDetailsModal.crdAddedDate ? new Date(extraWorkDetailsModal.crdAddedDate).toLocaleDateString('en-GB') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-black-600 font-semibold">Work Order Issued On:</span>
                      <span className="font-bold text-purple-700">{extraWorkDetailsModal.crdAddedDate ? new Date(extraWorkDetailsModal.crdAddedDate).toLocaleDateString('en-GB') : '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default CRDFlow;
