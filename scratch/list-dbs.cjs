const mongoose = require('mongoose');

async function check() {
  const uri = 'mongodb+srv://gopikap2812_db_user:OfAkpPu3iLQ7c72w@builders.8jfeh2t.mongodb.net/?retryWrites=true&w=majority';
  await mongoose.connect(uri);
  console.log('Connected!');
  
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('Databases:', dbs.databases.map(d => d.name));
  
  await mongoose.disconnect();
}

check().catch(console.error);
