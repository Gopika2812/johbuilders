const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const UserPermission = require('./models/UserPermission');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const jb1 = await User.findOne({ name: 'jb1' });
    
    if (jb1) {
      const perms = await UserPermission.findOne({ userId: jb1._id });
      if (perms) {
        // Update extra_works and extra_works_crd permissions
        perms.permissions.forEach(p => {
          if (p.pageId === 'extra_works') {
            p.canView = true;
          }
          if (p.pageId === 'extra_works_crd') {
            p.canView = true;
            p.canEdit = true;
          }
        });
        await perms.save();
        console.log('Updated jb1 permissions successfully');
      }
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
test();
