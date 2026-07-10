const fs = require('fs');
const path = require('path');

const filePath = 'client/src/components/Sidebar.jsx';
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add isHovered state and isExpanded variable
  content = content.replace(
    /const \[reportsMenuOpen, setReportsMenuOpen\] = useState\(true\);/g,
    `const [reportsMenuOpen, setReportsMenuOpen] = useState(true);\n  const [isHovered, setIsHovered] = useState(false);\n  const isExpanded = sidebarOpen || isHovered;`
  );

  // 2. Fix handleNavClick
  content = content.replace(
    /const handleNavClick = \(e\) => \{\s*if \(e\.target\.closest\('a'\)\) \{\s*setSidebarOpen\(false\);\s*\}\s*\};/m,
    `const handleNavClick = (e) => {\n    if (window.innerWidth < 768 && e.target.closest('a')) {\n      setSidebarOpen(false);\n    }\n  };`
  );

  // 3. Add onMouseEnter and onMouseLeave to aside
  content = content.replace(
    /<aside className=\{`bg-\[#edfbf4\] text-\[#1e4a3b\] flex flex-col h-screen fixed left-0 top-0 z-50 border-none shadow-none transition-all duration-300 \$\{sidebarOpen \? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0 overflow-hidden'\}`\}>/m,
    `<aside \n      onMouseEnter={() => setIsHovered(true)}\n      onMouseLeave={() => setIsHovered(false)}\n      className={\`bg-[#edfbf4] text-[#1e4a3b] flex flex-col h-screen fixed left-0 top-0 z-50 border-none shadow-none transition-all duration-300 \${isExpanded ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0 overflow-hidden'}\`}>`
  );

  // 4. Replace sidebarOpen with isExpanded in JSX only!
  // Be careful not to replace it in handleNavClick or component signature.
  // We can do a string split/join starting from the return statement.
  
  const returnIndex = content.indexOf('return (');
  const beforeReturn = content.slice(0, returnIndex);
  let afterReturn = content.slice(returnIndex);
  
  // Replace 'sidebarOpen ?' with 'isExpanded ?'
  afterReturn = afterReturn.replace(/sidebarOpen \?/g, 'isExpanded ?');
  afterReturn = afterReturn.replace(/sidebarOpen &&/g, 'isExpanded &&');
  
  content = beforeReturn + afterReturn;

  fs.writeFileSync(filePath, content);
  console.log('Sidebar.jsx updated successfully');
} else {
  console.log('Sidebar.jsx not found');
}
