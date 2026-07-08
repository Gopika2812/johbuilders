import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, XCircle } from 'lucide-react';
import { useAuth, API_URL } from '../context/AuthContext';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useAuth();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_URL}/requests/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(requests.filter(req => req._id !== id));
        alert('Request approved successfully');
      } else {
        throw new Error('Failed to approve');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_URL}/requests/${id}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(requests.filter(req => req._id !== id));
        alert('Request rejected successfully');
      } else {
        throw new Error('Failed to reject');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to reject request');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-600" />
            Pending Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage cancellation and other approval requests.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-200">
          <p className="text-gray-500">No pending requests at this time.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${request.type === 'LEAD_REREGISTRATION' ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {request.type === 'CRD_CANCELLATION' ? 'CRD Cancellation' : request.type === 'LEAD_REREGISTRATION' ? 'Lead Re-registration' : request.type}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Requested by: {request.requestedBy?.name || 'Unknown User'}
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg mt-3 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Narration / Reason:</h4>
                  <p className="text-gray-600 text-sm">{request.narration}</p>
                </div>
                
                {request.type === 'CRD_CANCELLATION' && request.referenceId && (
                  <div className="mt-3 text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">Reference Flow ID:</span> {request.referenceId._id}
                  </div>
                )}
              </div>
              
              <div className="flex flex-row md:flex-col gap-3 justify-center min-w-[140px]">
                <button
                  onClick={() => handleApprove(request._id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(request._id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;
