const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const roleMap = {
  'Admin': 'Superadmin',
  'Super Admin': 'Superadmin',
  'Manager': 'Crd team',
  'Site Engineer': 'ped team',
  'Sales Executive': 'sales person'
};

async function migrateRoles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    let count = 0;
    
    for (const user of users) {
      if (roleMap[user.role]) {
        user.role = roleMap[user.role];
        await user.save();
        count++;
        console.log(`Updated user ${user.email} to role: ${user.role}`);
      }
    }
    
    console.log(`Migration complete. Updated ${count} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateRoles();
