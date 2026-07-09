import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { ArrowLeft, Plus, X } from 'lucide-react';


const CRDFlowDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [extraWorkModalOpen, setExtraWorkModalOpen] = useState(false);
  const [selectedStageIdx, setSelectedStageIdx] = useState(null);
  const [extraWorkName, setExtraWorkName] = useState('');
  const [extraWorkAmount, setExtraWorkAmount] = useState('');

  const fetchFlow = async () => {
    try {
      const res = await fetch(`${API_URL}/crd-flow/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFlow(await res.json());
      } else {
        setError('Failed to fetch CRD Flow details');
      }
    } catch (err) {
      setError('Connection error fetching details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlow();
  }, [id, token]);

  const handleAddExtraWork = async (e) => {
    e.preventDefault();
    if (!extraWorkName || !extraWorkAmount) return;

    try {
      const res = await fetch(`${API_URL}/crd-flow/${id}/stage/${selectedStageIdx}/extra-work`, {
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
        setExtraWorkModalOpen(false);
        setExtraWorkName('');
        setExtraWorkAmount('');
        fetchFlow();
      } else {
        alert('Failed to add extra work');
      }
    } catch (err) {
      alert('Error adding extra work');
    }
  };

  const getStagePaid = (stage) => stage.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const getExtraWorkTotal = (stage) => stage.extraWorks?.reduce((sum, ew) => sum + ew.amount, 0) || 0;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading flow details...</div>;
  if (error || !flow) return <div className="p-8 text-center text-rose-500">{error || 'Flow not found'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/crd-flow')}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to CRD Flows
        </button>
        <h1 className="text-2xl font-black text-[#0e623a]">Stage Details</h1>
      </div>

      {/* Header Info */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-sm flex flex-wrap gap-8">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Customer</p>
          <p className="text-base font-black text-gray-800">{flow.lead?.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Project</p>
          <p className="text-base font-black text-gray-800">{flow.project?.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Units</p>
          <p className="text-base font-black text-emerald-700 bg-emerald-50 px-2 rounded-md">{flow.unitId}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Assigned Executive</p>
          <p className="text-base font-black text-[#0e623a]">{flow.lead?.assignedTo?.name || flow.lead?.assignedTo || 'Unassigned'}</p>
        </div>
      </div>

      {/* Stages Table */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Stage Name</th>
              <th className="p-4 text-right">Original Amt (Rs)</th>
              <th className="p-4 text-right">Extra Work (Rs)</th>
              <th className="p-4 text-right">Total Payable (Rs)</th>
              <th className="p-4 text-right text-emerald-600">Paid Amt (Rs)</th>
              <th className="p-4 text-right text-rose-600">Pending Amt (Rs)</th>
              <th className="p-4 text-center">Collection Person</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {flow.stages?.map((stage, idx) => {
              const original = stage.amount;
              const extra = getExtraWorkTotal(stage);
              const total = original + extra;
              const paid = getStagePaid(stage);
              const pending = Math.max(0, total - paid);
              const isDone = stage.isCompleted || paid >= total;

              return (
                <tr key={idx} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-800">Stage {idx + 1}: {stage.name}</td>
                  <td className="p-4 text-right text-gray-600">{original.toLocaleString()}</td>
                  <td className="p-4 text-right text-purple-600 font-semibold">{extra > 0 ? extra.toLocaleString() : '-'}</td>
                  <td className="p-4 text-right font-black text-[#0e623a]">{total.toLocaleString()}</td>
                  <td className="p-4 text-right font-bold text-emerald-600">{paid.toLocaleString()}</td>
                  <td className="p-4 text-right font-bold text-rose-600">{pending.toLocaleString()}</td>
                  <td className="p-4 text-center text-gray-600">{flow.lead?.assignedTo?.name || flow.lead?.assignedTo || '-'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedStageIdx(idx);
                        setExtraWorkModalOpen(true);
                      }}
                      disabled={isDone}
                      title={isDone ? "Cannot add extra work to a completed/fully paid stage" : "Add Extra Work"}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm ${
                        isDone 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer border border-purple-200'
                      }`}
                    >
                      <Plus className="w-3 h-3" /> Extra Work
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Extra Work Modal */}
      {extraWorkModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#0e623a] p-5 text-white flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-300" /> Add Extra Work
              </h3>
              <button onClick={() => setExtraWorkModalOpen(false)} className="hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddExtraWork} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Work Description</label>
                <input
                  type="text"
                  required
                  value={extraWorkName}
                  onChange={e => setExtraWorkName(e.target.value)}
                  placeholder="e.g. Italian Marble Flooring"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Amount (Rs)</label>
                <input
                  type="number"
                  required
                  value={extraWorkAmount}
                  onChange={e => setExtraWorkAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setExtraWorkModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0e623a] text-white rounded-xl text-xs font-bold hover:bg-[#0b4d2d]"
                >
                  Add Amount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRDFlowDetail;
