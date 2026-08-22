import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { LOGO_BASE64 } from './logoBase64';

let cachedLogoArrayBuffer = null;

// Helper to fetch logo ArrayBuffer directly from base64 fallback or public folder
const getLogoArrayBuffer = async () => {
  if (cachedLogoArrayBuffer) return cachedLogoArrayBuffer;

  if (LOGO_BASE64) {
    try {
      const cleanBase64 = LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '');
      const binaryString = window.atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      cachedLogoArrayBuffer = bytes.buffer; // Pass ArrayBuffer directly to ExcelJS
      return cachedLogoArrayBuffer;
    } catch (e) {
      console.error('Failed to convert LOGO_BASE64 to ArrayBuffer:', e);
    }
  }
  
  try {
    const res = await fetch('/logo_white.jpg');
    if (res.ok) {
      const blob = await res.blob();
      cachedLogoArrayBuffer = await blob.arrayBuffer();
      return cachedLogoArrayBuffer;
    }
  } catch (e) {
    console.warn('Could not fetch /logo_white.jpg:', e);
  }

  return null;
};

export const exportHtmlSheetsToExcel = async (sheets, filename) => {
  try {
    const wb = new ExcelJS.Workbook();

    let logoImageId = null;
    if (LOGO_BASE64) {
      try {
        logoImageId = wb.addImage({
          base64: LOGO_BASE64,
          extension: 'jpeg',
        });
      } catch (e) {
        console.error('Failed to add base64 logo image to Excel workbook:', e);
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
          const isHeaderCell = cell.tagName === 'TH' || cellClasses.includes('table-headers') || cellClasses.includes('bg-header-blue') || cellClasses.includes('bg-header-green');

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

            if (logoImageId !== null) {
              excelCell.value = ''; // Clear text so logo image displays cleanly
              try {
                ws.addImage(logoImageId, {
                  tl: { col: cIdx + 0.1, row: rIdx + 0.1 },
                  br: { col: cIdx + cSpan - 0.1, row: rIdx + rSpan - 0.1 },
                  editAs: 'oneCell'
                });
              } catch (e) {
                console.warn('Could not overlay logo image:', e);
                excelCell.value = 'JB  |  JOHN BUILDWELL';
              }
            } else {
              excelCell.value = 'JB  |  JOHN BUILDWELL';
            }
          } else {
            // Value & Phone Number parsing
            const rawVal = cellText.replace(/^₹\s*/, '').replace(/,/g, '');
            const isPhoneOrContact = (
              cellClasses.includes('contact') || 
              cellClasses.includes('phone') || 
              /^(\+?\d{1,4}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}$/.test(cellText) || 
              (rawVal.length >= 10 && !rawVal.includes('.') && !cellText.includes('TOTAL') && !cellText.includes('Cr') && !cellClasses.includes('amount') && !cellClasses.includes('price'))
            );

            if (isPhoneOrContact) {
              excelCell.value = cellText; // Keep phone number as text (NO COMMAS!)
              excelCell.numFmt = '@';
            } else if (!isNaN(rawVal) && rawVal !== '' && !cellText.includes('DATE:') && !cellText.includes('TOTAL') && !cellText.includes('S.No') && !cellText.includes('S.NO.')) {
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

          // 6. Alignment & Header Text Wrapping
          let hAlign = 'center';
          if (cellClasses.includes('text-left') || styleAttr.includes('text-align: left')) hAlign = 'left';
          if (cellClasses.includes('text-right') || styleAttr.includes('text-align: right')) hAlign = 'right';

          excelCell.alignment = {
            horizontal: hAlign,
            vertical: 'middle',
            wrapText: isHeaderCell || cellText.length > 40 // Enable text wrapping for headers and long notes
          };

          // 7. Borders
          const borderStyle = { style: 'thin', color: { argb: 'FFCBD5E1' } };
          excelCell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

          maxCol = Math.max(maxCol, cIdx + cSpan - 1);
          cIdx += cSpan;
        }
      }

      // Column Width Calculation (Increase Remarks column, fit Contact phone numbers, compact others)
      for (let col = 1; col <= maxCol + 1; col++) {
        let dataMaxLen = 0;
        let headerTitle = '';

        ws.eachRow((row, rowNumber) => {
          const cellVal = row.getCell(col).value;
          if (cellVal !== null && cellVal !== undefined) {
            const s = String(cellVal).trim();
            if (rowNumber <= 6 && (
              s.toUpperCase().includes('REMARKS') || 
              s.toUpperCase().includes('DESCRIPTION') || 
              s.toUpperCase().includes('CONTACT') || 
              s.toUpperCase().includes('NAME') || 
              s.toUpperCase().includes('STATUS') || 
              s.toUpperCase().includes('PROJECT') || 
              s.toUpperCase().includes('DATE') || 
              s.toUpperCase().includes('S.NO') ||
              s.toUpperCase().includes('PLACE') ||
              s.toUpperCase().includes('MODE')
            )) {
              headerTitle = s.toUpperCase();
            }
            if (rowNumber > 6) {
              const lines = s.split(/\r?\n/);
              lines.forEach(l => { dataMaxLen = Math.max(dataMaxLen, l.length); });
            }
          }
        });

        let calculatedWidth = 10;

        if (headerTitle.includes('REMARKS') || headerTitle.includes('NOTE') || headerTitle.includes('COMPLAINT')) {
          // REMARKS column: Spacious width (45 - 60) so long comments fit comfortably!
          calculatedWidth = Math.min(Math.max(dataMaxLen + 4, 45), 65);
        } else if (headerTitle.includes('DESCRIPTION') || headerTitle.includes('NAME') || headerTitle.includes('CUSTOMER')) {
          // DESCRIPTION / NAME column: Spacious width (22 - 32)
          calculatedWidth = Math.min(Math.max(dataMaxLen + 3, 22), 35);
        } else if (headerTitle.includes('CONTACT') || headerTitle.includes('PHONE') || headerTitle.includes('MOBILE')) {
          // CONTACT column: width 16 (fits 10-12 digit phone number cleanly)
          calculatedWidth = 16;
        } else if (headerTitle.includes('S.NO') || headerTitle.includes('S NO') || headerTitle === 'S.NO.') {
          calculatedWidth = 6;
        } else if (headerTitle.includes('PROJECT') || headerTitle.includes('PLOT') || headerTitle.includes('UNIT') || headerTitle.includes('PLACE')) {
          calculatedWidth = 10;
        } else if (headerTitle.includes('DATE')) {
          calculatedWidth = 12;
        } else if (headerTitle.includes('STATUS') || headerTitle.includes('MODE') || headerTitle.includes('BY')) {
          calculatedWidth = 12;
        } else {
          // All numeric & week actual columns: compact 9-11 width
          calculatedWidth = Math.min(Math.max(dataMaxLen + 2.5, 9), 11);
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
