const fs = require('fs');

const filesToPatch = [
  'client/src/pages/CRDReports.jsx',
  'client/src/pages/ExportReports.jsx',
  'client/src/pages/KPIInsights.jsx'
];

filesToPatch.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    const replacement = `const getExcelHeader = (titleText, monthTitle, totalColumns, themeColor, logoPath) => {
  const safeCols = Math.max(4, totalColumns);
  const greenTheme = "#0e623a";
  return \\\`
    <tr style="height: 60px;">
      <td colspan="\\\${safeCols}" class="title-row" style="border:none; vertical-align:middle; text-align:center; font-size: 22pt; font-weight: bold; color: \\\${greenTheme}; height: 60px;">
        \\\${titleText}
      </td>
    </tr>
    \\\${monthTitle ? \\\`
    <tr>
      <td colspan="\\\${safeCols}" class="month-header" style="height: 35px; vertical-align: middle;">
        \\\${monthTitle}
      </td>
    </tr>\\\` : ''}
    <tr><td colspan="\\\${safeCols}" style="border:none; height: 15px;"></td></tr>
  \\\`;
};`;

    content = content.replace(/const getExcelHeader = \(titleText, monthTitle, totalColumns, themeColor, logoPath\) => {[\s\S]*?<tr><td colspan="\${safeCols}" style="border:none; height: 15px;"><\/td><\/tr>\s*`;\s*};/m, replacement);
    
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
});
