const fs = require('fs');
const file = 'e:/builders/client/src/pages/CRDFlow.jsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// 1. Fix the 3-dots action menu
const actionMenuStart = lines.findIndex(l => l.includes('onClick={(e) => {') && lines[l+1] === '                                e.stopPropagation();' && lines[l+2] === '                                if (actionMenuId === lead._id) {');
// Wait, we need to match the specific action menu code block precisely.
