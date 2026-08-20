import ExcelJS from 'exceljs';
import { LOGO_BASE64 } from './logoBase64';

export const exportHtmlSheetsToExcel = async (sheets, filename) => {
  try {
    const wb = new ExcelJS.Workbook();

    // Prepare logo image if available
    let logoImageId = null;
    if (LOGO_BASE64) {
      try {
        const base64Data = LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '');
        logoImageId = wb.addImage({
          base64: base64Data,
          extension: 'jpeg',
        });
      } catch (e) {
        console.error('Failed to add logo image to Excel workbook:', e);
      }
    }

    for (const sheetObj of sheets) {
      const ws = wb.addWorksheet(sheetObj.name || 'Report');

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

          if (!bgHex) {
            if (cellClasses.includes('title-row') || cellClasses.includes('bg-header-blue') || cellClasses.includes('bg-header-green') || cellClasses.includes('table-headers')) {
              bgHex = '0F5233';
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

          if (!fontColor) {
            if (bgHex === '0F5233' || bgHex === '0B4D2D' || bgHex === '000000') {
              fontColor = 'FFFFFF';
            } else if (bgHex === 'E6F4EA' || bgHex === 'D1E7DD') {
              fontColor = '0F5233';
            } else {
              fontColor = '1E293B';
            }
          }

          // 3. Logo Cell & Image Embedding
          const hasImg = Boolean(cell.querySelector('img'));
          const isLogoCell = cellClasses.includes('logo-cell') || hasImg || (rIdx === 0 && cIdx < 2 && (cellText.toUpperCase() === 'JOHN BUILDWELL' || cellText === ''));

          if (isLogoCell && logoImageId) {
            excelCell.value = '';
            bgHex = 'FFFFFF';
            fontColor = '0F5233';
            ws.getRow(rIdx + 1).height = 55;

            ws.addImage(logoImageId, {
              tl: { col: cIdx + 0.05, row: rIdx + 0.05 },
              br: { col: cIdx + cSpan - 0.05, row: rIdx + rSpan - 0.05 },
              editAs: 'oneCell'
            });
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
          let isBold = cellClasses.includes('font-bold') || cell.tagName === 'TH' || styleAttr.includes('font-weight: bold') || styleAttr.includes('font-weight: 700');

          excelCell.font = {
            name: 'Segoe UI',
            size: (cellClasses.includes('title-row') || rIdx === 0) ? 13 : 10,
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
            wrapText: true
          };

          // 7. Borders
          const borderStyle = { style: 'thin', color: { argb: 'FFCBD5E1' } };
          excelCell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

          maxCol = Math.max(maxCol, cIdx + cSpan - 1);
          cIdx += cSpan;
        }
      }

      // Column widths
      for (let col = 1; col <= maxCol + 1; col++) {
        ws.getColumn(col).width = col === 1 ? 8 : (col === 2 || col === 3 ? 24 : 16);
      }
    }

    // Write file & trigger browser download
    const buffer = await wb.xlsx.writeBuffer();
    const finalFilename = filename.endsWith('.xlsx') ? filename : filename.replace(/\.xls$/, '.xlsx');
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting ExcelJS workbook:', err);
  }
};
