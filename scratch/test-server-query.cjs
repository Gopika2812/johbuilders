const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });
const connectDB = require('../server/config/db');
const BudgetPlan = require('../server/models/BudgetPlan');

async function test() {
  await connectDB();
  console.log('Server DB Connected! Database Name:', mongoose.connection.name);
  const plans = await BudgetPlan.find({});
  console.log('Plans count:', plans.length);
  plans.forEach(p => {
    console.log('Plan:', p.month, p.allocations.length);
  });
  await mongoose.disconnect();
}

test().catch(console.error);
