const fs = require('fs');

const file = 'client/src/pages/ExportReports.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Split the SALES PARAMETER REPORT title row
content = content.replace(
  /<td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: center; vertical-align: middle;">\s*<img src="\${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" \/>\s*SALES PARAMETER REPORT\s*<\/td>/g,
  `<td colspan="2" class="bg-header-blue" style="height: 80px; text-align: center; vertical-align: middle;">
      <img src="\${logoPath}" width="200" height="70" style="vertical-align: middle;" />
   </td>
   <td colspan="8" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: left; padding-left: 20px; vertical-align: middle;">
      SALES PARAMETER REPORT
   </td>`
);

// 2. Split the JB MARKETING PARAMETER REPORT title row
content = content.replace(
  /<td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: center; vertical-align: middle;">\s*<img src="\${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" \/>\s*JB MARKETING PARAMETER REPORT\s*<\/td>/g,
  `<td colspan="2" class="bg-header-blue" style="height: 80px; text-align: center; vertical-align: middle;">
      <img src="\${logoPath}" width="200" height="70" style="vertical-align: middle;" />
   </td>
   <td colspan="8" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: left; padding-left: 20px; vertical-align: middle;">
      JB MARKETING PARAMETER REPORT
   </td>`
);

// 3. Update convertHtmlToSheet inside handleDownloadAll to apply summary classes
const newConvertHtmlToSheet = `
        const convertHtmlToSheet = async (exportFunc, sheetName) => {
          window.__capturedHtml = null;
          await exportFunc(); // It triggers handlePreview
          const htmlString = window.__capturedHtml;
          if (!htmlString) return;
          const div = document.createElement('div');
          div.innerHTML = htmlString;
          const table = div.querySelector('table');
          if (table) {
            // Parse colors from injected <style> block
            const styleBlock = div.querySelector('style');
            let titleBg = 'FCE4D6';
            let monthBg = 'DDEBF7';
            let headerBg = 'FCE4D6';
            let execBg = 'DDEBF7';
            
            if (styleBlock) {
               const css = styleBlock.innerHTML;
               const mTitle = css.match(/\\.title-row\\s*{[^}]*background-color:\\s*#([0-9a-fA-F]+)/);
               if (mTitle) titleBg = mTitle[1];
               const mMonth = css.match(/\\.month-header\\s*{[^}]*background-color:\\s*#([0-9a-fA-F]+)/);
               if (mMonth) monthBg = mMonth[1];
               const mHeader = css.match(/\\.table-headers\\s*th\\s*{[^}]*background-color:\\s*#([0-9a-fA-F]+)/);
               if (mHeader) headerBg = mHeader[1];
               const mExec = css.match(/\\.exec-banner\\s*{[^}]*background-color:\\s*#([0-9a-fA-F]+)/);
               if (mExec) execBg = mExec[1];
               if (!mExec) {
                  const mGroup = css.match(/\\.group-banner\\s*{[^}]*background-color:\\s*#([0-9a-fA-F]+)/);
                  if (mGroup) execBg = mGroup[1];
               }
            }

            const ws = XLSX.utils.table_to_sheet(table, { raw: true });
            
            // Apply styles to all cells
            const borderStyle = { style: 'thin', color: { rgb: '000000' } };
            const border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
            
            for (let cellRef in ws) {
              if (cellRef[0] === '!') continue;
              const cell = ws[cellRef];
              const coord = XLSX.utils.decode_cell(cellRef);
              const rowNum = coord.r;
              
              cell.s = {
                border: border,
                font: { name: 'Calibri', sz: 10, color: { rgb: '000000' } },
                alignment: { vertical: 'center', horizontal: 'center', wrapText: true }
              };
  
              const tr = table.rows[rowNum];
              if (!tr) continue;
              
              // Get classes for the cell or fallback to row
              const cellClasses = table.rows[rowNum].cells[coord.c]?.className || '';
              const rowClasses = tr.className || '';
              const allClass = cellClasses + ' ' + rowClasses;
  
              if (allClass.includes('title-row')) {
                cell.s.fill = { fgColor: { rgb: titleBg } };
                cell.s.font.bold = true;
                cell.s.font.sz = 14;
                if (coord.c > 1) cell.s.alignment.horizontal = 'left';
              }
              else if (allClass.includes('month-header')) {
                cell.s.fill = { fgColor: { rgb: monthBg } };
                cell.s.font.bold = true;
              }
              else if (allClass.includes('table-headers')) {
                cell.s.fill = { fgColor: { rgb: headerBg } };
                cell.s.font.bold = true;
              }
              else if (allClass.includes('exec-banner') || allClass.includes('group-banner')) {
                cell.s.fill = { fgColor: { rgb: execBg } };
                cell.s.font.bold = true;
                cell.s.alignment.horizontal = 'left';
              }
              else if (allClass.includes('bg-header-blue')) {
                cell.s.fill = { fgColor: { rgb: '5B9BD5' } };
                cell.s.font.bold = true;
                if (allClass.includes('font-bold') && coord.c > 1 && rowNum < 3) cell.s.alignment.horizontal = 'left';
              }
              else if (allClass.includes('bg-header-green')) {
                cell.s.fill = { fgColor: { rgb: 'C6E0B4' } };
                cell.s.font.bold = true;
              }
              else if (allClass.includes('bg-gray-row')) {
                cell.s.fill = { fgColor: { rgb: 'D9D9D9' } };
              }
              else if (allClass.includes('bg-orange-pct')) {
                cell.s.fill = { fgColor: { rgb: 'F8CBAD' } };
                cell.s.font.bold = true;
              }
              else {
                cell.s.fill = { fgColor: { rgb: 'FFFFFF' } };
                // Keep left alignment for text-left cells
                if (allClass.includes('text-left') || (typeof cell.v === 'string' && isNaN(cell.v) && coord.c === 1)) {
                   cell.s.alignment.horizontal = 'left';
                }
              }
              
              if (allClass.includes('font-bold')) {
                 cell.s.font.bold = true;
              }
            }
  
            ws['!cols'] = Array(20).fill({ wch: 15 });
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          }
        };
`;

const oldRegex = /const convertHtmlToSheet = async \(exportFunc, sheetName\) => \{[\s\S]*?XLSX\.utils\.book_append_sheet\(wb, ws, sheetName\);\s*\}\s*\};/;
content = content.replace(oldRegex, newConvertHtmlToSheet.trim());

fs.writeFileSync(file, content);
console.log('Patched handleDownloadAll for summary colors and split title cells');
