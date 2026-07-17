const fs = require('fs');
const path = require('path');
const dirs = ['e:/builders/client/src', 'e:/builders/server'];
const replacements = [
  { from: /'Super Admin'/g, to: "'Superadmin'" },
  { from: /"Super Admin"/g, to: '"Superadmin"' },
  { from: /'Admin'/g, to: "'Superadmin'" },
  { from: /"Admin"/g, to: '"Superadmin"' },
  { from: /'Manager'/g, to: "'Crd team'" },
  { from: /"Manager"/g, to: '"Crd team"' },
  { from: /'Sales Executive'/g, to: "'sales person'" },
  { from: /"Sales Executive"/g, to: '"sales person"' },
  { from: /'Site Engineer'/g, to: "'ped team'" },
  { from: /"Site Engineer"/g, to: '"ped team"' },
  { from: /\bSuper Admin\b/g, to: 'Superadmin' },
  { from: /\bAdmin\b/g, to: 'Superadmin' },
  { from: /\bManager\b/g, to: 'Crd team' },
  { from: /\bSales Executive\b/g, to: 'sales person' },
  { from: /\bSite Engineer\b/g, to: 'ped team' }
];

function processDir(dir) {
  for (const file of fs.readdirSync(dir)) {
    if (file === 'node_modules' || file.startsWith('.')) continue;
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) processDir(p);
    else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      let content = fs.readFileSync(p, 'utf8');
      let newContent = content;
      for (const r of replacements) newContent = newContent.replace(r.from, r.to);
      if (content !== newContent) {
        fs.writeFileSync(p, newContent);
        console.log('Updated ' + p);
      }
    }
  }
}
dirs.forEach(processDir);
