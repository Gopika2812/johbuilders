const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const CRDFlow = require('./models/CRDFlow');

const resetDebtors = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/builders_db';
    console.log('Connecting to MongoDB...', mongoUri);
    await mongoose.connect(mongoUri);

    const res = await CRDFlow.updateMany({}, { $set: { debtorsAmount: 0 } });
    console.log(`Successfully reset debtorsAmount to 0 for ${res.modifiedCount || res.nModified} flows.`);

    process.exit(0);
  } catch (err) {
    console.error('Error resetting debtorsAmount:', err);
    process.exit(1);
  }
};

resetDebtors();
