const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'client/src/pages/KPIInsights.jsx',
  'client/src/pages/ExportReports.jsx',
  'client/src/pages/CRDReports.jsx'
];

const newGetExcelHeader = `const getExcelHeader = (titleText, monthTitle, totalColumns, themeColor, logoPath) => {
    const safeCols = Math.max(4, totalColumns);
    return \`
      <tr style="height: 80px;">
        <td colspan="\${safeCols}" class="title-row" style="border: 1px solid #000000; vertical-align:middle; text-align:center; font-size: 14pt; font-weight: bold; color: #000000; height: 80px; background-color: #5B9BD5;">
          <img src="\${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" />
          \${titleText}
        </td>
      </tr>
      \${monthTitle ? \`
      <tr>
        <td colspan="\${safeCols}" class="month-header" style="height: 22px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: #C6E0B4; border: 1px solid #000000; text-align: center; text-transform: uppercase;">
          \${monthTitle}
        </td>
      </tr>\` : ''}
      <tr><td colspan="\${safeCols}" style="border:none; height: 15px;"></td></tr>
    \`;
  };`;

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find getExcelHeader definition and replace it
    // Use regex to match from const getExcelHeader = ... to its closing brace
    const regex = /const getExcelHeader = \(titleText, monthTitle, totalColumns, themeColor, logoPath\) => {[\s\S]*?<tr><td colspan="\$\{safeCols\}" style="border:none; height: 15px;"><\/td><\/tr>\s*`;\s*};/m;
    
    if (regex.test(content)) {
      content = content.replace(regex, newGetExcelHeader);
      fs.writeFileSync(filePath, content);
      console.log(`Updated getExcelHeader in ${filePath}`);
    } else {
      console.log(`Could not find getExcelHeader in ${filePath}`);
    }
  }
});
