const mongoose = require('mongoose');
const Lead = require('./models/Lead');
require('dotenv').config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to DB');

    const contactedUpdate = await Lead.updateMany(
      { status: 'Contacted' },
      { $set: { status: 'Follow-Up' } }
    );
    console.log(`Updated ${contactedUpdate.modifiedCount} leads from Contacted to Follow-Up`);

    const siteVisitFollowUpUpdate = await Lead.updateMany(
      { status: 'Site Visit Follow-up' },
      { $set: { status: 'Site Visit' } }
    );
    console.log(`Updated ${siteVisitFollowUpUpdate.modifiedCount} leads from Site Visit Follow-up to Site Visit`);

    const wonUpdate = await Lead.updateMany(
      { status: 'Won' },
      { $set: { status: 'Booking' } }
    );
    console.log(`Updated ${wonUpdate.modifiedCount} leads from Won to Booking`);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrate();
