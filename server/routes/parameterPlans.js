const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ParameterPlan = require('../models/ParameterPlan');
const CRDFlow = require('../models/CRDFlow');

// Get parameter plan for a specific month
router.get('/:month', protect, async (req, res) => {
  try {
    const { month } = req.params;
    let plan = await ParameterPlan.findOne({ month });
    if (!plan) {
      plan = new ParameterPlan({ month });
      await plan.save();
    }

    // Prepare date range for the month
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10) - 1; // 0-indexed for JS Date
    const startDate = new Date(year, m, 1);
    const endDate = new Date(year, m + 1, 0, 23, 59, 59, 999);

    const actuals = {
      registrations: { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
      keyHandover: { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
      totalDebtors: { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 }, // snapshot
      collectionAmount: { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
      npaValue: { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 }, // snapshot
      bankLoans: { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
      criticalIssues: { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
      customerComplaints: { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
      extraWorks: { actual: 0, total: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 }
    };

    const addToWeek = (obj, date, amount = 1) => {
      if (date <= endDate) {
        obj.total += amount;
        if (date >= startDate) {
          obj.actual += amount;
          const day = date.getDate();
          if (day <= 7) obj.w1 += amount;
          else if (day <= 14) obj.w2 += amount;
          else if (day <= 21) obj.w3 += amount;
          else if (day <= 28) obj.w4 += amount;
          else obj.w5 += amount;
        }
      }
    };

    // Fetch all active/completed flows
    const flows = await CRDFlow.find().populate('lead project');

    let totalDebtorsAmount = 0;
    let totalNpaAmount = 0;

    for (const flow of flows) {
      if (flow.status === 'Cancelled' || flow.status === 'Returned') continue;
      
      const stages = flow.stages || [];
      
      // Check registrations (Agreement & Sign stage)
      const agreementStage = stages.find(s => s.name.toLowerCase().includes('agreement')) || (stages.length > 1 ? stages[1] : null);
      if (agreementStage && agreementStage.isCompleted && agreementStage.completedDate) {
        addToWeek(actuals.registrations, new Date(agreementStage.completedDate), 1);
      } else if (agreementStage) {
          // Alternative: check if paid completely
          const stagePaid = agreementStage.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
          if (agreementStage.amount > 0 && stagePaid >= agreementStage.amount) {
              const lastPaymentDate = agreementStage.payments.length > 0 ? new Date(Math.max(...agreementStage.payments.map(p => new Date(p.date)))) : null;
              if (lastPaymentDate) {
                  addToWeek(actuals.registrations, lastPaymentDate, 1);
              }
          }
      }

      // Check key handover
      const handoverStage = stages.find(s => s.name.toLowerCase().includes('handover') || s.name.toLowerCase().includes('handing over')) || stages[stages.length - 1];
      if (handoverStage && handoverStage.isCompleted && handoverStage.completedDate) {
        addToWeek(actuals.keyHandover, new Date(handoverStage.completedDate), 1);
      }

      let flowTotalPaid = 0;
      let lastPaymentDate = null;

      stages.forEach(stage => {
        (stage.payments || []).forEach(p => {
          flowTotalPaid += (p.amount || 0);
          const pDate = new Date(p.date);
          
          if (!lastPaymentDate || pDate > lastPaymentDate) {
            lastPaymentDate = pDate;
          }

          // Collection amount
          addToWeek(actuals.collectionAmount, pDate, p.amount || 0);
          
          // Bank Loans
          if (p.method === 'Bank Loan') {
            addToWeek(actuals.bankLoans, pDate, 1);
          }
        });

        // Extra works
        (stage.extraWorks || []).forEach(ew => {
          if (ew.addedAt) {
            addToWeek(actuals.extraWorks, new Date(ew.addedAt), 1);
          }
        });
      });

      const flowDebtors = Math.max(0, (flow.totalCurrentValue || 0) - flowTotalPaid);
      totalDebtorsAmount += flowDebtors;

      // NPA Calculation
      if (flowDebtors > 0) {
          const daysSinceLastPayment = lastPaymentDate 
              ? (new Date() - lastPaymentDate) / (1000 * 60 * 60 * 24) 
              : (new Date() - new Date(flow.createdAt)) / (1000 * 60 * 60 * 24);
          
          if (daysSinceLastPayment > 60) {
              totalNpaAmount += flowDebtors;
          }
      }

      // Complaints
      (flow.complaints || []).forEach(comp => {
        if (comp.reportedAt) {
          addToWeek(actuals.customerComplaints, new Date(comp.reportedAt), 1);
        }
        if (comp.resolvedAt && comp.status === 'Completed') {
          addToWeek(actuals.criticalIssues, new Date(comp.resolvedAt), 1);
        }
      });
    }

    // Convert amounts to Crores
    actuals.totalDebtors.total = totalDebtorsAmount / 10000000;
    actuals.totalDebtors.actual = totalDebtorsAmount / 10000000;
    actuals.totalDebtors.w1 = actuals.totalDebtors.actual; // display snapshot in w1
    
    actuals.npaValue.total = totalNpaAmount / 10000000;
    actuals.npaValue.actual = totalNpaAmount / 10000000;
    actuals.npaValue.w1 = actuals.npaValue.actual; // display snapshot in w1

    actuals.collectionAmount.total = actuals.collectionAmount.total / 10000000;
    actuals.collectionAmount.actual = actuals.collectionAmount.actual / 10000000;
    actuals.collectionAmount.w1 = actuals.collectionAmount.w1 / 10000000;
    actuals.collectionAmount.w2 = actuals.collectionAmount.w2 / 10000000;
    actuals.collectionAmount.w3 = actuals.collectionAmount.w3 / 10000000;
    actuals.collectionAmount.w4 = actuals.collectionAmount.w4 / 10000000;
    actuals.collectionAmount.w5 = actuals.collectionAmount.w5 / 10000000;

    res.json({
      target: plan,
      actuals
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving parameter plan' });
  }
});

// Update parameter plan
router.post('/', protect, async (req, res) => {
  try {
    const {
      month,
      registrationsTarget,
      keyHandoverTarget,
      totalDebtorsTarget,
      collectionAmountTarget,
      npaValueTarget,
      bankLoansTarget,
      criticalIssuesTarget,
      customerComplaintsTarget,
      extraWorksTarget
    } = req.body;

    let plan = await ParameterPlan.findOne({ month });
    if (!plan) {
      plan = new ParameterPlan({ month });
    }

    plan.registrationsTarget = Number(registrationsTarget) || 0;
    plan.keyHandoverTarget = Number(keyHandoverTarget) || 0;
    plan.totalDebtorsTarget = Number(totalDebtorsTarget) || 0;
    plan.collectionAmountTarget = Number(collectionAmountTarget) || 0;
    plan.npaValueTarget = Number(npaValueTarget) || 0;
    plan.bankLoansTarget = Number(bankLoansTarget) || 0;
    plan.criticalIssuesTarget = Number(criticalIssuesTarget) || 0;
    plan.customerComplaintsTarget = Number(customerComplaintsTarget) || 0;
    plan.extraWorksTarget = Number(extraWorksTarget) || 0;

    await plan.save();
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving parameter plan' });
  }
});

module.exports = router;
