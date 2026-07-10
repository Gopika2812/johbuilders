const fs = require('fs');
const files = [
  'client/src/pages/ExportReports.jsx',
  'client/src/pages/CRDReports.jsx',
  'client/src/pages/KPIInsights.jsx'
];

const newStyles = `const getExcelStyles = (themeColor, bannerBg, bannerText, bannerBorder) => {
  return \`
    <style>
      table { border-collapse: collapse; }
      td, th { border: 1px solid #000000; padding: 6px 8px; font-family: 'Segoe UI', Calibri, sans-serif; font-size: 10pt; color: #000000; }
      th, .table-headers th { font-weight: bold; background-color: #FCE4D6; color: #000000; border: 1px solid #000000; text-align: center; }
      .title-row { font-size: 11pt; font-weight: bold; color: #000000; background-color: #FCE4D6; text-align: center; }
      .month-header { height: 22px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: #DDEBF7; border: 1px solid #000000; text-align: center; text-transform: uppercase; }
      .exec-banner { background-color: #DDEBF7; font-weight: bold; text-align: left; }
      .bg-header-blue { background-color: #5B9BD5 !important; color: #000000 !important; font-weight: bold; text-align: center; }
      .bg-header-green { background-color: #C6E0B4 !important; color: #000000 !important; font-weight: bold; text-align: center; }
      .bg-gray-row { background-color: #D9D9D9 !important; color: #000000 !important; }
      .bg-orange-pct { background-color: #F8CBAD !important; color: #000000 !important; font-weight: bold; text-align: center; }
      
      .font-bold { font-weight: bold; color: #000000; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
    </style>
  \`;
};

const getExcelHeader = (titleText, monthTitle, totalColumns, themeColor, logoPath) => {
    const safeCols = Math.max(4, totalColumns);
    return \`
      <tr style="height: 80px;">
        <td colspan="\${safeCols}" class="title-row" style="border: 1px solid #000000; vertical-align:middle; text-align:center; font-size: 14pt; font-weight: bold; color: #000000; height: 80px; background-color: #FCE4D6;">
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

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const regex = /const getExcelStyles = [\s\S]*?(?=\/\/\s*🔵 REUSABLE)/;
    if (regex.test(content)) {
      content = content.replace(regex, newStyles + '\n\n');
      fs.writeFileSync(file, content);
      console.log('Patched ' + file);
    } else {
      console.log('Regex did not match in ' + file);
    }
  }
});
