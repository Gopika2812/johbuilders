const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/pages/ExtraWorks.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// The block to remove starts around line 1232:
// {(isAdmin || canEditTab('crd')) && work.status === 'Pending' && (
//   <button
//     onClick={async (e) => {
//       e.stopPropagation();
//       setSubmitting(work._id);
//       try {
//         await handleSendToPED(flow._id, work.stageIdx, work._id);
//       } finally {
//         setSubmitting(null);
//       }
//     }}
//     disabled={submitting === work._id}
//     className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded text-[10px] font-bold shadow-sm whitespace-nowrap"
//   >
//     Send to PED
//   </button>
// )}

const lines = content.split('\n');
const newLines = [];
let skipMode = false;
let openBrackets = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (!skipMode) {
    if (line.includes("{(isAdmin || canEditTab('crd')) && work.status === 'Pending' && (") && lines[i+1].includes("<button") && lines[i+7].includes("handleSendToPED")) {
      // Start skipping
      skipMode = true;
      openBrackets = 1;
      continue;
    }
    newLines.push(line);
  } else {
    // If in skip mode, we just count brackets to find the end of the block.
    // However, since it's a fixed JSX block ending with )} we can just look for that.
    if (line.includes(")}")) {
      skipMode = false;
    }
  }
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log('Patched successfully!');
