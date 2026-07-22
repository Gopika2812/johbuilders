const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const jb1 = await User.findOne({ name: 'jb1' });
    console.log('jb1 permissions:', JSON.stringify(jb1.permissions, null, 2));
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
test();
