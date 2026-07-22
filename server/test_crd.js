const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Quotation = require('./models/Quotation');
const CRDFlow = require('./models/CRDFlow');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const jb1 = await User.findOne({ name: 'jb1' });
    if (!jb1) {
      console.log('jb1 not found');
      process.exit();
    }
    console.log('jb1 ID:', jb1._id);

    const qs = await Quotation.find({ crdPerson: jb1._id }).populate('crdPerson');
    console.log('Quotations for jb1 count:', qs.length);
    if (qs.length > 0) {
      console.log('Lead IDs in quotations:', qs.map(q => q.lead));
    }

    const authorizedLeadIds = qs.map(q => q.lead);
    const flows = await CRDFlow.find({ lead: { $in: authorizedLeadIds } });
    console.log('CRDFlows found by lead IDs:', flows.length);
    
    // Also check flows overall
    const allFlows = await CRDFlow.find({});
    console.log('Total CRDFlows in DB:', allFlows.length);
    
    // Find who is the CRD person for the first flow
    if (allFlows.length > 0) {
      const q = await Quotation.findOne({ lead: allFlows[0].lead }).populate('crdPerson');
      console.log('Quotation for first flow CRD person:', q ? (q.crdPerson ? q.crdPerson.name : 'none') : 'no quotation');
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
