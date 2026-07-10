const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'client/src/pages/KPIInsights.jsx',
  'client/src/pages/ExportReports.jsx',
  'client/src/pages/CRDReports.jsx'
];

const newGetExcelStyles = `const getExcelStyles = (themeColor, bannerBg, bannerText, bannerBorder) => {
    return \`
      <style>
        table { border-collapse: collapse; }
        td, th { border: 1px solid #000000; padding: 6px 8px; font-family: 'Segoe UI', Calibri, sans-serif; font-size: 10pt; color: #000000; }
        th, .table-headers th { font-weight: bold; background-color: #FF99CC; color: #000000; border: 1px solid #000000; text-align: center; }
        .title-row { font-size: 14pt; font-weight: bold; color: #C00000; background-color: #F8CBAD; text-align: center; }
        
        .bg-header-blue { background-color: #F8CBAD !important; color: #C00000 !important; font-weight: bold; text-align: center; }
        .bg-header-green { background-color: #DDEBF7 !important; color: #000000 !important; font-weight: bold; text-align: center; }
        .bg-gray-row { background-color: #D9D9D9 !important; color: #000000 !important; }
        .bg-orange-pct { background-color: #F8CBAD !important; color: #000000 !important; font-weight: bold; text-align: center; }
        
        .font-bold { font-weight: bold; color: #000000; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .exec-banner, .group-banner { font-weight: bold; background-color: #00B0F0; color: #000000; border: 1px solid #000000; text-align: left; text-transform: uppercase; }
        .subtotal-row { font-weight: bold; background-color: #DDEBF7; }
        .total-row { font-weight: bold; background-color: #F8CBAD; color: #C00000; }
        .even-row td { background-color: #f9fafb; }
      </style>
    \`;
  };`;

const newGetExcelHeader = `const getExcelHeader = (titleText, monthTitle, totalColumns, themeColor, logoPath) => {
    const safeCols = Math.max(4, totalColumns);
    return \`
      <tr style="height: 80px;">
        <td colspan="\${safeCols}" class="title-row" style="border: 1px solid #000000; vertical-align:middle; text-align:center; font-size: 14pt; font-weight: bold; color: #C00000; height: 80px; background-color: #F8CBAD;">
          <img src="\${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" />
          \${titleText}
        </td>
      </tr>
      \${monthTitle ? \`
      <tr>
        <td colspan="\${safeCols}" class="month-header" style="height: 22px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: #DDEBF7; border: 1px solid #000000; text-align: center; text-transform: uppercase;">
          \${monthTitle}
        </td>
      </tr>\` : ''}
      <tr><td colspan="\${safeCols}" style="border:none; height: 15px;"></td></tr>
    \`;
  };`;

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace getExcelStyles
    const styleRegex = /const getExcelStyles = \([\s\S]*?<\/style>\\n\s*`;\s*};/m;
    if (styleRegex.test(content)) {
      content = content.replace(styleRegex, newGetExcelStyles);
    }
    
    // Replace getExcelHeader
    const headerRegex = /const getExcelHeader = \([\s\S]*?<tr><td colspan="\$\{safeCols\}" style="border:none; height: 15px;"><\/td><\/tr>\\n\s*`;\s*};/m;
    if (headerRegex.test(content)) {
      content = content.replace(headerRegex, newGetExcelHeader);
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated styles and headers in ${filePath}`);
  }
});
