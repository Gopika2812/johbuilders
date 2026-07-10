const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'client/src/pages/KPIInsights.jsx',
  'client/src/pages/ExportReports.jsx',
  'client/src/pages/CRDReports.jsx'
];

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace SALES PARAMETER REPORT block
    content = content.replace(
      /<tr style="height: 100px;">\s*<td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 100px; text-align: center; vertical-align: middle;">\s*<img src="\$\{logoPath\}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" \/>\s*SALES PARAMETER REPORT\s*<\/td>\s*<\/tr>/g,
      `<tr style="height: 80px;">
                <td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: center; vertical-align: middle;">
                  <img src="\${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" />
                  SALES PARAMETER REPORT
                </td>
              </tr>`
    );

    // Replace JB MARKETING PARAMETER REPORT block
    content = content.replace(
      /<tr style="height: 100px;">\s*<td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 100px; text-align: center; vertical-align: middle;">\s*<img src="\$\{logoPath\}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" \/>\s*JB MARKETING PARAMETER REPORT\s*<\/td>\s*<\/tr>/g,
      `<tr style="height: 80px;">
              <td colspan="10" class="bg-header-blue font-bold" style="font-size: 14pt; font-weight: bold; height: 80px; text-align: center; vertical-align: middle;">
                <img src="\${logoPath}" width="250" height="80" style="vertical-align: middle; margin-right: 15px;" />
                JB MARKETING PARAMETER REPORT
              </td>
            </tr>`
    );

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
});
