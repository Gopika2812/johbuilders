const mongoose = require('mongoose');

const uri = 'mongodb://gopikap2812_db_user:OfAkpPu3iLQ7c72w@ac-qnctjrc-shard-00-00.8jfeh2t.mongodb.net:27017,ac-qnctjrc-shard-00-01.8jfeh2t.mongodb.net:27017,ac-qnctjrc-shard-00-02.8jfeh2t.mongodb.net:27017/?ssl=true&replicaSet=atlas-4pb6lf-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
  console.log('Connected to DB');
  
  const collectionsToKeep = [
    'users', 
    'userpermissions', 
    'rolepermissions', 
    'systemsettings'
  ];
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  for (const col of collections) {
    if (!collectionsToKeep.includes(col.name)) {
      console.log(`Dropping collection: ${col.name}`);
      await mongoose.connection.db.collection(col.name).drop();
    } else {
      console.log(`Keeping collection: ${col.name}`);
    }
  }
  
  console.log('Database flushed successfully!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
