import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Target,
  Search,
  ArrowRight,
  TrendingDown,
  Building,
  BarChart3,
  Percent,
  FileText,
  User,
  FolderOpen,
  Layers,
  Download
} from 'lucide-react';

const getCoordinatesForPercent = (percent) => {
  const x = Math.cos(2 * Math.PI * (percent - 0.25));
  const y = Math.sin(2 * Math.PI * (percent - 0.25));
  return [x, y];
};

const ObservedSwirlPieChart = ({
  dataArray,
  valueKey,
  labelKey,
  isCount,
  onSegmentClick
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const total = dataArray.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 italic text-xs">
        No data available
      </div>
    );
  }

  const availableItem = dataArray.find(d => d[labelKey]?.toLowerCase() === 'available') || { [valueKey]: 0, [labelKey]: 'Available' };
  const bookedItem = dataArray.find(d => d[labelKey]?.toLowerCase() === 'booked') || { [valueKey]: 0, [labelKey]: 'Booked' };
  const handoverItem = dataArray.find(d => d[labelKey]?.toLowerCase() === 'handover') || { [valueKey]: 0, [labelKey]: 'Handover' };

  const availPct = total > 0 ? (availableItem[valueKey] / total) * 100 : 0;
  const bookedPct = total > 0 ? (bookedItem[valueKey] / total) * 100 : 0;
  const handoverPct = total > 0 ? (handoverItem[valueKey] / total) * 100 : 0;

  const cx = 160;
  const cy = 160;

  const slots = [
    {
      item: availableItem,
      pct: availPct,
      color: '#7ebda9',
      circleBg: '#9ad1c0',
      label: 'Available',
      rotation: 0
    },
    {
      item: bookedItem,
      pct: bookedPct,
      color: '#8bc34a',
      circleBg: '#a2d663',
      label: 'Booked',
      rotation: 120
    },
    {
      item: handoverItem,
      pct: handoverPct,
      color: '#004d61',
      circleBg: '#00657f',
      label: 'Handover',
      rotation: 240
    }
  ];

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row-reverse items-center justify-center gap-6 md:gap-8 w-full relative p-4">
      <style>{`
        @keyframes swirlIn {
          0% {
            transform: translate(160px, 160px) rotate(-180deg) scale(0.3);
            opacity: 0;
          }
          100% {
            transform: translate(160px, 160px) rotate(0deg) scale(1);
            opacity: 1;
          }
        }
        .animate-swirl {
          animation: swirlIn 1.3s cubic-bezier(0.25, 1, 0.5, 1) both;
          transform-origin: 0 0;
        }
        .swirl-hover-effect {
          transition: filter 0.3s ease;
          cursor: pointer;
        }
        .swirl-hover-effect:hover {
          filter: brightness(1.05);
        }
      `}</style>

      <div className="relative w-80 h-80 shrink-0">
        <svg 
          className={`w-full h-full opacity-0 ${isVisible ? 'transition-opacity duration-300 !opacity-100' : ''}`} 
          viewBox="0 0 320 320"
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="5" stdDeviation="4" floodOpacity="0.22" />
            </filter>
            <path 
              id="swirl-blade"
              d="M 0 -135 A 135 135 0 0 1 116.91 67.5 A 67.5 67.5 0 0 0 0 0 A 67.5 67.5 0 0 0 0 -135 Z"
            />
          </defs>

          <g className={isVisible ? 'animate-swirl' : ''}>
            {slots.map((slot, index) => {
              return (
                <g 
                  key={index}
                  className="swirl-hover-effect"
                  transform={`rotate(${slot.rotation})`}
                  onClick={() => onSegmentClick && onSegmentClick(slot.item)}
                >
                  <use 
                    href="#swirl-blade"
                    fill={slot.color}
                    filter="url(#shadow)"
                  />
                  <circle 
                    cx="0" 
                    cy="-67.5" 
                    r="54" 
                    fill="#ffffff"
                    stroke={slot.color}
                    strokeWidth="4"
                    filter="url(#shadow)"
                  />
                  <g transform="translate(0, -67.5)">
                    <text
                      x="0"
                      y="-16"
                      textAnchor="middle"
                      fill="#1e293b"
                      className="font-black text-[14px] uppercase tracking-wider"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {slot.label}
                    </text>
                    <text
                      x="0"
                      y="7"
                      textAnchor="middle"
                      fill="#0f172a"
                      className="font-black text-[24px]"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {slot.pct.toFixed(1)}%
                    </text>
                    <text
                      x="0"
                      y="26"
                      textAnchor="middle"
                      fill="#475569"
                      className="font-black text-[11px]"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {`(${slot.item[valueKey]} ${typeof isCount === 'string' ? isCount : 'Units'})`}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="flex flex-col gap-3 justify-center items-center w-96 mt-6 md:mt-0">
        {slots.map((slot, index) => {
          const val = slot.item[valueKey] || 0;
          return (
            <div key={index} className="flex items-center gap-4 bg-slate-50/90 backdrop-blur-sm border border-slate-100/50 rounded-2xl px-6 py-4 hover:bg-slate-100 transition shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] w-full">
              <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: slot.color }}></span>
              <div className="flex flex-col text-left">
                <span className="text-base font-black text-gray-500 uppercase tracking-wider">{slot.label}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-gray-900 font-black text-3xl">{slot.pct.toFixed(1)}%</span>
                  <span className="text-gray-500 font-bold text-base">({val} {typeof isCount === 'string' ? isCount : 'Units'})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ObservedPieChart = ({
  dataArray,
  valueKey,
  labelKey,
  colorPalette,
  isCount,
  onSegmentClick,
  selectedLabel
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const total = dataArray.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 italic text-xs">
        No data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full relative p-4">
      <style>{`
        .slice-hover-effect {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease;
          cursor: pointer;
        }
        .slice-hover-effect:hover {
          transform: scale(1.04);
          filter: brightness(1.05) drop-shadow(0 6px 12px rgba(0,0,0,0.1));
        }
      `}</style>

      {/* Detail Tags */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
        {dataArray.map((item, index) => {
          const val = item[valueKey] || 0;
          const percentage = (val / total) * 100;
          const color = colorPalette[index % colorPalette.length];
          const isSelected = selectedLabel === item[labelKey];
          return (
            <div 
              key={index} 
              onClick={() => onSegmentClick && onSegmentClick(item)}
              className={`flex flex-col items-start bg-slate-50 border rounded-2xl p-4 hover:bg-slate-100 transition shadow-sm cursor-pointer w-full ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}
            >
              <div className="flex items-center gap-2 mb-2 w-full">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider truncate">{item[labelKey]}</span>
              </div>
              <div className="flex flex-col items-start gap-0.5 mt-auto">
                <span className="text-gray-900 font-black text-xl leading-none">{percentage.toFixed(1)}%</span>
                <span className="text-gray-500 font-bold text-xs mt-1">({isCount ? `${val} ${typeof isCount === 'string' ? isCount : 'Leads'}` : `₹${Math.round(val).toLocaleString()}`})</span>
              </div>
            </div>
          );
        })}
      </div>

      {hoveredItem && (
        <div 
          className="absolute z-50 pointer-events-none bg-gray-900/95 backdrop-blur-md text-white text-[11px] px-3.5 py-2.5 rounded-2xl shadow-xl border border-gray-800 flex flex-col gap-1 pointer-events-none transition-all duration-75"
          style={{ 
            left: `${mousePos.x + 15}px`, 
            top: `${mousePos.y + 15}px`,
            fontFamily: "'Segoe UI', system-ui, sans-serif"
          }}
        >
          <span className="font-extrabold text-[9px] uppercase tracking-wider text-gray-400">
            {hoveredItem[labelKey]}
          </span>
          <div className="flex items-center gap-2 font-sans font-black">
            <span className="text-[#10b981] font-black text-sm">
              {((hoveredItem[valueKey] / total) * 100).toFixed(1)}%
            </span>
            <span className="text-gray-300 font-extrabold text-[10px]">
              ({isCount ? `${hoveredItem[valueKey]} ${typeof isCount === 'string' ? isCount : 'Leads'}` : `₹${Math.round(hoveredItem[valueKey]).toLocaleString()}`})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const CRDDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);
  const [bookedModalOpen, setBookedModalOpen] = useState(false);
  const clickTimeoutRef = useRef(null);
  const bookedClickTimeoutRef = useRef(null);

  const handleLeadsCardClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      navigate('/leads');
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        setLeadsModalOpen(true);
      }, 300);
    }
  };

  const handleBookedCardClick = () => {
    if (bookedClickTimeoutRef.current) {
      clearTimeout(bookedClickTimeoutRef.current);
      bookedClickTimeoutRef.current = null;
      navigate('/leads?status=Booking');
    } else {
      bookedClickTimeoutRef.current = setTimeout(() => {
        bookedClickTimeoutRef.current = null;
        setBookedModalOpen(true);
      }, 300);
    }
  };

  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const handoverClickTimeoutRef = useRef(null);

  const handleHandoverCardClick = () => {
    if (handoverClickTimeoutRef.current) {
      clearTimeout(handoverClickTimeoutRef.current);
      handoverClickTimeoutRef.current = null;
      navigate('/leads?status=Won');
    } else {
      handoverClickTimeoutRef.current = setTimeout(() => {
        handoverClickTimeoutRef.current = null;
        setHandoverModalOpen(true);
      }, 300);
    }
  };

  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [breakdownModalData, setBreakdownModalData] = useState({ title: '', users: [] });
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [selectedInventoryProj, setSelectedInventoryProj] = useState(null); // { projCode, stats }
  const [cardBreakdownModal, setCardBreakdownModal] = useState({ open: false, type: '' });

  const handleStageClick = (stageLabel, sourceContext) => {
    if (!stats.cards.leadsList) return;

    let filtered = [...stats.cards.leadsList];

    // 1. Filter by Context
    if (sourceContext === 'user') {
      if (selectedUserPerfName) {
        filtered = filtered.filter(l => l.assignedTo === selectedUserPerfName);
      }
    } else if (sourceContext === 'source') {
      if (selectedSourceGroup) {
        if (selectedSubSource) {
          filtered = filtered.filter(l => l.leadSource.toLowerCase() === selectedSubSource.toLowerCase());
        } else {
          const groupObj = stats.groupStats[selectedSourceGroup];
          const groupSources = (groupObj?.sources || []).map(s => s.source.toLowerCase());
          filtered = filtered.filter(l => groupSources.includes(l.leadSource.toLowerCase()));
        }
      }
    }

    // 2. Filter by Stage
    if (stageLabel === 'Enquiries') {
      filtered = filtered.filter(l => l.status === 'Contacted' || l.status === 'Follow-Up');
    } else if (stageLabel === 'Site Visit') {
      filtered = filtered.filter(l => l.status === 'Site Visit' || l.status === 'Site Visit Follow-up');
    } else if (stageLabel === 'Hot List') {
      filtered = filtered.filter(l => l.status === 'Qualified');
    } else if (stageLabel === 'Booking') {
      filtered = filtered.filter(l => l.status === 'Booking');
    } else if (stageLabel === 'Handover') {
      filtered = filtered.filter(l => l.status === 'Won');
    } else if (stageLabel === 'Lost') {
      filtered = filtered.filter(l => l.status === 'Lost');
    }
    // 'Total Leads' needs no status filter.

    // 3. Group by User Name and Count
    const counts = {};
    filtered.forEach(l => {
      const user = l.assignedTo || 'Unassigned';
      counts[user] = (counts[user] || 0) + 1;
    });

    const userBreakdown = Object.keys(counts).map(name => ({
      name,
      count: counts[name]
    })).sort((a, b) => b.count - a.count);

    const titleContext = sourceContext === 'user'
      ? (selectedUserPerfName || 'All Users')
      : (selectedSubSource ? `${selectedSourceGroup} - ${selectedSubSource}` : (selectedSourceGroup || 'All Sources'));

    setBreakdownModalData({
      title: `${stageLabel} - User Breakdown (${titleContext})`,
      users: userBreakdown
    });
    setBreakdownModalOpen(true);
  };
  
  // Date filters - default to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    const lastDayVal = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(lastDayVal).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // User and Project filters
  const [selectedUser, setSelectedUser] = useState(() => {
    const isPrivileged = user?.role === 'Super Admin' || user?.role === 'Admin';
    return isPrivileged ? '' : (user?._id || '');
  });
  
  useEffect(() => {
    if (user && user.role !== 'Super Admin' && user.role !== 'Admin') {
      setSelectedUser(user._id);
    }
  }, [user]);

  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUsersList, setSelectedUsersList] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProjectsList, setSelectedProjectsList] = useState([]);
  
  const [selectedSource, setSelectedSource] = useState('');
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [selectedSourcesList, setSelectedSourcesList] = useState([]);
  const [showDetailedPreviewModal, setShowDetailedPreviewModal] = useState(false);
  const [showSourceDetailedPreviewModal, setShowSourceDetailedPreviewModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    cards: {
      totalLeads: 0,
      liveLeads: 0,
      today: { leads: 0, enquiries: 0, siteVisits: 0, hotList: 0, booked: 0, handover: 0 },
      enquiries: { total: 0, live: 0, contacted: 0, followup: 0, closed: 0 },
      siteVisits: { total: 0, live: 0, siteVisit: 0, followup: 0, closed: 0 },
      hotList: { total: 0, live: 0 },
      conversion: { count: 0, value: 0, received: 0, pending: 0 },
      booked: { total: 0, live: 0, count: 0, value: 0, received: 0, pending: 0 },
      handover: { total: 0, live: 0, count: 0, value: 0, received: 0, pending: 0 },
      inventory: { totalProjects: 0, totalUnits: 0, availableUnits: 0, bookedUnits: 0, handoverUnits: 0 }
    },
    sourceStats: {},
    userStats: {},
    projectStats: {},
    stageStats: {},
    layeredStats: { projectTypes: {}, stages: {}, sources: {} },
    users: [],
    projects: []
  });

  const [selectedUserPerfName, setSelectedUserPerfName] = useState(null);

  const userPerformanceData = React.useMemo(() => {
    const data = {};
    
    (stats.users || []).forEach(u => {
      data[u.name] = {
        userName: u.name,
        totalLeads: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        booked: 0,
        handover: 0,
        lost: 0
      };
    });

    Object.keys(stats.personProjectStages || {}).forEach(key => {
      const row = stats.personProjectStages[key];
      const uName = row.personName;
      if (!data[uName]) {
        data[uName] = {
          userName: uName,
          totalLeads: 0,
          enquiries: 0,
          siteVisits: 0,
          hotList: 0,
          booked: 0,
          handover: 0,
          lost: 0
        };
      }
      data[uName].totalLeads += row.totalLeads || 0;
      data[uName].enquiries += row.enquiries || 0;
      data[uName].siteVisits += row.siteVisits || 0;
      data[uName].hotList += row.hotList || 0;
      data[uName].booked += row.booked || 0;
      data[uName].handover += row.handover || 0;
      data[uName].lost += row.lost || 0;
    });
    return Object.values(data).filter(u => u.totalLeads > 0);
  }, [stats.personProjectStages, stats.users]);

  const selectedUserPerfData = React.useMemo(() => {
    if (!selectedUserPerfName) {
      const totals = {
        userName: 'All Users Combined',
        totalLeads: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        booked: 0,
        handover: 0,
        lost: 0
      };
      userPerformanceData.forEach(u => {
        totals.totalLeads += u.totalLeads;
        totals.enquiries += u.enquiries;
        totals.siteVisits += u.siteVisits;
        totals.hotList += u.hotList;
        totals.booked += u.booked;
        totals.handover += u.handover;
        totals.lost += u.lost;
      });
      return totals;
    }
    return userPerformanceData.find(u => u.userName === selectedUserPerfName) || {
      userName: selectedUserPerfName,
      totalLeads: 0,
      enquiries: 0,
      siteVisits: 0,
      hotList: 0,
      booked: 0,
      handover: 0,
      lost: 0
    };
  }, [selectedUserPerfName, userPerformanceData]);

  const [selectedSourceGroup, setSelectedSourceGroup] = useState(null);
  const [selectedSubSource, setSelectedSubSource] = useState(null);

  // Group-level totals
  const sourceGroupsPerformanceData = React.useMemo(() => {
    return Object.keys(stats.groupStats || {}).map(groupName => {
      const g = stats.groupStats[groupName];
      const totals = {
        groupName: groupName,
        totalLeads: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        booked: 0,
        handover: 0,
        lost: 0
      };
      (g.sources || []).forEach(src => {
        totals.totalLeads += src.count || 0;
        totals.enquiries += src.enquiries || 0;
        totals.siteVisits += src.siteVisits || 0;
        totals.hotList += src.hotList || 0;
        totals.booked += src.booked || 0;
        totals.handover += src.handover || 0;
        totals.lost += src.lost || 0;
      });
      return totals;
    }).filter(g => g.totalLeads > 0);
  }, [stats.groupStats]);

  // Sub-sources data under the selected group
  const subSourcesPerformanceData = React.useMemo(() => {
    if (!selectedSourceGroup) return [];
    const g = stats.groupStats[selectedSourceGroup];
    if (!g) return [];
    return (g.sources || []).map(src => ({
      subSourceName: src.source,
      totalLeads: src.count || 0,
      enquiries: src.enquiries || 0,
      siteVisits: src.siteVisits || 0,
      hotList: src.hotList || 0,
      booked: src.booked || 0,
      handover: src.handover || 0,
      lost: src.lost || 0
    })).filter(s => s.totalLeads > 0);
  }, [selectedSourceGroup, stats.groupStats]);

  // The metrics to display on the details card
  const selectedSourcePerfData = React.useMemo(() => {
    if (!selectedSourceGroup) {
      // Combined totals of all groups
      const totals = {
        displayName: 'All Sources Combined',
        totalLeads: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        booked: 0,
        handover: 0,
        lost: 0
      };
      sourceGroupsPerformanceData.forEach(g => {
        totals.totalLeads += g.totalLeads;
        totals.enquiries += g.enquiries;
        totals.siteVisits += g.siteVisits;
        totals.hotList += g.hotList;
        totals.booked += g.booked;
        totals.handover += g.handover;
        totals.lost += g.lost;
      });
      return totals;
    }

    if (selectedSubSource) {
      const match = subSourcesPerformanceData.find(s => s.subSourceName === selectedSubSource);
      return match ? { ...match, displayName: `${selectedSourceGroup} - ${selectedSubSource}` } : {
        displayName: selectedSubSource,
        totalLeads: 0, enquiries: 0, siteVisits: 0, hotList: 0, booked: 0, handover: 0, lost: 0
      };
    }

    // Selected group totals
    const groupMatch = sourceGroupsPerformanceData.find(g => g.groupName === selectedSourceGroup);
    return groupMatch ? { ...groupMatch, displayName: selectedSourceGroup } : {
      displayName: selectedSourceGroup,
      totalLeads: 0, enquiries: 0, siteVisits: 0, hotList: 0, booked: 0, handover: 0, lost: 0
    };
  }, [selectedSourceGroup, selectedSubSource, sourceGroupsPerformanceData, subSourcesPerformanceData]);

  const handleExportDetailedExcel = () => {
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <style>
          table { border-collapse: collapse; }
          td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
          th { font-weight: bold; background-color: #0e623a; color: white; border: 1px solid #0e623a; text-align: center; }
          .title-row { font-size: 14pt; font-weight: bold; color: #0e623a; }
          .even-row { background-color: #f8fafc; }
          .bold-label { font-weight: bold; color: #0f172a; }
          .summary-row { font-weight: bold; background-color: #e2f0d9; color: #385723; }
        </style>
      </head>
      <body>
        <table>
          <tr style="height: 120px;">
            <td colspan="3" style="background-color: #0e623a; border: none; text-align: center; vertical-align: middle; height: 120px;">
              <img src="${logoPath}" height="95" style="height: 95px; width: auto; display: block; margin: 0 auto;" />
            </td>
            <td colspan="5" class="title-row" style="border:none; vertical-align:middle; text-align:center; font-size: 14pt; font-weight: bold; color: #0e623a; height: 120px;">
              JohnBuildwell ERP - USER PERFORMANCE DETAILS
            </td>
          </tr>
          <tr><td colspan="8" style="border:none; height: 15px;"></td></tr>
          
          <tr>
            <th>User Name</th>
            <th>Total Leads</th>
            <th>Enquiries</th>
            <th>Site Visit</th>
            <th>Hot List</th>
            <th>Booking</th>
            <th>Handover</th>
            <th>Lost</th>
          </tr>
    `;

    const dataToExport = selectedUserPerfName 
      ? [selectedUserPerfData] 
      : userPerformanceData;

    dataToExport.forEach((row, idx) => {
      const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
      htmlContent += `
        <tr ${rowClass}>
          <td class="bold-label">${row.userName}</td>
          <td>${row.totalLeads}</td>
          <td>${row.enquiries}</td>
          <td>${row.siteVisits}</td>
          <td>${row.hotList}</td>
          <td>${row.booked}</td>
          <td>${row.handover}</td>
          <td>${row.lost}</td>
        </tr>
      `;
    });

    if (dataToExport.length > 1) {
      const totals = {
        totalLeads: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        booked: 0,
        handover: 0,
        lost: 0
      };
      userPerformanceData.forEach(u => {
        totals.totalLeads += u.totalLeads;
        totals.enquiries += u.enquiries;
        totals.siteVisits += u.siteVisits;
        totals.hotList += u.hotList;
        totals.booked += u.booked;
        totals.handover += u.handover;
        totals.lost += u.lost;
      });
      htmlContent += `
        <tr class="summary-row">
          <td class="bold-label">TOTAL</td>
          <td>${totals.totalLeads}</td>
          <td>${totals.enquiries}</td>
          <td>${totals.siteVisits}</td>
          <td>${totals.hotList}</td>
          <td>${totals.booked}</td>
          <td>${totals.handover}</td>
          <td>${totals.lost}</td>
        </tr>
      `;
    }

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `User_Performance_Detailed_${selectedUserPerfName || 'All'}_${new Date().toISOString().substring(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSourceDetailedExcel = () => {
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <style>
          table { border-collapse: collapse; }
          td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
          th { font-weight: bold; background-color: #0e623a; color: white; border: 1px solid #0e623a; text-align: center; }
          .title-row { font-size: 14pt; font-weight: bold; color: #0e623a; }
          .even-row { background-color: #f8fafc; }
          .bold-label { font-weight: bold; color: #0f172a; }
          .summary-row { font-weight: bold; background-color: #e2f0d9; color: #385723; }
        </style>
      </head>
      <body>
        <table>
          <tr style="height: 120px;">
            <td colspan="3" style="background-color: #0e623a; border: none; text-align: center; vertical-align: middle; height: 120px;">
              <img src="${logoPath}" height="95" style="height: 95px; width: auto; display: block; margin: 0 auto;" />
            </td>
            <td colspan="6" class="title-row" style="border:none; vertical-align:middle; text-align:center; font-size: 14pt; font-weight: bold; color: #0e623a; height: 120px;">
              JohnBuildwell ERP - MARKETING SOURCE PERFORMANCE DETAILS
            </td>
          </tr>
          <tr><td colspan="9" style="border:none; height: 15px;"></td></tr>
          
          <tr>
            <th>Group Name</th>
            <th>Source Name</th>
            <th>Total Leads</th>
            <th>Enquiries</th>
            <th>Site Visit</th>
            <th>Hot List</th>
            <th>Booking</th>
            <th>Handover</th>
            <th>Lost</th>
          </tr>
    `;

    const rows = [];
    Object.keys(stats.groupStats || {}).forEach(groupName => {
      if (selectedSourceGroup && groupName !== selectedSourceGroup) return;
      const g = stats.groupStats[groupName];
      (g.sources || []).forEach(src => {
        if (selectedSubSource && src.source !== selectedSubSource) return;
        rows.push({
          groupName: groupName,
          sourceName: src.source,
          totalLeads: src.count || 0,
          enquiries: src.enquiries || 0,
          siteVisits: src.siteVisits || 0,
          hotList: src.hotList || 0,
          booked: src.booked || 0,
          handover: src.handover || 0,
          lost: src.lost || 0
        });
      });
    });

    rows.forEach((row, idx) => {
      const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
      htmlContent += `
        <tr ${rowClass}>
          <td class="bold-label">${row.groupName}</td>
          <td>${row.sourceName}</td>
          <td>${row.totalLeads}</td>
          <td>${row.enquiries}</td>
          <td>${row.siteVisits}</td>
          <td>${row.hotList}</td>
          <td>${row.booked}</td>
          <td>${row.handover}</td>
          <td>${row.lost}</td>
        </tr>
      `;
    });

    if (rows.length > 1) {
      const totals = {
        totalLeads: 0,
        enquiries: 0,
        siteVisits: 0,
        hotList: 0,
        booked: 0,
        handover: 0,
        lost: 0
      };
      rows.forEach(r => {
        totals.totalLeads += r.totalLeads;
        totals.enquiries += r.enquiries;
        totals.siteVisits += r.siteVisits;
        totals.hotList += r.hotList;
        totals.booked += r.booked;
        totals.handover += r.handover;
        totals.lost += r.lost;
      });
      htmlContent += `
        <tr class="summary-row">
          <td colspan="2" class="bold-label">TOTAL</td>
          <td>${totals.totalLeads}</td>
          <td>${totals.enquiries}</td>
          <td>${totals.siteVisits}</td>
          <td>${totals.hotList}</td>
          <td>${totals.booked}</td>
          <td>${totals.handover}</td>
          <td>${totals.lost}</td>
        </tr>
      `;
    }

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Source_Performance_Detailed_${selectedSourceGroup || 'All'}_${new Date().toISOString().substring(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fromDate, toDate, selectedUser, selectedProject, selectedProjectType, selectedSource]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/dashboard/stats?fromDate=${fromDate}&toDate=${toDate}`;
      if (selectedUser) url += `&userId=${selectedUser}`;
      if (selectedProject) url += `&projectId=${selectedProject}`;
      if (selectedProjectType) url += `&projectType=${selectedProjectType}`;
      if (selectedSource) url += `&source=${selectedSource}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * (percent - 0.25));
    const y = Math.sin(2 * Math.PI * (percent - 0.25));
    return [x, y];
  };

  // Helper to render an SVG solid Pie chart dynamically
  const renderPieChart = (dataArray, valueKey, labelKey, colorPalette, isCount = false, onSegmentClick = null, selectedLabel = null) => {
    return (
      <ObservedPieChart 
        dataArray={dataArray}
        valueKey={valueKey}
        labelKey={labelKey}
        colorPalette={colorPalette}
        isCount={isCount}
        onSegmentClick={onSegmentClick}
        selectedLabel={selectedLabel}
      />
    );
  };

  // Helper to render the custom interlocking swirl pie chart for JMD/JLB Project Inventories
  const renderSwirlPieChart = (dataArray, valueKey, labelKey, isCount = false, onSegmentClick = null) => {
    return (
      <ObservedSwirlPieChart 
        dataArray={dataArray}
        valueKey={valueKey}
        labelKey={labelKey}
        isCount={isCount}
        onSegmentClick={onSegmentClick}
      />
    );
  };

  const handleMonthChange = (monthVal) => {
    if (!monthVal) return;
    setSelectedMonth(monthVal);
    const [yearStr, monthStr] = monthVal.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const lastDayVal = new Date(year, month, 0).getDate();
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayVal).padStart(2, '0')}`;
    setFromDate(firstDay);
    setToDate(lastDay);
  };

  const logoPath = window.location.origin + "/jb_logo.jpg";

  const handleExportExcel = async () => {
    const inventory = stats.cards.inventory || {};
    
    const availableProjCount = inventory.totalProjects || 0;
    const availableProjVal = (inventory.availableValueByType?.Plot || 0) + 
                             (inventory.availableValueByType?.Flat || 0) + 
                             (inventory.availableValueByType?.Villa || 0) +
                             (inventory.availableValueByType?.House || 0);

    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <style>
          table { border-collapse: collapse; }
          td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
          th { font-weight: bold; background-color: #0e623a; color: white; border: 1px solid #0e623a; text-align: center; }
          .title-row { font-size: 22pt; font-weight: bold; color: #0e623a; }
          .section-banner { font-size: 11pt; font-weight: bold; background-color: #e2f0d9; color: #385723; padding: 12px; border: 1px solid #c5e1a5; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
          .even-row { background-color: #f8fafc; }
          .bold-label { font-weight: bold; color: #0f172a; }
        </style>
      </head>
      <body>
        <table>
          <tr style="height: 120px;">
            <td colspan="3" style="background-color: #0e623a; border: none; text-align: center; vertical-align: middle; height: 120px;">
              <img src="${logoPath}" height="95" style="height: 95px; width: auto; display: block; margin: 0 auto;" />
            </td>
            <td colspan="6" class="title-row" style="border:none; vertical-align:middle; text-align:center; font-size: 22pt; font-weight: bold; color: #0e623a; height: 120px;">
              JohnBuildwell ERP - OVERALL STATUS REPORT
            </td>
          </tr>
          <tr><td colspan="9" style="border:none; height: 15px;"></td></tr>
          
          <!-- PART 1 -->
          <tr><td colspan="9" class="section-banner">PART 1: PROJECTS & UNIT TYPE SUMMARY</td></tr>
          <tr>
            <th colspan="3">Metric</th>
            <th colspan="3">Count</th>
            <th colspan="3">Total Value (INR)</th>
          </tr>
          <tr>
            <td colspan="3" class="bold-label">Available Projects (Common)</td>
            <td colspan="3">${availableProjCount}</td>
            <td colspan="3">Rs. ${availableProjVal.toLocaleString()}</td>
          </tr>
          <tr class="even-row">
            <td colspan="3" class="bold-label">Available Projects (Plot)</td>
            <td colspan="3">${inventory.projectsByType?.Plot || 0}</td>
            <td colspan="3">Rs. ${(inventory.availableValueByType?.Plot || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="3" class="bold-label">Available Projects (Flat)</td>
            <td colspan="3">${inventory.projectsByType?.Flat || 0}</td>
            <td colspan="3">Rs. ${(inventory.availableValueByType?.Flat || 0).toLocaleString()}</td>
          </tr>
          <tr class="even-row">
            <td colspan="3" class="bold-label">Available Projects (Villa)</td>
            <td colspan="3">${(inventory.projectsByType?.Villa || 0) + (inventory.projectsByType?.House || 0)}</td>
            <td colspan="3">Rs. ${((inventory.availableValueByType?.Villa || 0) + (inventory.availableValueByType?.House || 0)).toLocaleString()}</td>
          </tr>
          <tr><td colspan="9" style="border:none; height: 10px;"></td></tr>
          
          <tr>
            <th>Project Type</th>
            <th>Overall Count</th>
            <th>Overall Value (INR)</th>
            <th>Available Count</th>
            <th>Available Value (INR)</th>
            <th>Booked Count</th>
            <th>Booked Value (INR)</th>
            <th>Sold Out Count</th>
            <th>Sold Out Value (INR)</th>
          </tr>
     `;

    ['Plot', 'Flat', 'Villa'].forEach((type, idx) => {
      const overallCount = (inventory.totalByType?.[type] || 0) + (type === 'Villa' ? (inventory.totalByType?.House || 0) : 0);
      const overallVal = (inventory.totalValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.totalValueByType?.House || 0) : 0);
      const availCount = (inventory.availableByType?.[type] || 0) + (type === 'Villa' ? (inventory.availableByType?.House || 0) : 0);
      const availVal = (inventory.availableValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.availableValueByType?.House || 0) : 0);
      const bookedCount = (inventory.bookedByType?.[type] || 0) + (type === 'Villa' ? (inventory.bookedByType?.House || 0) : 0);
      const bookedVal = (inventory.bookedValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.bookedValueByType?.House || 0) : 0);
      const soldCount = (inventory.handoverByType?.[type] || 0) + (type === 'Villa' ? (inventory.handoverByType?.House || 0) : 0);
      const soldVal = (inventory.handoverValueByType?.[type] || 0) + (type === 'Villa' ? (inventory.handoverValueByType?.House || 0) : 0);
      
      const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
      
      htmlContent += `
        <tr ${rowClass}>
          <td class="bold-label">${type}</td>
          <td>${overallCount}</td>
          <td>Rs. ${overallVal.toLocaleString()}</td>
          <td>${availCount}</td>
          <td>Rs. ${availVal.toLocaleString()}</td>
          <td>${bookedCount}</td>
          <td>Rs. ${bookedVal.toLocaleString()}</td>
          <td>${soldCount}</td>
          <td>Rs. ${soldVal.toLocaleString()}</td>
        </tr>
      `;
    });

    htmlContent += `
          <tr><td colspan="9" style="border:none; height: 10px;"></td></tr>
          
          <!-- PART 2 -->
          <tr><td colspan="9" class="section-banner">PART 2: PROJECT BASED WORKFLOW STAGES</td></tr>
          <tr>
            <th colspan="2">Project Name</th>
            <th>Total Leads</th>
            <th>Enquiries</th>
            <th>Site Visit</th>
            <th>Hot List</th>
            <th>Booked</th>
            <th colspan="2">Site Conversion (Handover)</th>
          </tr>
    `;

    Object.keys(stats.projectStages || {}).forEach((projName, idx) => {
      const stages = stats.projectStages[projName];
      const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
      htmlContent += `
        <tr ${rowClass}>
          <td colspan="2" class="bold-label">${projName}</td>
          <td>${stages.totalLeads}</td>
          <td>${stages.enquiries}</td>
          <td>${stages.siteVisits}</td>
          <td>${stages.hotList}</td>
          <td>${stages.booked}</td>
          <td colspan="2">${stages.handover}</td>
        </tr>
      `;
    });

    htmlContent += `
          <tr><td colspan="9" style="border:none; height: 10px;"></td></tr>
          
          <!-- PART 3 -->
          <tr><td colspan="9" class="section-banner">PART 3: PERSONS WISE PROJECT BREAKDOWN</td></tr>
          <tr>
            <th>Person Name</th>
            <th>Project Name</th>
            <th>Total Leads</th>
            <th>Enquiries</th>
            <th>Site Visit</th>
            <th>Hot List</th>
            <th>Booked</th>
            <th colspan="2">Site Conversion (Handover)</th>
          </tr>
    `;

    Object.keys(stats.personProjectStages || {}).forEach((key, idx) => {
      const row = stats.personProjectStages[key];
      const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
      htmlContent += `
        <tr ${rowClass}>
          <td class="bold-label">${row.personName}</td>
          <td>${row.projectName}</td>
          <td>${row.totalLeads}</td>
          <td>${row.enquiries}</td>
          <td>${row.siteVisits}</td>
          <td>${row.hotList}</td>
          <td>${row.booked}</td>
          <td colspan="2">${row.handover}</td>
        </tr>
      `;
    });

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `JohnBuildwell_ERP_Overall_Report_${new Date().toISOString().substring(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUserReport = async (selectedUserNames) => {
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <style>
          table { border-collapse: collapse; }
          td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
          th { font-weight: bold; background-color: #0e623a; color: white; border: 1px solid #0e623a; text-align: center; }
          .title-row { font-size: 22pt; font-weight: bold; color: #0e623a; }
          .section-banner { font-size: 11pt; font-weight: bold; background-color: #e2f0d9; color: #385723; padding: 12px; border: 1px solid #c5e1a5; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
          .even-row { background-color: #f8fafc; }
          .bold-label { font-weight: bold; color: #0f172a; }
          .summary-row { font-weight: bold; background-color: #e2f0d9; color: #385723; }
        </style>
      </head>
      <body>
        <table>
          <tr style="height: 120px;">
            <td colspan="3" style="background-color: #0e623a; border: none; text-align: center; vertical-align: middle; height: 120px;">
              <img src="${logoPath}" height="95" style="height: 95px; width: auto; display: block; margin: 0 auto;" />
            </td>
            <td colspan="4" class="title-row" style="border:none; vertical-align:middle; text-align:center; font-size: 22pt; font-weight: bold; color: #0e623a; height: 120px;">
              JohnBuildwell ERP - USER WISE PERFORMANCE REPORT
            </td>
          </tr>
          <tr><td colspan="7" style="border:none; height: 15px;"></td></tr>
    `;

    selectedUserNames.forEach(uName => {
      let uTotalLeads = 0, uEnquiries = 0, uSiteVisits = 0, uHotList = 0, uBooked = 0, uHandover = 0;
      let rows = [];

      Object.keys(stats.personProjectStages || {}).forEach(key => {
        const row = stats.personProjectStages[key];
        if (row.personName === uName) {
          uTotalLeads += row.totalLeads;
          uEnquiries += row.enquiries;
          uSiteVisits += row.siteVisits;
          uHotList += row.hotList;
          uBooked += row.booked;
          uHandover += row.handover;
          rows.push(row);
        }
      });

      htmlContent += `
        <tr><td colspan="7" class="section-banner">USER: ${uName}</td></tr>
        <tr>
          <th>Project Name</th>
          <th>Total Leads</th>
          <th>Enquiries</th>
          <th>Site Visit</th>
          <th>Hot List</th>
          <th>Booked</th>
          <th>Site Conversion (Handover)</th>
        </tr>
        <tr class="summary-row">
          <td class="bold-label">OVERALL SUMMARY</td>
          <td>${uTotalLeads}</td>
          <td>${uEnquiries}</td>
          <td>${uSiteVisits}</td>
          <td>${uHotList}</td>
          <td>${uBooked}</td>
          <td>${uHandover}</td>
        </tr>
      `;

      rows.forEach((row, idx) => {
        const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
        htmlContent += `
          <tr ${rowClass}>
            <td class="bold-label">${row.projectName}</td>
            <td>${row.totalLeads}</td>
            <td>${row.enquiries}</td>
            <td>${row.siteVisits}</td>
            <td>${row.hotList}</td>
            <td>${row.booked}</td>
            <td>${row.handover}</td>
          </tr>
        `;
      });

      htmlContent += `<tr><td colspan="7" style="border:none; height: 15px;"></td></tr>`;
    });

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `User_Wise_Report_${new Date().toISOString().substring(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProjectReport = async (selectedProjectNames) => {
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <style>
          table { border-collapse: collapse; }
          td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
          th { font-weight: bold; background-color: #0e623a; color: white; border: 1px solid #0e623a; text-align: center; }
          .title-row { font-size: 22pt; font-weight: bold; color: #0e623a; }
          .section-banner { font-size: 11pt; font-weight: bold; background-color: #e2f0d9; color: #385723; padding: 12px; border: 1px solid #c5e1a5; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
          .even-row { background-color: #f8fafc; }
          .bold-label { font-weight: bold; color: #0f172a; }
        </style>
      </head>
      <body>
        <table>
          <tr style="height: 120px;">
            <td colspan="3" style="background-color: #0e623a; border: none; text-align: center; vertical-align: middle; height: 120px;">
              <img src="${logoPath}" height="95" style="height: 95px; width: auto; display: block; margin: 0 auto;" />
            </td>
            <td colspan="4" class="title-row" style="border:none; vertical-align:middle; text-align:center; font-size: 22pt; font-weight: bold; color: #0e623a; height: 120px;">
              JohnBuildwell ERP - PROJECT WISE PERFORMANCE REPORT
            </td>
          </tr>
          <tr><td colspan="7" style="border:none; height: 15px;"></td></tr>
    `;

    selectedProjectNames.forEach(projName => {
      const stages = stats.projectStages[projName] || { totalLeads: 0, enquiries: 0, siteVisits: 0, hotList: 0, booked: 0, handover: 0 };
      
      htmlContent += `
        <tr><td colspan="7" class="section-banner">PROJECT: ${projName}</td></tr>
        <tr>
          <th colspan="3">Workflow Stage</th>
          <th colspan="4">Count</th>
        </tr>
        <tr>
          <td colspan="3" class="bold-label">Total Leads</td>
          <td colspan="4">${stages.totalLeads}</td>
        </tr>
        <tr class="even-row">
          <td colspan="3" class="bold-label">Enquiries</td>
          <td colspan="4">${stages.enquiries}</td>
        </tr>
        <tr>
          <td colspan="3" class="bold-label">Site Visits</td>
          <td colspan="4">${stages.siteVisits}</td>
        </tr>
        <tr class="even-row">
          <td colspan="3" class="bold-label">Hot List</td>
          <td colspan="4">${stages.hotList}</td>
        </tr>
        <tr>
          <td colspan="3" class="bold-label">Booked Units</td>
          <td colspan="4">${stages.booked}</td>
        </tr>
        <tr class="even-row">
          <td colspan="3" class="bold-label">Site Conversion (Handover)</td>
          <td colspan="4">${stages.handover}</td>
        </tr>
        
        <tr><td colspan="7" style="border:none; height:10px;"></td></tr>
        
        <tr>
          <th colspan="2">Executive Name</th>
          <th>Total Leads</th>
          <th>Enquiries</th>
          <th>Site Visit</th>
          <th>Hot List</th>
          <th>Booked</th>
        </tr>
      `;

      let executiveIdx = 0;
      Object.keys(stats.personProjectStages || {}).forEach(key => {
        const row = stats.personProjectStages[key];
        if (row.projectName === projName) {
          const rowClass = executiveIdx % 2 === 1 ? 'class="even-row"' : '';
          executiveIdx++;
          htmlContent += `
            <tr ${rowClass}>
              <td colspan="2" class="bold-label">${row.personName}</td>
              <td>${row.totalLeads}</td>
              <td>${row.enquiries}</td>
              <td>${row.siteVisits}</td>
              <td>${row.hotList}</td>
              <td>${row.booked}</td>
            </tr>
          `;
        }
      });

      htmlContent += `<tr><td colspan="7" style="border:none; height:20px;"></td></tr>`;
    });

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Project_Wise_Report_${new Date().toISOString().substring(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSourceReport = async (selectedSources) => {
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <style>
          table { border-collapse: collapse; }
          td, th { border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10pt; color: #334155; }
          th { font-weight: bold; background-color: #0e623a; color: white; border: 1px solid #0e623a; text-align: center; }
          .title-row { font-size: 22pt; font-weight: bold; color: #0e623a; }
          .section-banner { font-size: 11pt; font-weight: bold; background-color: #e2f0d9; color: #385723; padding: 12px; border: 1px solid #c5e1a5; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
          .even-row { background-color: #f8fafc; }
          .bold-label { font-weight: bold; color: #0f172a; }
        </style>
      </head>
      <body>
        <table>
          <tr style="height: 120px;">
            <td colspan="2" style="background-color: #0e623a; border: none; text-align: center; vertical-align: middle; height: 120px;">
              <img src="${logoPath}" height="95" style="height: 95px; width: auto; display: block; margin: 0 auto;" />
            </td>
            <td colspan="2" class="title-row" style="border:none; vertical-align:middle; text-align:center; font-size: 22pt; font-weight: bold; color: #0e623a; height: 120px;">
              JohnBuildwell ERP - SOURCE WISE PERFORMANCE REPORT
            </td>
          </tr>
          <tr><td colspan="4" style="border:none; height: 15px;"></td></tr>
          
          <tr>
            <th>Source Type</th>
            <th>Budget Allocation</th>
            <th>Spent Value</th>
            <th>Networth Value</th>
          </tr>
    `;

    selectedSources.forEach((src, idx) => {
      const s = stats.sourceStats[src] || { budget: 0, spent: 0, value: 0 };
      const rowClass = idx % 2 === 1 ? 'class="even-row"' : '';
      htmlContent += `
        <tr ${rowClass}>
          <td class="bold-label">${src}</td>
          <td>Rs. ${(s.budget || 0).toLocaleString()}</td>
          <td>Rs. ${(s.spent || 0).toLocaleString()}</td>
          <td>Rs. ${(s.value || 0).toLocaleString()}</td>
        </tr>
      `;
    });

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Source_Wise_Report_${new Date().toISOString().substring(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSourcesData = () => {
    const budgetData = [];
    const spentData = [];
    const networthData = [];

    Object.keys(stats.sourceStats || {}).forEach(src => {
      const s = stats.sourceStats[src];
      if (s.budget > 0) budgetData.push({ source: src, budget: s.budget });
      if (s.spent > 0) spentData.push({ source: src, spent: s.spent });
      if (s.value > 0) networthData.push({ source: src, networth: s.value });
    });

    return { budgetData, spentData, networthData };
  };

  const { budgetData, spentData, networthData } = getSourcesData();
  const primaryColors = [
    '#0e623a', // Brand Green (Dominant Highlight)
    '#3b82f6', // Electric Blue (Secondary Highlight)
    '#94a3b8', // Slate Grey (Muted Accent)
    '#8b5cf6', // Lavender Purple
    '#5c8d70', // Sage Green
    '#f59e0b', // Warm Amber
    '#b0b3c2', // Medium Silver
    '#e2e8f0'  // Light Slate
  ];

  return (
    <div className="space-y-8 w-full mx-auto text-left animate-fadeIn">
      {/* Title Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#0e623a]" />
            <span>Dashboard Overview</span>
          </h2>
          <p className="text-xs text-gray-550 mt-1">Real-time pipelines, employee metrics, sales performance, and marketing conversions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Overall Report</span>
          </button>
          
          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export User Report</span>
          </button>

          <button
            onClick={() => setShowProjectModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Project Report</span>
          </button>

          <button
            onClick={() => setShowSourceModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Source Report</span>
          </button>
        </div>
      </div>

      {/* Filtration Header Card */}
      <div className="bg-white/90 backdrop-blur-md border border-gray-150 shadow-md rounded-3xl p-5 w-full sticky top-16 z-20 transition-all duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          
          {/* User Select */}
          {(user?.role === 'Super Admin' || user?.role === 'Admin') ? (
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtered User</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
                <User className="w-4 h-4 text-gray-455 shrink-0" />
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-700 font-bold focus:outline-none focus:ring-0 border-0 p-0"
                >
                  <option value="">All Users</option>
                  {(stats.users || []).map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="hidden lg:block"></div>
          )}

          {/* Project Select */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtered Project</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <FolderOpen className="w-4 h-4 text-gray-455 shrink-0" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-700 font-bold focus:outline-none focus:ring-0 border-0 p-0"
              >
                <option value="">All Projects</option>
                {(stats.projects || []).map(p => (
                  <option key={p._id} value={p._id}>{p.code || p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Type Select */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtered Type</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <Layers className="w-4 h-4 text-gray-455 shrink-0" />
              <select
                value={selectedProjectType}
                onChange={(e) => setSelectedProjectType(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-700 font-bold focus:outline-none focus:ring-0 border-0 p-0"
              >
                <option value="">All Types</option>
                <option value="Plot">Plot</option>
                <option value="Flat">Flat</option>
                <option value="Villa">Villa</option>
              </select>
            </div>
          </div>

          {/* Source Select */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtered Source</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <Target className="w-4 h-4 text-gray-455 shrink-0" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-700 font-bold focus:outline-none focus:ring-0 border-0 p-0"
              >
                <option value="">All Sources</option>
                {Object.keys(stats.sourceStats || {}).map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Month Wise */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Month</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-[#0e623a] shrink-0" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-700 font-bold focus:outline-none focus:ring-0 border-0 p-0"
              />
            </div>
          </div>

          {/* Range picker */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom Date Range</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-1/2 bg-transparent text-xs text-gray-700 font-bold focus:outline-none focus:ring-0 border-0 p-0 text-center"
              />
              <span className="text-[10px] text-gray-400 font-bold">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-1/2 bg-transparent text-xs text-gray-700 font-bold focus:outline-none focus:ring-0 border-0 p-0 text-center"
              />
            </div>
          </div>

        </div>
      </div>      {/* CRD Flow Performance Metrics */}
      {stats.crdFlowStats && (
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-6">
            {/* CRD User Wise Performance */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 text-left">
                CRD User Wise Performance
              </h3>
              <div>
                {Object.keys(stats.crdFlowStats.usersCount || {}).length === 0 ? (
                  <p className="text-gray-400 italic text-xs py-8 text-center">No active CRD Flows found</p>
                ) : (
                  renderPieChart(
                    Object.keys(stats.crdFlowStats.usersCount).map(u => ({
                      user: u,
                      count: stats.crdFlowStats.usersCount[u]
                    })),
                    'count',
                    'user',
                    primaryColors,
                    true
                  )
                )}
              </div>
            </div>

            {/* CRD Stage Wise Performance */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 text-left">
                CRD Stage Wise Performance
              </h3>
              <div>
                {Object.keys(stats.crdFlowStats.stagesCount || {}).length === 0 ? (
                  <p className="text-gray-400 italic text-xs py-8 text-center">No active CRD Flows found</p>
                ) : (
                  renderPieChart(
                    Object.keys(stats.crdFlowStats.stagesCount).map(s => ({
                      stage: s,
                      count: stats.crdFlowStats.stagesCount[s]
                    })),
                    'count',
                    'stage',
                    primaryColors,
                    true
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRDDashboard;