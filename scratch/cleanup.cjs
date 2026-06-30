const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://gopikap2812_db_user:OfAkpPu3iLQ7c72w@builders.8jfeh2t.mongodb.net/';

async function cleanup() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const collections = mongoose.connection.collections;
    for (const name in collections) {
      if (name === 'users') {
        console.log('Keeping users collection, but filtering out non-admin users...');
        const res = await mongoose.connection.collection('users').deleteMany({ role: { $ne: 'Admin' } });
        console.log(`Deleted ${res.deletedCount} non-admin users.`);
      } else {
        console.log(`Clearing collection: ${name}...`);
        const res = await collections[name].deleteMany({});
        console.log(`Cleared ${res.deletedCount} documents from ${name}.`);
      }
    }
    console.log('Database cleanup completed successfully!');
  } catch (err) {
    console.error('Error cleaning up database:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

cleanup();
