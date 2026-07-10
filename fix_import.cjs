const fs = require('fs');

let projectDetail = fs.readFileSync('client/src/pages/ProjectDetail.jsx', 'utf8');

// Check if FileSpreadsheet is already imported
if (!projectDetail.includes('FileSpreadsheet')) {
  // It should be imported from lucide-react. Let's find the lucide-react import
  projectDetail = projectDetail.replace(
    /import \{\s*Building,/,
    `import {\n  Building,\n  FileSpreadsheet,`
  );

  fs.writeFileSync('client/src/pages/ProjectDetail.jsx', projectDetail);
  console.log('ProjectDetail.jsx updated with FileSpreadsheet import.');
} else {
  // Maybe it's imported somewhere else or I need to insert it differently
  // Since it said "FileSpreadsheet is not defined", it's probably NOT imported.
  // Oh wait, maybe my code block that uses it is there, but the import is missing.
  
  // Let's do a strict check for the import
  const importMatch = projectDetail.match(/import \{([^}]+)\} from 'lucide-react';/);
  if (importMatch && !importMatch[1].includes('FileSpreadsheet')) {
    projectDetail = projectDetail.replace(
      /import \{([^}]+)\} from 'lucide-react';/,
      `import {$1,\n  FileSpreadsheet\n} from 'lucide-react';`
    );
    fs.writeFileSync('client/src/pages/ProjectDetail.jsx', projectDetail);
    console.log('ProjectDetail.jsx updated with FileSpreadsheet import.');
  } else {
    console.log('FileSpreadsheet might already be imported or lucide-react import not found.');
  }
}
