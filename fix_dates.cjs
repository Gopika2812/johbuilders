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
const todayStr = "new Date().toISOString().split('T')[0]";

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Regex to match date-related states
  const regex = /const \[(fromDate|toDate|startDate|endDate|date|selectedDate|filterDate), (setFromDate|setToDate|setStartDate|setEndDate|setDate|setSelectedDate|setFilterDate)\] = useState\(['"]['"]\);/g;
  
  content = content.replace(regex, (match, p1, p2) => {
    return `const [${p1}, ${p2}] = useState(${todayStr});`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log("Updated", file);
  }
});

console.log(`Updated date defaults in ${changedCount} files.`);
