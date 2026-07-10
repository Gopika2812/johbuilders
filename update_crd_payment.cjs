const fs = require('fs');

let content = fs.readFileSync('server/routes/crdFlow.js', 'utf8');

const oldLogic = `    if (payments && Array.isArray(payments)) {
      payments.forEach(p => {
        flow.stages[idx].payments.push({
          method: p.method,
          amount: Number(p.amount),
          details: p.details
        });
      });
    } else {
      const payAmt = Number(amount);
      if (isNaN(payAmt) || payAmt <= 0) {
        return res.status(400).json({ message: 'Amount must be positive' });
      }
      flow.stages[idx].payments.push({
        method,
        amount: payAmt,
        details
      });
    }`;

const newLogic = `    // Process payments and cascade backwards to clear previous stages
    let paymentsToProcess = [];
    if (payments && Array.isArray(payments)) {
      paymentsToProcess = payments.map(p => ({ method: p.method, amount: Number(p.amount), details: p.details }));
    } else {
      const payAmt = Number(amount);
      if (isNaN(payAmt) || payAmt <= 0) {
        return res.status(400).json({ message: 'Amount must be positive' });
      }
      paymentsToProcess = [{ method, amount: payAmt, details }];
    }

    for (let p of paymentsToProcess) {
      let remainingAmount = p.amount;
      
      // Cascade from stage 0 up to selected stageIndex
      for (let i = 0; i <= idx; i++) {
        if (remainingAmount <= 0) break;
        
        const stage = flow.stages[i];
        
        // Calculate pending amount for this stage
        const stageTotal = Number(stage.amount) || 0;
        const stagePaid = stage.payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
        const stagePending = Math.max(0, stageTotal - stagePaid);
        
        if (stagePending > 0) {
          if (remainingAmount >= stagePending) {
            // Pay off this stage completely
            stage.payments.push({
              method: p.method,
              amount: stagePending,
              details: p.details
            });
            stage.isCompleted = true;
            remainingAmount -= stagePending;
          } else {
            // Partially pay this stage
            stage.payments.push({
              method: p.method,
              amount: remainingAmount,
              details: p.details
            });
            remainingAmount = 0;
          }
        }
      }
      
      // If there's still overpayment amount left after clearing up to idx,
      // add it to the selected stage (idx) as an overpayment.
      if (remainingAmount > 0) {
        flow.stages[idx].payments.push({
          method: p.method,
          amount: remainingAmount,
          details: p.details
        });
        flow.stages[idx].isCompleted = true;
      }
    }`;

if (content.includes(oldLogic)) {
  content = content.replace(oldLogic, newLogic);
  fs.writeFileSync('server/routes/crdFlow.js', content);
  console.log('Successfully updated cascading payment logic!');
} else {
  console.log('Could not find the old payment logic to replace.');
}
