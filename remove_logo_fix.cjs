const fs = require('fs');

const filesToPatch = [
  'client/src/pages/CRDReports.jsx',
  'client/src/pages/ExportReports.jsx',
  'client/src/pages/KPIInsights.jsx'
];

filesToPatch.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // We just replace the \` with `
    content = content.replace(/return \\`/g, 'return `');
    
    // Also we need to fix the template variables \$ -> $
    content = content.replace(/\\(\$)/g, '$1');
    
    // Wait, let's just do a clean replacement again
    const replacement = 'const getExcelHeader = (titleText, monthTitle, totalColumns, themeColor, logoPath) => {\n' +
'  const safeCols = Math.max(4, totalColumns);\n' +
'  const greenTheme = "#0e623a";\n' +
'  return `\n' +
'    <tr style="height: 60px;">\n' +
'      <td colspan="${safeCols}" class="title-row" style="border:none; vertical-align:middle; text-align:center; font-size: 22pt; font-weight: bold; color: ${greenTheme}; height: 60px;">\n' +
'        ${titleText}\n' +
'      </td>\n' +
'    </tr>\n' +
'    ${monthTitle ? `\n' +
'    <tr>\n' +
'      <td colspan="${safeCols}" class="month-header" style="height: 35px; vertical-align: middle;">\n' +
'        ${monthTitle}\n' +
'      </td>\n' +
'    </tr>` : \'\'}\n' +
'    <tr><td colspan="${safeCols}" style="border:none; height: 15px;"></td></tr>\n' +
'  `;\n' +
'};';

    content = content.replace(/const getExcelHeader = \(titleText, monthTitle, totalColumns, themeColor, logoPath\) => {[\s\S]*?<tr><td colspan="\$\{safeCols\}" style="border:none; height: 15px;"><\/td><\/tr>\s*`;\s*};/m, replacement);
    
    // Wait, my previous regex might not match anymore because it has `\${safeCols}` in it now (with backslash).
    // Let's just match from `const getExcelHeader` until the first `};`
    content = content.replace(/const getExcelHeader = \(titleText, monthTitle, totalColumns, themeColor, logoPath\) => {[\s\S]*?height: 15px;">.*?<\/tr>\r?\n\s*`;\r?\n};/m, replacement);
    
    // Just in case, let's also remove any stray backslashes before backticks and dollars in getExcelHeader:
    // But replacing the whole thing is safer.
    
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
});
