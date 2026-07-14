const mongoose = require('mongoose');
const CRDFlow = require('./server/models/CRDFlow');

mongoose.connect('mongodb://gopikap2812_db_user:OfAkpPu3iLQ7c72w@ac-qnctjrc-shard-00-00.8jfeh2t.mongodb.net:27017,ac-qnctjrc-shard-00-01.8jfeh2t.mongodb.net:27017,ac-qnctjrc-shard-00-02.8jfeh2t.mongodb.net:27017/?ssl=true&replicaSet=atlas-4pb6lf-shard-0&authSource=admin&retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const flow = await CRDFlow.findOne({});
      if (!flow) {
        console.log("No flows found.");
        process.exit(0);
      }
      // Force it to validate everything
      flow.markModified('stages');
      await flow.save();
      console.log("Saved successfully!");
    } catch (e) {
      console.error("Validation Error:", e);
    }
    process.exit(0);
  });
