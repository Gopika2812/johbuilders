const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Lead = require('./models/Lead');

async function updateAssignedBy() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const bharathi = await User.findOne({ name: 'Bharathi' });
    if (!bharathi) {
      console.error('User Bharathi not found!');
      process.exit(1);
    }

    const superAdmin = await User.findOne({ name: 'Super Admin' });

    console.log(`Target User (Bharathi): ID=${bharathi._id}, Role=${bharathi.role}`);
    console.log(`Source User (Super Admin): ID=${superAdmin?._id}`);

    // Update leads created via Bulk Import or assigned by Super Admin
    const filter = {
      $or: [
        { 'history.note': { $regex: /bulk/i } },
        { leadSource: { $regex: /bulk/i } },
        { assignedBy: superAdmin._id }
      ]
    };

    const countToUpdate = await Lead.countDocuments(filter);
    console.log(`Found ${countToUpdate} lead(s) to update assignedBy -> Bharathi.`);

    const result = await Lead.updateMany(filter, {
      $set: { assignedBy: bharathi._id }
    });

    console.log(`Successfully updated ${result.modifiedCount} lead(s).`);

    process.exit(0);
  } catch (err) {
    console.error('Error during update:', err);
    process.exit(1);
  }
}

updateAssignedBy();
