import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { LOGO_BASE64 } from './logoBase64';

let cachedLogoArrayBuffer = null;

// Helper to fetch logo Uint8Array directly from public folder or base64 fallback
const getLogoArrayBuffer = async () => {
  if (cachedLogoArrayBuffer) return cachedLogoArrayBuffer;
  
  try {
    const res = await fetch('/logo_white.jpg');
    if (res.ok) {
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      cachedLogoArrayBuffer = new Uint8Array(arrayBuffer);
      return cachedLogoArrayBuffer;
    }
  } catch (e) {
    console.warn('Could not fetch /logo_white.jpg, trying base64 fallback:', e);
  }

  if (LOGO_BASE64) {
    try {
      const cleanBase64 = LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '');
      const binaryString = window.atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      cachedLogoArrayBuffer = bytes;
      return cachedLogoArrayBuffer;
    } catch (e) {
      console.error('Failed to convert base64 to Uint8Array:', e);
    }
  }
  return null;
};

export const exportHtmlSheetsToExcel = async (sheets, filename) => {
  try {
    const wb = new ExcelJS.Workbook();

    const logoArrayBuffer = await getLogoArrayBuffer();
    let logoImageId = null;
    if (logoArrayBuffer) {
      try {
        logoImageId = wb.addImage({
          buffer: logoArrayBuffer,
          extension: 'jpeg',
        });
      } catch (e) {
        console.error('Failed to add logo image to Excel workbook:', e);
      }
    }

    for (const sheetObj of sheets) {
      const ws = wb.addWorksheet(sheetObj.name || 'Report');

      // Page Setup: Landscape & Fit to 1 Page Wide
      ws.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9 // A4
      };

      const div = document.createElement('div');
      div.innerHTML = sheetObj.html;
      const table = div.querySelector('table');
      if (!table) continue;

      const rowCount = table.rows.length;
      const occupied = [];
      for (let i = 0; i < rowCount + 50; i++) occupied[i] = [];

      let maxCol = 0;

      for (let rIdx = 0; rIdx < table.rows.length; rIdx++) {
        const tr = table.rows[rIdx];
        let cIdx = 0;

        for (let cHtml = 0; cHtml < tr.cells.length; cHtml++) {
          const cell = tr.cells[cHtml];
          while (occupied[rIdx][cIdx]) { cIdx++; }

          const rSpan = parseInt(cell.getAttribute('rowspan') || '1');
          const cSpan = parseInt(cell.getAttribute('colspan') || '1');

          if (rSpan > 1 || cSpan > 1) {
            ws.mergeCells(rIdx + 1, cIdx + 1, rIdx + rSpan, cIdx + cSpan);
          }

          for (let rs = 0; rs < rSpan; rs++) {
            for (let cs = 0; cs < cSpan; cs++) {
              occupied[rIdx + rs][cIdx + cs] = true;
            }
          }

          const excelCell = ws.getCell(rIdx + 1, cIdx + 1);
          const cellText = (cell.innerText || cell.textContent || '').trim();
          const cellClasses = (cell.className || '') + ' ' + (tr.className || '');
          const styleAttr = cell.getAttribute('style') || '';
          const bgcolorAttr = cell.getAttribute('bgcolor') || '';

          // 1. Background color detection
          let bgHex = null;
          const bgMatch = styleAttr.match(/background-color:\s*#([0-9a-fA-F]{6})/i);
          if (bgMatch) {
            bgHex = bgMatch[1].toUpperCase();
          } else if (bgcolorAttr && bgcolorAttr !== 'transparent') {
            bgHex = bgcolorAttr.replace('#', '').toUpperCase();
          }

          if (!bgHex || cellClasses.includes('title-row')) {
            if (cellClasses.includes('title-row') || cellClasses.includes('bg-header-blue') || cellClasses.includes('bg-header-green') || cellClasses.includes('table-headers')) {
              bgHex = '0F5233'; // Corporate Emerald Green
            } else if (cellClasses.includes('month-header') || cellClasses.includes('exec-banner') || cellClasses.includes('group-banner')) {
              bgHex = 'E6F4EA';
            } else if (cellClasses.includes('bg-orange-pct')) {
              bgHex = 'D1E7DD';
            } else if (cellClasses.includes('bg-black-row')) {
              bgHex = 'F8FAFC';
            } else if (cellClasses.includes('bg-light-green')) {
              bgHex = 'F8FAF8';
            } else {
              bgHex = 'FFFFFF';
            }
          }

          // 2. Font color detection
          let fontColor = null;
          const colorMatch = styleAttr.match(/(?:^|;\s*)color:\s*#([0-9a-fA-F]{6})/i);
          if (colorMatch) {
            fontColor = colorMatch[1].toUpperCase();
          }

          if (!fontColor || cellClasses.includes('title-row')) {
            if (bgHex === '0F5233' || bgHex === '0B4D2D' || bgHex === '000000' || cellClasses.includes('title-row')) {
              fontColor = 'FFFFFF'; // White text on dark emerald green title header
            } else if (bgHex === 'E6F4EA' || bgHex === 'D1E7DD') {
              fontColor = '0F5233';
            } else {
              fontColor = '1E293B';
            }
          }

          // 3. Logo Cell & Formatting
          const hasImg = Boolean(cell.querySelector('img'));
          const isLogoCell = cellClasses.includes('logo-cell') || hasImg || (rIdx === 0 && cIdx < 2 && (cellText.toUpperCase() === 'JOHN BUILDWELL' || cellText === ''));

          if (isLogoCell) {
            bgHex = 'FFFFFF';
            fontColor = '0F5233';
            ws.getRow(rIdx + 1).height = 45;

            if (logoImageId) {
              excelCell.value = ''; // Clear text so image shows cleanly
              try {
                ws.addImage(logoImageId, {
                  tl: { col: cIdx + 0.1, row: rIdx + 0.1 },
                  ext: { width: 130, height: 40 },
                  editAs: 'oneCell'
                });
              } catch (e) {
                console.warn('Could not overlay image:', e);
                excelCell.value = 'JB  |  JOHN BUILDWELL';
              }
            } else {
              excelCell.value = 'JB  |  JOHN BUILDWELL';
            }
          } else {
            // Value parsing
            const rawVal = cellText.replace(/^₹\s*/, '').replace(/,/g, '');
            if (!isNaN(rawVal) && rawVal !== '' && !cellText.includes('DATE:') && !cellText.includes('TOTAL') && !cellText.includes('S.No') && !cellText.includes('S.NO.')) {
              excelCell.value = Number(rawVal);
              if (cellText.includes('.')) {
                excelCell.numFmt = '#,##0.00';
              } else {
                excelCell.numFmt = '#,##0';
              }
            } else {
              excelCell.value = cellText;
            }
          }

          // 4. Font styling
          let isBold = isLogoCell || cellClasses.includes('font-bold') || cell.tagName === 'TH' || styleAttr.includes('font-weight: bold') || styleAttr.includes('font-weight: 700');

          excelCell.font = {
            name: 'Segoe UI',
            size: (isLogoCell || cellClasses.includes('title-row') || rIdx === 0) ? 12 : 9.5,
            bold: isBold,
            color: { argb: 'FF' + fontColor }
          };

          // 5. Fill background
          excelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + bgHex }
          };

          // 6. Alignment
          let hAlign = 'center';
          if (cellClasses.includes('text-left') || styleAttr.includes('text-align: left')) hAlign = 'left';
          if (cellClasses.includes('text-right') || styleAttr.includes('text-align: right')) hAlign = 'right';

          excelCell.alignment = {
            horizontal: hAlign,
            vertical: 'middle',
            wrapText: cellText.length > 60
          };

          // 7. Borders
          const borderStyle = { style: 'thin', color: { argb: 'FFCBD5E1' } };
          excelCell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

          maxCol = Math.max(maxCol, cIdx + cSpan - 1);
          cIdx += cSpan;
        }
      }

      // Dynamic Compact Column Width Calculation (Tight, fitted formatting)
      const colMaxLens = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return; // Skip title banner rows
        row.eachCell((cell, colNumber) => {
          const valStr = cell.value ? String(cell.value) : '';
          const lines = valStr.split(/\r?\n/);
          lines.forEach(l => {
            colMaxLens[colNumber] = Math.max(colMaxLens[colNumber] || 5, l.length);
          });
        });
      });

      for (let col = 1; col <= maxCol + 1; col++) {
        const maxLen = colMaxLens[col] || 8;
        let calculatedWidth = maxLen + 2.5; // Compact 2.5 char padding

        if (col === 1) {
          calculatedWidth = Math.min(Math.max(maxLen + 2, 6), 8); // S.No column: width 6-8
        } else if (col === 2) {
          calculatedWidth = Math.min(Math.max(maxLen + 2, 10), 16); // Project column: width 10-16
        } else {
          calculatedWidth = Math.min(Math.max(calculatedWidth, 8), 35); // Data columns: min 8, max 35
        }
        ws.getColumn(col).width = calculatedWidth;
      }
    }

    const buffer = await wb.xlsx.writeBuffer();
    const finalFilename = filename.endsWith('.xlsx') ? filename : filename.replace(/\.xls$/, '.xlsx');
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, finalFilename);
  } catch (err) {
    console.error('Error exporting ExcelJS workbook:', err);
  }
};
