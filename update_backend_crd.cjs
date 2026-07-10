const fs = require('fs');

let content = fs.readFileSync('server/routes/leads.js', 'utf8');

const injectionCode = `
          if (proj) {
            // ---- AUTO INITIALIZE CRD FLOW ----
            const CRDFlow = require('../models/CRDFlow');
            let existingFlow = await CRDFlow.findOne({ lead: lead._id });
            if (!existingFlow) {
              const Quotation = require('../models/Quotation');
              const quot = await Quotation.findOne({ lead: lead._id }).sort({ createdAt: -1 });
              const valuation = quot ? quot.totalValue : 2500000;
              
              const defaultStagesTemplate = [
                { name: 'On Booking', percentage: 5 },
                { name: 'Agreement (14 days)', percentage: 15 },
                { name: 'Plinth level', percentage: 15 },
                { name: 'Ground Floor Roof', percentage: 10 },
                { name: 'First Floor Roof', percentage: 10 },
                { name: 'Brickwork (GF)', percentage: 10 },
                { name: 'Brickwork (FF)', percentage: 10 },
                { name: 'Plastering', percentage: 10 },
                { name: 'Flooring', percentage: 10 },
                { name: 'Handover', percentage: 5 },
              ];
              
              let sumAmount = 0;
              const stages = defaultStagesTemplate.map((s, idx) => {
                 let amt = Math.round((s.percentage / 100) * valuation);
                 if (idx === defaultStagesTemplate.length - 1) amt = valuation - sumAmount;
                 else sumAmount += amt;
                 return { name: s.name, percentage: s.percentage, amount: amt, status: 'Pending', pending: amt, paid: 0, isCompleted: false, payments: [] };
              });

              const newFlow = new CRDFlow({
                lead: lead._id,
                project: proj._id,
                unitId: bookingInfo.selectedUnits.join(', '),
                totalCurrentValue: valuation,
                stages: stages,
                status: 'Active'
              });
              await newFlow.save();
            }
            // ----------------------------------

            bookingInfo.selectedUnits.forEach(unitId => {`;

content = content.replace(
  `          if (proj) {
            bookingInfo.selectedUnits.forEach(unitId => {`,
  injectionCode
);

fs.writeFileSync('server/routes/leads.js', content);
console.log('Backend CRD flow initialization updated.');
