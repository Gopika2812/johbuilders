const fs = require('fs');

let fileContent = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');
const lines = fileContent.split('\n');

const startIndex = lines.findIndex(l => l.includes('<tbody className="divide-y divide-gray-50">'));
const endIndex = lines.findIndex(l => l.includes('</tbody>'));

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

const newLines = [
  ...lines.slice(0, startIndex),
  correctTbody,
  ...lines.slice(endIndex + 1)
];

fs.writeFileSync('client/src/pages/CRDFlow.jsx', newLines.join('\n'));
console.log('CRDFlow.jsx fixed completely.');
