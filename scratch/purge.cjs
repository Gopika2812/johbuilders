const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://gopikap2812_db_user:OfAkpPu3iLQ7c72w@builders.8jfeh2t.mongodb.net/';

async function purge() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const colInfo of collections) {
      const name = colInfo.name;
      if (name === 'users') {
        console.log('Purging non-admin users...');
        const res = await db.collection('users').deleteMany({ role: { $ne: 'Admin' } });
        console.log(`Deleted ${res.deletedCount} non-admin users.`);
      } else {
        console.log(`Clearing collection: ${name}...`);
        const res = await db.collection(name).deleteMany({});
        console.log(`Cleared ${res.deletedCount} documents from ${name}.`);
      }
    }
    console.log('Database purge completed successfully!');
  } catch (err) {
    console.error('Error during purge:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

purge();
