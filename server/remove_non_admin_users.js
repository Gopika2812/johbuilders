const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

const removeNonAdminUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} total users in DB:`);
    allUsers.forEach(u => console.log(` - [${u.role}] ${u.name} (${u.email || u.phone})`));

    const result = await User.deleteMany({ role: { $ne: 'Superadmin' } });
    console.log(`Successfully deleted ${result.deletedCount} non-Superadmin users.`);

    const remainingUsers = await User.find({});
    console.log(`Remaining Superadmin users (${remainingUsers.length}):`);
    remainingUsers.forEach(u => console.log(` - [${u.role}] ${u.name} (${u.email || u.phone})`));

    process.exit(0);
  } catch (err) {
    console.error('Error removing non-admin users:', err);
    process.exit(1);
  }
};

removeNonAdminUsers();
