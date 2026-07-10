const fs = require('fs');
const file = 'client/src/pages/LeadsDirectory.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove from STAGE_COLORS & STAGE_STYLES
content = content.replace(/,\s*'Hot List':\s*\{[^}]+\}/g, '');
content = content.replace(/,\s*'Negotiation':\s*\{[^}]+\}/g, '');

content = content.replace(/'Hot List':\s*[^,]+,\s*/g, '');
content = content.replace(/'Negotiation':\s*[^,]+,\s*/g, '');

// 2. Remove from LEAD_STATUSES
content = content.replace(/,\s*'Hot List'/g, '');
content = content.replace(/,\s*'Negotiation'/g, '');

// 3. Remove from statuses array
// Note: the above might have caught them, but if they are alone on a line:
content = content.replace(/\s*'Hot List',?\s*/g, (match) => match.includes(',') ? '\n  ' : '\n');
content = content.replace(/\s*'Negotiation',?\s*/g, (match) => match.includes(',') ? '\n  ' : '\n');

// 4. Update transitions
// Replace: activeTab === 'Site Visit' ? 'Hot List' : \n activeTab === 'Hot List' ? 'Negotiation' : \n activeTab === 'Negotiation' ? 'Booking' :
content = content.replace(/activeTab === 'Site Visit' \? 'Hot List' :\s*activeTab === 'Hot List' \? 'Negotiation' :\s*activeTab === 'Negotiation' \? 'Booking' :/g, 
  "activeTab === 'Site Visit' ? 'Booking' :");

content = content.replace(/const hasFollowUp = \['Follow-Up', 'Site Visit', 'Hot List', 'Negotiation', 'Future Follow-up'\]\.includes\(targetStatus\);/g,
  "const hasFollowUp = ['Follow-Up', 'Site Visit', 'Future Follow-up'].includes(targetStatus);");

content = content.replace(/const hasFollowUpOptions = \['Contacted', 'Follow-Up', 'Site Visit', 'Qualified', 'Negotiation'\]\.includes\(followTargetStatus\);/g,
  "const hasFollowUpOptions = ['Contacted', 'Follow-Up', 'Site Visit', 'Qualified'].includes(followTargetStatus);");

// 5. Remove logic blocks referencing Hot List
content = content.replace(/const isAdvancingToHotList = followTargetStatus === 'Hot List';/g, '');

// Replace: status: isAdvancingToHotList ? 'Hot List' : 'Lost',
content = content.replace(/status: isAdvancingToHotList \? 'Hot List' : 'Lost',/g, "status: 'Lost',");

// Update handleFollowSubmit logic:
content = content.replace(/setSuccessMsg\('Lead advanced to Hot List stage successfully!'\);/g, '');

// Remove else if (activeTab === 'Hot List')
content = content.replace(/\} else if \(activeTab === 'Hot List'\) \{\s*matchesTab = \(lead\.status === 'Hot List' \|\| \(lead\.history && lead\.history\.some\(h => h\.status === 'Hot List'\)\)\) && !lead\.isClosed;\s*/g, '');

content = content.replace(/\} else if \(st === 'Hot List'\) \{\s*count = leads\.filter\(l => \(l\.status === 'Hot List' \|\| \(l\.history && l\.history\.some\(h => h\.status === 'Hot List'\)\)\) && !l\.isClosed\)\.length;\s*/g, '');

content = content.replace(/\{st === 'Qualified' \? 'Hot List' : st\}/g, '{st}');

content = content.replace(/\{activeTab === 'Hot List' && lead\.status !== 'Hot List' && \(\s*<div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-teal-100 rounded-full shadow-sm text-teal-600">\s*<CheckCircle2 className="w-3 h-3" \/>\s*<\/div>\s*\)\}/g, '');


fs.writeFileSync(file, content);
console.log("Successfully removed Hot List and Negotiation from LeadsDirectory.jsx");
