const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles('client/src');
let anyMissing = false;

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lucideMatch = content.match(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"]/);
  const importedIcons = new Set(lucideMatch ? lucideMatch[1].split(',').map(s => s.trim()).filter(Boolean) : []);
  
  // Also collect other imports
  const otherImportMatches = Array.from(content.matchAll(/import\s+([A-Za-z0-9_]+)\s+from/g)).map(m => m[1]);
  const namedImportMatches = Array.from(content.matchAll(/import\s*\{([\s\S]*?)\}\s*from/g));
  const otherNamedImports = new Set();
  namedImportMatches.forEach(m => {
    m[1].split(',').forEach(s => otherNamedImports.add(s.trim()));
  });

  const jsxTags = new Set(Array.from(content.matchAll(/<([A-Z][A-Za-z0-9]*)/g)).map(m => m[1]));
  const knownGlobals = new Set(['React', 'Fragment', 'Icon', 'Component', 'PageGuard', 'Layout', 'ErrorBoundary', 'Canvas', 'Environment', 'PerspectiveCamera', 'SoftShadows']);

  const missing = [];
  for (const tag of jsxTags) {
    if (!importedIcons.has(tag) && 
        !otherNamedImports.has(tag) && 
        !otherImportMatches.includes(tag) && 
        !knownGlobals.has(tag) &&
        !content.includes(`const ${tag}`) &&
        !content.includes(`function ${tag}`) &&
        !content.includes(`class ${tag}`)) {
      missing.push(tag);
    }
  }

  if (missing.length > 0) {
    console.log(`[!] ${filePath} has missing tags:`, missing);
    anyMissing = true;
  }
});

if (!anyMissing) {
  console.log('All JSX tags and Lucide icons across ALL files are properly imported and defined!');
}
