import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Building, 
  Layers, 
  CheckCircle2, 
  CalendarClock, 
  CircleDollarSign, 
  ArrowRight,
  TrendingUp,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [projectsRes, leadsRes] = await Promise.all([
          fetch(`${API_URL}/projects`, { headers }),
          fetch(`${API_URL}/leads`, { headers })
        ]);
        
        if (projectsRes.ok && leadsRes.ok) {
          const projectsData = await projectsRes.json();
          const leadsData = await leadsRes.json();
          setProjects(projectsData);
          setLeads(leadsData);
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (err) {
        setError('Connection error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const todayStr = new Date().toDateString();
  const todaysFollowups = leads.filter(lead => {
    if (lead.isClosed) return false;
    if (!lead.followUpInfo?.nextFollowUpDate) return false;
    
    const assignedId = lead.assignedTo?._id || lead.assignedTo;
    const isAssignedToMe = assignedId === user?._id;
    if (!isAssignedToMe) return false;
    
    const followDate = new Date(lead.followUpInfo.nextFollowUpDate);
    return followDate.toDateString() === todayStr;
  });

  // Aggregate project statistics
  const totalProjects = projects.length;
  let totalUnits = 0;
  let availableUnits = 0;
  let bookedUnits = 0;
  let constructionUnits = 0;
  let soldUnits = 0;
  let totalValuation = 0;

  projects.forEach(project => {
    totalUnits += project.units?.length || 0;
    totalValuation += project.totalValuation || 0;
    project.units?.forEach(unit => {
      if (unit.status === 'New') availableUnits++;
      else if (unit.status === 'Booked') bookedUnits++;
      else if (unit.status === 'Under Construction') constructionUnits++;
      else if (unit.status === 'Sold Out') soldUnits++;
    });
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e623a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0e623a] to-[#0b4d2d] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center pr-12">
          <Building className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#a7d8ff]/20 text-[#a7d8ff] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Workspace Active
          </span>
          <h1 className="text-3xl font-extrabold mt-3">Welcome back, {user?.name}!</h1>
          <p className="text-red-100 mt-2 font-light">
            Monitor real estate pipelines, update plot pricing, adjust allocations, and manage employee credentials.
          </p>
        </div>
      </div>

      {/* Today's Follow-up Alerts */}
      {todaysFollowups.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-255 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <CalendarClock className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="font-extrabold text-amber-900 text-sm sm:text-base">Today's Scheduled Follow-ups</h3>
              <p className="text-xs text-amber-700">You have {todaysFollowups.length} client follow-up(s) scheduled for today</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysFollowups.map(lead => (
              <div key={lead._id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-extrabold text-gray-800">{lead.name}</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      Time: {new Date(lead.followUpInfo.nextFollowUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{lead.phone}</span>
                  </div>
                  {lead.project && (
                    <div className="text-[9px] text-[#0e623a] font-extrabold uppercase">
                      Project: {lead.project.code} ({lead.project.name || ''})
                    </div>
                  )}
                  {lead.followUpInfo.remarks && (
                    <p className="text-[10px] text-gray-600 bg-gray-50 p-2 rounded-lg italic">
                      "{lead.followUpInfo.remarks}"
                    </p>
                  )}
                </div>

                <Link
                  to={`/leads?status=Follow-Up`}
                  className="w-full text-center py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1"
                >
                  <span>Open Follow-Up Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border-2 border-[#0e623a]/40 flex items-center justify-between shadow-[0_8px_30px_rgba(14,98,58,0.06)] hover:shadow-[0_15px_45px_rgba(14,98,58,0.16)] hover:border-[#0e623a]/60 transition-all duration-500 transform hover:-translate-y-1">
          <div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block">Total Projects</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{totalProjects}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#0e623a] flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border-2 border-[#0e623a]/40 flex items-center justify-between shadow-[0_8px_30px_rgba(14,98,58,0.06)] hover:shadow-[0_15px_45px_rgba(14,98,58,0.16)] hover:border-[#0e623a]/60 transition-all duration-500 transform hover:-translate-y-1">
          <div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block">Total Units</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{totalUnits}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0e623a] flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total Valuation */}
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border-2 border-[#0e623a]/40 flex items-center justify-between shadow-[0_8px_30px_rgba(14,98,58,0.06)] hover:shadow-[0_15px_45px_rgba(14,98,58,0.16)] hover:border-[#0e623a]/60 transition-all duration-500 transform hover:-translate-y-1">
          <div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block">Portfolio Valuation</span>
            <span className="text-2xl font-extrabold text-gray-800 mt-1 block">
              ${totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border-2 border-[#0e623a]/40 flex items-center justify-between shadow-[0_8px_30px_rgba(14,98,58,0.06)] hover:shadow-[0_15px_45px_rgba(14,98,58,0.16)] hover:border-[#0e623a]/60 transition-all duration-500 transform hover:-translate-y-1">
          <div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block">Available Units</span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">{availableUnits}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Tracker */}
        <div className="bg-white/40 backdrop-blur-md p-8 rounded-3xl shadow-sm border-2 border-[#0e623a]/40 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Inventory Status Chart</h3>
              <p className="text-xs text-gray-500">Breakdown of inventory states across all projects</p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-5">
            {/* Available */}
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                <span>Available Units</span>
                <span>{availableUnits} / {totalUnits} ({totalUnits > 0 ? Math.round((availableUnits/totalUnits)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalUnits > 0 ? (availableUnits/totalUnits)*100 : 0}%` }}></div>
              </div>
            </div>

            {/* Booked */}
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                <span>Booked Units</span>
                <span>{bookedUnits} / {totalUnits} ({totalUnits > 0 ? Math.round((bookedUnits/totalUnits)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${totalUnits > 0 ? (bookedUnits/totalUnits)*100 : 0}%` }}></div>
              </div>
            </div>

            {/* Under Construction */}
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                <span>Under Construction</span>
                <span>{constructionUnits} / {totalUnits} ({totalUnits > 0 ? Math.round((constructionUnits/totalUnits)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${totalUnits > 0 ? (constructionUnits/totalUnits)*100 : 0}%` }}></div>
              </div>
            </div>

            {/* Sold Out */}
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                <span>Sold Out</span>
                <span>{soldUnits} / {totalUnits} ({totalUnits > 0 ? Math.round((soldUnits/totalUnits)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-[#0e623a] h-full rounded-full" style={{ width: `${totalUnits > 0 ? (soldUnits/totalUnits)*100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links / Actions */}
        <div className="bg-white/40 backdrop-blur-md p-8 rounded-3xl shadow-sm border-2 border-[#0e623a]/40 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Quick Commands</h3>
            <p className="text-xs text-gray-500 mb-6">Common operations based on role authorizations</p>

            <div className="space-y-3">
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <Link
                  to="/projects/register"
                  className="flex items-center justify-between p-4 bg-white/20 hover:bg-[#0e623a]/5 rounded-xl border border-[#0e623a]/20 hover:border-[#0e623a]/50 transition group"
                >
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-[#0e623a]">Register Project</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0e623a] group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              <Link
                to="/projects"
                className="flex items-center justify-between p-4 bg-white/20 hover:bg-[#0e623a]/5 rounded-xl border border-[#0e623a]/20 hover:border-[#0e623a]/50 transition group"
              >
                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#0e623a]">Browse Project Inventory</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0e623a] group-hover:translate-x-1 transition-transform" />
              </Link>

              {user?.role === 'Admin' && (
                <Link
                  to="/employees"
                  className="flex items-center justify-between p-4 bg-white/20 hover:bg-[#0e623a]/5 rounded-xl border border-[#0e623a]/20 hover:border-[#0e623a]/50 transition group"
                >
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-[#0e623a]">Approve Pending Employees</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0e623a] group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white/10 border border-[#0e623a]/30 p-4 rounded-xl mt-6">
            <span className="text-xs font-bold text-[#0e623a] block uppercase mb-1">Company Config</span>
            <p className="text-xs text-gray-600 leading-normal">
              Need modifications to unit prefixes, system configurations, or user permissions? Contact your IT administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
