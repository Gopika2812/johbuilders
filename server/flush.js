const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(uri).then(async () => {
  console.log('Connected to MongoDB database');
  
  const collectionsToKeep = [
    'users', 
    'userpermissions', 
    'rolepermissions', 
    'systemsettings'
  ];
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections in database.`);
  
  for (const col of collections) {
    if (!collectionsToKeep.includes(col.name.toLowerCase())) {
      console.log(`Dropping collection: ${col.name}`);
      await mongoose.connection.db.collection(col.name).drop();
    } else {
      console.log(`Keeping collection: ${col.name}`);
    }
  }
  
  console.log('Database flushed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Error during database flush:', err);
  process.exit(1);
});

