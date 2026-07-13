const fs = require('fs');
const file = 'e:/builders/client/src/pages/CRDFlow.jsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* Expanded Accordion for Stage Details */}'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('</React.Fragment>'));

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find accordion boundaries', startIdx, endIdx);
    process.exit(1);
}

const accordionInner = lines.slice(startIdx + 4, endIdx - 4).join('\n');
const fixedInner = accordionInner.replace(/lead\./g, 'selectedBookingDetails.');

const modalCode = `      {/* View Payment Modal / Details Modal */}
      {selectedBookingId && selectedBookingDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-black-100 flex justify-between items-center bg-[#0e623a] text-white rounded-t-3xl">
              <h2 className="text-xl font-bold flex items-center gap-2">
                 <Layers className="w-5 h-5 text-white" />
                 Stage Details & Milestone Payments
              </h2>
              <button 
                onClick={() => {
                  setSelectedBookingId(null);
                  setActiveFlow(null);
                  setActionMenuId(null);
                }} 
                className="text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-black-50">
${fixedInner}
            </div>
          </div>
        </div>
      )}`;

lines.splice(startIdx, endIdx - startIdx);

const insertIdx = lines.findIndex(l => l.includes('{/* Extra Work Modal dialog */}'));
if (insertIdx !== -1) {
    lines.splice(insertIdx, 0, modalCode);
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Successfully updated file');
} else {
    console.error('Could not find insert location');
    process.exit(1);
}
