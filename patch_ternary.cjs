const fs = require('fs');
const file = 'client/src/pages/LeadsDirectory.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace ternary block 1
content = content.replace(
  /\{followTargetStatus === 'Hot List'\s*\?\s*'Choose to schedule another follow-up or advance this lead to Hot List stage'\s*:\s*\['Follow-Up', 'Site Visit', 'Future Follow-up'\]\.includes\(followTargetStatus\)\s*\?\s*'Specify followup schedules or mark the stage as completed'\s*:\s*`Enter remarks or notes to record this stage transition`\}/g,
  "{['Follow-Up', 'Site Visit', 'Future Follow-up'].includes(followTargetStatus) ? 'Specify followup schedules or mark the stage as completed' : `Enter remarks or notes to record this stage transition`}"
);

// Replace ternary block 2
content = content.replace(
  /\{followTargetStatus === 'Hot List' \? 'Move to Hot List' : 'Close Lead \(Lost\)'\}/g,
  "{'Close Lead (Lost)'}"
);

// Replace ternary block 3
content = content.replace(
  /\)\s*:\s*followTargetStatus === 'Hot List'\s*\?\s*\(\s*<div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-100">\s*<strong>Note:<\/strong> Advancing this lead will move it to the <span className="font-bold">Hot List<\/span> stage\.\s*<\/div>\s*\)\s*:\s*\(/g,
  ") : ("
);

// Replace ternary block 4
content = content.replace(
  /\{followTargetStatus === 'Hot List'\s*\?\s*'Transition Remarks \(Optional\)'\s*:\s*!hasFollowUpOptions\s*\?\s*`Remarks \/ Notes for transitioning to \$\{followTargetStatus\} \(Optional\)`\s*:\s*'Closing Remarks'\}/g,
  "{!hasFollowUpOptions ? `Remarks / Notes for transitioning to ${followTargetStatus} (Optional)` : 'Closing Remarks'}"
);

// Replace ternary block 5
content = content.replace(
  /placeholder=\{\s*followTargetStatus === 'Hot List'\s*\?\s*"Add any notes about this qualification\.\.\."\s*:\s*!hasFollowUpOptions\s*\?\s*`Provide details regarding the transition to \$\{followTargetStatus\}\.\.\.`\s*:\s*"Explain reasons for closing \/ completion details\.\.\."\s*\}/g,
  "placeholder={!hasFollowUpOptions ? `Provide details regarding the transition to ${followTargetStatus}...` : \"Explain reasons for closing / completion details...\"}"
);

// Replace ternary block 6
content = content.replace(
  /\? \(followTargetStatus === 'Hot List' \? 'bg-\[#0e623a\] text-white shadow' : 'bg-red-600 text-white shadow'\)/g,
  "? 'bg-red-600 text-white shadow'"
);

// Replace ternary block 7 (Header)
content = content.replace(
  /\{followTargetStatus === 'Hot List'\s*\?\s*'Site Visit Follow-up Options'\s*:\s*\['Follow-Up', 'Site Visit', 'Future Follow-up'\]\.includes\(followTargetStatus\)\s*\?\s*'Contacted \/ Follow-up Actions'\s*:\s*`Transition to \$\{followTargetStatus\}`\}/g,
  "{['Follow-Up', 'Site Visit', 'Future Follow-up'].includes(followTargetStatus) ? 'Contacted / Follow-up Actions' : `Transition to ${followTargetStatus}`}"
);

fs.writeFileSync(file, content);
console.log("Successfully removed remaining Hot List ternary operations.");
