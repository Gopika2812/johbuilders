const fs = require('fs');
const file = 'client/src/pages/KPIInsights.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add filteredSourceStats before getSourcesData
const filteredSourceCode = `
  const filteredSourceStats = Object.entries(stats.sourceStats || {}).reduce((acc, [src, data]) => {
    if (selectedSource && src.toLowerCase() !== selectedSource.toLowerCase()) return acc;
    acc[src] = data;
    return acc;
  }, {});

  const getSourcesData = () => {`;
  
content = content.replace(/\s*const getSourcesData = \(\) => \{/, filteredSourceCode);

// 2. Update getSourcesData to use filteredSourceStats
content = content.replace(/Object\.keys\(stats\.sourceStats \|\| \{\}\)\.forEach\(src => \{/g, 'Object.keys(filteredSourceStats).forEach(src => {');
content = content.replace(/const s = stats\.sourceStats\[src\];/g, 'const s = filteredSourceStats[src];');

// 3. Update the DAILY LEAD COST ANALYSIS REPORT section to use filteredSourceStats
content = content.replace(/Object\.keys\(stats\?\.sourceStats \|\| \{\}\)\.length/g, 'Object.keys(filteredSourceStats).length');
content = content.replace(/Object\.entries\(stats\.sourceStats\)/g, 'Object.entries(filteredSourceStats)');

fs.writeFileSync(file, content);
console.log("Successfully applied Lead Source filter to the report sections.");
