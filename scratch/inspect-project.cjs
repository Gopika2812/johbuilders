const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });
const connectDB = require('../server/config/db');
const Project = require('../server/models/Project');

async function test() {
  await connectDB();
  const projs = await Project.find({});
  console.log('Projects found:', projs.length);
  for (const proj of projs) {
    console.log('---');
    console.log('Project Name:', proj.name);
    console.log('Project Types:', proj.projectType);
    console.log('Units count:', proj.units.length);
    if (proj.units.length > 0) {
      console.log('First unit sample:', JSON.stringify(proj.units[0], null, 2));
      console.log('Distinct unitTypes:', [...new Set(proj.units.map(u => u.unitType))]);
    }
  }
  await mongoose.disconnect();
}

test().catch(console.error);
