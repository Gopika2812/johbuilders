const mongoose = require('mongoose');
const BudgetPlan = require('../server/models/BudgetPlan');

async function check() {
  const uri = 'mongodb+srv://gopikap2812_db_user:OfAkpPu3iLQ7c72w@builders.8jfeh2t.mongodb.net/real_estate_erp?retryWrites=true&w=majority';
  await mongoose.connect(uri);
  console.log('Cloud DB Connected!');
  const plans = await BudgetPlan.find({});
  console.log('Plans count:', plans.length);
  plans.forEach(p => {
    console.log('Plan Month:', p.month);
    console.log('Allocations:', p.allocations);
  });
  await mongoose.disconnect();
}

check().catch(console.error);
