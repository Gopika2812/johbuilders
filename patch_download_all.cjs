const fs = require('fs');

const file = 'client/src/pages/ExportReports.jsx';
let content = fs.readFileSync(file, 'utf8');

const newConvertHtmlToSheet = `
        const convertHtmlToSheet = async (exportFunc, sheetName) => {
          window.__capturedHtml = null;
          await exportFunc(); // It triggers handlePreview, which sets window.__capturedHtml
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
            
            // Apply styles to all cells in the sheet
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
  
              if (tr.cells[0]?.className?.includes('title-row') || tr.className?.includes('title-row')) {
                cell.s.fill = { fgColor: { rgb: titleBg } };
                cell.s.font.bold = true;
                cell.s.font.sz = 14;
                if (coord.c > 1) { // text cell
                   cell.s.alignment.horizontal = 'left';
                }
              }
              else if (tr.cells[0]?.className?.includes('month-header') || tr.className?.includes('month-header')) {
                cell.s.fill = { fgColor: { rgb: monthBg } };
                cell.s.font.bold = true;
              }
              else if (tr.className === 'table-headers') {
                cell.s.fill = { fgColor: { rgb: headerBg } };
                cell.s.font.bold = true;
              }
              else if (tr.cells[0]?.className === 'exec-banner' || tr.cells[0]?.className === 'group-banner') {
                cell.s.fill = { fgColor: { rgb: execBg } };
                cell.s.font.bold = true;
                cell.s.alignment.horizontal = 'left';
              }
              else {
                cell.s.fill = { fgColor: { rgb: 'FFFFFF' } };
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
console.log('Patched handleDownloadAll');
