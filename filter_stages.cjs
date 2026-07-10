const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

const target = `                    const arrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                    const arrearsText = arrears > 0 ? \` + Arrears: Rs. \${arrears.toLocaleString()}\` : '';`;

const replacement = `                    const arrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                    if (thisStagePending <= 0 && arrears <= 0) return null;
                    const arrearsText = arrears > 0 ? \` + Arrears: Rs. \${arrears.toLocaleString()}\` : '';`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('client/src/pages/CRDFlow.jsx', content);
  console.log('Successfully filtered out paid stages!');
} else {
  console.log('Failed to find target string.');
}
