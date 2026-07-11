export const htmlToStyledSheet = (htmlString, XLSX) => {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlString);
    doc.close();

    setTimeout(() => {
      try {
        const table = doc.querySelector('table');
        if (!table) {
          resolve(XLSX.utils.aoa_to_sheet([["Error parsing table"]]));
          document.body.removeChild(iframe);
          return;
        }

        const ws = {};
        const merges = [];
        const rowCount = table.rows.length;
        let maxCol = 0;
        
        const occupied = [];
        for (let i = 0; i < rowCount; i++) occupied[i] = [];

        const color2hex = (colorStr) => {
          if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') return null;
          const matchRgb = colorStr.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
          if (matchRgb) {
            return ("0" + parseInt(matchRgb[1], 10).toString(16)).slice(-2).toUpperCase() +
                   ("0" + parseInt(matchRgb[2], 10).toString(16)).slice(-2).toUpperCase() +
                   ("0" + parseInt(matchRgb[3], 10).toString(16)).slice(-2).toUpperCase();
          }
          const matchRgba = colorStr.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
          if (matchRgba) {
            return ("0" + parseInt(matchRgba[1], 10).toString(16)).slice(-2).toUpperCase() +
                   ("0" + parseInt(matchRgba[2], 10).toString(16)).slice(-2).toUpperCase() +
                   ("0" + parseInt(matchRgba[3], 10).toString(16)).slice(-2).toUpperCase();
          }
          return null;
        };

        const defaultBorder = { style: 'thin', color: { rgb: "000000" } };
        const fullBorder = { top: defaultBorder, bottom: defaultBorder, left: defaultBorder, right: defaultBorder };

        for (let R = 0; R < rowCount; ++R) {
          const row = table.rows[R];
          let C = 0; 
          
          for (let i = 0; i < row.cells.length; ++i) {
            const cell = row.cells[i];
            
            while (occupied[R][C]) { C++; }
            
            const rSpan = cell.rowSpan || 1;
            const cSpan = cell.colSpan || 1;
            
            if (rSpan > 1 || cSpan > 1) {
              merges.push({ s: { r: R, c: C }, e: { r: R + rSpan - 1, c: C + cSpan - 1 } });
            }
            
            for (let rr = 0; rr < rSpan; ++rr) {
              if (!occupied[R + rr]) occupied[R + rr] = [];
              for (let cc = 0; cc < cSpan; ++cc) {
                occupied[R + rr][C + cc] = true;
              }
            }
            
            const address = XLSX.utils.encode_cell({ r: R, c: C });
            
            const computed = iframe.contentWindow.getComputedStyle(cell);
            const bgColor = color2hex(computed.backgroundColor);
            const color = color2hex(computed.color) || "000000";
            const fontWeight = computed.fontWeight === 'bold' || parseInt(computed.fontWeight) >= 700;
            
            // Handle alignments
            let textAlign = computed.textAlign;
            if (textAlign === 'start' || textAlign === 'auto') textAlign = 'left';
            if (textAlign === 'end') textAlign = 'right';

            let v = cell.innerText.trim();
            let t = 's';
            
            if (!isNaN(v) && v !== '') {
              v = Number(v);
              t = 'n';
            }

            ws[address] = {
              v: v,
              t: t,
              s: {
                fill: bgColor ? { fgColor: { rgb: bgColor } } : undefined,
                font: { name: "Arial", sz: 10, bold: fontWeight, color: { rgb: color } },
                alignment: { horizontal: textAlign, vertical: "center", wrapText: true },
                border: fullBorder
              }
            };

            maxCol = Math.max(maxCol, C + cSpan - 1);
            C += cSpan;
          }
        }

        merges.forEach(merge => {
          for (let r = merge.s.r; r <= merge.e.r; r++) {
            for (let c = merge.s.c; c <= merge.e.c; c++) {
              const addr = XLSX.utils.encode_cell({ r: r, c: c });
              if (!ws[addr]) {
                 const rootCell = ws[XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })];
                 ws[addr] = { v: '', t: 's', s: rootCell ? rootCell.s : { border: fullBorder } };
              }
            }
          }
        });

        ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowCount - 1, c: maxCol } });
        if (merges.length > 0) ws['!merges'] = merges;
        
        const cols = [];
        for (let i = 0; i <= maxCol; i++) cols.push({ wch: 15 });
        ws['!cols'] = cols;

        resolve(ws);
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(iframe);
      }
    }, 150);
  });
};
