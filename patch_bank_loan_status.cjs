const fs = require('fs');

const file = 'client/src/pages/BankLoanHistory.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add loanStatus to getClientLoanDetails
const getClientDetailsRegex = /const preferredBank = flow\.stages\.flatMap[^;]+;\s*return \{/m;
if (getClientDetailsRegex.test(content)) {
    content = content.replace(getClientDetailsRegex, (match) => {
        return `const preferredBank = flow.stages.flatMap(s => s.payments || []).find(p => p.method === 'Bank Loan')?.details?.preferredBank || flow.lead?.bookingInfo?.loanDetails?.preferredBank || 'N/A';
    
    let loanStatus = flow.lead?.bookingInfo?.loanDetails?.loanStatus || 'Pending';
    if (bankLoanPaid > 0) loanStatus = 'Disbursed';

    return {`;
    });
}

// 2. Add Status to return object (which we already did by injecting loanStatus into return, wait, let's explicitly inject loanStatus)
// Wait, my regex `return {` didn't inject `loanStatus,`.
// Let's do a better replace for the return object.
content = content.replace(/return \{\s*bankLoanPaid,\s*bankLoanPending,\s*loanPayments,\s*preferredBank\s*\};/, `return {
      bankLoanPaid,
      bankLoanPending,
      loanPayments,
      preferredBank,
      loanStatus
    };`);

// 3. Update table headers
const tableHeaderRegex = /<th className="p-4">Financing Bank<\/th>\s*<th className="p-4 text-right">Loan Disbursed<\/th>/;
content = content.replace(tableHeaderRegex, `<th className="p-4">Financing Bank</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Loan Disbursed</th>`);

// 4. Update table row
const tableRowRegex = /<td className="p-4 text-gray-600 font-bold">\s*\{client\.preferredBank\}\s*<\/td>\s*<td className="p-4 text-right text-emerald-800 font-bold">/;
content = content.replace(tableRowRegex, `<td className="p-4 text-gray-600 font-bold">
                            {client.preferredBank}
                          </td>
                          <td className="p-4">
                            <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase \${
                              client.loanStatus === 'Disbursed' ? 'bg-emerald-50 text-emerald-700' :
                              client.loanStatus === 'Approved' ? 'bg-blue-50 text-blue-700' :
                              'bg-amber-50 text-amber-700'
                            }\`}>
                              {client.loanStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right text-emerald-800 font-bold">`);

// 5. Update colspan for expanded row from 6 to 7
content = content.replace(/<td colSpan="6" className="p-0 border-b border-gray-200">/g, `<td colSpan="7" className="p-0 border-b border-gray-200">`);

fs.writeFileSync(file, content);
console.log("Successfully added Status column to BankLoanHistory.jsx");
