const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CRDFlow.jsx', 'utf8');

const oldMapBlock = `{activeFlow?.stages.map((stage, idx) => {
                      const thisStagePending = Math.max(0, getStageTotal(stage) - getStagePaid(stage));
                      const arrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                      const arrearsText = arrears > 0 ? \` + Arrears: Rs. \${arrears.toLocaleString()}\` : '';
                      return (
                        <option key={idx} value={idx}>Stage {idx + 1}: {stage.name} (Pending: Rs. {thisStagePending.toLocaleString()}{arrearsText})</option>
                      );
                    })}`;

const newMapBlock = `{activeFlow?.stages.map((stage, idx) => {
                      const thisStagePending = Math.max(0, getStageTotal(stage) - getStagePaid(stage));
                      const arrears = getPendingPreviousStages(idx).reduce((sum, s) => sum + s.pending, 0);
                      
                      // Skip rendering fully paid stages
                      if (thisStagePending <= 0 && arrears <= 0) return null;
                      
                      const arrearsText = arrears > 0 ? \` + Arrears: Rs. \${arrears.toLocaleString()}\` : '';
                      return (
                        <option key={idx} value={idx}>Stage {idx + 1}: {stage.name} (Pending: Rs. {thisStagePending.toLocaleString()}{arrearsText})</option>
                      );
                    })}`;

if (content.includes(oldMapBlock)) {
  content = content.replace(oldMapBlock, newMapBlock);
  fs.writeFileSync('client/src/pages/CRDFlow.jsx', content);
  console.log('Successfully added filter for paid stages!');
} else {
  console.log('Could not find the map block to replace.');
}
