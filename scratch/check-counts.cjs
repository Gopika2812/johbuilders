const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });
const connectDB = require('../server/config/db');
const Lead = require('../server/models/Lead');
const Project = require('../server/models/Project');
const User = require('../server/models/User');

async function test() {
  await connectDB();
  console.log('Connected to database:', mongoose.connection.name);
  const leadsCount = await Lead.countDocuments({});
  const projectsCount = await Project.countDocuments({});
  const usersCount = await User.countDocuments({});
  console.log('Leads:', leadsCount);
  console.log('Projects:', projectsCount);
  console.log('Users:', usersCount);
  await mongoose.disconnect();
}

test().catch(console.error);
