const fs = require('fs');

const file = 'client/src/pages/BankLoanHistory.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add updateLoanStatus function before fetchCRDFlows
const updateLoanStatusStr = `
  const updateLoanStatus = async (leadId, newStatus, lead) => {
    try {
      const updatedBookingInfo = {
        ...(lead?.bookingInfo || {}),
        loanDetails: {
          ...(lead?.bookingInfo?.loanDetails || {}),
          loanStatus: newStatus
        }
      };

      const res = await fetch(\`\${API_URL}/leads/\${leadId}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ bookingInfo: updatedBookingInfo })
      });
      if (res.ok) {
        fetchCRDFlows();
      }
    } catch (err) {
      console.error('Failed to update loan status', err);
    }
  };

  useEffect(() => {
`;
content = content.replace(/useEffect\(\(\) => \{/m, updateLoanStatusStr);

// 2. Modify the cell
// The cell currently has:
/*
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              client.loanStatus === 'Disbursed' ? 'bg-emerald-50 text-emerald-700' :
                              client.loanStatus === 'Approved' ? 'bg-blue-50 text-blue-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {client.loanStatus}
                            </span>
                          </td>
*/
const cellTargetRegex = /<td className="p-4">\s*<span className=\{`text-\[10px\][^>]+>\s*\{client\.loanStatus\}\s*<\/span>\s*<\/td>/;

const newCell = `<td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <select 
                              value={client.loanStatus}
                              onChange={(e) => updateLoanStatus(client.flow.lead._id, e.target.value, client.flow.lead)}
                              className={\`text-[10px] font-bold px-2 py-1 rounded-full uppercase cursor-pointer border-none outline-none appearance-none \${
                                client.loanStatus === 'Disbursed' ? 'bg-emerald-50 text-emerald-700' :
                                client.loanStatus === 'Approved' ? 'bg-blue-50 text-blue-700' :
                                'bg-amber-50 text-amber-700'
                              }\`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Disbursed">Disbursed</option>
                            </select>
                          </td>`;

if (cellTargetRegex.test(content)) {
    content = content.replace(cellTargetRegex, newCell);
    fs.writeFileSync(file, content);
    console.log("Patched status cell to be a dropdown");
} else {
    console.log("Could not find status cell regex.");
}
