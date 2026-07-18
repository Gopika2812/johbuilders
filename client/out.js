(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/pages/CRDReports.jsx
  var import_react2 = __toESM(__require("react"), 1);

  // src/context/AuthContext.jsx
  var import_react = __toESM(__require("react"), 1);
  var AuthContext = (0, import_react.createContext)(null);
  var API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000/api" : "https://johbuilders.onrender.com/api";
  var useAuth = () => {
    const context = (0, import_react.useContext)(AuthContext);
    if (!context) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
  };

  // src/pages/CRDReports.jsx
  var XLSX = __toESM(__require("xlsx-js-style"), 1);

  // src/utils/htmlToSheet.js
  var htmlToStyledSheet = (htmlString, XLSX2) => {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      iframe.style.visibility = "hidden";
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlString);
      doc.close();
      setTimeout(() => {
        try {
          const table = doc.querySelector("table");
          if (!table) {
            resolve(XLSX2.utils.aoa_to_sheet([["Error parsing table"]]));
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
            if (!colorStr || colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)") return null;
            const matchRgb = colorStr.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            if (matchRgb) {
              return ("0" + parseInt(matchRgb[1], 10).toString(16)).slice(-2).toUpperCase() + ("0" + parseInt(matchRgb[2], 10).toString(16)).slice(-2).toUpperCase() + ("0" + parseInt(matchRgb[3], 10).toString(16)).slice(-2).toUpperCase();
            }
            const matchRgba = colorStr.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
            if (matchRgba) {
              return ("0" + parseInt(matchRgba[1], 10).toString(16)).slice(-2).toUpperCase() + ("0" + parseInt(matchRgba[2], 10).toString(16)).slice(-2).toUpperCase() + ("0" + parseInt(matchRgba[3], 10).toString(16)).slice(-2).toUpperCase();
            }
            return null;
          };
          const defaultBorder = { style: "thin", color: { rgb: "000000" } };
          const fullBorder = { top: defaultBorder, bottom: defaultBorder, left: defaultBorder, right: defaultBorder };
          for (let R = 0; R < rowCount; ++R) {
            const row = table.rows[R];
            let C = 0;
            for (let i = 0; i < row.cells.length; ++i) {
              const cell = row.cells[i];
              while (occupied[R][C]) {
                C++;
              }
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
              const address = XLSX2.utils.encode_cell({ r: R, c: C });
              const computed = iframe.contentWindow.getComputedStyle(cell);
              const bgColor = color2hex(computed.backgroundColor);
              const color = color2hex(computed.color) || "000000";
              const fontWeight = computed.fontWeight === "bold" || parseInt(computed.fontWeight) >= 700;
              let textAlign = computed.textAlign;
              if (textAlign === "start" || textAlign === "auto") textAlign = "left";
              if (textAlign === "end") textAlign = "right";
              let v = cell.innerText.trim();
              let t = "s";
              if (!isNaN(v) && v !== "") {
                v = Number(v);
                t = "n";
              }
              ws[address] = {
                v,
                t,
                s: {
                  fill: bgColor ? { fgColor: { rgb: bgColor } } : void 0,
                  font: { name: "Arial", sz: 10, bold: fontWeight, color: { rgb: color } },
                  alignment: { horizontal: textAlign, vertical: "center", wrapText: true },
                  border: fullBorder
                }
              };
              maxCol = Math.max(maxCol, C + cSpan - 1);
              C += cSpan;
            }
          }
          merges.forEach((merge) => {
            for (let r = merge.s.r; r <= merge.e.r; r++) {
              for (let c = merge.s.c; c <= merge.e.c; c++) {
                const addr = XLSX2.utils.encode_cell({ r, c });
                if (!ws[addr]) {
                  const rootCell = ws[XLSX2.utils.encode_cell({ r: merge.s.r, c: merge.s.c })];
                  ws[addr] = { v: "", t: "s", s: rootCell ? rootCell.s : { border: fullBorder } };
                }
              }
            }
          });
          ws["!ref"] = XLSX2.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowCount - 1, c: maxCol } });
          if (merges.length > 0) ws["!merges"] = merges;
          const cols = [];
          for (let i = 0; i <= maxCol; i++) cols.push({ wch: 15 });
          ws["!cols"] = cols;
          resolve(ws);
        } catch (e) {
          reject(e);
        } finally {
          document.body.removeChild(iframe);
        }
      }, 150);
    });
  };

  // src/pages/CRDReports.jsx
  var import_lucide_react = __require("lucide-react");
  var getExcelStyles = (titleBg, monthBg, headerBg, execBg) => {
    return `
    <style>
      table { border-collapse: collapse; }
      td, th { border: 1px solid #000000; padding: 6px 8px; font-family: 'Segoe UI', Calibri, sans-serif; font-size: 10pt; color: #000000; }
      th, .table-headers th { font-weight: bold; background-color: ${headerBg || "#FCE4D6"}; color: #000000; border: 1px solid #000000; text-align: center; }
      .title-row { font-size: 11pt; font-weight: bold; color: #000000; background-color: ${titleBg || "#FCE4D6"}; text-align: center; }
      .month-header { height: 22px; vertical-align: middle; font-size: 10pt; font-weight: bold; background-color: ${monthBg || "#DDEBF7"}; border: 1px solid #000000; text-align: center; text-transform: uppercase; }
      .exec-banner { background-color: ${execBg || "#DDEBF7"}; font-weight: bold; text-align: left; }
      .bg-header-blue { background-color: #5B9BD5 !important; color: #000000 !important; font-weight: bold; text-align: center; }
      .bg-header-green { background-color: #C6E0B4 !important; color: #000000 !important; font-weight: bold; text-align: center; }
      .bg-black-row { background-color: #D9D9D9 !important; color: #000000 !important; }
      .bg-orange-pct { background-color: #F8CBAD !important; color: #000000 !important; font-weight: bold; text-align: center; }
      
      .font-bold { font-weight: bold; color: #000000; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
    </style>
  `;
  };
  var getExcelHeader = (titleText, monthTitle, totalColumns, themeColor, logoPath) => {
    const safeCols = Math.max(3, totalColumns);
    const webLogo = window.location.origin + "/jb_logo.jpg";
    const excelLogo = "file:///E:/builders/client/public/jb_logo.jpg";
    return `
      <tr style="height: 60px;">
        <td colspan="2" class="title-row" style="background-color: #FFFFFF; border: 1px solid #000000; border-right: none; vertical-align:middle; text-align:center; height: 60px;">
          <!--[if gte mso 9]>
            <img src="${excelLogo}" width="150" height="52" style="vertical-align: middle;" />
          <![endif]-->
          <!--[if !mso]><!-->
            <img src="${webLogo}" width="150" height="52" style="vertical-align: middle;" />
          <!--<![endif]-->
        </td>
        <td colspan="${safeCols - 2}" class="title-row text-center" style="background-color: #FCE4D6; color: #000000; border: 1px solid #000000; border-left: none; vertical-align:middle; text-align:center; font-size: 14pt; font-weight: bold; height: 60px;">
          ${titleText}
        </td>
      </tr>
      ${monthTitle ? `
      <tr>
        <td colspan="${safeCols}" class="month-header" style="height: 22px; vertical-align: middle; font-size: 10pt; font-weight: bold; border: 1px solid #000000; text-align: center; text-transform: uppercase;">
          ${monthTitle}
        </td>
      </tr>` : ""}
      <tr><td colspan="${safeCols}" style="border:none; height: 15px;"></td></tr>
    `;
  };
  var KPIInsights = () => {
    const { token, user } = useAuth();
    const logoPath = "file:///E:/builders/client/public/jb_logo.jpg";
    const [fromDate, setFromDate] = (0, import_react2.useState)(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    const [toDate, setToDate] = (0, import_react2.useState)(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    const [selectedUser, setSelectedUser] = (0, import_react2.useState)(() => {
      const isPrivileged = user?.role === "Superadmin" || user?.role === "Superadmin";
      return isPrivileged ? "" : user?._id || "";
    });
    (0, import_react2.useEffect)(() => {
      if (user && user.role !== "Superadmin" && user.role !== "Superadmin") {
        setSelectedUser(user._id);
      }
    }, [user]);
    const [selectedProject, setSelectedProject] = (0, import_react2.useState)("");
    const [loading, setLoading] = (0, import_react2.useState)(true);
    const [selectedGroup, setSelectedGroup] = (0, import_react2.useState)(null);
    const [activeCpeDrillDown, setActiveCpeDrillDown] = (0, import_react2.useState)(null);
    const [exportMenuOpen, setExportMenuOpen] = (0, import_react2.useState)(false);
    const [crdMenuOpen, setCrdMenuOpen] = (0, import_react2.useState)(false);
    const [previewHtml, setPreviewHtml] = (0, import_react2.useState)("");
    const [previewFilename, setPreviewFilename] = (0, import_react2.useState)("");
    const [previewModalOpen, setPreviewModalOpen] = (0, import_react2.useState)(false);
    const [previewSheets, setPreviewSheets] = (0, import_react2.useState)([]);
    const [currentSheetIndex, setCurrentSheetIndex] = (0, import_react2.useState)(0);
    const [previewOriginalWs, setPreviewOriginalWs] = (0, import_react2.useState)(null);
    const handlePreview = (content, filename, isWorksheet = false) => {
      let htmlContent = content;
      if (isWorksheet) {
        htmlContent = XLSX.utils.sheet_to_html(content, { editable: false });
        htmlContent = `<div class="p-4 bg-white"><style>table{border-collapse:collapse;width:100%} td,th{border:1px solid #ddd;padding:8px;text-align:left;}</style>${htmlContent}</div>`;
      }
      if (window.__isDownloadingAll) {
        window.__capturedHtml = htmlContent;
        window.__capturedWs = isWorksheet ? content : null;
        return;
      }
      setPreviewSheets([]);
      setPreviewHtml(htmlContent);
      setPreviewFilename(filename);
      setPreviewOriginalWs(isWorksheet ? content : null);
      setPreviewModalOpen(true);
    };
    const downloadFromPreview = () => {
      if (previewSheets && previewSheets.length > 0) {
        const wb = XLSX.utils.book_new();
        for (const sheet of previewSheets) {
          if (sheet.originalWs) {
            XLSX.utils.book_append_sheet(wb, sheet.originalWs, sheet.name);
            continue;
          }
          const div = document.createElement("div");
          div.innerHTML = sheet.html;
          const table = div.querySelector("table");
          if (!table) continue;
          const styleBlock = div.querySelector("style");
          let titleBg = "FCE4D6", monthBg = "DDEBF7", headerBg = "FCE4D6", execBg = "DDEBF7";
          if (styleBlock) {
            const css = styleBlock.innerHTML;
            const mTitle = css.match(/\.title-row\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
            if (mTitle) titleBg = mTitle[1];
            const mMonth = css.match(/\.month-header\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
            if (mMonth) monthBg = mMonth[1];
            const mHeader = css.match(/\.table-headers\s*th\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
            if (mHeader) headerBg = mHeader[1];
            const mExec = css.match(/\.exec-banner\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
            if (mExec) execBg = mExec[1];
            if (!mExec) {
              const mGroup = css.match(/\.group-banner\s*{[^}]*background-color:\s*#([0-9a-fA-F]+)/);
              if (mGroup) execBg = mGroup[1];
            }
          }
          const ws = XLSX.utils.table_to_sheet(table, { raw: true });
          const borderStyle = { style: "thin", color: { rgb: "000000" } };
          const border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
          for (let cellRef in ws) {
            if (cellRef[0] === "!") continue;
            const cell = ws[cellRef];
            const coord = XLSX.utils.decode_cell(cellRef);
            const rowNum = coord.r;
            cell.s = {
              border,
              font: { name: "Calibri", sz: 10, color: { rgb: "000000" } },
              alignment: { vertical: "center", horizontal: "center", wrapText: true }
            };
            const tr = table.rows[rowNum];
            if (!tr) continue;
            const cellClasses = table.rows[rowNum].cells[coord.c]?.className || "";
            const rowClasses = tr.className || "";
            const allClass = cellClasses + " " + rowClasses;
            if (allClass.includes("title-row") || rowNum === 0) {
              cell.s.fill = { fgColor: { rgb: titleBg } };
              cell.s.font.bold = true;
              cell.s.font.sz = 14;
              if (coord.c > 1) cell.s.alignment.horizontal = "left";
              if (rowNum === 0 && coord.c < 2) {
                cell.s.fill = { fgColor: { rgb: "0E623A" } };
                cell.s.font.color = { rgb: "FFFFFF" };
                cell.s.font.bold = true;
                cell.s.font.sz = 18;
                if (coord.c === 0 && (!cell.v || cell.v.trim() === "")) {
                  cell.v = "JOHN BUILDWELL";
                  cell.t = "s";
                }
              }
            } else if (allClass.includes("month-header")) {
              cell.s.fill = { fgColor: { rgb: monthBg } };
              cell.s.font.bold = true;
            } else if (allClass.includes("table-headers")) {
              cell.s.fill = { fgColor: { rgb: headerBg } };
              cell.s.font.bold = true;
            } else if (allClass.includes("exec-banner") || allClass.includes("group-banner")) {
              cell.s.fill = { fgColor: { rgb: execBg } };
              cell.s.font.bold = true;
              cell.s.alignment.horizontal = "left";
            } else if (allClass.includes("bg-header-blue")) {
              cell.s.fill = { fgColor: { rgb: "5B9BD5" } };
              cell.s.font.bold = true;
            } else if (allClass.includes("bg-header-green")) {
              cell.s.fill = { fgColor: { rgb: "C6E0B4" } };
              cell.s.font.bold = true;
            } else if (allClass.includes("bg-black-row")) {
              cell.s.fill = { fgColor: { rgb: "D9D9D9" } };
            } else if (allClass.includes("bg-orange-pct")) {
              cell.s.fill = { fgColor: { rgb: "F8CBAD" } };
              cell.s.font.bold = true;
            }
            if (allClass.includes("text-left")) cell.s.alignment.horizontal = "left";
            if (allClass.includes("text-center")) cell.s.alignment.horizontal = "center";
            if (allClass.includes("text-right")) cell.s.alignment.horizontal = "right";
            if (allClass.includes("font-bold")) cell.s.font.bold = true;
          }
          const colWidths = [];
          for (let cellRef in ws) {
            if (cellRef[0] === "!") continue;
            const cell = ws[cellRef];
            const coord = XLSX.utils.decode_cell(cellRef);
            if (coord.r === 0 || coord.r === 1) continue;
            const val = cell.v ? cell.v.toString() : "";
            const valLen = val.length;
            const currentWidth = colWidths[coord.c] || 15;
            colWidths[coord.c] = Math.max(currentWidth, Math.min(valLen + 5, 100));
          }
          ws["!cols"] = colWidths.map((w) => ({ wch: w || 15 }));
          ws["!rows"] = [{ hpt: 60 }];
          XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        }
        XLSX.writeFile(wb, previewFilename);
        setPreviewModalOpen(false);
        return;
      }
      if (previewOriginalWs) {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, previewOriginalWs, "Report");
        XLSX.writeFile(wb, previewFilename);
        setPreviewModalOpen(false);
        return;
      }
      const blob = new Blob([previewHtml], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = previewFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setPreviewModalOpen(false);
    };
    const [stats, setStats] = (0, import_react2.useState)({
      cards: {
        enquiries: { total: 0, contacted: 0, followup: 0, closed: 0 },
        siteVisits: { total: 0, siteVisit: 0, followup: 0, closed: 0 },
        hotList: 0,
        conversion: { count: 0, value: 0, received: 0, pending: 0 },
        booked: { count: 0, value: 0, received: 0, pending: 0 },
        handover: { count: 0, value: 0, received: 0, pending: 0 },
        inventory: { totalProjects: 0, totalUnits: 0, availableUnits: 0, bookedUnits: 0, handoverUnits: 0 }
      },
      insights: {
        totalMarketingSpend: 0,
        totalLeadCost: 0,
        costPerEnquiry: 0,
        siteVisitConversionRate: 0,
        bookingConversionRate: 0,
        handoverRate: 0
      },
      sourceStats: {},
      groupStats: {},
      userStats: {},
      projectStats: {},
      stageStats: {},
      users: [],
      projects: []
    });
    (0, import_react2.useEffect)(() => {
      setSelectedGroup(null);
      fetchInsightsData();
    }, [fromDate, toDate, selectedUser, selectedProject]);
    const fetchInsightsData = async () => {
      setLoading(true);
      try {
        let url = `${API_URL}/dashboard/stats?fromDate=${fromDate}&toDate=${toDate}`;
        if (selectedUser) url += `&userId=${selectedUser}`;
        if (selectedProject) url += `&projectId=${selectedProject}`;
        const response = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const handleExportEnquiriesExcel = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/leads`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load lead details for export");
          return;
        }
        const data = await res.json();
        const filtered = data.filter((lead) => {
          const isEnquiry = lead.status === "Contacted" || lead.status === "Follow-Up";
          if (!isEnquiry) return false;
          if (selectedProject && (lead.project?._id || lead.project) !== selectedProject) return false;
          if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;
          const createdAt = new Date(lead.createdAt);
          if (fromDate && createdAt < new Date(fromDate)) return false;
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (createdAt > end) return false;
          }
          return true;
        });
        if (filtered.length === 0) {
          alert("No enquiry records found for the selected filters.");
          return;
        }
        const projectTitle = selectedProject ? stats.projects.find((p) => p._id === selectedProject)?.code || "PROJECT" : "";
        const titleText = projectTitle ? `JB - ${projectTitle.toUpperCase()} MARKETING ENQUIRY SHEET` : `JB - MARKETING ENQUIRY SHEET`;
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#FCE4D6", "#DDEBF7", "#FCE4D6", "#DDEBF7")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 10, "#16a34a", logoPath)}
      `;
        const groupedByExec = {};
        filtered.forEach((lead) => {
          const execName = lead.assignedTo?.name || "UNASSIGNED";
          if (!groupedByExec[execName]) groupedByExec[execName] = [];
          groupedByExec[execName].push(lead);
        });
        let globalSNo = 1;
        Object.keys(groupedByExec).forEach((execName) => {
          html += `
          <tr>
            <td colspan="10" class="exec-banner">${execName.toUpperCase()}</td>
          </tr>
          <!-- Table Headers -->
          <tr class="table-headers">
            <th>S.No</th>
            <th>Enquiry date</th>
            <th>Lead Name</th>
            <th>Contact Number</th>
            <th>Assigned To</th>
            <th>Enquiry Mode</th>
            <th>Project</th>
            <th>Place</th>
            <th>Lead Status</th>
            <th>sales person Remarks</th>
          </tr>
        `;
          groupedByExec[execName].forEach((lead, idx) => {
            const dateStr = new Date(lead.createdAt).toLocaleDateString("en-GB").replace(/\//g, ".");
            const phoneStr = lead.phone || "";
            const sourceStr = lead.leadSource || "";
            const projectStr = lead.project?.code || "";
            const placeStr = lead.address ? lead.address.split(",")[0] : "";
            const statusStr = (lead.status || "").toLowerCase().replace("-", "");
            const remarksStr = lead.followUpInfo?.remarks || lead.closeRemarks || "";
            const rowClass = idx % 2 === 1 ? 'class="even-row"' : "";
            html += `
            <tr ${rowClass}>
              <td>${globalSNo++}</td>
              <td>${dateStr}</td>
              <td class="text-left bold-label">${lead.name || ""}</td>
              <td>${phoneStr}</td>
              <td>${execName.toUpperCase()}</td>
              <td>${sourceStr}</td>
              <td>${projectStr}</td>
              <td>${placeStr}</td>
              <td>${statusStr}</td>
              <td class="text-left">${remarksStr}</td>
            </tr>
          `;
          });
        });
        html += `
          </table>
        </body>
        </html>
      `;
        handlePreview(html, `JB_ENQUIRY_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting enquiry sheet");
      } finally {
        setLoading(false);
      }
    };
    const handleExportSiteVisitsExcel = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/leads`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load lead details for export");
          return;
        }
        const data = await res.json();
        const filtered = data.filter((lead) => {
          const isSiteVisit = lead.status === "Site Visit" || lead.status === "Site Visit Follow-up";
          if (!isSiteVisit) return false;
          if (selectedProject && (lead.project?._id || lead.project) !== selectedProject) return false;
          if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;
          const createdAt = new Date(lead.createdAt);
          if (fromDate && createdAt < new Date(fromDate)) return false;
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (createdAt > end) return false;
          }
          return true;
        });
        if (filtered.length === 0) {
          alert("No site visit records found for the selected filters.");
          return;
        }
        const projectTitle = selectedProject ? stats.projects.find((p) => p._id === selectedProject)?.code || "PROJECT" : "";
        const titleText = projectTitle ? `JB - ${projectTitle.toUpperCase()} SITE VISIT REPORT` : `JB - SITE VISIT REPORT`;
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#FF99CC", "#F8CBAD", "#FF99CC", "#00B0F0")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 9, "#2563eb", logoPath)}
      `;
        const groupedByExec = {};
        filtered.forEach((lead) => {
          const execName = lead.assignedTo?.name || "UNASSIGNED";
          if (!groupedByExec[execName]) groupedByExec[execName] = [];
          groupedByExec[execName].push(lead);
        });
        let globalSNo = 1;
        Object.keys(groupedByExec).forEach((execName) => {
          html += `
          <tr>
            <td colspan="9" class="exec-banner">${execName.toUpperCase()}</td>
          </tr>
          <!-- Table Headers -->
          <tr class="table-headers">
            <th>S.No.</th>
            <th>Enquiry date</th>
            <th>Name</th>
            <th>Contact</th>
            <th>Site Visited By</th>
            <th>Place</th>
            <th>Enquiry Status</th>
            <th>Remarks</th>
            <th>Enquiry mode</th>
          </tr>
        `;
          groupedByExec[execName].forEach((lead, idx) => {
            const dateStr = new Date(lead.createdAt).toLocaleDateString("en-GB").replace(/\//g, ".");
            const phoneStr = lead.phone || "";
            const placeStr = lead.address ? lead.address.split(",")[0] : "";
            const visitedBy = execName;
            const statusStr = lead.status === "Site Visit Follow-up" ? "followup" : "completed";
            const remarksStr = lead.followUpInfo?.remarks || lead.closeRemarks || "";
            const sourceStr = lead.leadSource || "";
            const rowClass = idx % 2 === 1 ? 'class="even-row"' : "";
            html += `
            <tr ${rowClass}>
              <td>${globalSNo++}</td>
              <td>${dateStr}</td>
              <td class="text-left bold-label">${lead.name || ""}</td>
              <td>${phoneStr}</td>
              <td>${visitedBy}</td>
              <td>${placeStr}</td>
              <td>${statusStr}</td>
              <td class="text-left">${remarksStr}</td>
              <td>${sourceStr}</td>
            </tr>
          `;
          });
        });
        html += `
          </table>
        </body>
        </html>
      `;
        handlePreview(html, `JB_SITE_VISIT_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting site visit report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportHotListExcel = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/leads`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load lead details for export");
          return;
        }
        const data = await res.json();
        const filtered = data.filter((lead) => {
          const isHotList = lead.leadCategory === "Hot" && !lead.isClosed;
          if (!isHotList) return false;
          if (selectedProject && (lead.project?._id || lead.project) !== selectedProject) return false;
          if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;
          const createdAt = new Date(lead.createdAt);
          if (fromDate && createdAt < new Date(fromDate)) return false;
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (createdAt > end) return false;
          }
          return true;
        });
        if (filtered.length === 0) {
          alert("No hot list records found for the selected filters.");
          return;
        }
        const projectTitle = selectedProject ? stats.projects.find((p) => p._id === selectedProject)?.code || "PROJECT" : "";
        const titleText = projectTitle ? `JB - ${projectTitle.toUpperCase()} MARKETING HOT LIST` : `JB - MARKETING HOT LIST`;
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#F8CBAD", "#E6B8B7", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 7, "#ea580c", logoPath)}
      `;
        const groupedByExec = {};
        filtered.forEach((lead) => {
          const execName = lead.assignedTo?.name || "UNASSIGNED";
          if (!groupedByExec[execName]) groupedByExec[execName] = [];
          groupedByExec[execName].push(lead);
        });
        let globalSNo = 1;
        Object.keys(groupedByExec).forEach((execName) => {
          html += `
          <tr>
            <td colspan="7" class="exec-banner">${execName.toUpperCase()}</td>
          </tr>
          <!-- Table Headers -->
          <tr class="table-headers">
            <th>S.No</th>
            <th>Customer Name</th>
            <th>Contact Number</th>
            <th>Followup By</th>
            <th>Last Called Date</th>
            <th>Follow up Date</th>
            <th>Remarks</th>
          </tr>
        `;
          groupedByExec[execName].forEach((lead, idx) => {
            const nameStr = lead.name || "";
            const phoneStr = lead.phone || "";
            const followBy = execName;
            const lastCalledStr = lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString("en-GB").replace(/\//g, ".") : new Date(lead.createdAt).toLocaleDateString("en-GB").replace(/\//g, ".");
            const followUpDateStr = lead.followUpInfo?.nextFollowUpDate ? new Date(lead.followUpInfo.nextFollowUpDate).toLocaleDateString("en-GB").replace(/\//g, ".") : "";
            const remarksStr = lead.followUpInfo?.remarks || lead.closeRemarks || "";
            const rowClass = idx % 2 === 1 ? 'class="even-row"' : "";
            html += `
            <tr ${rowClass}>
              <td>${globalSNo++}</td>
              <td class="text-left bold-label">${nameStr}</td>
              <td>${phoneStr}</td>
              <td>${followBy}</td>
              <td>${lastCalledStr}</td>
              <td>${followUpDateStr}</td>
              <td class="text-left">${remarksStr}</td>
            </tr>
          `;
          });
        });
        html += `
          </table>
        </body>
        </html>
      `;
        handlePreview(html, `JB_HOT_LIST_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting hot list report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportBookingsExcel = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/leads`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load lead details for export");
          return;
        }
        const data = await res.json();
        const filtered = data.filter((lead) => {
          const isBooking = lead.status === "Booking" || lead.status === "Won";
          if (!isBooking) return false;
          if (selectedProject && (lead.project?._id || lead.project) !== selectedProject) return false;
          if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;
          const createdAt = new Date(lead.createdAt);
          if (fromDate && createdAt < new Date(fromDate)) return false;
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (createdAt > end) return false;
          }
          return true;
        });
        if (filtered.length === 0) {
          alert("No booking records found for the selected filters.");
          return;
        }
        const projectTitle = selectedProject ? stats.projects.find((p) => p._id === selectedProject)?.code || "PROJECT" : "";
        const titleText = projectTitle ? `JB - ${projectTitle.toUpperCase()} UNIT BOOKING DETAILS` : `JB - UNIT BOOKING DETAILS`;
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#92D050", "#C6E0B4", "#92D050", "#C6E0B4")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 8, "#15803d", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S.NO.</th>
              <th>BOOKING DATE</th>
              <th>CUSTOMER NAME</th>
              <th>CONTACT NO.</th>
              <th>Attended by</th>
              <th>PROJECT</th>
              <th>UNIT NO.</th>
              <th>UNIT VALUE</th>
            </tr>
      `;
        filtered.forEach((lead, index) => {
          const bDate = lead.bookingInfo?.bookingDate ? new Date(lead.bookingInfo.bookingDate) : new Date(lead.createdAt);
          const dateStr = bDate.toLocaleDateString("en-GB").replace(/\//g, ".");
          const custName = lead.name || "";
          const phoneStr = lead.phone || "";
          const attendedBy = lead.assignedTo?.name || "UNASSIGNED";
          const projectStr = lead.project?.code || "";
          const unitNo = lead.bookingInfo?.selectedUnits?.join(", ") || "";
          const unitValStr = lead.leadCost ? lead.leadCost.toLocaleString() : "0";
          const rowClass = index % 2 === 1 ? 'class="even-row"' : "";
          html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${dateStr}</td>
            <td class="text-left bold-label">${custName}</td>
            <td>${phoneStr}</td>
            <td>${attendedBy}</td>
            <td>${projectStr}</td>
            <td>${unitNo}</td>
            <td class="text-right">${unitValStr}</td>
          </tr>
        `;
        });
        html += `
          </table>
        </body>
        </html>
      `;
        handlePreview(html, `JB_UNIT_BOOKING_DETAILS_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting bookings report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportSummaryReport = async () => {
      try {
        setLoading(true);
        const activeMonthStr = fromDate.substring(0, 7);
        const [targetsRes, statsRes, pStatsRes, mStatsRes] = await Promise.all([
          fetch(`${API_URL}/summary-plans/${activeMonthStr}`, {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(`${API_URL}/quotations/summary-stats/${activeMonthStr}`, {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(`${API_URL}/summary-plans/project-stats/${activeMonthStr}`, {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(`${API_URL}/summary-plans/marketing-stats/${activeMonthStr}`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);
        if (!targetsRes.ok || !statsRes.ok || !pStatsRes.ok || !mStatsRes.ok) {
          alert("Failed to load summary stats for export");
          return;
        }
        const targetData = await targetsRes.json();
        const statsData = await statsRes.json();
        const projectStatsData = await pStatsRes.json();
        const marketingStatsData = await mStatsRes.json();
        const sTarget = targetData.salesTarget || 0;
        const hTarget = targetData.villasTarget || targetData.housesTarget || 0;
        const pTarget = targetData.plotsTarget || 0;
        const currentAchieved = {
          salesValue: statsData.current?.salesValue || 0,
          villasCount: statsData.current?.villasCount || statsData.current?.housesCount || 0,
          plotsCount: statsData.current?.plotsCount || 0
        };
        const lastMonthAchieved = {
          salesValue: statsData.lastMonth?.salesValue || 0,
          villasCount: statsData.lastMonth?.villasCount || statsData.lastMonth?.housesCount || 0,
          plotsCount: statsData.lastMonth?.plotsCount || 0
        };
        const projectTargetsMap = {};
        Object.keys(projectStatsData).forEach((projId) => {
          projectTargetsMap[projId] = { enquiries: 0, hotlist: 0, sitevisits: 0, booked: 0, value: 0 };
        });
        if (targetData.projectTargets) {
          targetData.projectTargets.forEach((pt) => {
            projectTargetsMap[pt.projectId] = {
              enquiries: pt.enquiriesTarget || 0,
              hotlist: pt.hotlistTarget || 0,
              sitevisits: pt.sitevisitsTarget || 0,
              booked: pt.bookedTarget || 0,
              value: pt.valueTarget || 0
            };
          });
        }
        const marketingTargetsMap = {};
        Object.keys(marketingStatsData.groups || {}).forEach((name) => {
          marketingTargetsMap[name] = 0;
        });
        marketingTargetsMap["LEADS GENERATED"] = 0;
        marketingTargetsMap["SITE VISIT CONVERSIONS"] = 0;
        if (targetData.marketingTargets) {
          targetData.marketingTargets.forEach((mt) => {
            marketingTargetsMap[mt.name] = mt.target || 0;
          });
        }
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const shortYear = dateForMonth.getFullYear().toString().substring(2);
        const shortMonthHeader = `${monthNames[dateForMonth.getMonth()].substring(0, 3)}-${shortYear}`;
        const todayFormatted = (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB").replace(/\//g, ".");
        const getPct = (act, tgt) => {
          if (!tgt || tgt <= 0) return "0.00%";
          return `${(act / tgt * 100).toFixed(2)}%`;
        };
        const getPctVal = (act, tgt) => {
          if (!tgt || tgt <= 0) return 0;
          return act / tgt * 100;
        };
        const marketingRowsList = [];
        let mSNo = 1;
        Object.keys(marketingStatsData.groups || {}).forEach((name) => {
          const statsObj = marketingStatsData.groups[name];
          const targetVal = marketingTargetsMap[name] || 0;
          marketingRowsList.push({
            sNo: mSNo++,
            name,
            target: targetVal,
            actual: statsObj.actual,
            w1: statsObj.w1,
            w2: statsObj.w2,
            w3: statsObj.w3,
            w4: statsObj.w4,
            isFloat: true
          });
        });
        const lgTarget = marketingTargetsMap["LEADS GENERATED"] || 0;
        const lgStats = marketingStatsData.static?.leadsGenerated || { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 };
        marketingRowsList.push({
          sNo: mSNo++,
          name: "LEADS GENERATED",
          target: lgTarget,
          actual: lgStats.actual,
          w1: lgStats.w1,
          w2: lgStats.w2,
          w3: lgStats.w3,
          w4: lgStats.w4,
          isFloat: false
        });
        const svcTarget = marketingTargetsMap["SITE VISIT CONVERSIONS"] || 0;
        const svcStats = marketingStatsData.static?.conversions || { actual: 0, w1: 0, w2: 0, w3: 0, w4: 0 };
        marketingRowsList.push({
          sNo: mSNo++,
          name: "SITE VISIT CONVERSIONS",
          target: svcTarget,
          actual: svcStats.actual,
          w1: svcStats.w1,
          w2: svcStats.w2,
          w3: svcStats.w3,
          w4: svcStats.w4,
          isFloat: false
        });
        let mTotalPct = 0;
        marketingRowsList.forEach((r) => {
          if (r.target && r.target > 0) mTotalPct += r.actual / r.target * 100;
        });
        const marketingPerformanceText = `${(mTotalPct / marketingRowsList.length).toFixed(2)}%`;
        const projKeys = Object.keys(projectStatsData);
        const firstProjId = projKeys[0];
        const firstProj = projectStatsData[firstProjId];
        const projCode = firstProj ? firstProj.code || firstProj.name || "JMD" : "JMD";
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#002060", "#d9e1f2", "#002060", "#b4c6e7")}
        </head>
        <body>
          <table>
            <thead>
              <tr style="height: 80px;">
                <td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: center; vertical-align: middle;">
                  <img src="${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" />
                  SALES PARAMETER REPORT
                </td>
              </tr>
              <tr>
                <th class="bg-header-green" style="width: 50px;">S.No</th>
                <th class="bg-header-green" style="width: 250px;">TOTAL SALES PROJECTION ${dateForMonth.getFullYear() - 1} - ${dateForMonth.getFullYear().toString().substring(2)}</th>
                <th class="bg-header-green" style="width: 180px;">TOTAL</th>
                <th class="bg-header-green" style="width: 80px;">UNIT</th>
                <th class="bg-header-green" style="width: 100px;">ACHIEVED</th>
                <th class="bg-header-green" style="width: 100px;">BALANCE</th>
                <th class="bg-header-green" style="width: 130px;">LAST MONTH ACHIEVED</th>
                <th colspan="3" rowspan="3" class="bg-header-green font-bold" style="font-size: 11pt; vertical-align: middle; text-align: center;">
                  ${shortMonthHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td class="text-left font-bold">Overall Sales Target</td>
                <td class="text-right font-bold">${sTarget}</td>
                <td>Crores</td>
                <td class="text-right">${currentAchieved.salesValue.toFixed(2)}</td>
                <td class="text-right">${Math.max(0, sTarget - currentAchieved.salesValue).toFixed(2)}</td>
                <td class="text-right">${lastMonthAchieved.salesValue.toFixed(2)}</td>
              </tr>
              <tr>
                <td>2</td>
                <td class="text-left font-bold">Total Houses to be Sold</td>
                <td class="text-right font-bold">${hTarget}</td>
                <td>Units</td>
                <td class="text-right">${currentAchieved.villasCount}</td>
                <td class="text-right">${Math.max(0, hTarget - currentAchieved.villasCount)}</td>
                <td class="text-right">${lastMonthAchieved.villasCount}</td>
              </tr>
              <tr>
                <td>3</td>
                <td class="text-left font-bold">Total Plots to be Sold</td>
                <td class="text-right font-bold">${pTarget}</td>
                <td>Units</td>
                <td class="text-right">${currentAchieved.plotsCount}</td>
                <td class="text-right">${Math.max(0, pTarget - currentAchieved.plotsCount)}</td>
                <td class="text-right">${lastMonthAchieved.plotsCount}</td>
                <td colspan="2" class="font-bold bg-header-green" style="font-size: 10pt;">DATE:</td>
                <td class="bg-header-green" style="font-size: 10pt;">${todayFormatted}</td>
              </tr>

              <!-- Spacing row -->
              <tr><td colspan="10" style="border: none; height: 15px;"></td></tr>

              <!-- PHASE 2: Project wise Report Headers -->
              <tr>
                <th class="bg-header-blue">S.NO.</th>
                <th class="bg-header-blue">PROJECT</th>
                <th class="bg-header-blue">DESCRIPTION</th>
                <th class="bg-header-blue">TARGET</th>
                <th class="bg-header-blue">ACTUAL</th>
                <th class="bg-header-blue">% ACHIEVED</th>
                <th class="bg-header-blue">1st Week Actual</th>
                <th class="bg-header-blue">2nd Week Actual</th>
                <th class="bg-header-blue">3rd Week Actual</th>
                <th class="bg-header-blue">4th Week Actual</th>
              </tr>
      `;
        let pTotalPct = 0;
        let pTotalRows = 0;
        projKeys.forEach((projId, index) => {
          const proj = projectStatsData[projId];
          const targets = projectTargetsMap[projId] || { enquiries: 0, hotlist: 0, sitevisits: 0, booked: 0, value: 0 };
          const rows = [
            { label: "Total Enquiries", target: targets.enquiries, actual: proj.enquiries.actual, w1: proj.enquiries.w1, w2: proj.enquiries.w2, w3: proj.enquiries.w3, w4: proj.enquiries.w4 },
            { label: "Site Visits", target: targets.sitevisits, actual: proj.sitevisits.actual, w1: proj.sitevisits.w1, w2: proj.sitevisits.w2, w3: proj.sitevisits.w3, w4: proj.sitevisits.w4 },
            { label: "Booked Units", target: targets.booked, actual: proj.bookedUnits.actual, w1: proj.bookedUnits.w1, w2: proj.bookedUnits.w2, w3: proj.bookedUnits.w3, w4: proj.bookedUnits.w4 },
            { label: "Booking Value", target: targets.value, actual: proj.bookingValue.actual, w1: proj.bookingValue.w1, w2: proj.bookingValue.w2, w3: proj.bookingValue.w3, w4: proj.bookingValue.w4, isFloat: true }
          ];
          rows.forEach((row, rIdx) => {
            const pctText = getPct(row.actual, row.target);
            pTotalPct += getPctVal(row.actual, row.target);
            pTotalRows += 1;
            html += `
            <tr>
              ${rIdx === 0 ? `<td rowspan="4" style="vertical-align: middle;">${index + 1}</td><td rowspan="4" class="font-bold" style="vertical-align: middle;">${proj.code || proj.name}</td>` : ""}
              <td class="text-left">${row.label}</td>
              <td class="text-right">${row.target}${row.isFloat ? " Cr" : ""}</td>
              <td class="text-right">${row.isFloat ? row.actual.toFixed(2) : row.actual}</td>
              <td class="font-bold">${pctText}</td>
              <td class="text-right">${row.isFloat ? row.w1.toFixed(2) : row.w1}</td>
              <td class="text-right">${row.isFloat ? row.w2.toFixed(2) : row.w2}</td>
              <td class="text-right">${row.isFloat ? row.w3.toFixed(2) : row.w3}</td>
              <td class="text-right">${row.isFloat ? row.w4.toFixed(2) : row.w4}</td>
            </tr>
          `;
          });
        });
        const projectPerformanceText = pTotalRows > 0 ? `${(pTotalPct / pTotalRows).toFixed(2)}%` : "0.00%";
        html += `
            <!-- Phase 2 Overall Average achieved -->
            <tr>
              <td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td>
              <td class="bg-orange-pct" style="font-size: 10pt; font-weight: bold; border: 1px solid #000000; text-align: center; vertical-align: middle;">${projectPerformanceText}</td>
              <td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td>
            </tr>

            <!-- Spacing row -->
            <tr><td colspan="10" style="border: none; height: 15px;"></td></tr>

            <!-- PHASE 3: Marketing Plan Table -->
            <tr style="height: 80px;">
              <td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: center; vertical-align: middle;">
                <img src="${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" />
                JB MARKETING PARAMETER REPORT
              </td>
            </tr>
            <tr style="height: 22px;">
              <td colspan="10" class="bg-header-green font-bold" style="font-size: 10pt; height: 22px; text-align: center; vertical-align: middle; text-transform: uppercase;">MONTH OF ${monthNames[dateForMonth.getMonth()].toUpperCase()} ${dateForMonth.getFullYear()}</td>
            </tr>
            <tr>
              <th class="bg-header-blue">S.NO.</th>
              <th colspan="2" class="bg-header-blue">DESCRIPTION</th>
              <th class="bg-header-blue">BUDGET/ TARGET</th>
              <th class="bg-header-blue">ACTUAL</th>
              <th class="bg-header-blue">% ACHIEVED</th>
              <th class="bg-header-blue">1st Week Actual</th>
              <th class="bg-header-blue">2nd Week Actual</th>
              <th class="bg-header-blue">3rd Week Actual</th>
              <th class="bg-header-blue">4th Week Actual</th>
            </tr>
      `;
        marketingRowsList.forEach((row) => {
          const pctText = getPct(row.actual, row.target);
          html += `
          <tr>
            <td>${row.sNo}</td>
            <td colspan="2" class="text-left font-bold">${row.name}</td>
            <td class="text-right">${row.isFloat ? "\u20B9 " : ""}${row.target.toLocaleString()}</td>
            <td class="text-right">${row.isFloat ? "\u20B9 " : ""}${row.isFloat ? row.actual.toFixed(2) : row.actual}</td>
            <td class="font-bold">${pctText}</td>
            <td class="text-right">${row.isFloat ? "\u20B9 " : ""}${row.isFloat ? row.w1.toFixed(2) : row.w1}</td>
            <td class="text-right">${row.isFloat ? "\u20B9 " : ""}${row.isFloat ? row.w2.toFixed(2) : row.w2}</td>
            <td class="text-right">${row.isFloat ? "\u20B9 " : ""}${row.isFloat ? row.w3.toFixed(2) : row.w3}</td>
            <td class="text-right">${row.isFloat ? "\u20B9 " : ""}${row.isFloat ? row.w4.toFixed(2) : row.w4}</td>
          </tr>
        `;
        });
        html += `
            <tr>
              <td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td>
              <td class="bg-orange-pct" style="font-size: 10pt; font-weight: bold; border: 1px solid #000000; text-align: center; vertical-align: middle;">${marketingPerformanceText}</td>
              <td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td><td class="bg-black-row"></td>
            </tr>
          </tbody>
          </table>
        </body>
        </html>
      `;
        handlePreview(html, `JB_SUMMARY_OF_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting summary report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportMarketingReport = async () => {
      try {
        setLoading(true);
        const groupData = stats.groupStats || {};
        if (Object.keys(groupData).length === 0) {
          alert("No marketing spend data found for the selected filters.");
          return;
        }
        const projectTitle = selectedProject ? stats.projects.find((p) => p._id === selectedProject)?.code || "PROJECT" : "";
        const titleText = projectTitle ? `JB - ${projectTitle.toUpperCase()} MARKETING PERFORMANCE REPORT` : `JB - MARKETING PERFORMANCE REPORT`;
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 7, "#1d4ed8", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S.No</th>
              <th>Lead Source Group</th>
              <th>Source Type</th>
              <th>Planned Budget</th>
              <th>Actual Spent</th>
              <th>% Spent vs Budget</th>
              <th>Turnover Value (Revenue)</th>
            </tr>
      `;
        let globalSNo = 1;
        let totalBudget = 0;
        let totalSpent = 0;
        let totalRevenue = 0;
        Object.keys(groupData).forEach((groupName) => {
          const groupObj = groupData[groupName];
          const sourcesList = groupObj.sources || [];
          html += `
          <tr>
            <td colspan="7" class="group-banner">${groupName.toUpperCase()}</td>
          </tr>
        `;
          sourcesList.forEach((src) => {
            const budgetVal = src.budget || 0;
            const spentVal = src.spent || 0;
            const revenueVal = src.value || 0;
            const pctSpent = budgetVal > 0 ? `${(spentVal / budgetVal * 100).toFixed(1)}%` : "0.0%";
            totalBudget += budgetVal;
            totalSpent += spentVal;
            totalRevenue += revenueVal;
            html += `
            <tr>
              <td>${globalSNo++}</td>
              <td class="text-left font-semibold" style="color: #555555;">${groupName}</td>
              <td class="text-left font-bold">${src.source}</td>
              <td class="text-right">\u20B9 ${budgetVal.toLocaleString()}</td>
              <td class="text-right">\u20B9 ${spentVal.toLocaleString()}</td>
              <td>${pctSpent}</td>
              <td class="text-right">\u20B9 ${revenueVal.toLocaleString()}</td>
            </tr>
          `;
          });
          const groupBudget = groupObj.budget || 0;
          const groupSpent = groupObj.spent || 0;
          const groupValue = groupObj.value || 0;
          const groupPct = groupBudget > 0 ? `${(groupSpent / groupBudget * 100).toFixed(1)}%` : "0.0%";
          html += `
          <tr class="subtotal-row">
            <td></td>
            <td colspan="2" class="text-left">SUBTOTAL: ${groupName.toUpperCase()}</td>
            <td class="text-right">\u20B9 ${groupBudget.toLocaleString()}</td>
            <td class="text-right">\u20B9 ${groupSpent.toLocaleString()}</td>
            <td>${groupPct}</td>
            <td class="text-right">\u20B9 ${groupValue.toLocaleString()}</td>
          </tr>
        `;
        });
        const grandPct = totalBudget > 0 ? `${(totalSpent / totalBudget * 100).toFixed(1)}%` : "0.0%";
        html += `
        <tr class="total-row">
          <td></td>
          <td colspan="2" class="text-left">GRAND TOTAL</td>
          <td class="text-right">\u20B9 ${totalBudget.toLocaleString()}</td>
          <td class="text-right">\u20B9 ${totalSpent.toLocaleString()}</td>
          <td>${grandPct}</td>
          <td class="text-right">\u20B9 ${totalRevenue.toLocaleString()}</td>
        </tr>
      `;
        html += `
          </table>
        </body>
        </html>
      `;
        handlePreview(html, `JB_MARKETING_RETURNS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting marketing returns report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportLeadSourcesExcel = async () => {
      try {
        setLoading(true);
        const activeMonthStr = fromDate.substring(0, 7);
        const [groupsRes, targetsRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/lead-groups`, {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(`${API_URL}/lead-targets/${activeMonthStr}`, {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(`${API_URL}/leads/target-stats/${activeMonthStr}`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);
        if (!groupsRes.ok || !targetsRes.ok || !statsRes.ok) {
          alert("Failed to load lead sources data for export");
          return;
        }
        const activeGroups = await groupsRes.json();
        const targetData = await targetsRes.json();
        const statsData = await statsRes.json();
        const targetMap = {};
        activeGroups.forEach((group) => {
          group.sources?.forEach((src) => {
            targetMap[src] = 0;
          });
        });
        if (targetData && targetData.targets) {
          targetData.targets.forEach((t) => {
            targetMap[t.source] = t.target || 0;
          });
        }
        const actualMap = {};
        const convMap = {};
        statsData.actual?.forEach((item) => {
          actualMap[item._id] = item.count || 0;
        });
        statsData.conversions?.forEach((item) => {
          convMap[item._id] = item.count || 0;
        });
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader("JB - LEAD SOURCES PERFORMANCE REPORT", monthTitle, 5, "#0d9488", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S.No</th>
              <th>LEAD SOURCE</th>
              <th>TARGET</th>
              <th>ACTUAL</th>
              <th>SITE VISIT CONVERSIONS</th>
            </tr>
      `;
        let globalSNo = 1;
        let totalTarget = 0;
        let totalActual = 0;
        let totalConversions = 0;
        activeGroups.forEach((group) => {
          group.sources?.forEach((src) => {
            const targetVal = targetMap[src] || 0;
            const actualVal = actualMap[src] || 0;
            const convVal = convMap[src] || 0;
            totalTarget += targetVal;
            totalActual += actualVal;
            totalConversions += convVal;
            html += `
            <tr>
              <td>${globalSNo++}</td>
              <td class="text-left font-bold" style="text-transform: capitalize;">${src}</td>
              <td>${targetVal || ""}</td>
              <td>${actualVal || ""}</td>
              <td>${convVal || ""}</td>
            </tr>
          `;
          });
        });
        html += `
        <tr class="total-row">
          <td colspan="2">TOTAL</td>
          <td>${totalTarget}</td>
          <td>${totalActual}</td>
          <td>${totalConversions}</td>
        </tr>
      `;
        html += `
          </table>
        </body>
        </html>
      `;
        handlePreview(html, `JB_LEAD_SOURCES_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting lead sources report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportNPACollectedReport = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/crd-flow`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load NPA Collected Report details for export");
          return;
        }
        const data = await res.json();
        const filtered = data.filter((flow) => {
          if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return false;
          if (selectedUser && (flow.lead?.assignedTo?._id || flow.lead?.assignedTo) !== selectedUser) return false;
          return true;
        });
        if (filtered.length === 0) {
          alert("No NPA Collected records found for the selected filters.");
          return;
        }
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const targetMonth = dateForMonth.getMonth();
        const targetYear = dateForMonth.getFullYear();
        const getWeeklyCollections2 = (flow) => {
          let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
          if (flow.stages) {
            flow.stages.forEach((stage) => {
              if (stage.payments) {
                stage.payments.forEach((p) => {
                  const pDate = new Date(p.date);
                  if (pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear) {
                    const day = pDate.getDate();
                    const amt = Number(p.amount) || 0;
                    if (day >= 1 && day <= 7) w1 += amt;
                    else if (day >= 8 && day <= 14) w2 += amt;
                    else if (day >= 15 && day <= 21) w3 += amt;
                    else w4 += amt;
                  }
                });
              }
            });
          }
          return { w1, w2, w3, w4 };
        };
        const projectTitle = selectedProject ? stats.projects.find((p) => p._id === selectedProject)?.code || "PROJECT" : "";
        const titleText = projectTitle ? `JB - ${projectTitle.toUpperCase()} NPA COLLECTED REPORT` : `JB - NPA COLLECTED REPORT`;
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthTitle = `MONTH OF ${monthNames[targetMonth]} - ${targetYear}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#0E623A", "#D1FAE5", "#0E623A", "#0E623A")}
        </head>
        <body>
          <table>
            <col width="60" />
            <col width="250" />
            <col width="150" />
            <col width="150" />
            <col width="150" />
            <col width="150" />
            <col width="150" />
            <col width="120" />
            <col width="120" />
            <col width="120" />
            <col width="120" />
            ${getExcelHeader(titleText, monthTitle, 11, "#0E623A", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S.NO.</th>
              <th>LEAD NAME</th>
              <th>PROJECT TYPE</th>
              <th>UNIT NO</th>
              <th>TOTAL AMOUNT</th>
              <th>DEBTORS AMOUNT</th>
              <th>TARGET AMOUNT</th>
              <th>WEEK 1</th>
              <th>WEEK 2</th>
              <th>WEEK 3</th>
              <th>WEEK 4</th>
            </tr>
      `;
        filtered.forEach((flow, index) => {
          const weeks = getWeeklyCollections2(flow);
          const rowClass = index % 2 === 1 ? 'class="even-row"' : "";
          const projType = Array.isArray(flow.project?.projectType) ? flow.project.projectType.join(", ") : flow.project?.projectType || "N/A";
          html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td class="text-left bold-label">${flow.lead?.name || "N/A"}</td>
            <td>${projType}</td>
            <td>${flow.unitId || "N/A"}</td>
            <td class="text-right">${(flow.totalCurrentValue || 0).toLocaleString()}</td>
            <td class="text-right">${(flow.debtorsAmount || 0).toLocaleString()}</td>
            <td class="text-right">${(flow.targetAmount || 0).toLocaleString()}</td>
            <td class="text-right">${weeks.w1.toLocaleString()}</td>
            <td class="text-right">${weeks.w2.toLocaleString()}</td>
            <td class="text-right">${weeks.w3.toLocaleString()}</td>
            <td class="text-right">${weeks.w4.toLocaleString()}</td>
          </tr>
        `;
        });
        html += `
          </table>
        </body>
        </html>
      `;
        handlePreview(html, `JB_NPA_COLLECTED_REPORT_${targetYear}_${targetMonth + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting NPA Collected Report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportRegistrationReport = async (options = {}) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/crd-flow`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load CRD flows details for export");
          return;
        }
        const data = await res.json();
        const filtered = data.filter((flow) => {
          const lead = flow.lead;
          if (!lead) return false;
          if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return false;
          if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;
          const createdAt = new Date(flow.createdAt);
          if (fromDate && createdAt < new Date(fromDate)) return false;
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (createdAt > end) return false;
          }
          return true;
        });
        if (filtered.length === 0) {
          alert("No registration records found for the selected filters.");
          return;
        }
        const projectTitle = selectedProject ? stats.projects.find((p) => p._id === selectedProject)?.code || "PROJECT" : "";
        const titleText = projectTitle ? `${projectTitle.toUpperCase()} REGISTRATION THIS MONTH TARGET` : `REGISTRATION THIS MONTH TARGET`;
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;
        const registeredFlows = [];
        const pendingFlows = [];
        filtered.forEach((flow) => {
          const stages = flow.stages || [];
          const agreementStage = stages.find((s) => s.name.toLowerCase().includes("agreement")) || (stages.length > 1 ? stages[1] : null);
          let isRegistered = false;
          if (agreementStage) {
            const stageTotal = agreementStage.amount || 0;
            const stagePaid = agreementStage.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            if (agreementStage.isCompleted || stageTotal > 0 && stagePaid >= stageTotal) {
              isRegistered = true;
            }
          }
          if (isRegistered) {
            registeredFlows.push(flow);
          } else {
            pendingFlows.push(flow);
          }
        });
        const groupedRegistered = {};
        registeredFlows.forEach((flow) => {
          const projCode = flow.project?.code || "UNASSIGNED";
          if (!groupedRegistered[projCode]) groupedRegistered[projCode] = [];
          groupedRegistered[projCode].push(flow);
        });
        const groupedPending = {};
        pendingFlows.forEach((flow) => {
          const projCode = flow.project?.code || "UNASSIGNED";
          if (!groupedPending[projCode]) groupedPending[projCode] = [];
          groupedPending[projCode].push(flow);
        });
        const buildRowsHtml = (groupedData) => {
          let rowsHtml = "";
          let localSNo = 1;
          Object.keys(groupedData).forEach((projCode) => {
            rowsHtml += `
            <tr>
              <td colspan="6" class="group-banner">${projCode.toUpperCase()}</td>
            </tr>
          `;
            groupedData[projCode].forEach((flow, idx) => {
              const lead = flow.lead || {};
              const advDate = lead.bookingInfo?.bookingDate ? new Date(lead.bookingInfo.bookingDate).toLocaleDateString("en-GB").replace(/\//g, ".") : "";
              const plotNo = flow.unitId || lead.bookingInfo?.selectedUnits?.join(" & ") || "";
              const custName = lead.name || "";
              const pType = flow.project?.projectType;
              const typeRaw = (Array.isArray(pType) ? pType.join(", ") : pType || "").toLowerCase();
              let houseType = "Plots";
              if (typeRaw.includes("villa") || typeRaw.includes("house") || typeRaw.includes("individual")) {
                houseType = "Villa";
              } else if (typeRaw.includes("apartment") || typeRaw.includes("flat")) {
                houseType = "Flat";
              }
              const lastFlowNote = flow.history && flow.history.length > 0 ? flow.history[flow.history.length - 1].notes || flow.history[flow.history.length - 1].action : "";
              const commentsStr = lastFlowNote || lead.closeRemarks || "";
              const rowClass = idx % 2 === 1 ? 'class="even-row"' : "";
              rowsHtml += `
              <tr ${rowClass}>
                <td>${localSNo++}</td>
                <td>${advDate}</td>
                <td>${projCode}</td>
                <td>${plotNo}</td>
                <td class="text-left bold-label">${custName}</td>
                <td>${houseType}</td>
              </tr>
            `;
            });
          });
          return rowsHtml;
        };
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, monthTitle, 6, "#7c3aed", logoPath)}
            
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Adv Date</th>
              <th>Project</th>
              <th>Plot No</th>
              <th>Customer Name</th>
              <th>Project Type</th>
            </tr>
            
            <!-- REGISTERED STAGE LEADS (REGISTRATION THIS MONTH TARGET) -->
            ${buildRowsHtml(groupedRegistered)}

            <!-- REGISTRATION PENDING HEADER -->
            <tr>
              <td colspan="6" class="section-banner">REGISTRATION PENDING</td>
            </tr>
            <tr class="table-headers">
              <th>S No</th>
              <th>Adv Date</th>
              <th>Project</th>
              <th>Plot No</th>
              <th>Customer Name</th>
              <th>Project Type</th>
            </tr>

            <!-- PENDING STAGE LEADS (REGISTRATION PENDING) -->
            ${buildRowsHtml(groupedPending)}
          </table>
        </body>
        </html>
      `;
        if (options.returnWorksheet) {
          return htmlToStyledSheet(html, XLSX);
        }
        handlePreview(html, `JB_REGISTRATION_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting registration report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportKeyHandoverReport = async (options = {}) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/crd-flow`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load CRD flows details for export");
          return;
        }
        const data = await res.json();
        const filtered = data.filter((flow) => {
          const lead = flow.lead;
          if (!lead) return false;
          if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return false;
          if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return false;
          const createdAt = new Date(flow.createdAt);
          if (fromDate && createdAt < new Date(fromDate)) return false;
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (createdAt > end) return false;
          }
          return true;
        });
        if (filtered.length === 0) {
          alert("No CRD Flow records found for the selected filters.");
          return;
        }
        const completedFlows = [];
        const pendingFlows = [];
        filtered.forEach((flow) => {
          const stages = flow.stages || [];
          const handoverStage = stages.find((s) => s.name.toLowerCase().includes("handing over") || s.name.toLowerCase().includes("handover")) || stages[stages.length - 1];
          if (handoverStage && handoverStage.isCompleted) {
            completedFlows.push(flow);
          } else {
            pendingFlows.push(flow);
          }
        });
        const projectTitle = selectedProject ? stats.projects.find((p) => p._id === selectedProject)?.code || "PROJECT" : "";
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthTitle = `MONTH OF ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader("KEY HANDOVER REPORT", monthTitle, 6, "#7c3aed", logoPath)}
            <tr class="table-headers">
              <th>S.no</th>
              <th>Adv Date</th>
              <th>Customer Name</th>
              <th>Project Type</th>
              <th>Unit No</th>
              <th>Status (Key Handover Pending or Completed)</th>
            </tr>
      `;
        filtered.forEach((flow, index) => {
          const lead = flow.lead || {};
          const advDate = lead.bookingInfo?.bookingDate ? new Date(lead.bookingInfo.bookingDate).toLocaleDateString("en-GB").replace(/\//g, ".") : "";
          const custName = lead.name || "";
          const unitNo = flow.unitId || "";
          const stages = flow.stages || [];
          const handoverStage = stages.find((s) => s.name.toLowerCase().includes("handing over") || s.name.toLowerCase().includes("handover")) || stages[stages.length - 1];
          const isCompleted = handoverStage && handoverStage.isCompleted;
          const statusText = isCompleted ? "Completed" : "Key Handover Pending";
          const pType = flow.project?.projectType;
          const typeRaw = (Array.isArray(pType) ? pType.join(", ") : pType || "").toLowerCase();
          let projectType = "Villa";
          if (typeRaw.includes("villa") || typeRaw.includes("house") || typeRaw.includes("individual")) {
            projectType = "Villa";
          } else if (typeRaw.includes("apartment") || typeRaw.includes("flat")) {
            projectType = "Flat";
          } else {
            projectType = "Land";
          }
          const rowClass = index % 2 === 1 ? 'class="even-row"' : "";
          html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${advDate}</td>
            <td class="text-left bold-label">${custName}</td>
            <td>${projectType}</td>
            <td>${unitNo}</td>
            <td>${statusText}</td>
          </tr>
        `;
        });
        html += `
          </table>
        </body>
        </html>
      `;
        if (options.returnWorksheet) {
          return htmlToStyledSheet(html, XLSX);
        }
        handlePreview(html, `JB_KEY_HANDOVER_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting key handover report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportCollectionReport = async (options = {}) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/crd-flow`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load CRD flows details for export");
          return;
        }
        const data = await res.json();
        const paymentsList = [];
        data.forEach((flow) => {
          const lead = flow.lead;
          if (!lead) return;
          if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return;
          if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return;
          const stages = flow.stages || [];
          let leadTotalPaidAllTime = 0;
          const dailyPayments = {};
          stages.forEach((stage) => {
            const payments = stage.payments || [];
            payments.forEach((pay) => {
              leadTotalPaidAllTime += pay.amount || 0;
              const payDate = new Date(pay.date);
              if (fromDate && payDate < new Date(fromDate)) return;
              if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                if (payDate > end) return;
              }
              const dateStr = payDate.toDateString();
              if (!dailyPayments[dateStr]) {
                dailyPayments[dateStr] = {
                  date: payDate,
                  amount: 0
                };
              }
              dailyPayments[dateStr].amount += pay.amount || 0;
            });
          });
          const totalValue = flow.totalCurrentValue || 0;
          const pendingValue = totalValue - leadTotalPaidAllTime;
          Object.values(dailyPayments).forEach((group) => {
            paymentsList.push({
              customerName: lead.name || "",
              projectCode: flow.project?.code || "UNASSIGNED",
              plotNo: flow.unitId || "",
              date: group.date,
              totalAmount: totalValue,
              pendingAmount: pendingValue,
              amount: group.amount
            });
          });
        });
        if (paymentsList.length === 0) {
          alert("No collections found for the selected filters.");
          return;
        }
        paymentsList.sort((a, b) => a.date - b.date);
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthName = monthNames[dateForMonth.getMonth()];
        const titleText = `COLLECTION REPORT - ${monthName}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 8, "#7c3aed", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Project</th>
              <th>Unit</th>
              <th>Total Amount</th>
              <th>Pending Amount</th>
              <th>Received Amount</th>
            </tr>
      `;
        let totalAmount = 0;
        paymentsList.forEach((pay, index) => {
          const dateStr = pay.date.toLocaleDateString("en-GB").replace(/\//g, ".");
          totalAmount += pay.amount;
          const rowClass = index % 2 === 1 ? 'class="even-row"' : "";
          html += `
          <tr ${rowClass}>
            <td class="text-center">${index + 1}</td>
            <td class="text-center">${dateStr}</td>
            <td class="text-left bold-label">${pay.customerName}</td>
            <td class="text-center">${pay.projectCode}</td>
            <td class="text-center">${pay.plotNo}</td>
            <td class="text-right">\u20B9 ${pay.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">\u20B9 ${pay.pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">\u20B9 ${pay.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
        });
        html += `
        <tr class="subtotal-row">
          <td colspan="7" class="text-right">TOTAL</td>
          <td class="text-right">\u20B9 ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
        html += `
          </table>
        </body>
        </html>
      `;
        if (options.returnWorksheet) {
          return htmlToStyledSheet(html, XLSX);
        }
        handlePreview(html, `JB_COLLECTION_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting collection report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportBankLoanReport = async (options = {}) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/crd-flow`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const leadsRes = await fetch(`${API_URL}/leads?status=Booking,Cancelled`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load CRD flows details for export");
          return;
        }
        const flowsData = await res.json();
        let allFlows = [...flowsData];
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          const pendingLoanLeads = leadsData.filter((l) => (l.bankLoan === "Yes" || l.bookingInfo?.hasLoan === "Yes") && !flowsData.some((f) => f.lead?._id === l._id));
          const mockFlows = pendingLoanLeads.map((lead) => ({
            _id: `mock-${lead._id}`,
            project: lead.project || {},
            lead,
            unitId: lead.bookingInfo?.selectedUnits?.join(", ") || "N/A",
            totalCurrentValue: lead.bookingInfo?.loanDetails?.amountRequired || 0,
            stages: [],
            createdAt: lead.createdAt
          }));
          allFlows = [...allFlows, ...mockFlows];
        }
        const getClientLoanDetails = (flow) => {
          let bankLoanPaid = flow.lead?.bookingInfo?.loanDetails?.disbursedAmount || 0;
          let bankLoanPending = 0;
          const loanPayments = [];
          (flow.stages || []).forEach((stage, sIdx) => {
            const stageLoanPayments = (stage.payments || []).filter((p) => p.method === "Bank Loan");
            stageLoanPayments.forEach((p) => {
              bankLoanPaid += p.amount;
              loanPayments.push(p);
            });
            const stagePaidTotal = (stage.payments || []).reduce((sum, p) => sum + p.amount, 0);
            const stagePending = Math.max(0, stage.amount - stagePaidTotal);
            const hasBankLoanPayment = stageLoanPayments.length > 0;
            const isBankLoanCustomer = flow.lead?.bankLoan === "Yes" || flow.lead?.bookingInfo?.hasLoan === "Yes";
            if (hasBankLoanPayment || isBankLoanCustomer || (flow.stages || []).some((s) => (s.payments || []).some((p) => p.method === "Bank Loan"))) {
              bankLoanPending += stagePending;
            }
          });
          const preferredBank = (flow.stages || []).flatMap((s) => s.payments || []).find((p) => p.method === "Bank Loan")?.details?.preferredBank || flow.lead?.bookingInfo?.loanDetails?.preferredBank || "N/A";
          const accountNumber = (flow.stages || []).flatMap((s) => s.payments || []).find((p) => p.method === "Bank Loan")?.details?.accountNumber || flow.lead?.bookingInfo?.loanDetails?.accountNumber || "N/A";
          let loanStatus = flow.lead?.bookingInfo?.loanDetails?.loanStatus || "Pending";
          return { bankLoanPaid, bankLoanPending, loanPayments, preferredBank, accountNumber, loanStatus };
        };
        let loanClients = allFlows.map((flow) => {
          return { flow, ...getClientLoanDetails(flow) };
        }).filter((c) => {
          const isYesType = c.flow.lead?.bankLoan === "Yes" || c.flow.lead?.bookingInfo?.hasLoan === "Yes";
          return isYesType || c.loanPayments.length > 0;
        });
        loanClients = loanClients.filter((c) => {
          if (selectedProject && (c.flow.project?._id || c.flow.project) !== selectedProject) return false;
          if (selectedUser && (c.flow.lead?.assignedTo?._id || c.flow.lead?.assignedTo) !== selectedUser) return false;
          return true;
        });
        if (loanClients.length === 0) {
          alert("No bank loan collection records found for the selected filters.");
          return;
        }
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const titleText = `BANK LOAN CUSTOMERS REPORT - ${monthNames[dateForMonth.getMonth()]} ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 10, "#7c3aed", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Customer Name</th>
              <th>Project</th>
              <th>Plot/Unit No</th>
              <th>Project Value</th>
              <th>Financing Bank</th>
              <th>Account Number</th>
              <th>Status</th>
              <th>Loan Disbursed</th>
              <th>Loan Pending</th>
            </tr>
      `;
        let totalDisbursed = 0;
        let totalPending = 0;
        loanClients.forEach((client, index) => {
          totalDisbursed += client.bankLoanPaid;
          totalPending += client.bankLoanPending;
          const rowClass = index % 2 === 1 ? 'class="even-row"' : "";
          const projCode = client.flow.project?.code || "UNASSIGNED";
          const unitId = client.flow.unitId || "";
          html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td class="text-left bold-label">${client.flow.lead?.name || "N/A"}</td>
            <td>${projCode}</td>
            <td>${unitId}</td>
            <td class="text-right">\u20B9 ${(client.flow.totalCurrentValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${client.preferredBank}</td>
            <td>${client.accountNumber !== "N/A" ? client.accountNumber : ""}</td>
            <td style="font-weight: bold; color: ${client.loanStatus === "Approved" ? "#1d4ed8" : "#b45309"}">${client.loanStatus}</td>
            <td class="text-right text-emerald-800 font-bold">\u20B9 ${client.bankLoanPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right text-amber-700 font-bold">\u20B9 ${client.bankLoanPending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
        });
        html += `
        <tr class="subtotal-row">
          <td colspan="8" class="text-right">TOTAL</td>
          <td class="text-right text-emerald-800 font-bold">\u20B9 ${totalDisbursed.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-right text-amber-700 font-bold">\u20B9 ${totalPending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
        html += `
          </table>
        </body>
        </html>
      `;
        if (options.returnWorksheet) {
          return htmlToStyledSheet(html, XLSX);
        }
        handlePreview(html, `JB_BANK_LOAN_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting bank loan report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportExtraWorksReport = async (options = {}) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/crd-flow`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load CRD flows details for export");
          return;
        }
        const data = await res.json();
        const extraWorksList = [];
        data.forEach((flow) => {
          const lead = flow.lead;
          if (!lead) return;
          if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return;
          if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return;
          const stages = flow.stages || [];
          stages.forEach((stage) => {
            const extras = stage.extraWorks || [];
            extras.forEach((ew) => {
              const addedDate = new Date(ew.addedAt || flow.createdAt);
              if (fromDate && addedDate < new Date(fromDate)) return;
              if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                if (addedDate > end) return;
              }
              extraWorksList.push({
                projectCode: flow.project?.code || "UNASSIGNED",
                projectType: flow.project?.projectType || "Land",
                customerName: lead.name || "",
                contactNumber: lead.phone || "",
                extraWorkName: ew.name || "",
                value: ew.amount || 0,
                status: stage.isCompleted ? "Completed" : "Pending",
                addedAt: addedDate
              });
            });
          });
        });
        if (extraWorksList.length === 0) {
          alert("No extra works records found for the selected filters.");
          return;
        }
        extraWorksList.sort((a, b) => a.addedAt - b.addedAt);
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const titleText = `EXTRA WORKS REPORT - ${monthNames[dateForMonth.getMonth()]} ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 7, "#7c3aed", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Project Type</th>
              <th>Customer Name</th>
              <th>Contact Number</th>
              <th>Extra Work</th>
              <th>Value of Work</th>
              <th>Status</th>
            </tr>
      `;
        let totalValue = 0;
        extraWorksList.forEach((ew, index) => {
          totalValue += ew.value;
          const phoneStr = ew.contactNumber ? `'${ew.contactNumber}` : "";
          const rowClass = index % 2 === 1 ? 'class="even-row"' : "";
          html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${ew.projectType} (${ew.projectCode})</td>
            <td class="text-left bold-label">${ew.customerName}</td>
            <td>${phoneStr}</td>
            <td class="text-left">${ew.extraWorkName}</td>
            <td class="text-right">\u20B9 ${ew.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="font-weight: bold; color: ${ew.status === "Completed" ? "#16a34a" : "#ea580c"}">${ew.status}</td>
          </tr>
        `;
        });
        html += `
        <tr class="subtotal-row">
          <td colspan="5" class="text-right">TOTAL VALUE OF EXTRA WORKS</td>
          <td class="text-right">\u20B9 ${totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td></td>
        </tr>
      `;
        html += `
          </table>
        </body>
        </html>
      `;
        if (options.returnWorksheet) {
          return htmlToStyledSheet(html, XLSX);
        }
        handlePreview(html, `JB_EXTRA_WORKS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting extra works report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportComplaintsReport = async (options = {}) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/crd-flow`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          alert("Failed to load CRD flows details for export");
          return;
        }
        const data = await res.json();
        const complaintsList = [];
        data.forEach((flow) => {
          const lead = flow.lead;
          if (!lead) return;
          if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return;
          if (selectedUser && (lead.assignedTo?._id || lead.assignedTo) !== selectedUser) return;
          const complaints = flow.complaints || [];
          complaints.forEach((comp) => {
            const compDate = new Date(comp.reportedAt);
            if (fromDate && compDate < new Date(fromDate)) return;
            if (toDate) {
              const end = new Date(toDate);
              end.setHours(23, 59, 59, 999);
              if (compDate > end) return;
            }
            complaintsList.push({
              reportedDate: compDate,
              customerName: lead.name || "",
              projectType: flow.project?.projectType || "Land",
              projectCode: flow.project?.code || "UNASSIGNED",
              unitId: flow.unitId || "",
              description: comp.description || "",
              status: comp.status || "Pending"
            });
          });
        });
        if (complaintsList.length === 0) {
          alert("No complaints found matching the active filters to export.");
          return;
        }
        complaintsList.sort((a, b) => a.reportedDate - b.reportedDate);
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const titleText = `CUSTOMER COMPLAINTS REPORT - ${monthNames[dateForMonth.getMonth()]} ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 7, "#7c3aed", logoPath)}
            <!-- Table Headers -->
            <tr class="table-headers">
              <th>S No</th>
              <th>Reported Date</th>
              <th>Customer Name</th>
              <th>Project Type</th>
              <th>Unit / Flat / Plot No</th>
              <th>Complaint</th>
              <th>Status</th>
            </tr>
      `;
        complaintsList.forEach((comp, index) => {
          const dateStr = comp.reportedDate.toLocaleDateString("en-GB").replace(/\//g, ".");
          let statusColor = "#ea580c";
          if (comp.status === "Resolved") statusColor = "#16a34a";
          else if (comp.status === "In Progress") statusColor = "#2563eb";
          const rowClass = index % 2 === 1 ? 'class="even-row"' : "";
          html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td>${dateStr}</td>
            <td class="text-left bold-label">${comp.customerName}</td>
            <td>${comp.projectType} (${comp.projectCode})</td>
            <td>${comp.unitId}</td>
            <td class="text-left">${comp.description}</td>
            <td style="font-weight: bold; color: ${statusColor};">${comp.status}</td>
          </tr>
        `;
        });
        html += `
          </table>
        </body>
        </html>
      `;
        if (options.returnWorksheet) {
          return htmlToStyledSheet(html, XLSX);
        }
        handlePreview(html, `JB_COMPLAINTS_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting customer complaints report");
      } finally {
        setLoading(false);
      }
    };
    const getWeeklyCollections = (flow) => {
      const now = /* @__PURE__ */ new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
      if (flow.stages) {
        flow.stages.forEach((stage) => {
          if (stage.payments) {
            stage.payments.forEach((p) => {
              const pDate = new Date(p.date);
              if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
                const day = pDate.getDate();
                const amt = Number(p.amount) || 0;
                if (day >= 1 && day <= 7) w1 += amt;
                else if (day >= 8 && day <= 14) w2 += amt;
                else if (day >= 15 && day <= 21) w3 += amt;
                else w4 += amt;
              }
            });
          }
        });
      }
      return { w1, w2, w3, w4 };
    };
    const handleExportNPAReport = async (options = {}) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/crd-flow`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch CRD Flows");
        const data = await res.json();
        const filteredFlows = data.filter((flow) => {
          if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return false;
          if (selectedUser && (flow.lead?.assignedTo?._id || flow.lead?.assignedTo) !== selectedUser) return false;
          return true;
        });
        if (filteredFlows.length === 0) {
          alert("No records found for the selected filters.");
          return;
        }
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const titleText = `OVERALL COLLECTED REPORT - ${monthNames[dateForMonth.getMonth()]} ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#9BC2E6", "#C6E0B4", "#9BC2E6", "#9BC2E6")}
        </head>
        <body>
          <table>
            ${getExcelHeader(titleText, "", 11, "#7c3aed", logoPath)}
            <tr class="table-headers">
              <th>S.No</th>
              <th>Lead Name</th>
              <th>Project Type</th>
              <th>Unit No</th>
              <th>Total Amount</th>
              <th>Debtors Amount</th>
              <th>Target Amount</th>
              <th>Week 1</th>
              <th>Week 2</th>
              <th>Week 3</th>
              <th>Week 4</th>
            </tr>
      `;
        filteredFlows.forEach((flow, index) => {
          const weeks = getWeeklyCollections(flow);
          const rowClass = index % 2 === 1 ? 'class="even-row"' : "";
          const projectType = Array.isArray(flow.project?.projectType) ? flow.project.projectType.join(", ") : flow.project?.projectType || "N/A";
          html += `
          <tr ${rowClass}>
            <td>${index + 1}</td>
            <td class="text-left bold-label">${flow.lead?.name || "N/A"}</td>
            <td>${projectType}</td>
            <td>${flow.unitId || "N/A"}</td>
            <td class="text-right font-bold">\u20B9 ${(flow.totalCurrentValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right" style="color: #e11d48; font-weight: bold;">\u20B9 ${(flow.debtorsAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right" style="color: #0e623a; font-weight: bold;">\u20B9 ${(flow.targetAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">\u20B9 ${weeks.w1.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">\u20B9 ${weeks.w2.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">\u20B9 ${weeks.w3.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right">\u20B9 ${weeks.w4.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
        });
        html += `
          </table>
        </body>
        </html>
      `;
        if (options.returnWorksheet) {
          return htmlToStyledSheet(html, XLSX);
        }
        handlePreview(html, `JB_OVERALL_COLLECTED_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting NPA Collected Report");
      } finally {
        setLoading(false);
      }
    };
    const handleExportParameterReport = async (options = {}) => {
      try {
        setLoading(true);
        const dateForMonth = fromDate ? new Date(fromDate) : /* @__PURE__ */ new Date();
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthStr = `${dateForMonth.getFullYear()}-${String(dateForMonth.getMonth() + 1).padStart(2, "0")}`;
        const res = await fetch(`${API_URL}/parameter-plans/${monthStr}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch parameter data");
        const data = await res.json();
        const fmt = (val, isFloat) => {
          if (val === void 0 || val === null) return 0;
          return isFloat ? Number(val).toFixed(2) : Math.round(val);
        };
        const calculatePercentage = (actual, target) => {
          if (!target || target <= 0) return "0%";
          const pct = actual / target * 100;
          return `${pct.toFixed(0)}%`;
        };
        const rows = [
          { label: "No.of Registrations ( 45 days)", key: "registrationsTarget", actKey: "registrations", unit: "Nos", isFloat: false },
          { label: "No.of Key Handover", key: "keyHandoverTarget", actKey: "keyHandover", unit: "Nos", isFloat: false },
          { label: "Total Debtors", key: "totalDebtorsTarget", actKey: "totalDebtors", unit: "Cr", isFloat: true },
          { label: "Collection Amount (<60 Days)", key: "collectionAmountTarget", actKey: "collectionAmount", unit: "Cr", isFloat: true },
          { label: "NPA Value (>60 Days)", key: "npaValueTarget", actKey: "npaValue", unit: "Cr", isFloat: true },
          { label: "Bank Loans (15 Days)", key: "bankLoansTarget", actKey: "bankLoans", unit: "Nos", isFloat: false },
          { label: "Critical Customers Issues fixed", key: "criticalIssuesTarget", actKey: "criticalIssues", unit: "Nos", isFloat: false },
          { label: "Customer Complaints (15 Days)", key: "customerComplaintsTarget", actKey: "customerComplaints", unit: "Nos", isFloat: false },
          { label: "Additional Work Approvals (15 days)", key: "extraWorksTarget", actKey: "extraWorks", unit: "Nos", isFloat: false }
        ];
        const monthYearTitle = `COLLECTION PARAMETER REPORT ${monthNames[dateForMonth.getMonth()]} - ${dateForMonth.getFullYear()}`;
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${getExcelStyles("#FCE4D6", "#DDEBF7", "#FCE4D6", "#DDEBF7")}
        </head>
        <body>
          <table>
            ${getExcelHeader("JB - COLLECTION PARAMETER REPORT", monthYearTitle, 12, "#16a34a", logoPath)}
            
            <tr class="table-headers">
              <th colspan="7"></th>
              <th class="bg-header-green">Week 1</th>
              <th class="bg-header-green">Week 2</th>
              <th class="bg-header-green">Week 3</th>
              <th class="bg-header-green">Week 4</th>
              <th class="bg-header-green">Week 5</th>
            </tr>
            <tr class="table-headers" style="background-color: #A64040; color: white;">
              <th>S NO</th>
              <th>COLLECTIONS</th>
              <th>TOTAL</th>
              <th>Unit</th>
              <th>TARGET</th>
              <th>ACTUAL</th>
              <th>%</th>
              <th>ACTUAL</th>
              <th>ACTUAL</th>
              <th>ACTUAL</th>
              <th>ACTUAL</th>
              <th>ACTUAL</th>
            </tr>
      `;
        let totalPct = 0;
        let validRows = 0;
        rows.forEach((row, index) => {
          const targetVal = data.target?.[row.key] || 0;
          const actObj = data.actuals?.[row.actKey] || { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 };
          if (targetVal > 0) {
            totalPct += actObj.actual / targetVal * 100;
            validRows++;
          }
          const rowClass = index % 2 === 1 ? 'class="even-row"' : "";
          html += `
          <tr ${rowClass}>
            <td style="text-align: center">${index + 1}</td>
            <td style="text-align: left; font-weight: bold">${row.label}</td>
            <td style="text-align: center; font-weight: bold">${fmt(actObj.total, row.isFloat)}</td>
            <td style="text-align: center">${row.unit}</td>
            <td style="text-align: center">${targetVal}</td>
            <td style="text-align: center; font-weight: bold; color: #006838">${fmt(actObj.actual, row.isFloat)}</td>
            <td style="text-align: center; font-weight: bold">${calculatePercentage(actObj.actual, targetVal)}</td>
            <td style="text-align: center">${fmt(actObj.w1, row.isFloat)}</td>
            <td style="text-align: center">${fmt(actObj.w2, row.isFloat)}</td>
            <td style="text-align: center">${fmt(actObj.w3, row.isFloat)}</td>
            <td style="text-align: center">${fmt(actObj.w4, row.isFloat)}</td>
            <td style="text-align: center">${fmt(actObj.w5, row.isFloat)}</td>
          </tr>
        `;
        });
        const overallPerformance = validRows === 0 ? "0%" : `${(totalPct / validRows).toFixed(0)}%`;
        html += `
          <tr class="bg-black-row">
            <td colspan="2"></td>
            <td colspan="4" style="text-align: right; font-weight: bold">Over all Percentage</td>
            <td style="text-align: center; font-weight: bold; background-color: #C6E0B4">${overallPerformance}</td>
            <td colspan="5"></td>
          </tr>
        </table>
      </body>
      </html>
      `;
        if (options.returnWorksheet) {
          return htmlToStyledSheet(html, XLSX);
        }
        handlePreview(html, `JB_PARAMETER_REPORT_${dateForMonth.getFullYear()}_${dateForMonth.getMonth() + 1}.xls`);
      } catch (err) {
        console.error(err);
        alert("Error exporting Parameter Report");
      } finally {
        setLoading(false);
      }
    };
    const handleMonthChange = (monthVal) => {
      if (!monthVal) return;
      const [yearStr, monthStr] = monthVal.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDayVal = new Date(year, month, 0).getDate();
      const lastDay = `${year}-${String(month).padStart(2, "0")}-${String(lastDayVal).padStart(2, "0")}`;
      setFromDate(firstDay);
      setToDate(lastDay);
    };
    const getSourcesData = () => {
      const budgetData2 = [];
      const spentData2 = [];
      const networthData2 = [];
      Object.keys(stats.sourceStats || {}).forEach((src) => {
        const s = stats.sourceStats[src];
        if (s.budget > 0) budgetData2.push({ source: src, budget: s.budget });
        if (s.spent > 0) spentData2.push({ source: src, spent: s.spent });
        if (s.value > 0) networthData2.push({ source: src, networth: s.value });
      });
      return { budgetData: budgetData2, spentData: spentData2, networthData: networthData2 };
    };
    const { budgetData, spentData, networthData } = getSourcesData();
    const primaryColors = [
      "#FFD23F",
      // Pastel Yellow
      "#A4DE3B",
      // Pastel Lime Green
      "#E882C7",
      // Pastel Pink
      "#8C9ECB",
      // Pastel Purple-blue
      "#FF8C61",
      // Pastel Orange
      "#62C3A5",
      // Pastel Teal
      "#4DD0E1",
      // Pastel Cyan
      "#BA68C8",
      // Pastel Purple
      "#FFD54F",
      // Pastel Amber
      "#81C784"
      // Pastel Light Green
    ];
    const handleDownloadAllReports = async () => {
      try {
        setLoading(true);
        window.__isDownloadingAll = true;
        const allSheets = [];
        const convertHtmlToSheet = async (exportFunc, sheetName, isWs = false) => {
          window.__capturedHtml = null;
          window.__capturedWs = null;
          await exportFunc();
          if (isWs && window.__capturedWs) {
            allSheets.push({ name: sheetName, html: window.__capturedHtml, originalWs: window.__capturedWs });
          } else if (window.__capturedHtml) {
            allSheets.push({ name: sheetName, html: window.__capturedHtml });
          }
        };
        await convertHtmlToSheet(handleExportParameterReport, "Parameter Report", true);
        await convertHtmlToSheet(handleExportRegistrationReport, "Registration Report");
        await convertHtmlToSheet(handleExportKeyHandoverReport, "Key Handover Report");
        await convertHtmlToSheet(handleExportCollectionReport, "Collection Report");
        await convertHtmlToSheet(handleExportNPAReport, "NPA Collected Reports", true);
        await convertHtmlToSheet(handleExportComplaintsReport, "Complaints Report");
        await convertHtmlToSheet(handleExportBankLoanReport, "Bank Loan Report");
        await convertHtmlToSheet(handleExportExtraWorksReport, "Extra Works Report");
        if (allSheets.length > 0) {
          setPreviewSheets(allSheets);
          setCurrentSheetIndex(0);
          setPreviewHtml(allSheets[0].html);
          if (allSheets[0].originalWs) setPreviewOriginalWs(allSheets[0].originalWs);
          setPreviewFilename(`ALL_CRD_REPORTS_${(/* @__PURE__ */ new Date()).toLocaleDateString("en-GB").replace(/\\/ / g, "-")}.xlsx`);
          setPreviewModalOpen(true);
        }
      } catch (err) {
        console.error(err);
        alert("Error previewing consolidated reports file");
      } finally {
        window.__isDownloadingAll = false;
        setLoading(false);
      }
    };
    return /* @__PURE__ */ import_react2.default.createElement("div", { className: "space-y-8 w-full mx-auto text-left animate-fadeIn" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 border-b border-black-200 pb-5" }, /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("h1", { className: "text-2xl font-black text-black-800 flex items-center gap-2" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.CheckCircle, { className: "w-6 h-6 text-[#0e623a]" }), /* @__PURE__ */ import_react2.default.createElement("span", null, "CRD Reports"))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-black-150 shadow-xs" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center gap-2 px-2" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.Calendar, { className: "w-3.5 h-3.5 text-[#0e623a]" }), /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-xs font-bold text-black-700" }, "Range:"), /* @__PURE__ */ import_react2.default.createElement(
      "input",
      {
        type: "date",
        value: fromDate,
        onChange: (e) => setFromDate(e.target.value),
        className: "text-xs font-bold text-black-700 bg-transparent border-b border-black-300 focus:outline-none focus:border-[#0e623a] px-1"
      }
    ), /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-xs font-bold text-black-500" }, "to"), /* @__PURE__ */ import_react2.default.createElement(
      "input",
      {
        type: "date",
        value: toDate,
        onChange: (e) => setToDate(e.target.value),
        className: "text-xs font-bold text-black-700 bg-transparent border-b border-black-300 focus:outline-none focus:border-[#0e623a] px-1"
      }
    )))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6" }, /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        onClick: handleDownloadAllReports,
        className: "bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 bg-emerald-100 text-[#0e623a] rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.FolderOpen, { className: "w-8 h-8" })),
      /* @__PURE__ */ import_react2.default.createElement("h3", { className: "text-sm font-black text-[#0e623a] uppercase tracking-wide" }, "Download All Reports")
    ), /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        onClick: handleExportParameterReport,
        className: "bg-orange-50 border border-orange-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 bg-orange-100 text-orange-600 rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.TrendingUp, { className: "w-8 h-8" })),
      /* @__PURE__ */ import_react2.default.createElement("h3", { className: "text-sm font-black text-orange-800 uppercase tracking-wide" }, "Parameter Report")
    ), /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        onClick: handleExportRegistrationReport,
        className: "bg-purple-50 border border-purple-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 bg-purple-100 text-purple-600 rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.CheckCircle, { className: "w-8 h-8" })),
      /* @__PURE__ */ import_react2.default.createElement("h3", { className: "text-sm font-black text-purple-800 uppercase tracking-wide" }, "Registration Report")
    ), /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        onClick: handleExportKeyHandoverReport,
        className: "bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 bg-indigo-100 text-indigo-600 rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.Key, { className: "w-8 h-8" })),
      /* @__PURE__ */ import_react2.default.createElement("h3", { className: "text-sm font-black text-indigo-800 uppercase tracking-wide" }, "Key Handover Report")
    ), /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        onClick: handleExportCollectionReport,
        className: "bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 bg-emerald-100 text-emerald-600 rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.DollarSign, { className: "w-8 h-8" })),
      /* @__PURE__ */ import_react2.default.createElement("h3", { className: "text-sm font-black text-emerald-800 uppercase tracking-wide" }, "Collection Report")
    ), /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        onClick: () => {
          if (typeof handleExportBankLoanReport !== "undefined") handleExportBankLoanReport();
          else if (typeof handleExportBankLoansExcel !== "undefined") handleExportBankLoansExcel();
        },
        className: "bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 bg-blue-100 text-blue-600 rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.Building, { className: "w-8 h-8" })),
      /* @__PURE__ */ import_react2.default.createElement("h3", { className: "text-sm font-black text-blue-800 uppercase tracking-wide" }, "Bank Loan Report")
    ), /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        onClick: handleExportExtraWorksReport,
        className: "bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 bg-amber-100 text-amber-600 rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.FileText, { className: "w-8 h-8" })),
      /* @__PURE__ */ import_react2.default.createElement("h3", { className: "text-sm font-black text-amber-800 uppercase tracking-wide" }, "Extra Works")
    ), /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        onClick: handleExportComplaintsReport,
        className: "bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 bg-rose-100 text-rose-600 rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.AlertCircle, { className: "w-8 h-8" })),
      /* @__PURE__ */ import_react2.default.createElement("h3", { className: "text-sm font-black text-rose-800 uppercase tracking-wide" }, "Complaints"),
      /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-[11px] text-rose-500 font-semibold" }, "User complaints and statuses.")
    ), /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        onClick: handleExportNPAReport,
        className: "bg-sky-50 border border-sky-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-4 bg-sky-100 text-sky-600 rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.BarChart3, { className: "w-8 h-8" })),
      /* @__PURE__ */ import_react2.default.createElement("h3", { className: "text-sm font-black text-sky-800 uppercase tracking-wide" }, "NPA Collected Reports")
    )), previewModalOpen && /* @__PURE__ */ import_react2.default.createElement("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "bg-white w-full max-w-6xl h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "px-6 py-4 border-b flex items-center justify-between bg-gray-50 shrink-0" }, /* @__PURE__ */ import_react2.default.createElement("h2", { className: "text-xl font-bold text-gray-800 flex items-center gap-2" }, /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.FileText, { className: "w-5 h-5 text-gray-500" }), previewSheets.length > 0 ? `${previewSheets[currentSheetIndex].name} - Preview` : "Report Preview"), previewSheets.length > 0 && /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        onClick: () => {
          const newIdx = Math.max(0, currentSheetIndex - 1);
          setCurrentSheetIndex(newIdx);
          setPreviewHtml(previewSheets[newIdx].html);
          if (previewSheets[newIdx].originalWs) setPreviewOriginalWs(previewSheets[newIdx].originalWs);
        },
        disabled: currentSheetIndex === 0,
        className: "px-4 py-1.5 rounded-lg font-bold text-gray-600 bg-white border hover:bg-gray-50 transition disabled:opacity-50"
      },
      "\u2190 Prev Sheet"
    ), /* @__PURE__ */ import_react2.default.createElement("span", { className: "font-bold text-sm text-gray-600" }, currentSheetIndex + 1, " of ", previewSheets.length), /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        onClick: () => {
          const newIdx = Math.min(previewSheets.length - 1, currentSheetIndex + 1);
          setCurrentSheetIndex(newIdx);
          setPreviewHtml(previewSheets[newIdx].html);
          if (previewSheets[newIdx].originalWs) setPreviewOriginalWs(previewSheets[newIdx].originalWs);
        },
        disabled: currentSheetIndex === previewSheets.length - 1,
        className: "px-4 py-1.5 rounded-lg font-bold text-gray-600 bg-white border hover:bg-gray-50 transition disabled:opacity-50"
      },
      "Next Sheet \u2192"
    )), /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        onClick: () => setPreviewModalOpen(false),
        className: "text-gray-400 hover:text-red-500 transition ml-4"
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "w-6 h-6 flex items-center justify-center font-bold text-xl leading-none" }, "\xD7")
    )), /* @__PURE__ */ import_react2.default.createElement("div", { className: "p-6 overflow-auto flex-1 bg-gray-100" }, /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        className: "bg-white shadow-sm border p-4 inline-block min-w-full",
        dangerouslySetInnerHTML: { __html: previewHtml }
      }
    )), /* @__PURE__ */ import_react2.default.createElement("div", { className: "px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3 shrink-0" }, /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        onClick: () => setPreviewModalOpen(false),
        className: "px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-white border hover:bg-gray-50 transition"
      },
      "Cancel"
    ), /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        onClick: downloadFromPreview,
        className: "px-5 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm flex items-center gap-2 transition"
      },
      /* @__PURE__ */ import_react2.default.createElement(import_lucide_react.CheckCircle, { className: "w-4 h-4" }),
      "Download Excel"
    )))));
  };
  var CRDReports_default = KPIInsights;
})();
