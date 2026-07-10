const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

// The block to replace
const originalBlock = `<button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuId(actionMenuId === lead._id ? null : lead._id);
                              }}
                              className="p-1.5 text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 rounded transition cursor-pointer"
                              title="Quick Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>`;

const newBlock = `<button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (actionMenuId === lead._id) {
                                  setActionMenuId(null);
                                } else {
                                  setActionMenuId(lead._id);
                                  if (selectedBookingId !== lead._id) {
                                    handleBookingSelect(lead._id);
                                  }
                                }
                              }}
                              className="p-1.5 text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 rounded transition cursor-pointer"
                              title="Quick Actions"
                            >`;

if (content.includes(originalBlock)) {
  content = content.replace(originalBlock, newBlock);
  fs.writeFileSync('client/src/pages/CRDFlow.jsx', content);
  console.log('Successfully updated the button click handler!');
} else {
  console.log('Could not find the original block to replace.');
}
