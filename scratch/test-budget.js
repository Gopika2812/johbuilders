const mongoose = require('mongoose');
const BudgetPlan = require('../server/models/BudgetPlan');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/real_estate_erp');
  console.log('DB Connected!');
  const plans = await BudgetPlan.find({});
  console.log('Plans count:', plans.length);
  plans.forEach(p => {
    console.log('Plan Month:', p.month);
    console.log('Allocations:', p.allocations);
  });
  await mongoose.disconnect();
}

check();
