const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/pages/ExtraWorks.jsx');
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

// 2. Remove the first individual "Send to PED" button (which is in the expanded view)
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

// Only replace the first occurrence
content = content.replace(individualButtonCode, '');

// 3. Align the bulk buttons left
content = content.replace(
  '<div className="mt-4 flex flex-wrap justify-end gap-3">',
  '<div className="mt-4 flex flex-wrap justify-start gap-3">'
);

content = content.replace(
  '<div className="mt-4 flex justify-end">\n                                    <span className="text-[10px] text-gray-400 font-bold border border-dashed border-emerald-250/60 rounded-xl px-4 py-2 bg-emerald-50/10">\n                                      Select one or more items to perform actions\n                                    </span>\n                                  </div>',
  '<div className="mt-4 flex justify-start">\n                                    <span className="text-[10px] text-gray-400 font-bold border border-dashed border-emerald-250/60 rounded-xl px-4 py-2 bg-emerald-50/10">\n                                      Select one or more items to perform actions\n                                    </span>\n                                  </div>'
);

fs.writeFileSync(filePath, content);
console.log('Patched successfully!');
