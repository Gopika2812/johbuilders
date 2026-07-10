const fs = require('fs');
let content = fs.readFileSync('client/src/pages/ProjectDetail.jsx', 'utf8');

if (!content.includes('Upload,')) {
    content = content.replace('CheckCircle2,', 'CheckCircle2,\n  Upload,');
    fs.writeFileSync('client/src/pages/ProjectDetail.jsx', content);
    console.log('Added Upload import to ProjectDetail.jsx');
}
