const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const CRDFlow = require('./models/CRDFlow');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  const flow = await CRDFlow.findOne({ 'complaints.token': '2U3VH31Y' });
  if (flow) {
    const complaint = flow.complaints.find(c => c.token === '2U3VH31Y');
    if (complaint) {
      complaint.pedPrice = 40000;
      await flow.save();
      console.log('Updated successfully to 40000');
    } else {
      console.log('Complaint not found');
    }
  } else {
    console.log('Flow not found');
  }
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
