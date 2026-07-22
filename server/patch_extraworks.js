const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../client/src/pages/ExtraWorks.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Re-apply useEffect auto-refresh
const refreshEffectCode = `  useEffect(() => {
    if (flows.length > 0) {
      const selectableIds = [];
      flows.forEach(flow => {
        const allExtraWorks = flow.stages ? flow.stages.flatMap(s => s.extraWorks || []) : [];
        allExtraWorks.forEach(work => {
          if ((((isAdmin || canEditTab('crd')) && ['Pending', 'Returned to CRD', 'Client Approved', 'Added to CRD'].includes(work.status)) ||
               ((isAdmin || canEditTab('ped')) && ['Sent to PED', 'PED Approved'].includes(work.status)) ||
               ((isAdmin || canEditTab('accounts')) && work.status === 'Sent to Accounts'))) {
            selectableIds.push(work._id);
          }
        });
      });
      setSelectableWorks(selectableIds);
      
      if (groupDetailsModal) {
        const currentFlow = flows.find(f => f._id === groupDetailsModal.flow._id);
        if (currentFlow) {
          const currentStage = currentFlow.stages.find((s, idx) => idx === groupDetailsModal.sIdx);
          if (currentStage && currentStage.extraWorks && currentStage.extraWorks.length > 0) {
            const groups = currentStage.extraWorks.reduce((acc, work) => {
              const ewId = work.ewId;
              if (!acc[ewId]) {
                acc[ewId] = { ewId, displayId: ewId, items: [] };
              }
              acc[ewId].items.push(work);
              return acc;
            }, {});
            
            const groupList = Object.values(groups);
            const currentGroup = groupList[groupDetailsModal.gIdx];
            
            if (currentGroup) {
              setGroupDetailsModal({
                ...groupDetailsModal,
                flow: currentFlow,
                group: currentGroup
              });
            }
          }
        }
      }
    }
  }, [flows, isAdmin, canEditTab]);

  useEffect(() => {
    fetchFlows();
  }, []);`;

content = content.replace(/  useEffect\(\(\) => \{\n    fetchFlows\(\);\n  \}, \[\]\);/g, refreshEffectCode);


// 2. Remove individual Send to PED button
const individualButtonCode = `                                              {(isAdmin || canEditTab('crd')) && work.status === 'Pending' && (
                                                <button
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    setSubmitting(work._id);
                                                    try {
                                                      await handleSendToPED(flow._id, work.stageIdx, work._id);
                                                    } finally {
                                                      setSubmitting(null);
                                                    }
                                                  }}
                                                  disabled={submitting === work._id}
                                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded text-[10px] font-bold shadow-sm whitespace-nowrap"
                                                >
                                                  Send to PED
                                                </button>
                                              )}`;

content = content.replace(individualButtonCode, '');

// 3. Add bulk Send to PED button in modal footer
const oldFooter = `            <div className="p-6 border-t border-gray-100 bg-white rounded-b-[2rem] flex justify-end gap-3">
              <button
                onClick={() => setGroupDetailsModal(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>`;

const newFooter = `            <div className="p-6 border-t border-gray-100 bg-white rounded-b-[2rem] flex justify-between items-center gap-3">
              <div>
                {selectedWorks.length > 0 && (isAdmin || canEditTab('crd')) && groupDetailsModal.group.items.some(w => selectedWorks.includes(w._id) && w.status === 'Pending') && (
                  <button
                    onClick={async () => {
                      const worksToSend = groupDetailsModal.group.items.filter(w => selectedWorks.includes(w._id) && w.status === 'Pending');
                      if (worksToSend.length === 0) return;
                      setSubmitting('bulk-ped');
                      try {
                        for (const work of worksToSend) {
                          const res = await fetch(\`\${API_URL}/extra-works/\${groupDetailsModal.flow._id}/\${work.stageIdx}/\${work._id}/send-to-ped\`, {
                            method: 'PUT',
                            headers: { Authorization: \`Bearer \${token}\` }
                          });
                          if (!res.ok) throw new Error(\`Failed to send \${work.name} to PED team\`);
                        }
                        await fetchFlows();
                        setSelectedWorks([]);
                      } catch (err) {
                        alert(err.message);
                      } finally {
                        setSubmitting(null);
                      }
                    }}
                    disabled={submitting === 'bulk-ped'}
                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow flex items-center gap-2"
                  >
                    {submitting === 'bulk-ped' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send {groupDetailsModal.group.items.filter(w => selectedWorks.includes(w._id) && w.status === 'Pending').length} Items to PED
                  </button>
                )}
              </div>
              <button
                onClick={() => setGroupDetailsModal(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>`;

content = content.replace(oldFooter, newFooter);

fs.writeFileSync(filePath, content);
console.log('Patched successfully!');
