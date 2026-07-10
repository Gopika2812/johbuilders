const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'server', '.env') });
const Lead = require('./server/models/Lead');

async function migrateLeads() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing!');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const result = await Lead.updateMany(
      { status: { $in: ['Hot List', 'Negotiation'] } },
      { $set: { status: 'Follow-Up', leadCategory: 'Hot' } }
    );

    console.log(`Successfully migrated ${result.modifiedCount} leads from Hot List / Negotiation to Follow-Up with Hot category.`);

    await mongoose.disconnect();
    console.log('Disconnected from DB');
  } catch (error) {
    console.error('Error migrating leads:', error);
    process.exit(1);
  }
}

migrateLeads();
