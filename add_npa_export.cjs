const fs = require('fs');

let content = fs.readFileSync('e:/builders/client/src/pages/CRDReports.jsx', 'utf8');

// 1. Define the handleExportNPACollectedReport function
const newFunction = `
  const handleExportNPACollectedReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(\`\${API_URL}/crd-flow\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (!res.ok) {
        alert('Failed to load NPA Collected Report details for export');
        return;
      }
      const data = await res.json();

      // Apply active dashboard filters
      const filtered = data.filter(flow => {
        // Project filter
        if (selectedProject && (flow.project?._id || flow.project) !== selectedProject) return false;

        // User/Executive filter
        if (selectedUser && (flow.lead?.assignedTo?._id || flow.lead?.assignedTo) !== selectedUser) return false;

        return true;
      });

      if (filtered.length === 0) {
        alert('No NPA Collected records found for the selected filters.');
        return;
      }

      const dateForMonth = fromDate ? new Date(fromDate) : new Date();
      const targetMonth = dateForMonth.getMonth();
      const targetYear = dateForMonth.getFullYear();

      const getWeeklyCollections = (flow) => {
        let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
        if (flow.stages) {
          flow.stages.forEach(stage => {
            if (stage.payments) {
              stage.payments.forEach(p => {
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

      const projectTitle = selectedProject 
        ? (stats.projects.find(p => p._id === selectedProject)?.code || 'PROJECT')
        : '';
      const titleText = projectTitle 
        ? \`JB - \${projectTitle.toUpperCase()} NPA COLLECTED REPORT\`
        : \`JB - NPA COLLECTED REPORT\`;
        
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const monthTitle = \`MONTH OF \${monthNames[targetMonth]} - \${targetYear}\`;

      // Build HTML
      let html = \`
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          \${getExcelStyles("#0E623A", "#D1FAE5", "#0E623A", "#0E623A")}
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
            \${getExcelHeader(titleText, monthTitle, 11, "#0E623A", logoPath)}
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
      \`;

      filtered.forEach((flow, index) => {
        const weeks = getWeeklyCollections(flow);
        const rowClass = index % 2 === 1 ? 'class="even-row"' : '';
        const projType = Array.isArray(flow.project?.projectType) ? flow.project.projectType.join(', ') : (flow.project?.projectType || 'N/A');

        html += \`
          <tr \${rowClass}>
            <td>\${index + 1}</td>
            <td class="text-left bold-label">\${flow.lead?.name || 'N/A'}</td>
            <td>\${projType}</td>
            <td>\${flow.unitId || 'N/A'}</td>
            <td class="text-right">\${(flow.totalCurrentValue || 0).toLocaleString()}</td>
            <td class="text-right">\${(flow.debtorsAmount || 0).toLocaleString()}</td>
            <td class="text-right">\${(flow.targetAmount || 0).toLocaleString()}</td>
            <td class="text-right">\${weeks.w1.toLocaleString()}</td>
            <td class="text-right">\${weeks.w2.toLocaleString()}</td>
            <td class="text-right">\${weeks.w3.toLocaleString()}</td>
            <td class="text-right">\${weeks.w4.toLocaleString()}</td>
          </tr>
        \`;
      });

      html += \`
          </table>
        </body>
        </html>
      \`;

      // Trigger download
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileCode = projectTitle ? projectTitle : 'ALL_PROJECTS';
      a.download = \`JB_\${fileCode}_NPA_COLLECTED_REPORT_\${targetYear}_\${targetMonth + 1}.xls\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Error exporting NPA Collected Report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportRegistrationReport = async () => {\`;

// Insert the new function before handleExportRegistrationReport
content = content.replace("  const handleExportRegistrationReport = async () => {", newFunction);

// 2. Change the onClick handler in the NPA Collected Report card
const oldCardTarget = \`        {/* NPA Collected Report */}
        <div 
          onClick={() => navigate('/crd-flow/overall-report')}
          className="bg-teal-50 border border-teal-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >\`;

const newCardReplacement = \`        {/* NPA Collected Report */}
        <div 
          onClick={handleExportNPACollectedReport}
          className="bg-teal-50 border border-teal-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >\`;

content = content.replace(oldCardTarget, newCardReplacement);

fs.writeFileSync('e:/builders/client/src/pages/CRDReports.jsx', content);
console.log('Successfully added handleExportNPACollectedReport and updated card onClick.');
