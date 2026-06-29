import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { History, Calendar, User, ShieldAlert } from 'lucide-react';

const EmployeeHistory = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        setError('Failed to fetch activity logs');
      }
    } catch (err) {
      setError('Connection error fetching history');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'Register':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Login':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Create Project':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Resize Plot':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Update Pricing Engine':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

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
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#0e623a] p-6 text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-[#a7d8ff]" />
            <span>Employee Activity History</span>
          </h3>
          <p className="text-red-100 text-xs mt-1">
            Audit logs tracking all administrative actions, data edits, logins, and project mutations
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-light">
              No activity logs recorded in the system yet.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="p-6 hover:bg-gray-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4 items-start">
                  {/* Avatar Icon */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold uppercase border">
                    {log.userName ? log.userName.slice(0, 2) : 'EM'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{log.userName}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border font-medium">
                        {log.userRole}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-normal">{log.description}</p>
                  </div>
                </div>

                {/* Date / Timestamp */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium shrink-0 md:text-right pl-14 md:pl-0">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeHistory;
