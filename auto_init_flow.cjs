const fs = require('fs');
let content = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

const autoInitLogic = `
  const autoInitializeFlow = async (leadId) => {
    const selectedBooking = bookings.find(b => b._id === leadId);
    if (!selectedBooking) return;
    const projId = selectedBooking.project?._id || selectedBooking.project;
    
    try {
      // 1. Fetch project to get Master CRD Format
      const projRes = await fetch(\`\${API_URL}/projects/\${projId}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      
      let parsedStages = [];
      let isMasterLoaded = false;
      
      if (projRes.ok) {
        const projectData = await projRes.json();
        if (projectData.crdFlowSheet && projectData.crdFlowSheet.link) {
          isMasterLoaded = true;
          // Calculate valuation
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
      
      // If no master format, just use default presets
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
      
      // 2. Initialize Flow
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

// Insert autoInitializeFlow before handleBookingSelect
content = content.replace(
  '  const handleBookingSelect = async (leadId) => {',
  autoInitLogic + '\n  const handleBookingSelect = async (leadId) => {'
);

// Update handleBookingSelect to call it if data is empty
content = content.replace(
  /if \(data\) \{\s*setActiveFlow\(data\);\s*\}/,
  `if (data) {
            setActiveFlow(data);
          } else {
            await autoInitializeFlow(leadId);
          }`
);

// We can optionally remove the "Stage Initialization view" UI entirely, but it won't be shown anyway if activeFlow is immediately set.
// Wait, autoInitializeFlow takes a second. During that time, activeFlow is null, so it might flash the setup UI.
// Let's replace the !activeFlow block with a loading spinner if selectedBookingId is set but activeFlow is null.
const setupUIStart = `{/* Stage Initialization view if NO flow exists */}`;
const setupUIRegex = /\{\/\* Stage Initialization view if NO flow exists \*\/\}\s*\{selectedBookingId && !activeFlow && \([\s\S]*?\}\)/;

content = content.replace(setupUIRegex, 
`{/* Auto Initializing Flow State */}
      {selectedBookingId && !activeFlow && (
        <div className="bg-white border border-gray-150 p-12 rounded-3xl shadow-sm space-y-6 text-center flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e623a]"></div>
          <div className="max-w-md mx-auto space-y-2 mt-4">
            <h3 className="text-sm font-bold text-gray-800">Initializing CRD Master Format...</h3>
            <p className="text-xs text-gray-500">Automatically setting up the milestone payment schedules for this booking.</p>
          </div>
        </div>
      )}`);

fs.writeFileSync('client/src/pages/CRDFlow.jsx', content);
console.log('CRDFlow.jsx updated to auto-initialize!');
