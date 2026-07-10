const fs = require('fs');

let sidebar = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

// The replacement chunk
const newChunk = `
        {/* Leads Directory (Promoted to Main Item) */}
        <Link
          to="/leads"
          className={\`flex items-center gap-3 py-3 \${sidebarOpen ? "justify-start px-4" : "justify-center px-0"} rounded-xl transition duration-200 \${
            location.pathname === '/leads' && !location.search
              ? 'bg-[#11c278] text-white font-bold shadow-md' 
              : 'text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278]'
          }\`}
        >
          <UserPlus className={\`w-5 h-5 \${location.pathname === '/leads' && !location.search ? 'text-white' : 'text-[#1e4a3b]'}\`} />
          <span className={sidebarOpen ? "block truncate" : "hidden"}>Leads Directory</span>
        </Link>

        {/* CRD Group */}
        <div>
          <button
            onClick={() => setLeadsMenuOpen(!leadsMenuOpen)}
            className={\`w-full flex items-center \${sidebarOpen ? "justify-between px-4" : "justify-center px-0"} py-3 text-[#1e4a3b] hover:bg-[#11c278]/10 hover:text-[#11c278] rounded-xl transition duration-200\`}
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-5 h-5 text-[#1e4a3b]" />
              <span className={\`font-semibold \${sidebarOpen ? "block" : "hidden"}\`}>CRD</span>
            </div>
            {sidebarOpen && <ChevronDown className={\`w-4 h-4 text-[#1e4a3b] transition-transform duration-200 \${leadsMenuOpen ? 'rotate-180' : ''}\`} />}
          </button>
          
          {leadsMenuOpen && sidebarOpen && (
            <div className={\`mt-1 space-y-1 \${sidebarOpen ? "pl-8" : "pl-0 flex flex-col items-center"}\`}>
              <Link
                to="/crd-flow"
                className={\`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition \${
                  isActive('/crd-flow')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }\`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>CRD Flow</span>
              </Link>

              <Link
                to="/quotations"
                className={\`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition \${
                  location.pathname === '/quotations'
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }\`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>Quotation Records</span>
              </Link>

              <Link
                to="/crd-flow/bank-loan-history"
                className={\`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition \${
                  isActive('/crd-flow/bank-loan-history')
                    ? 'text-[#11c278] font-extrabold pl-2'
                    : 'text-[#1e4a3b] hover:text-[#11c278] hover:bg-[#11c278]/10'
                }\`}
              >
                <span className={sidebarOpen ? "block truncate" : "hidden"}>Bank Loan History</span>
              </Link>
            </div>
          )}
        </div>
`;

// Now replace the old Leads Phase block with this new chunk.
// Using regex to capture from {/* Leads Phase */} to the closing div of that section, before {/* Reports Master */}
const regex = /\{\/\* Leads Phase \*\/\}[\s\S]*?\{\/\* Reports Master \*\/\}/g;

if(regex.test(sidebar)) {
  sidebar = sidebar.replace(regex, newChunk + '\n          {/* Reports Master */}');
  fs.writeFileSync('client/src/components/Sidebar.jsx', sidebar);
  console.log('Sidebar restructured successfully.');
} else {
  console.log('Regex did not match.');
}
