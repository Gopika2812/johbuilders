const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const UserPermission = require('./models/UserPermission');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const jb1 = await User.findOne({ name: 'jb1' });
    const perms = await UserPermission.findOne({ userId: jb1._id });
    console.log('UserPermissions for jb1:');
    if (perms) {
      console.log(perms.permissions.find(p => p.pageId === 'extra_works_crd'));
    } else {
      console.log('null');
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
test();
