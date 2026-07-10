const fs = require('fs');

let fileContent = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

// Replace table header
fileContent = fileContent.replace(
  /<th className="p-4">Project \/ Units<\/th>/,
  '<th className="p-4">Project</th>\n                  <th className="p-4">Units & Value</th>'
);

// Replace table body data
const oldTd = `<td className="p-4">
                        <div className="font-semibold text-gray-700">
                          {lead.project?.code || 'N/A'} - {lead.project?.name || 'N/A'}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 items-center">
                          <div className="text-\\[10px\\] text-emerald-800 font-bold bg-emerald-50 px-2 py-0\\.5 rounded inline-block">
                            Units: \\{lead.bookingInfo\\?\\.selectedUnits\\?\\.join\\(', '\\) \\|\\| 'N\\/A'\\}
                          <\\/div>
                          \\{\\(\\) => \\{
                            const flow = flows\\.find\\(f => \\(f\\.lead\\?\\._id \\|\\| f\\.lead\\) === lead\\._id\\);
                            const quot = quotations\\.find\\(q => \\(q\\.lead\\?\\._id \\|\\| q\\.lead\\) === lead\\._id\\);
                            const value = flow \\? flow\\.totalCurrentValue : \\(quot \\? quot\\.totalValue : null\\);
                            if \\(value !== null\\) \\{
                              return \\(
                                <div className="text-\\[10px\\] text-blue-800 font-extrabold bg-blue-50 border border-blue-200 px-2 py-0\\.5 rounded inline-block">
                                  Value: Rs\\. \\{value\\.toLocaleString\\(\\)\\}
                                <\\/div>
                              \\);
                            \\}
                            return null;
                          \\}\\}\\(\\)\\}
                        <\\/div>
                      <\\/td>`;

// I will use split and join instead for better precision
let lines = fileContent.split('\n');
let newLines = [];
let insideProjectUnitsCell = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<td className="p-4">') && lines[i+1] && lines[i+1].includes('className="font-semibold text-gray-700"')) {
    newLines.push(lines[i]);
    newLines.push(lines[i+1]);
    newLines.push(lines[i+2]);
    newLines.push(lines[i+3]);
    newLines.push('                      </td>');
    newLines.push('                      <td className="p-4">');
    i += 3; // skip to end of that div
  } else {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('client/src/pages/CRDFlow.jsx', newLines.join('\n'));
console.log('CRDFlow.jsx updated with separate columns.');
