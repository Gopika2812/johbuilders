const fs = require('fs');
const file = 'client/src/pages/KPIInsights.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Filter to imports
content = content.replace(/AlertCircle\n\} from 'lucide-react';/, "AlertCircle,\n  Filter\n} from 'lucide-react';");

// 2. Add SOURCE_TYPES array after getCoordinatesForPercent
const sourceTypes = `

const SOURCE_TYPES = [
  'Paper Ad',
  'Railway station Hoardings (Rental)',
  'Local TV',
  'FM Radio',
  'Airport Advertisement - Tuticorin',
  'Hydrogen Balloon',
  'Notice distribution',
  'Unipole',
  'LED board behind park',
  'Pearl Bliss Tuticorin Project',
  'Satellite Channel',
  '99acres',
  'Housing.com',
  'Facebook',
  'Instagram',
  'Youtube',
  'Real Estate',
  'Magicbricks',
  'Website',
  'Direct',
  'Old Customer',
  'Reference',
  'Flexboard/Banner',
  'Stall'
];`;
content = content.replace(/(const getCoordinatesForPercent = [^}]+\};\n)/, `$1${sourceTypes}\n`);

// 3. Add selectedSource state
content = content.replace(/const \[selectedProject, setSelectedProject\] = useState\(''\);/, "const [selectedProject, setSelectedProject] = useState('');\n  const [selectedSource, setSelectedSource] = useState('');");

// 4. Update dependencies
content = content.replace(/\[fromDate, toDate, selectedUser, selectedProject\]\);/, "[fromDate, toDate, selectedUser, selectedProject, selectedSource]);");

// 5. Update fetchLeadCostAnalysisData
content = content.replace(
  /if \(selectedProject\) url \+= `&projectId=\$\{selectedProject\}`;(\s*const response = await fetch)/,
  "if (selectedProject) url += `&projectId=${selectedProject}`;\n      if (selectedSource) url += `&source=${encodeURIComponent(selectedSource)}`;$1"
);

// 6. Update fetchInsightsData
content = content.replace(
  /if \(selectedProject\) url \+= `&projectId=\$\{selectedProject\}`;(\s*const response = await fetch)/,
  "if (selectedProject) url += `&projectId=${selectedProject}`;\n      if (selectedSource) url += `&source=${encodeURIComponent(selectedSource)}`;$1"
);

// 7. Add Source dropdown to UI (after Project Select)
const sourceDropdown = `

          {/* Source Select */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e623a] text-gray-700 font-bold max-w-[150px]"
            >
              <option value="">All Sources</option>
              {SOURCE_TYPES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>`;
content = content.replace(/(<\/select>\n\s*<\/div>\n\n\s*<div className="border-l border-gray-200 h-5"><\/div>)/, `${sourceDropdown}\n$1`);

fs.writeFileSync(file, content);
console.log("Successfully added Lead Source filter to KPIInsights.jsx");
