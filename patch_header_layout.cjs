const fs = require('fs');

const files = [
  'client/src/pages/ExportReports.jsx',
  'client/src/pages/CRDReports.jsx',
  'client/src/pages/KPIInsights.jsx'
];

const newHeaderDef = `const getExcelHeader = (titleText, monthTitle, totalColumns, themeColor, logoPath) => {
    const safeCols = Math.max(4, totalColumns);
    const logoCols = 2;
    const textCols = safeCols - logoCols;
    return \`
      <tr style="height: 80px;">
        <td colspan="\${logoCols}" class="title-row" style="border: 1px solid #000000; border-right: none; vertical-align:middle; text-align:center; height: 80px;">
          <img src="\${logoPath}" width="200" height="70" style="vertical-align: middle;" />
        </td>
        <td colspan="\${textCols}" class="title-row" style="border: 1px solid #000000; border-left: none; vertical-align:middle; text-align:left; padding-left: 20px; font-size: 14pt; font-weight: bold; color: #000000; height: 80px;">
          \${titleText}
        </td>
      </tr>
      \${monthTitle ? \`
      <tr>
        <td colspan="\${safeCols}" class="month-header" style="height: 22px; vertical-align: middle; font-size: 10pt; font-weight: bold; border: 1px solid #000000; text-align: center; text-transform: uppercase;">
          \${monthTitle}
        </td>
      </tr>\` : ''}
      <tr><td colspan="\${safeCols}" style="border:none; height: 15px;"></td></tr>
    \`;
  };`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace just getExcelHeader
    const headerRegex = /const getExcelHeader = [\s\S]*?(?=;\s*\n*(?:\/\/\s*🔵 REUSABLE|export|const|\n*$))/m;
    
    // The previous regex might capture too much. Let's do a more precise replacement.
    // getExcelHeader starts at `const getExcelHeader = ` and ends at `  };` before the next thing.
    // It's safer to split on the known start and end
    const parts = content.split('const getExcelHeader = (titleText, monthTitle, totalColumns, themeColor, logoPath) => {');
    if (parts.length > 1) {
      const rest = parts[1];
      const endIdx = rest.indexOf('};');
      if (endIdx !== -1) {
         const newContent = parts[0] + newHeaderDef + rest.substring(endIdx + 2);
         fs.writeFileSync(file, newContent);
         console.log('Patched layout in ' + file);
      }
    }
  }
});
