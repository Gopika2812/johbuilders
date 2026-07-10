const fs = require('fs');
const file = 'client/src/pages/CRDFlow.jsx';
let content = fs.readFileSync(file, 'utf8');

// Update headers
content = content.replace(
  /<th className="p-4">Final Quotation Value<\/th>/,
  '<th className="p-4">Final Quotation Value</th>\n                <th className="p-4">Received Value</th>\n                <th className="p-4">Pending Value</th>'
);

// Update data columns
const oldColumns = `<td className="p-4 space-y-1.5 min-w-\\[140px\\]">\n\\s*\\{value !== null \\? \\(\n\\s*<>\n\\s*<div className="flex items-center justify-between text-\\[10px\\] gap-2">\n\\s*<span className="text-gray-500 font-bold uppercase tracking-wider">Total<\\/span>\n\\s*<span className="text-blue-800 font-black bg-blue-50 border border-blue-200 px-1\\.5 py-0\\.5 rounded shadow-sm">\n\\s*Rs\\. \\{value\\.toLocaleString\\(\\)\\}\n\\s*<\\/span>\n\\s*<\\/div>\n\\s*<div className="flex items-center justify-between text-\\[10px\\] gap-2">\n\\s*<span className="text-gray-500 font-bold uppercase tracking-wider">Received<\\/span>\n\\s*<span className="text-emerald-800 font-black bg-emerald-50 border border-emerald-200 px-1\\.5 py-0\\.5 rounded shadow-sm">\n\\s*Rs\\. \\{received\\.toLocaleString\\(\\)\\}\n\\s*<\\/span>\n\\s*<\\/div>\n\\s*<div className="flex items-center justify-between text-\\[10px\\] gap-2">\n\\s*<span className="text-gray-500 font-bold uppercase tracking-wider">Pending<\\/span>\n\\s*<span className="text-rose-800 font-black bg-rose-50 border border-rose-200 px-1\\.5 py-0\\.5 rounded shadow-sm">\n\\s*Rs\\. \\{\\(pending \\|\\| 0\\)\\.toLocaleString\\(\\)\\}\n\\s*<\\/span>\n\\s*<\\/div>\n\\s*<\\/>\n\\s*\\) : \\(\n\\s*<span className="text-gray-400 text-\\[10px\\]">N\\/A<\\/span>\n\\s*\\)\\}\n\\s*<\\/td>`;

const newColumns = `<td className="p-4">
                          {value !== null ? (
                            <span className="text-blue-800 font-black bg-blue-50 border border-blue-200 px-2 py-1 rounded shadow-sm text-[10px]">
                              Rs. {value.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          {value !== null ? (
                            <span className="text-emerald-800 font-black bg-emerald-50 border border-emerald-200 px-2 py-1 rounded shadow-sm text-[10px]">
                              Rs. {received.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          {value !== null ? (
                            <span className="text-rose-800 font-black bg-rose-50 border border-rose-200 px-2 py-1 rounded shadow-sm text-[10px]">
                              Rs. {(pending || 0).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">N/A</span>
                          )}
                        </td>`;

content = content.replace(new RegExp(oldColumns), newColumns);

// Update colSpans
content = content.replace(/colSpan="9"/g, 'colSpan="11"');

fs.writeFileSync(file, content);
console.log("Successfully updated columns in CRDFlow.jsx");
