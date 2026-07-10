const fs = require('fs');

// 1. Read the clean HEAD state
let content = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

// 2. Apply Column Split
content = content.replace(
  /<th className="p-4">Project \/ Units<\/th>/,
  '<th className="p-4">Project</th>\n                  <th className="p-4">Units & Value</th>'
);

const startIndex = content.indexOf('<tbody className="divide-y divide-gray-50">');
const endIndex = content.indexOf('</tbody>', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const correctTbody = `              <tbody className="divide-y divide-gray-50">
                {bookings
                  .filter(lead => {
                    if (filterProjectCode && lead.project?.code !== filterProjectCode) return false;
                    if (filterDate) {
                      const bookingStr = new Date(lead.bookingInfo?.bookingDate || lead.createdAt).toLocaleDateString('en-CA');
                      if (bookingStr !== filterDate) return false;
                    }
                    return true;
                  })
                  .map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{lead.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-700">
                          {lead.project?.code || 'N/A'} - {lead.project?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block">
                            Units: {lead.bookingInfo?.selectedUnits?.join(', ') || 'N/A'}
                          </div>
                          {(() => {
                            const flow = flows.find(f => (f.lead?._id || f.lead) === lead._id);
                            const quot = quotations.find(q => (q.lead?._id || q.lead) === lead._id);
                            const value = flow ? flow.totalCurrentValue : (quot ? quot.totalValue : null);
                            if (value !== null) {
                              return (
                                <div className="text-[10px] text-blue-800 font-extrabold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded inline-block">
                                  Value: Rs. {value.toLocaleString()}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {new Date(lead.bookingInfo?.bookingDate || lead.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-700">{lead.phone}</div>
                        <div className={\`text-[9px] font-bold uppercase mt-0.5 \${lead.status === 'Cancelled' ? 'text-red-700 bg-red-50 px-2 py-0.5 border border-red-200 rounded inline-block' : 'text-yellow-800'}\`}>
                          {lead.status === 'Cancelled' ? 'Cancelled' : 'Booking Stage'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleBookingSelect(lead._id)}
                          className="px-4 py-2 bg-[#0e623a] text-white font-bold rounded-xl hover:bg-[#0b4d2d] transition text-[10px] cursor-pointer"
                        >
                          Manage CRD Flow
                        </button>
                      </td>
                    </tr>
                  ))}

                {bookings.filter(lead => {
                  if (filterProjectCode && lead.project?.code !== filterProjectCode) return false;
                  if (filterDate) {
                    const bookingStr = new Date(lead.bookingInfo?.bookingDate || lead.createdAt).toLocaleDateString('en-CA');
                    if (bookingStr !== filterDate) return false;
                  }
                  return true;
                }).length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400">
                      No matching booked leads found.
                    </td>
                  </tr>
                )}
              </tbody>`;
  
  content = content.substring(0, startIndex) + correctTbody + content.substring(endIndex + 8);
}

// 3. Apply autoInitializeFlow function logic
const autoInitLogic = `
  const autoInitializeFlow = async (leadId) => {
    const selectedBooking = bookings.find(b => b._id === leadId);
    if (!selectedBooking) return;
    const projId = selectedBooking.project?._id || selectedBooking.project;
    
    try {
      const projRes = await fetch(\`\${API_URL}/projects/\${projId}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      
      let parsedStages = [];
      let isMasterLoaded = false;
      
      if (projRes.ok) {
        const projectData = await projRes.json();
        if (projectData.crdFlowSheet && projectData.crdFlowSheet.link) {
          isMasterLoaded = true;
          const quot = quotations.find(q => (q.lead?._id || q.lead) === leadId);
          const valuation = quot ? quot.totalValue : (selectedBooking?.bookingInfo?.selectedUnits?.length 
            ? selectedBooking.bookingInfo.selectedUnits.length * (projectData.pricePerSqFt || 2000) * 1000
            : 2500000);
          
          let sumAmount = 0;
          parsedStages = defaultStagesTemplate.map((stage, idx) => {
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
        }
      }
      
      if (!isMasterLoaded) {
        const quot = quotations.find(q => (q.lead?._id || q.lead) === leadId);
        const valuation = quot ? quot.totalValue : 2500000;
        let sumAmount = 0;
        parsedStages = defaultStagesTemplate.map((stage, idx) => {
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
      }
      
      const initRes = await fetch(\`\${API_URL}/crd-flow/initialize\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          leadId,
          stages: parsedStages
        })
      });

      if (initRes.ok) {
        const newFlow = await initRes.json();
        setActiveFlow(newFlow);
        setSuccess('CRD Flow initialized automatically!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to auto-initialize CRD Flow.');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      console.error('Error auto-initializing flow:', err);
    }
  };
`;

content = content.replace(
  '  const handleBookingSelect = async (leadId) => {',
  autoInitLogic + '\n  const handleBookingSelect = async (leadId) => {'
);

content = content.replace(
  /if \(data\) \{\s*setActiveFlow\(data\);\s*\}/,
  `if (data) {
          setActiveFlow(data);
        } else {
          await autoInitializeFlow(leadId);
        }`
);

// 4. Update the setup UI to show a loader instead
const setupUIRegex = /\{\/\* Stage Initialization view if NO flow exists \*\/\}\s*\{selectedBookingId && !activeFlow && \([\s\S]*?\}\)/;

// Since [\s\S]*?\} is greedy if we don't end it at the right bracket, let's find it securely.
const startIdx = content.indexOf('{/* Stage Initialization view if NO flow exists */}');
const simplifiedIdx = content.indexOf('{/* Simplified Record Table */}');

if (startIdx !== -1 && simplifiedIdx !== -1) {
  const replacement = `{/* Auto Initializing Flow State */}
      {selectedBookingId && !activeFlow && (
        <div className="bg-white border border-gray-150 p-12 rounded-3xl shadow-sm space-y-6 text-center flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e623a]"></div>
          <div className="max-w-md mx-auto space-y-2 mt-4">
            <h3 className="text-sm font-bold text-gray-800">Initializing CRD Master Format...</h3>
            <p className="text-xs text-gray-500">Automatically setting up the milestone payment schedules for this booking.</p>
          </div>
        </div>
      )}\n\n      `;
      
  content = content.substring(0, startIdx) + replacement + content.substring(simplifiedIdx);
}

fs.writeFileSync('client/src/pages/CRDFlow.jsx', content);
console.log('CRDFlow.jsx completely restored and auto-init logic correctly applied!');
