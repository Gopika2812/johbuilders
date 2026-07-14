import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Building, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  Clock,
  Loader2,
  Send,
  Plus,
  Search,
  Download,
  X,
  FileText
} from 'lucide-react';

const ExtraWorks = () => {
  const { token, user } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFlow, setExpandedFlow] = useState(null);
  const [rates, setRates] = useState({});
  const [submitting, setSubmitting] = useState(null); // id of work being submitted
  const [activeTab, setActiveTab] = useState('crd');
  const [selectedWorks, setSelectedWorks] = useState([]); // crd, ped, client, accounts, work-orders
  const [extraWorkDetailsModal, setExtraWorkDetailsModal] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Add Extra Work Modal Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingWork, setIsAddingWork] = useState(false);
  const [addForm, setAddForm] = useState({
    stageId: '',
    name: '',
    category: 'General',
    unit: 'Unit',
    quantity: 1,
    rate: 0
  });

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/extra-works`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch extra works');
      const data = await res.json();
      setFlows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, [token]);

    const toggleWorkSelection = (workId) => {
    setSelectedWorks(prev => 
      prev.includes(workId) ? prev.filter(id => id !== workId) : [...prev, workId]
    );
  };

  const toggleSelectAll = (flow, activeTab) => {
    const selectableWorks = [];
    flow.stages.forEach(s => {
      s.extraWorks?.forEach(w => {
        if (activeTab === 'crd' && w.status === 'Pending') selectableWorks.push(w._id);
        if (activeTab === 'ped' && w.status === 'PED Approved') selectableWorks.push(w._id);
        if (activeTab === 'accounts' && w.status === 'Client Approved') selectableWorks.push(w._id);
      });
    });
    
    const allSelected = selectableWorks.length > 0 && selectableWorks.every(id => selectedWorks.includes(id));
    
    if (allSelected) {
      setSelectedWorks(prev => prev.filter(id => !selectableWorks.includes(id)));
    } else {
      setSelectedWorks(prev => [...new Set([...prev, ...selectableWorks])]);
    }
                                            (activeTab === 'ped' && work.status === 'PED Approved') ||
                                            (activeTab === 'accounts' && work.status === 'Client Approved')) && (
                                            <input 
                                              type="checkbox"
                                              className="w-4 h-4 rounded border-gray-300 text-[#006838] focus:ring-[#006838]"
                                              checked={selectedWorks.includes(work._id)}
                                              onChange={() => setSelectedWorks(prev => prev.includes(work._id) ? prev.filter(id => id !== work._id) : [...prev, work._id])}
                                            />
                                          )}
                                        </td>
                                        <td className="p-4 align-middle">
                                          <button onClick={() => setExtraWorkDetailsModal({ flow, stageIdx: sIdx, work })} className="font-mono text-blue-700 font-bold hover:underline cursor-pointer">
                                            {work.ewId || '-'}
                                          </button>
                                        </td>
                                        <td className="p-4 align-middle text-right font-bold text-black-800">
                                          Rs. {(work.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-gray-600">
                                          {work.pricingDate ? new Date(work.pricingDate).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-gray-600">
                                          {work.sentToPedDate ? new Date(work.sentToPedDate).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-emerald-700 font-medium">
                                          {work.customerApprovalDate ? new Date(work.customerApprovalDate).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-blue-700 font-medium">
                                          {work.crdAddedDate ? new Date(work.crdAddedDate).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-center text-sm text-purple-700 font-medium">
                                          {work.woId || (work.crdAddedDate ? new Date(work.crdAddedDate).toLocaleDateString('en-GB') : '-')}
                                        </td>
                                      </tr>
                                    ))
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {(() => {
                              if (activeTab === 'crd') {
                                const hasPending = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Pending'));
                                if (!hasPending) return null;
                                return (
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={async () => {
                                        setSubmitting('bulk-crd');
                                        try {
                                          const works = [];
                                          flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                            if (w.status === 'Pending' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
                                          }));
                                          for (const work of works) {
                                            await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/send-to-ped`, {
                                              method: 'PUT', headers: { Authorization: `Bearer ${token}` }
                                            });
                                          }
                                          setSelectedWorks([]);
                                          await fetchFlows();
                                        } finally {
                                          setSubmitting(null);
                                        }
                                      }}
                                      disabled={submitting === 'bulk-crd' || selectedWorks.length === 0}
                                      className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                      {submitting === 'bulk-crd' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Share Selected to PED ({selectedWorks.length})</>}
                                    </button>
                                  </div>
                                );
                              }

                              if (activeTab === 'ped') {
                                const hasReadyToShare = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'PED Approved'));
                                if (!hasReadyToShare) return null;
                                return (
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={async () => {
                                        setSubmitting('bulk-ped');
                                        try {
                                          const works = [];
                                          flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                            if (w.status === 'PED Approved' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
                                          }));
                                          for (const work of works) {
                                            await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/send`, {
                                              method: 'PUT', headers: { Authorization: `Bearer ${token}` }
                                            });
                                          }
                                          setSelectedWorks([]);
                                          await fetchFlows();
                                        } finally {
                                          setSubmitting(null);
                                        }
                                      }}
                                      disabled={submitting === 'bulk-ped' || selectedWorks.length === 0}
                                      className="px-6 py-2 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00512c] transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                      {submitting === 'bulk-ped' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Share Selected to Client ({selectedWorks.length})</>}
                                    </button>
                                  </div>
                                );
                              }

                              if (activeTab === 'accounts') {
                                const hasClientApproved = flow.stages.some(s => s.extraWorks?.some(w => w.status === 'Client Approved'));
                                if (!hasClientApproved) return null;
                                return (
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={async () => {
                                        setSubmitting('bulk-accounts');
                                        try {
                                          const works = [];
                                          flow.stages.forEach((s, sIdx) => s.extraWorks?.forEach(w => {
                                            if (w.status === 'Client Approved' && selectedWorks.includes(w._id)) works.push({sIdx, wId: w._id});
                                          }));
                                          for (const work of works) {
                                            await fetch(`${API_URL}/extra-works/${flow._id}/${work.sIdx}/${work.wId}/add-to-crd`, {
                                              method: 'PUT', headers: { Authorization: `Bearer ${token}` }
                                            });
                                          }
                                          setSelectedWorks([]);
                                          await fetchFlows();
                                        } finally {
                                          setSubmitting(null);
                                        }
                                      }}
                                      disabled={submitting === 'bulk-accounts' || selectedWorks.length === 0}
                                      className="px-6 py-2 bg-[#006838] text-white font-bold rounded-xl hover:bg-[#00512c] transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                      {submitting === 'bulk-accounts' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Work Orders for Selected ({selectedWorks.length})</>}
                                    </button>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extra Work Details Popup */}
      {extraWorkDetailsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-black-100">
            <div className="bg-[#006838] p-6 text-white relative">
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
            
            <div className="bg-emerald-50/50 p-4 md:px-6 border-b border-emerald-100 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Customer Name</div>
                <div className="font-bold text-emerald-900">{extraWorkDetailsModal.flow?.lead?.name || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Project Type</div>
                <div className="font-bold text-gray-900">{extraWorkDetailsModal.flow?.project?.name || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Unit</div>
                <div className="font-bold text-gray-900">{extraWorkDetailsModal.flow?.unitId || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Booked On</div>
                <div className="font-bold text-gray-900">
                  {(() => {
                    const lead = extraWorkDetailsModal.flow?.lead;
                    let bookingDate = lead?.history?.find(h => h.status === 'Booking')?.timestamp || lead?.createdAt || extraWorkDetailsModal.flow?.createdAt;
                    return bookingDate ? new Date(bookingDate).toLocaleDateString('en-GB') : '-';
                  })()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Registration Date On</div>
                <div className="font-bold text-gray-900">
                  {(() => {
                    const regStage = extraWorkDetailsModal.flow?.stages?.find(s => s.name?.includes('Agreement'));
                    return regStage?.completedDate ? new Date(regStage.completedDate).toLocaleDateString('en-GB') : '-';
                  })()}
                </div>
              </div>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                  <tr>
                    <th className="px-6 py-4">Work ID</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Sub Category</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Rate</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  <tr>
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">{extraWorkDetailsModal.work?.ewId || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">{extraWorkDetailsModal.work?.category}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{extraWorkDetailsModal.work?.name}</td>
                    <td className="px-6 py-4 text-center">
                      <strong className="text-gray-800">{extraWorkDetailsModal.work?.quantity}</strong> <span className="text-gray-500 text-xs">{extraWorkDetailsModal.work?.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {activeTab !== 'crd' ? (
                        <input
                          type="number"
                          disabled={activeTab !== 'ped' || (extraWorkDetailsModal.work?.status !== 'Sent to PED' && extraWorkDetailsModal.work?.status !== 'PED Approved')}
                          value={rates[extraWorkDetailsModal.work?._id] ?? extraWorkDetailsModal.work?.rate ?? ''}
                          onChange={(e) => handleRateChange(extraWorkDetailsModal.work?._id, e.target.value)}
                          className="w-24 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#006838] disabled:opacity-50 inline-block text-right"
                          placeholder="0"
                        />
                      ) : (
                        <span className="font-bold text-gray-800">Rs. {extraWorkDetailsModal.work?.rate || 0}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                        ${extraWorkDetailsModal.work?.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        extraWorkDetailsModal.work?.status === 'Client Approved' ? 'bg-emerald-100 text-emerald-700' :
                        extraWorkDetailsModal.work?.status === 'Added to CRD' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-200 text-gray-700'}`}>
                        {extraWorkDetailsModal.work?.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {activeTab === 'crd' && extraWorkDetailsModal.work?.status === 'Pending' && (
                        <button
                          onClick={() => {
                            handleSendToPED(extraWorkDetailsModal.flow._id, extraWorkDetailsModal.stageIdx, extraWorkDetailsModal.work._id);
                            setExtraWorkDetailsModal(null);
                          }}
                          disabled={submitting === extraWorkDetailsModal.work?._id}
                          className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-600 hover:text-white transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                        >
                          {submitting === extraWorkDetailsModal.work?._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Share to PED'}
                        </button>
                      )}
                      {activeTab === 'ped' && (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              handleSavePrice(extraWorkDetailsModal.flow._id, extraWorkDetailsModal.stageIdx, extraWorkDetailsModal.work._id);
                              setExtraWorkDetailsModal(null);
                            }}
                            disabled={submitting === extraWorkDetailsModal.work?._id || !(rates[extraWorkDetailsModal.work?._id] > 0)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-200 transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                          >
                            {submitting === extraWorkDetailsModal.work?._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Save Price'}
                          </button>
                          <button
                            onClick={() => {
                              handleSaveAndSendToClient(extraWorkDetailsModal.flow._id, extraWorkDetailsModal.stageIdx, extraWorkDetailsModal.work._id);
                              setExtraWorkDetailsModal(null);
                            }}
                            disabled={submitting === extraWorkDetailsModal.work?._id || !(rates[extraWorkDetailsModal.work?._id] > 0)}
                            className="px-4 py-2 bg-[#006838] text-white font-bold text-xs rounded-lg hover:bg-[#00512c] transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                          >
                            {submitting === extraWorkDetailsModal.work?._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Send to Client'}
                          </button>
                        </div>
                      )}
                      {activeTab === 'accounts' && extraWorkDetailsModal.work?.status === 'Client Approved' && (
                        <button
                          onClick={() => {
                            handleAddToCRD(extraWorkDetailsModal.flow._id, extraWorkDetailsModal.stageIdx, extraWorkDetailsModal.work._id);
                            setExtraWorkDetailsModal(null);
                          }}
                          disabled={submitting === extraWorkDetailsModal.work?._id}
                          className="px-4 py-2 bg-[#006838] text-white font-bold text-xs rounded-lg hover:bg-[#00512c] transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                        >
                          {submitting === extraWorkDetailsModal.work?._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Create Work Order'}
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtraWorks;
