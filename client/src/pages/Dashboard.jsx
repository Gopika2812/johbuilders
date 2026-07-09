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
  Download,
  Clock
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
    <div className="flex flex-col items-center justify-center w-full relative p-4">
      <div className="flex flex-col gap-3 justify-center items-center w-full mt-6 md:mt-0">
        {slots.map((slot, index) => {
          const val = slot.item[valueKey] || 0;
          return (
            <div key={index} className="flex items-center gap-4 bg-slate-50/90 backdrop-blur-sm border-none rounded-2xl px-6 py-4 hover:bg-slate-100 transition shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] w-full">
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
    <div ref={containerRef} className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 w-full relative p-2 md:p-6 overflow-hidden">
      <style>{`
        .slice-hover-effect {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease;
          cursor: pointer;
        }
        .slice-hover-effect:hover {
          transform: scale(1.04);
          filter: brightness(1.05) drop-shadow(0 6px 12px rgba(0,0,0,0.1));
        }
        @keyframes wheel-in {
          from { transform: rotate(-120deg) scale(0.5); opacity: 0; }
          to { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        .animate-wheel-in {
          animation: wheel-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <div className="relative flex-1 w-full min-w-[300px] max-w-[550px] shrink-0">
        <svg 
          className={`w-full h-auto drop-shadow-sm opacity-0 ${isVisible ? 'animate-wheel-in' : ''}`} 
          viewBox="0 0 700 500"
        >
          {(() => {
            let accumulatedPercent = 0;
            const cx = 350;
            const cy = 250;
            const r = 140;

            return dataArray.map((item, index) => {
              const val = item[valueKey] || 0;
              const percent = val / total;
              if (percent === 0) return null;

              const actualPercent = percent === 1 ? 0.9999 : percent;
              const startAngle = 2 * Math.PI * (accumulatedPercent - 0.25);
              const endAngle = 2 * Math.PI * (accumulatedPercent + actualPercent - 0.25);
              const midAngle = startAngle + (endAngle - startAngle) / 2;

              accumulatedPercent += percent;

              const x1 = cx + Math.cos(startAngle) * r;
              const y1 = cy + Math.sin(startAngle) * r;
              const x2 = cx + Math.cos(endAngle) * r;
              const y2 = cy + Math.sin(endAngle) * r;

              const largeArcFlag = percent > 0.5 ? 1 : 0;
              const color = colorPalette[index % colorPalette.length];

              const isLeft = Math.cos(midAngle) < 0;
              const textAnchor = isLeft ? "end" : "start";
              
              // Points for connecting line
              const lineStartX = cx + Math.cos(midAngle) * r;
              const lineStartY = cy + Math.sin(midAngle) * r;
              const lineMidX = cx + Math.cos(midAngle) * (r + 15);
              const lineMidY = cy + Math.sin(midAngle) * (r + 15);
              const lineEndX = lineMidX + (isLeft ? -15 : 15);
              const lineEndY = lineMidY;

              const labelX = lineEndX + (isLeft ? -8 : 8);
              const labelY = lineEndY;
              
              const displayText = isCount 
                ? `${val} ${typeof isCount === 'string' ? isCount : 'Leads'}`
                : `₹${Math.round(val).toLocaleString()}`;

              const isSelected = selectedLabel === item[labelKey];

              return (
                <g
                  key={index}
                  className="slice-hover-effect"
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onMouseMove={(e) => {
                    const rect = containerRef.current.getBoundingClientRect();
                    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                  onClick={() => onSegmentClick && onSegmentClick(item)}
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: isSelected ? 'scale(1.05)' : 'none'
                  }}
                >
                  <path
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {percent > 0.02 && (
                    <g>
                      <polyline
                        points={`${lineStartX},${lineStartY} ${lineMidX},${lineMidY} ${lineEndX},${lineEndY}`}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        className="opacity-70"
                      />
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor={textAnchor}
                        fill="#000000"
                        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
                      >
                        <tspan x={labelX} dy="-0.2em" className="font-normal text-[16px] md:text-[20px] uppercase tracking-wide">
                          {item[labelKey].length > 18 ? item[labelKey].substring(0, 18) + '..' : item[labelKey]}
                        </tspan>
                        <tspan x={labelX} dy="1.4em" className="font-extrabold text-[18px] md:text-[24px]">
                          {displayText}
                        </tspan>
                      </text>
                    </g>
                  )}
                </g>
              );
            });
          })()}
        </svg>
      </div>

      {/* Detail Tags */}
      <div className="flex flex-col gap-1.5 justify-center items-center w-full md:w-auto md:max-w-[260px] shrink-0 mt-4 md:mt-0">
        {dataArray.map((item, index) => {
          const val = item[valueKey] || 0;
          const percentage = (val / total) * 100;
          const color = colorPalette[index % colorPalette.length];
          const isSelected = selectedLabel === item[labelKey];
          return (
            <div 
              key={index} 
              onClick={() => onSegmentClick && onSegmentClick(item)}
              className={`flex items-center justify-between bg-slate-50/70 border rounded-xl px-4 py-1.5 hover:bg-slate-100 transition cursor-pointer w-full text-xs ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                <span className="font-bold text-gray-650 truncate max-w-[140px]">{item[labelKey]}</span>
              </div>
              <div className="flex items-baseline gap-1.5 ml-2 shrink-0">
                <span className="text-gray-900 font-extrabold">{percentage.toFixed(1)}%</span>
                <span className="text-black font-extrabold text-[10px]">({isCount ? `${val} ${typeof isCount === 'string' ? isCount : 'Leads'}` : `₹${Math.round(val).toLocaleString()}`})</span>
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

const Dashboard = () => {
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
      filtered = filtered.filter(l => l.status === 'Hot List');
    } else if (stageLabel === 'Booking') {
      filtered = filtered.filter(l => l.status === 'Booking');
    } else if (stageLabel === 'Handover') {
      filtered = filtered.filter(l => l.status === 'Won');
    } else if (stageLabel === 'Lost') {
      filtered = filtered.filter(l => l.status === 'Lost');
    }
    // 'Total Leads' needs no status filter.

    // 3. Group by User, Source, and Project Type
    const comboCounts = {};
    filtered.forEach(l => {
      const user = l.assignedTo || 'Unassigned';
      const source = l.leadSource || 'Unknown';
      const type = Array.isArray(l.projectType) ? l.projectType.join(', ') : (l.projectType || 'Unknown');
      
      const key = `${user}|${source}|${type}`;
      if (!comboCounts[key]) {
        comboCounts[key] = { user, source, type, count: 0 };
      }
      comboCounts[key].count += 1;
    });

    const comboBreakdown = Object.values(comboCounts).sort((a, b) => b.count - a.count);

    const titleContext = sourceContext === 'user'
      ? (selectedUserPerfName || 'All Users')
      : (selectedSubSource ? `${selectedSourceGroup} - ${selectedSubSource}` : (selectedSourceGroup || 'All Sources'));

    setBreakdownModalData({
      title: `${stageLabel} - Breakdown (${titleContext})`,
      comboData: comboBreakdown
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

  const [pendingFollowUps, setPendingFollowUps] = useState([]);
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

  const [selectedProjectPerfCode, setSelectedProjectPerfCode] = useState(null);
  const [selectedProjectPerfUser, setSelectedProjectPerfUser] = useState(null);

  const projectUsersData = React.useMemo(() => {
    if (!selectedProjectPerfCode) return [];
    const usersData = [];
    Object.keys(stats.personProjectStages || {}).forEach(key => {
      const row = stats.personProjectStages[key];
      if (row.projectName === selectedProjectPerfCode && row.totalLeads > 0) {
        usersData.push(row);
      }
    });
    return usersData.sort((a, b) => b.totalLeads - a.totalLeads);
  }, [stats.personProjectStages, selectedProjectPerfCode]);

  const selectedProjectUserData = React.useMemo(() => {
    if (!selectedProjectPerfCode || !selectedProjectPerfUser) return null;
    return projectUsersData.find(u => u.personName === selectedProjectPerfUser) || null;
  }, [projectUsersData, selectedProjectPerfUser, selectedProjectPerfCode]);

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
    fetchDashboardStats();
    fetchPendingFollowUps();
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

  const fetchPendingFollowUps = async () => {
    try {
      const response = await fetch(`${API_URL}/leads/due-followups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingFollowUps(data);
      }
    } catch (err) {
      console.error('Error fetching due follow-ups:', err);
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
    '#0e623a', // Brand Green
    '#1e3a8a', // Dark Blue
    '#b91c1c', // Dark Red
    '#c2410c', // Dark Orange
    '#6d28d9', // Dark Purple
    '#0f766e', // Dark Teal
    '#4d7c0f', // Dark Olive
    '#831843', // Dark Pink
    '#a16207', // Dark Gold
    '#374151'  // Dark Slate
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
      <div className="bg-[#f0fbf4]/90 backdrop-blur-md border-none shadow-md rounded-3xl p-5 w-full sticky top-16 z-20 transition-all duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          
          {/* User Select */}
          {(user?.role === 'Super Admin' || user?.role === 'Admin') ? (
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtered User</label>
              <div className="flex items-center gap-2 bg-gray-50 border-none px-3 py-1.5 rounded-xl">
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
            <div className="flex items-center gap-2 bg-gray-50 border-none px-3 py-1.5 rounded-xl">
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
            <div className="flex items-center gap-2 bg-gray-50 border-none px-3 py-1.5 rounded-xl">
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
            <div className="flex items-center gap-2 bg-gray-50 border-none px-3 py-1.5 rounded-xl">
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
            <div className="flex items-center gap-2 bg-gray-50 border-none px-3 py-1.5 rounded-xl">
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
            <div className="flex items-center gap-2 bg-gray-50 border-none px-3 py-1.5 rounded-xl">
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
      </div>

      {/* Project Wise Inventory Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(stats.projectUnitsStats || {}).map(projCode => {
          // If a specific project is selected, only render that one
          if (selectedProject) {
            const selectedProjObj = (stats.projects || []).find(p => p._id === selectedProject);
            const selectedCode = selectedProjObj?.code || selectedProjObj?.name;
            if (selectedCode && projCode !== selectedCode) return null;
          }

          const pStats = stats.projectUnitsStats[projCode];
          const chartData = [
            { stage: 'Available', count: pStats.available },
            { stage: 'Booked', count: pStats.booked },
            { stage: 'Handover', count: pStats.handover }
          ].filter(item => item.count > 0);

          return (
            <div key={projCode} className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 text-left">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#0e623a]" />
                    <span>{projCode} Project Inventory</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Project inventory breakdown</p>
                </div>
              </div>
              <div className="py-4 px-2">
                {chartData.length === 0 && (pStats.cancelled || 0) === 0 ? (
                  <div className="h-24 flex items-center justify-center text-gray-400 italic text-xs">
                    No units registered
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {[
                      { label: 'Total', count: pStats.total, color: '#94a3b8', pct: 100 },
                      { label: 'Available', count: pStats.available, color: '#7ebda9', pct: pStats.total > 0 ? (pStats.available/pStats.total)*100 : 0 },
                      { label: 'Booked', count: pStats.booked, color: '#8bc34a', pct: pStats.total > 0 ? (pStats.booked/pStats.total)*100 : 0 },
                    ].map((slot, index) => {
                      return (
                        <div key={index} 
                          onClick={() => {
                            setSelectedInventoryProj({ projCode, stats: pStats, view: slot.label === 'Total' ? '' : slot.label.toLowerCase() });
                            setInventoryModalOpen(true);
                          }}
                          className="flex flex-col items-start bg-slate-50 border-none rounded-2xl p-4 hover:bg-slate-100 transition shadow-sm cursor-pointer w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slot.color }}></span>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{slot.label}</span>
                          </div>
                          <div className="flex flex-col items-start gap-0.5 mt-auto">
                            <span className="text-gray-900 font-black text-3xl leading-none mt-1">{slot.count}</span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Cancelled Units display */}
                    <div 
                      onClick={() => {
                        setSelectedInventoryProj({ projCode, stats: pStats, view: 'cancelled' });
                        setInventoryModalOpen(true);
                      }}
                      className="flex flex-col items-start bg-red-50 border border-red-100 rounded-2xl p-4 hover:bg-red-100 transition shadow-sm cursor-pointer w-full"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full shrink-0 bg-red-500"></span>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Cancelled</span>
                      </div>
                      <div className="flex flex-col items-start gap-0.5 mt-auto">
                        <span className="text-red-900 font-black text-3xl leading-none mt-1">{pStats.cancelled || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 text-center border-t border-gray-50">
                <button
                  onClick={() => {
                    setSelectedInventoryProj({ projCode, stats: pStats });
                    setInventoryModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-[#0e623a] hover:underline"
                >
                  View Detailed Units Breakdown
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="py-24 text-center text-gray-400 italic">
          Fetching dynamic interactive dashboard metrics...
        </div>
      ) : (
        <>
          {/* Row 1: Total Performance Cards */}
          <div>
            <h4 className="text-sm font-black text-black uppercase tracking-wider mb-3 text-left">Lead Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              
              {/* Card 0: Total Leads / Lost Leads */}
              <div 
                onClick={handleLeadsCardClick}
                className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer select-none active:scale-[0.99] duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full pb-2">
                  <div className="flex-1 flex flex-col items-start justify-center border-r-2 border-gray-100 pr-2">
                    <span className="text-sm text-black font-extrabold uppercase tracking-wider">Total Leads</span>
                    <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.cards.totalLeads || 0}</h3>
                  </div>
                  <div className="flex-1 flex flex-col items-start justify-center pl-4">
                    <span className="text-sm text-rose-600 font-extrabold uppercase tracking-wider">Lost Leads</span>
                    <h3 className="text-3xl font-extrabold text-rose-600 mt-1">{(stats.cards.enquiries?.closed || 0) + (stats.cards.siteVisits?.closed || 0)}</h3>
                  </div>
                </div>
                {/* <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-50 text-[10px] font-bold">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider">Overall Leads</span>
                  <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Today: {stats.cards.today?.leads || 0}</span>
                </div> */}
              </div>

              {/* Card 1: Total Followup */}
              <div 
                className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-black font-extrabold uppercase tracking-wider">Total Followup</span>
                    <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.cards.enquiries?.followup || 0}</h3>
                  </div>

                </div>
                {/* <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-50 text-[10px] font-bold">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span>Breakdown</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                  <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Today: {stats.cards.today?.enquiries || 0}</span>
                </div> */}
              </div>

              {/* Card 2: Total Site Visits */}
              <div 
                className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-black font-extrabold uppercase tracking-wider">Total Site Visits</span>
                    <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.cards.siteVisits?.total || 0}</h3>
                  </div>

                </div>
                {/* <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-50 text-[10px] font-bold">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span>Breakdown</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                  <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Today: {stats.cards.today?.siteVisits || 0}</span>
                </div> */}
              </div>

              {/* Card 3: Total Hot List */}
              <div className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-black font-extrabold uppercase tracking-wider">Total Hot List</span>
                    <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.cards.hotList?.total || 0}</h3>
                  </div>

                </div>
                {/* <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-50 text-[10px] font-bold">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider">Hot List Leads</span>
                  <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Today: {stats.cards.today?.hotList || 0}</span>
                </div> */}
              </div>

              {/* Card 4: Total Booked */}
              <div 
                onClick={handleBookedCardClick}
                className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer select-none active:scale-[0.99] duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-black font-extrabold uppercase tracking-wider">Total Booked</span>
                    <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.cards.booked?.total || 0}</h3>
                  </div>

                </div>
                {/* <div className="mt-3 pt-2 border-t border-gray-50 space-y-1 text-[10px] font-bold uppercase">
                  <div className="flex justify-between text-gray-500">
                    <span>Total Value:</span>
                    <span className="text-gray-800 font-extrabold">₹{Math.round(stats.cards.booked?.value || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Received:</span>
                    <span className="text-emerald-800 font-extrabold">₹{Math.round(stats.cards.booked?.received || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Pending:</span>
                    <span className="text-rose-800 font-extrabold">₹{Math.round(stats.cards.booked?.pending || 0).toLocaleString()}</span>
                  </div>
                </div> */}
              </div>

            </div>
          </div>



          {/* Pending Follow-ups Widget */}
          {pendingFollowUps.length > 0 && (
            <div className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm mb-8 animate-fadeIn">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                  Pending Follow-ups ({pendingFollowUps.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingFollowUps.map(lead => (
                  <div key={lead._id} className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800">{lead.name}</h4>
                        <p className="text-[10px] text-gray-500 font-medium">{lead.phone}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-[#0e623a]/10 text-[#0e623a] rounded-full uppercase">
                        {lead.project?.code || 'No Project'}
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-700 font-semibold mb-3">
                      Due: {new Date(lead.followUpInfo?.nextFollowUpDate).toLocaleString()}
                    </div>
                    <div className="text-right border-t border-amber-100/50 pt-2">
                      <button
                        onClick={() => navigate(`/leads?search=${lead.name}`)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                      >
                        Take Action →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Wise & Stage Wise Performance Pie Reports */}
          <div className="flex flex-col gap-8">
            
            {/* User turn over Pie Chart */}
            <div className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                    User Wise Lead Details
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Click a user slice or legend to filter their details</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <select
                    className="px-2.5 py-1 text-[10px] font-bold text-gray-700 bg-gray-50 border-none rounded-xl outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    value={selectedUserPerfName || ''}
                    onChange={(e) => setSelectedUserPerfName(e.target.value || null)}
                  >
                    <option value="">All Users</option>
                    {userPerformanceData.map(u => (
                      <option key={u.userName} value={u.userName}>{u.userName}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowDetailedPreviewModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 rounded-xl transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Preview & Export</span>
                  </button>
                  {selectedUserPerfName && (
                    <button 
                      onClick={() => setSelectedUserPerfName(null)}
                      className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl transition"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7">
                  {userPerformanceData.length === 0 ? (
                    <p className="text-gray-400 italic text-xs py-8 text-center">No user performance recorded</p>
                  ) : (
                    renderPieChart(
                      selectedUserPerfName ? userPerformanceData.filter(u => u.userName === selectedUserPerfName) : userPerformanceData,
                      'totalLeads',
                      'userName',
                      primaryColors,
                      true,
                      (item) => setSelectedUserPerfName(item.userName),
                      selectedUserPerfName
                    )
                  )}
                </div>
                
                <div className="md:col-span-5 bg-gray-50/50 rounded-2xl p-4 border-none space-y-4">
                  <div className="border-b border-gray-200/60 pb-2">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Currently Showing</span>
                    <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide truncate mt-0.5">
                      {selectedUserPerfData.userName}
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { label: 'Total Leads', count: selectedUserPerfData.totalLeads, color: 'bg-gray-400', icon: TrendingUp },
                      { label: 'Enquiries', count: selectedUserPerfData.enquiries, color: 'bg-emerald-600', icon: Users },
                      { label: 'Site Visit', count: selectedUserPerfData.siteVisits, color: 'bg-blue-500', icon: MapPin },
                      { label: 'Hot List', count: selectedUserPerfData.hotList, color: 'bg-amber-500', icon: Target },
                      { label: 'Booking', count: selectedUserPerfData.booked || 0, color: 'bg-rose-500', icon: DollarSign },
                      /* { label: 'Handover', count: selectedUserPerfData.handover, color: 'bg-emerald-700', icon: Building }, */
                      { label: 'Lost', count: selectedUserPerfData.lost, color: 'bg-red-500', icon: TrendingDown }
                    ].filter(m => m.label === 'Total Leads' || m.count > 0).map((m, idx) => {
                      const IconComponent = m.icon;
                      const percentageOfTotal = selectedUserPerfData.totalLeads > 0 
                        ? (m.count / selectedUserPerfData.totalLeads) * 100 
                        : 0;
                      return (
                        <div 
                          key={idx} 
                          className="space-y-1 cursor-pointer hover:bg-gray-100 p-1.5 rounded-xl transition duration-150"
                          onClick={() => handleStageClick(m.label, 'user')}
                          title={`Click to see User breakdown for ${m.label}`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <div className="text-gray-700">
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-gray-750">{m.label}</span>
                            </div>
                            <div className="font-extrabold text-gray-800">
                              {m.count}
                              {m.label !== 'Total Leads' && selectedUserPerfData.totalLeads > 0 && (
                                <span className="text-[9px] text-gray-450 font-normal ml-1">({percentageOfTotal.toFixed(0)}%)</span>
                              )}
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${m.color} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min(100, percentageOfTotal || (m.label === 'Total Leads' && m.count > 0 ? 100 : 0))}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Source Wise drill down Pie Chart */}
            <div className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                    Source Wise Lead Details
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {selectedSourceGroup 
                      ? `Sub-sources for: ${selectedSourceGroup}` 
                      : 'Click a source group slice to drill down'}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <select
                    className="px-2.5 py-1 text-[10px] font-bold text-gray-700 bg-gray-50 border-none rounded-xl outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[120px] truncate"
                    value={selectedSourceGroup || ''}
                    onChange={(e) => {
                      setSelectedSourceGroup(e.target.value || null);
                      setSelectedSubSource(null);
                    }}
                  >
                    <option value="">All Sources</option>
                    {sourceGroupsPerformanceData.map(g => (
                      <option key={g.groupName} value={g.groupName}>{g.groupName}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowSourceDetailedPreviewModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 rounded-xl transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Preview & Export</span>
                  </button>
                  {selectedSourceGroup && (
                    <button 
                      onClick={() => {
                        if (selectedSubSource) {
                          setSelectedSubSource(null);
                        } else {
                          setSelectedSourceGroup(null);
                        }
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-[#0e623a] bg-emerald-50 hover:bg-emerald-100 transition rounded-xl"
                    >
                      ← {selectedSubSource ? 'Back to Group' : 'Back to Groups'}
                    </button>
                  )}
                  {(selectedSourceGroup || selectedSubSource) && (
                    <button 
                      onClick={() => {
                        setSelectedSourceGroup(null);
                        setSelectedSubSource(null);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-gray-655 bg-gray-100 hover:bg-gray-150 transition rounded-xl"
                    >
                      Reset All
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7">
                  {sourceGroupsPerformanceData.length === 0 ? (
                    <p className="text-gray-400 italic text-xs py-8 text-center">No source performance recorded</p>
                  ) : (
                    !selectedSourceGroup ? (
                      renderPieChart(
                        sourceGroupsPerformanceData,
                        'totalLeads',
                        'groupName',
                        primaryColors,
                        true,
                        (item) => setSelectedSourceGroup(item.groupName),
                        null
                      )
                    ) : (
                      renderPieChart(
                        selectedSubSource ? subSourcesPerformanceData.filter(s => s.subSourceName === selectedSubSource) : subSourcesPerformanceData,
                        'totalLeads',
                        'subSourceName',
                        primaryColors,
                        true,
                        (item) => setSelectedSubSource(item.subSourceName),
                        selectedSubSource
                      )
                    )
                  )}
                </div>
                
                <div className="md:col-span-5 bg-gray-50/50 rounded-2xl p-4 border-none space-y-4">
                  <div className="border-b border-gray-200/60 pb-2">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Currently Showing</span>
                    <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide truncate mt-0.5">
                      {selectedSourcePerfData.displayName}
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { label: 'Total Leads', count: selectedSourcePerfData.totalLeads, color: 'bg-gray-400', icon: TrendingUp },
                      { label: 'Enquiries', count: selectedSourcePerfData.enquiries, color: 'bg-emerald-600', icon: Users },
                      { label: 'Site Visit', count: selectedSourcePerfData.siteVisits, color: 'bg-blue-500', icon: MapPin },
                      { label: 'Hot List', count: selectedSourcePerfData.hotList, color: 'bg-amber-500', icon: Target },
                      { label: 'Booking', count: selectedSourcePerfData.booked || 0, color: 'bg-rose-500', icon: DollarSign },
                      /* { label: 'Handover', count: selectedSourcePerfData.handover, color: 'bg-emerald-700', icon: Building }, */
                      { label: 'Lost', count: selectedSourcePerfData.lost, color: 'bg-red-500', icon: TrendingDown }
                    ].filter(m => m.label === 'Total Leads' || m.count > 0).map((m, idx) => {
                      const IconComponent = m.icon;
                      const percentageOfTotal = selectedSourcePerfData.totalLeads > 0 
                        ? (m.count / selectedSourcePerfData.totalLeads) * 100 
                        : 0;
                      return (
                        <div 
                          key={idx} 
                          className="space-y-1 cursor-pointer hover:bg-gray-100 p-1.5 rounded-xl transition duration-150"
                          onClick={() => handleStageClick(m.label, 'source')}
                          title={`Click to see User breakdown for ${m.label}`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <div className="text-gray-700">
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-gray-750">{m.label}</span>
                            </div>
                            <div className="font-extrabold text-gray-800">
                              {m.count}
                              {m.label !== 'Total Leads' && selectedSourcePerfData.totalLeads > 0 && (
                                <span className="text-[9px] text-gray-455 font-normal ml-1">({percentageOfTotal.toFixed(0)}%)</span>
                              )}
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${m.color} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min(100, percentageOfTotal || (m.label === 'Total Leads' && m.count > 0 ? 100 : 0))}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>


          {/* Project Code Wise Matrix Panel */}
          <div className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 text-left">
              Project  Summary
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-12 text-center">S.NO.</th>
                    <th className="p-4 w-32">PROJECT CODE</th>
                    <th className="p-4">PIPELINE STAGE SPLITS</th>
                    <th className="p-4 w-40 text-right">BOOKED NET WORTH (₹)</th>
                    <th className="p-4 w-32 text-right">TOTAL LEADS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-xs">
                  {Object.keys(stats.projectStats || {}).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-400 italic">No project statistics logged for this period</td>
                    </tr>
                  ) : (
                    Object.keys(stats.projectStats).map((pCode, index) => {
                      const p = stats.projectStats[pCode];
                      return (
                        <tr key={pCode} className="hover:bg-gray-50/50 transition">
                          <td className="p-4 text-center font-bold text-gray-400">{index + 1}</td>
                          <td className="p-4 font-extrabold text-gray-800 uppercase">{pCode}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {Object.keys(p.stages || {}).map(stageName => (
                                <span 
                                  key={stageName}
                                  className="text-[10px] font-bold px-2.5 py-1 bg-gray-50 border-none text-gray-650 rounded-xl"
                                >
                                  {stageName}: {p.stages[stageName]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right font-extrabold text-[#0e623a] text-sm">
                            ₹{Math.round(p.value || 0).toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-bold text-gray-700">
                            {p.count}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Wise Visual Charts */}
          <div className="flex flex-col gap-8 mt-6">
            <div className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                    Project Wise Leads Share
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Click a project slice to filter user details</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {selectedProjectPerfCode && (
                    <button 
                      onClick={() => {
                        setSelectedProjectPerfCode(null);
                        setSelectedProjectPerfUser(null);
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl transition"
                    >
                      <span>Back to Projects</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[300px]">
                <div className={`${selectedProjectPerfCode ? 'md:col-span-5' : 'md:col-span-12'} flex flex-col items-center justify-center transition-all duration-300`}>
                  {Object.keys(stats.projectStats || {}).length === 0 ? (
                    <p className="text-gray-400 italic text-xs py-8 text-center">No project metrics logged</p>
                  ) : (
                    renderPieChart(
                      Object.keys(stats.projectStats).map(pCode => ({
                        projectCode: pCode,
                        count: stats.projectStats[pCode].count || 0
                      })),
                      'count',
                      'projectCode',
                      primaryColors,
                      true,
                      (item) => setSelectedProjectPerfCode(item.projectCode),
                      selectedProjectPerfCode
                    )
                  )}
                </div>

                {selectedProjectPerfCode && (
                  <div className="md:col-span-7 bg-gray-50/50 rounded-2xl p-4 border-none space-y-4">
                    <div className="border-b border-gray-200/60 pb-2">
                      <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Currently Showing Project</span>
                      <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide truncate mt-0.5">
                        {selectedProjectPerfCode}
                      </h4>
                    </div>

                    {stats.projectStats[selectedProjectPerfCode] ? (
                      <div className="space-y-3">
                        {[
                          { label: 'Total Leads', count: stats.projectStats[selectedProjectPerfCode].count, color: 'bg-gray-400', icon: TrendingUp },
                          ...Object.keys(stats.projectStats[selectedProjectPerfCode].stages || {}).map((stageName, i) => {
                            const colors = ['bg-emerald-600', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500'];
                            return {
                              label: stageName,
                              count: stats.projectStats[selectedProjectPerfCode].stages[stageName],
                              color: colors[i % colors.length],
                              icon: Users
                            };
                          })
                        ].filter(m => m.label === 'Total Leads' || m.count > 0).map((m, idx) => {
                          const IconComponent = m.icon;
                          const percentageOfTotal = stats.projectStats[selectedProjectPerfCode].count > 0 
                            ? (m.count / stats.projectStats[selectedProjectPerfCode].count) * 100 
                            : 0;
                          return (
                            <div 
                              key={idx} 
                              className="space-y-1 p-1.5 rounded-xl transition duration-150"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                  <div className="text-gray-700">
                                    <IconComponent className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-bold text-gray-750">{m.label}</span>
                                </div>
                                <div className="font-extrabold text-gray-800">
                                  {m.count}
                                  {m.label !== 'Total Leads' && stats.projectStats[selectedProjectPerfCode].count > 0 && (
                                    <span className="text-[9px] text-gray-455 font-normal ml-1">({percentageOfTotal.toFixed(0)}%)</span>
                                  )}
                                </div>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${m.color} rounded-full transition-all duration-500`}
                                  style={{ width: `${Math.min(100, percentageOfTotal || (m.label === 'Total Leads' && m.count > 0 ? 100 : 0))}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-gray-400 italic text-xs">
                        Select a project to see stage breakdown
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* User Selection Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl shadow-xl w-full max-w-md overflow-hidden border-none text-left">
            <div className="p-6 border-b border-gray-150">
              <h3 className="text-lg font-extrabold text-gray-800">Export User Wise Report</h3>
              <p className="text-xs text-gray-500 mt-1">Select one or more sales executives to include in the report</p>
            </div>
            
            <div className="p-6 max-h-60 overflow-y-auto space-y-2">
              <label className="flex items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedUsersList.length === (stats.users || []).length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsersList((stats.users || []).map(u => u.name));
                    } else {
                      setSelectedUsersList([]);
                    }
                  }}
                  className="rounded text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#0e623a]">Select All Users</span>
              </label>
              
              <div className="h-px bg-gray-100 my-2"></div>
              
              {(stats.users || []).map(user => (
                <label key={user._id} className="flex items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={selectedUsersList.includes(user.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsersList([...selectedUsersList, user.name]);
                      } else {
                        setSelectedUsersList(selectedUsersList.filter(name => name !== user.name));
                      }
                    }}
                    className="rounded text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                  />
                  <span className="text-xs text-gray-700 font-bold">{user.name}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-auto uppercase tracking-wider font-extrabold">{user.role}</span>
                </label>
              ))}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-150 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUsersList([]);
                }}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-750 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedUsersList.length === 0) {
                    alert("Please select at least one user to export.");
                    return;
                  }
                  handleExportUserReport(selectedUsersList);
                  setShowUserModal(false);
                  setSelectedUsersList([]);
                }}
                className="px-5 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Export Report ({selectedUsersList.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Selection Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl shadow-xl w-full max-w-md overflow-hidden border-none text-left">
            <div className="p-6 border-b border-gray-150">
              <h3 className="text-lg font-extrabold text-gray-800">Export Project Wise Report</h3>
              <p className="text-xs text-gray-550 mt-1">Select one or more projects to include in the report</p>
            </div>
            
            <div className="p-6 max-h-60 overflow-y-auto space-y-2">
              <label className="flex items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedProjectsList.length === (stats.projects || []).length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProjectsList((stats.projects || []).map(p => p.code || p.name));
                    } else {
                      setSelectedProjectsList([]);
                    }
                  }}
                  className="rounded text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#0e623a]">Select All Projects</span>
              </label>
              
              <div className="h-px bg-gray-100 my-2"></div>
              
              {(stats.projects || []).map(proj => {
                const name = proj.code || proj.name;
                return (
                  <label key={proj._id} className="flex items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={selectedProjectsList.includes(name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjectsList([...selectedProjectsList, name]);
                        } else {
                          setSelectedProjectsList(selectedProjectsList.filter(pName => pName !== name));
                        }
                      }}
                      className="rounded text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                    />
                    <span className="text-xs text-gray-700 font-bold">{name}</span>
                  </label>
                );
              })}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-150 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowProjectModal(false);
                  setSelectedProjectsList([]);
                }}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-750 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedProjectsList.length === 0) {
                    alert("Please select at least one project to export.");
                    return;
                  }
                  handleExportProjectReport(selectedProjectsList);
                  setShowProjectModal(false);
                  setSelectedProjectsList([]);
                }}
                className="px-5 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Export Report ({selectedProjectsList.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Selection Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl shadow-xl w-full max-w-md overflow-hidden border-none text-left">
            <div className="p-6 border-b border-gray-150">
              <h3 className="text-lg font-extrabold text-gray-800">Export Source Wise Report</h3>
              <p className="text-xs text-gray-550 mt-1">Select one or more marketing sources to include in the report</p>
            </div>
            
            <div className="p-6 max-h-60 overflow-y-auto space-y-2">
              <label className="flex items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedSourcesList.length === Object.keys(stats.sourceStats || {}).length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSourcesList(Object.keys(stats.sourceStats || {}));
                    } else {
                      setSelectedSourcesList([]);
                    }
                  }}
                  className="rounded text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#0e623a]">Select All Sources</span>
              </label>
              
              <div className="h-px bg-gray-100 my-2"></div>
              
              {Object.keys(stats.sourceStats || {}).map(src => (
                <label key={src} className="flex items-center gap-2.5 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={selectedSourcesList.includes(src)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSourcesList([...selectedSourcesList, src]);
                      } else {
                        setSelectedSourcesList(selectedSourcesList.filter(sName => sName !== src));
                      }
                    }}
                    className="rounded text-[#0e623a] focus:ring-[#0e623a] w-4 h-4"
                  />
                  <span className="text-xs text-gray-700 font-bold">{src}</span>
                </label>
              ))}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-150 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowSourceModal(false);
                  setSelectedSourcesList([]);
                }}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-750 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedSourcesList.length === 0) {
                    alert("Please select at least one source to export.");
                    return;
                  }
                  handleExportSourceReport(selectedSourcesList);
                  setShowSourceModal(false);
                  setSelectedSourcesList([]);
                }}
                className="px-5 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Export Report ({selectedSourcesList.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage User Breakdown Modal Popup */}
      {breakdownModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl border-none shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden text-left animate-fadeIn animate-duration-150">
            {/* Header */}
            <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">{breakdownModalData.title}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Assigned executives, lead sources, project types and counts</p>
              </div>
              <button 
                onClick={() => setBreakdownModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer font-bold text-sm animate-scaleUp"
              >
                ✕
              </button>
            </div>

            {/* Content List */}
            <div className="flex-grow p-0 overflow-y-auto max-h-[55vh] scrollbar-thin">
              {breakdownModalData.comboData && breakdownModalData.comboData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                      <tr className="border-b border-gray-150 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="p-4 whitespace-nowrap">User</th>
                        <th className="p-4 whitespace-nowrap">Source</th>
                        <th className="p-4 whitespace-nowrap">Project Type</th>
                        <th className="p-4 whitespace-nowrap text-right">Leads Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                      {breakdownModalData.comboData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition">
                          <td className="p-4 text-gray-850 font-bold">{row.user}</td>
                          <td className="p-4 text-[#0e623a]">{row.source}</td>
                          <td className="p-4 text-gray-500 truncate max-w-[150px]" title={row.type}>{row.type}</td>
                          <td className="p-4 text-right">
                            <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-xl font-extrabold text-[10px]">
                              {row.count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-450 italic text-xs">
                  No active leads for this stage matching configuration.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-150 bg-gray-50/30 flex justify-end">
              <button
                onClick={() => setBreakdownModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-705 text-xs font-bold rounded-xl transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leads List Modal Popup */}
      {leadsModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl border-none shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-left animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-base font-extrabold text-gray-800">Filtered Leads Directory</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Showing leads corresponding to current active filters</p>
              </div>
              <button 
                onClick={() => setLeadsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* List Content */}
            <div className="flex-grow p-6 overflow-y-auto max-h-[50vh] scrollbar-thin">
              {stats.cards.leadsList && stats.cards.leadsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3">Lead Name</th>
                        <th className="pb-3">Lead Source</th>
                        <th className="pb-3">Project Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                      {stats.cards.leadsList.map((lead, idx) => (
                        <tr key={lead._id || idx} className="hover:bg-gray-50/50 transition">
                          <td className="py-3.5 font-bold text-gray-850">{lead.name}</td>
                          <td className="py-3.5">
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {lead.leadSource}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-800">{lead.projectName}</span>
                              <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wide">
                                Type: {Array.isArray(lead.projectType) ? lead.projectType.join(', ') : lead.projectType}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-450 italic text-xs">
                  No leads available for this filtered configuration.
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-5 border-t border-gray-150 bg-gray-50/30 flex justify-end">
              <button
                onClick={() => {
                  setLeadsModalOpen(false);
                  navigate('/leads');
                }}
                className="px-4 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Go to Leads Directory →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booked Units Modal Popup */}
      {bookedModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl border-none shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-left animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-amber-500/10">
              <div>
                <h3 className="text-base font-extrabold text-amber-800">Booked Units Directory</h3>
                <p className="text-[10px] text-amber-700 mt-0.5">Showing registered unit bookings and customer information</p>
              </div>
              <button 
                onClick={() => setBookedModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f0fbf4] text-gray-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer font-bold border-none"
              >
                ✕
              </button>
            </div>

            {/* List Content */}
            <div className="flex-grow p-6 overflow-y-auto max-h-[50vh] scrollbar-thin">
              {stats.cards.inventory?.bookedUnitsList && stats.cards.inventory.bookedUnitsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3">Customer Details</th>
                        <th className="pb-3">Project / Unit</th>
                        <th className="pb-3">Unit Specifications</th>
                        <th className="pb-3 text-right">Booking Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                      {stats.cards.inventory.bookedUnitsList.map((unit, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition">
                          <td className="py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-850">{unit.customerName}</span>
                              <span className="text-[10px] text-gray-500 font-bold">{unit.customerPhone}</span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-800">{unit.projectName}</span>
                              <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wide">
                                Unit: {unit.unitId}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-755">{unit.unitType}</span>
                              <span className="text-[10px] text-gray-450 font-semibold">{unit.size.toLocaleString()} Sq.Ft</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-right font-extrabold text-[#0e623a] text-sm">
                            ₹{Math.round(unit.price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-450 italic text-xs">
                  No active unit bookings recorded.
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-5 border-t border-gray-150 bg-gray-50/30 flex justify-end">
              <button
                onClick={() => {
                  setBookedModalOpen(false);
                  navigate('/leads?status=Booking');
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Go to Bookings Tab →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handover Units Modal Popup */}
      {handoverModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl border-none shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-left animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-rose-500/10">
              <div>
                <h3 className="text-base font-extrabold text-rose-800">Handover Units Directory</h3>
                <p className="text-[10px] text-rose-700 mt-0.5">Showing completed handovers and client information</p>
              </div>
              <button 
                onClick={() => setHandoverModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f0fbf4] text-gray-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer font-bold border-none"
              >
                ✕
              </button>
            </div>

            {/* List Content */}
            <div className="flex-grow p-6 overflow-y-auto max-h-[50vh] scrollbar-thin">
              {stats.cards.inventory?.handoverUnitsList && stats.cards.inventory.handoverUnitsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3">Customer Details</th>
                        <th className="pb-3">Project / Unit</th>
                        <th className="pb-3">Unit Specifications</th>
                        <th className="pb-3 text-right">Value (Consideration)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                      {stats.cards.inventory.handoverUnitsList.map((unit, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition">
                          <td className="py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-850">{unit.customerName}</span>
                              <span className="text-[10px] text-gray-500 font-bold">{unit.customerPhone}</span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-800">{unit.projectName}</span>
                              <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wide">
                                Unit: {unit.unitId}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-755">{unit.unitType}</span>
                              <span className="text-[10px] text-gray-450 font-semibold">{unit.size.toLocaleString()} Sq.Ft</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-right font-extrabold text-[#0e623a] text-sm">
                            ₹{Math.round(unit.price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-450 italic text-xs">
                  No completed handovers recorded.
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-5 border-t border-gray-150 bg-gray-50/30 flex justify-end">
              <button
                onClick={() => {
                  setHandoverModalOpen(false);
                  navigate('/leads?status=Won');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Go to Won Leads Tab →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Preview Modal */}
      {showDetailedPreviewModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl border-none shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-left animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-blue-500/10">
              <div>
                <h3 className="text-base font-extrabold text-blue-800">Detailed Performance Report Preview</h3>
                <p className="text-[10px] text-blue-700 mt-0.5">Review the overall stage splits for all sales executives before downloading</p>
              </div>
              <button 
                onClick={() => setShowDetailedPreviewModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f0fbf4] text-gray-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer font-bold border-none"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow p-6 overflow-y-auto scrollbar-thin">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                      <th className="p-3 w-10 text-center">S.No</th>
                      <th className="p-3">User Name</th>
                      <th className="p-3 text-center">Total Leads</th>
                      <th className="p-3 text-center">Enquiries</th>
                      <th className="p-3 text-center">Site Visit</th>
                      <th className="p-3 text-center">Hot List</th>
                      <th className="p-3 text-center">Booking</th>
                      <th className="p-3 text-center">Handover</th>
                      <th className="p-3 text-center text-red-500">Lost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                    {userPerformanceData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="p-3 text-center font-bold text-gray-450">{idx + 1}</td>
                        <td className="p-3 font-extrabold text-gray-850 uppercase">{row.userName}</td>
                        <td className="p-3 text-center font-bold text-gray-700">{row.totalLeads}</td>
                        <td className="p-3 text-center text-emerald-700">{row.enquiries}</td>
                        <td className="p-3 text-center text-blue-700">{row.siteVisits}</td>
                        <td className="p-3 text-center text-amber-700">{row.hotList}</td>
                        <td className="p-3 text-center text-rose-700">{row.booked}</td>
                        <td className="p-3 text-center text-emerald-800">{row.handover}</td>
                        <td className="p-3 text-center text-red-600">{row.lost}</td>
                      </tr>
                    ))}
                    
                    {/* Totals Row */}
                    {userPerformanceData.length > 0 && (
                      <tr className="bg-emerald-50/20 font-bold text-gray-850 border-t border-gray-200">
                        <td className="p-3 text-center"></td>
                        <td className="p-3 uppercase">Total Sum</td>
                        <td className="p-3 text-center">{selectedUserPerfData.userName === 'All Users Combined' ? selectedUserPerfData.totalLeads : userPerformanceData.reduce((sum, u) => sum + u.totalLeads, 0)}</td>
                        <td className="p-3 text-center">{selectedUserPerfData.userName === 'All Users Combined' ? selectedUserPerfData.enquiries : userPerformanceData.reduce((sum, u) => sum + u.enquiries, 0)}</td>
                        <td className="p-3 text-center">{selectedUserPerfData.userName === 'All Users Combined' ? selectedUserPerfData.siteVisits : userPerformanceData.reduce((sum, u) => sum + u.siteVisits, 0)}</td>
                        <td className="p-3 text-center">{selectedUserPerfData.userName === 'All Users Combined' ? selectedUserPerfData.hotList : userPerformanceData.reduce((sum, u) => sum + u.hotList, 0)}</td>
                        <td className="p-3 text-center">{selectedUserPerfData.userName === 'All Users Combined' ? selectedUserPerfData.booked : userPerformanceData.reduce((sum, u) => sum + u.booked, 0)}</td>
                        <td className="p-3 text-center">{selectedUserPerfData.userName === 'All Users Combined' ? selectedUserPerfData.handover : userPerformanceData.reduce((sum, u) => sum + u.handover, 0)}</td>
                        <td className="p-3 text-center text-red-650">{selectedUserPerfData.userName === 'All Users Combined' ? selectedUserPerfData.lost : userPerformanceData.reduce((sum, u) => sum + u.lost, 0)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-150 bg-gray-50/30 flex justify-end gap-2">
              <button
                onClick={() => setShowDetailedPreviewModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-750 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleExportDetailedExcel();
                  setShowDetailedPreviewModal(false);
                }}
                className="px-5 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Detailed Preview Modal */}
      {showSourceDetailedPreviewModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl border-none shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-left animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-blue-500/10">
              <div>
                <h3 className="text-base font-extrabold text-blue-800">Source Detailed Performance Report Preview</h3>
                <p className="text-[10px] text-blue-700 mt-0.5">Review the overall stage splits for all marketing sources before downloading</p>
              </div>
              <button 
                onClick={() => setShowSourceDetailedPreviewModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f0fbf4] text-gray-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer font-bold border-none"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow p-6 overflow-y-auto scrollbar-thin">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                      <th className="p-3 w-10 text-center">S.No</th>
                      <th className="p-3">Group Name</th>
                      <th className="p-3">Source Name</th>
                      <th className="p-3 text-center">Total Leads</th>
                      <th className="p-3 text-center">Enquiries</th>
                      <th className="p-3 text-center">Site Visit</th>
                      <th className="p-3 text-center">Hot List</th>
                      <th className="p-3 text-center">Booking</th>
                      <th className="p-3 text-center">Handover</th>
                      <th className="p-3 text-center text-red-500">Lost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                    {(() => {
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
                      
                      return (
                        <>
                          {rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition">
                              <td className="p-3 text-center font-bold text-gray-455">{idx + 1}</td>
                              <td className="p-3 font-bold text-gray-700 uppercase">{row.groupName}</td>
                              <td className="p-3 font-extrabold text-gray-850 uppercase">{row.sourceName}</td>
                              <td className="p-3 text-center font-bold text-gray-700">{row.totalLeads}</td>
                              <td className="p-3 text-center text-emerald-700">{row.enquiries}</td>
                              <td className="p-3 text-center text-blue-700">{row.siteVisits}</td>
                              <td className="p-3 text-center text-amber-700">{row.hotList}</td>
                              <td className="p-3 text-center text-rose-700">{row.booked}</td>
                              <td className="p-3 text-center text-emerald-800">{row.handover}</td>
                              <td className="p-3 text-center text-red-600">{row.lost}</td>
                            </tr>
                          ))}
                          
                          {/* Totals Row */}
                          {rows.length > 0 && (
                            <tr className="bg-emerald-50/20 font-bold text-gray-855 border-t border-gray-200">
                              <td className="p-3 text-center" colSpan="3">Total Sum</td>
                              <td className="p-3 text-center">{rows.reduce((sum, r) => sum + r.totalLeads, 0)}</td>
                              <td className="p-3 text-center">{rows.reduce((sum, r) => sum + r.enquiries, 0)}</td>
                              <td className="p-3 text-center">{rows.reduce((sum, r) => sum + r.siteVisits, 0)}</td>
                              <td className="p-3 text-center">{rows.reduce((sum, r) => sum + r.hotList, 0)}</td>
                              <td className="p-3 text-center">{rows.reduce((sum, r) => sum + r.booked, 0)}</td>
                              <td className="p-3 text-center">{rows.reduce((sum, r) => sum + r.handover, 0)}</td>
                              <td className="p-3 text-center text-red-650">{rows.reduce((sum, r) => sum + r.lost, 0)}</td>
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-150 bg-gray-50/30 flex justify-end gap-2">
              <button
                onClick={() => setShowSourceDetailedPreviewModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-750 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleExportSourceDetailedExcel();
                  setShowSourceDetailedPreviewModal(false);
                }}
                className="px-5 py-2 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Inventory Detail Modal */}
      {inventoryModalOpen && selectedInventoryProj && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#f0fbf4] rounded-3xl border-none shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-left animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-[#0e623a] text-white">
              <div>
                <h3 className="text-base font-extrabold">{selectedInventoryProj.projCode} Project Inventory Details</h3>
                <p className="text-[10px] text-emerald-100 mt-0.5">Detailed breakdown of registered units and stages</p>
              </div>
              <button 
                onClick={() => setInventoryModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f0fbf4]/10 text-white hover:bg-[#f0fbf4]/20 transition cursor-pointer font-bold border border-white/25"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow p-6 overflow-y-auto scrollbar-thin space-y-6">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 border-none rounded-2xl p-4 text-center">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Total Units</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">{selectedInventoryProj.stats.total || 0}</span>
                </div>
                <div className="bg-[#7ebda9]/10 border border-[#7ebda9]/30 rounded-2xl p-4 text-center">
                  <span className="text-[10px] text-[#5b9683] font-extrabold uppercase tracking-wider block">Available</span>
                  <span className="text-2xl font-black text-[#004d61] block mt-1">{selectedInventoryProj.stats.available || 0}</span>
                </div>
                <div className="bg-[#8bc34a]/10 border border-[#8bc34a]/30 rounded-2xl p-4 text-center">
                  <span className="text-[10px] text-[#71a632] font-extrabold uppercase tracking-wider block">Booked</span>
                  <span className="text-2xl font-black text-[#558b2f] block mt-1">{(selectedInventoryProj.stats.booked || 0) + (selectedInventoryProj.stats.handover || 0)}</span>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                  <span className="text-[10px] text-red-700 font-extrabold uppercase tracking-wider block">Cancelled</span>
                  <span className="text-2xl font-black text-red-900 block mt-1">{selectedInventoryProj.stats.cancelled || 0}</span>
                </div>
              </div>

              {/* Units Lists sections */}
              <div className="space-y-4">
                
                {/* Total Units List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                    <span>Total units({selectedInventoryProj.stats.totalUnitsList?.length || 0})</span>
                  </h4>
                  <div className="bg-slate-50 border-none rounded-2xl p-4 min-h-[50px] flex flex-wrap gap-2">
                    {selectedInventoryProj.stats.totalUnitsList?.length > 0 ? (
                      selectedInventoryProj.stats.totalUnitsList.map(uid => (
                        <span key={uid} className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1 rounded-xl">
                          {uid}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">No units registered</span>
                    )}
                  </div>
                </div>

                {/* Cancelled Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span>Cancelled Units ({selectedInventoryProj.stats.cancelledUnitsList?.length || 0})</span>
                  </h4>
                  <div className="bg-red-50/20 border border-red-100/50 rounded-2xl p-4 min-h-[50px] flex flex-col gap-2">
                    {selectedInventoryProj.stats.cancelledUnitsList?.length > 0 ? (
                      selectedInventoryProj.stats.cancelledUnitsList.map((unit, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-100 p-3 rounded-xl flex flex-col md:flex-row justify-between gap-3 text-xs">
                          <div className="min-w-[150px]">
                            <span className="font-bold text-red-900 text-sm block">Unit {unit.unitId}</span>
                            <span className="text-red-700 block mt-1">Stage: <span className="font-bold">{unit.cancelStageName}</span></span>
                            <span className="text-[10px] text-red-600 font-bold block mt-1">{new Date(unit.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex-1 bg-[#f0fbf4] p-2 rounded-lg border border-red-50 text-red-600">
                            <span className="font-bold text-red-400 uppercase text-[10px] block mb-0.5">Narration</span>
                            {unit.cancelNarration}
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">No cancelled units</span>
                    )}
                  </div>
                </div>

                {/* Booked Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#558b2f] uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8bc34a]"></span>
                    <span>Booked Units {`(${[...(selectedInventoryProj.stats.bookedUnitsList || []), ...(selectedInventoryProj.stats.handoverUnitsList || [])].length})`}</span>
                  </h4>
                  <div className="bg-amber-50/20 border border-amber-100/50 rounded-2xl p-4 min-h-[50px] flex flex-wrap gap-2">
                    {[...(selectedInventoryProj.stats.bookedUnitsList || []), ...(selectedInventoryProj.stats.handoverUnitsList || [])].length > 0 ? (
                      [...(selectedInventoryProj.stats.bookedUnitsList || []), ...(selectedInventoryProj.stats.handoverUnitsList || [])].map(uid => (
                        <span key={uid} className="bg-amber-100/80 text-amber-800 border border-amber-250 text-xs font-bold px-3 py-1 rounded-xl">
                          {uid}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">No units booked</span>
                    )}
                  </div>
                </div>

                {/* Available Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#004d61] uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7ebda9]"></span>
                    <span>Available Units ({selectedInventoryProj.stats.availableUnitsList?.length || 0})</span>
                  </h4>
                  <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-2xl p-4 min-h-[50px] flex flex-wrap gap-2">
                    {selectedInventoryProj.stats.availableUnitsList?.length > 0 ? (
                      selectedInventoryProj.stats.availableUnitsList.map(uid => (
                        <span key={uid} className="bg-emerald-100/80 text-emerald-800 border border-emerald-250 text-xs font-bold px-3 py-1 rounded-xl">
                          {uid}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">No units available</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-150 bg-gray-50/30 flex justify-end">
              <button
                onClick={() => setInventoryModalOpen(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 text-xs font-bold rounded-xl transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
