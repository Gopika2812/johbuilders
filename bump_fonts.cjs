const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.jsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'client', 'src'));
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace arbitrary text sizes text-[Xpx] with text-[X+1px]
  content = content.replace(/text-\[(\d+)px\]/g, (match, p1) => {
    const size = parseInt(p1);
    return `text-[${size + 1}px]`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});

console.log(`Updated arbitrary font sizes in ${changedCount} files.`);
