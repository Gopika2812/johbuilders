const fs = require('fs');

const files = [
  'client/src/pages/ExportReports.jsx',
  'client/src/pages/CRDReports.jsx',
  'client/src/pages/KPIInsights.jsx'
];

const functionDefs = `const getExcelStyles = (titleBg, monthBg, headerBg, execBg) => {
  return \`
    <style>
      table { border-collapse: collapse; }
      td, th { border: 1px solid #000000; padding: 6px 8px; font-family: 'Segoe UI', Calibri, sans-serif; font-size: 10pt; color: #000000; }
      th, .table-headers th { font-weight: bold; background-color: \${headerBg || '#FCE4D6'}; color: #000000; border: 1px solid #000000; text-align: center; }
      .title-row { font-size: 11pt; font-weight: bold; color: #000000; background-color: \${titleBg || '#FCE4D6'}; text-align: center; }
      .month-header { height: 22px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: \${monthBg || '#DDEBF7'}; border: 1px solid #000000; text-align: center; text-transform: uppercase; }
      .exec-banner { background-color: \${execBg || '#DDEBF7'}; font-weight: bold; text-align: left; }
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
        <td colspan="\${safeCols}" class="title-row" style="border: 1px solid #000000; vertical-align:middle; text-align:center; font-size: 14pt; font-weight: bold; color: #000000; height: 80px;">
          <img src="\${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" />
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
    
    // First, update definitions
    const defRegex = /const getExcelStyles = [\s\S]*?(?=\/\/\s*🔵 REUSABLE)/;
    if (defRegex.test(content)) {
      content = content.replace(defRegex, functionDefs + '\n\n');
    }

    // Now map all the calls to getExcelStyles!
    // Enquiry Sheet
    content = content.replace(/getExcelStyles\("#16a34a",\s*"#dcfce7",\s*"#166534",\s*"#bbf7d0"\)/g, 'getExcelStyles("#FCE4D6", "#DDEBF7", "#FCE4D6", "#DDEBF7")');
    // Site Visit Sheet
    content = content.replace(/getExcelStyles\("#2563eb",\s*"#dbeafe",\s*"#1e40af",\s*"#bfdbfe"\)/g, 'getExcelStyles("#FF99CC", "#F8CBAD", "#FF99CC", "#00B0F0")');
    // Hot List Sheet
    content = content.replace(/getExcelStyles\("#ea580c",\s*"#ffedd5",\s*"#9a3412",\s*"#fed7aa"\)/g, 'getExcelStyles("#9BC2E6", "#F8CBAD", "#E6B8B7", "#9BC2E6")');
    // Booking Sheet
    content = content.replace(/getExcelStyles\("#15803d",\s*"#dcfce7",\s*"#166534",\s*"#bbf7d0"\)/g, 'getExcelStyles("#92D050", "#C6E0B4", "#92D050", "#C6E0B4")');
    // Marketing Performance / Overall / Others (Blue/Green combo)
    content = content.replace(/getExcelStyles\("#1d4ed8",\s*"#dbeafe",\s*"#1e40af",\s*"#bfdbfe"\)/g, 'getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")');
    content = content.replace(/getExcelStyles\("#0d9488",\s*"#ccfbf1",\s*"#115e59",\s*"#99f6e4"\)/g, 'getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")');
    content = content.replace(/getExcelStyles\("#7c3aed",\s*"#f3e8ff",\s*"#5b21b6",\s*"#e9d5ff"\)/g, 'getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")');

    fs.writeFileSync(file, content);
    console.log('Patched colors in ' + file);
  }
});
