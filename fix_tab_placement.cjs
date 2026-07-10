const fs = require('fs');

let fileContent = fs.readFileSync('client/src/pages/ProjectDetail.jsx', 'utf8');

// The block to extract
const startMarker = '{/* 🟢 CRD FLOW FORMAT VIEW */}';
const endMarker = '{/* 🟢 PLOT PROJECT VIEW */}';

const startIndex = fileContent.indexOf(startMarker);
const endIndex = fileContent.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const blockToMove = fileContent.substring(startIndex, endIndex);
    
    // Remove it from its current position
    fileContent = fileContent.replace(blockToMove, '');
    
    // Find the end of the ProjectDetail component return statement
    // The main container ends right before the last `</div>` which is followed by `);`
    
    // Let's look for the final activeTab === 'marketing' and the end of that.
    // An easier way is just to replace the final `</div>\n    </div>\n  );\n};` or similar
    
    // Let's insert it before the last `</div>\n    </div>\n  );`
    // Actually, looking at ProjectDetail, the outermost div is `<div className="space-y-5">`
    // I can just append it before `</div>\n  );\n};`
    
    fileContent = fileContent.replace(
      /<\/div>\s*\);\s*\};\s*export default ProjectDetail;/g,
      `
      ${blockToMove}
    </div>
  );
};
export default ProjectDetail;`
    );

    fs.writeFileSync('client/src/pages/ProjectDetail.jsx', fileContent);
    console.log('Successfully moved CRD Flow View out of Project View block.');
} else {
    console.log('Could not find the CRD Flow View block.');
}
