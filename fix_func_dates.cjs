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

  // Replace fromDate block
  const fromDateRegex = /const \[fromDate, setFromDate\] = useState\(\(\) => \{[\s\S]*?return `\$\{year\}-\$\{month\}-01`;\s*\}\);/g;
  content = content.replace(fromDateRegex, `const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);`);

  // Replace toDate block
  const toDateRegex = /const \[toDate, setToDate\] = useState\(\(\) => \{[\s\S]*?return `\$\{year\}-\$\{month\}-\$\{day\}`;\s*\}\);/g;
  content = content.replace(toDateRegex, `const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);`);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log("Updated function dates in", file);
  }
});

console.log(`Updated function dates in ${changedCount} files.`);
