const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const RolePermission = require('./models/RolePermission');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const crdRole = await RolePermission.findOne({ roleName: 'Crd team' });
    console.log('Crd team permissions:', JSON.stringify(crdRole, null, 2));
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
test();
