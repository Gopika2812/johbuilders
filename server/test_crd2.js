const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Quotation = require('./models/Quotation');
const CRDFlow = require('./models/CRDFlow');
const Project = require('./models/Project');
const Lead = require('./models/Lead');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const jb1 = await User.findOne({ name: 'jb1' });
    const qs = await Quotation.find({ crdPerson: jb1._id }).populate('crdPerson');
    const authorizedLeadIds = qs.map(q => q.lead);
    
    // We need to populate 'lead' like the route does
    const flows = await CRDFlow.find({ lead: { $in: authorizedLeadIds } })
      .populate('project')
      .populate('lead')
      .lean();
      
    console.log('CRDFlows populated:', flows.length);
    
    const flowsWithExtraWorks = flows.filter(flow => {
      console.log('Flow ID:', flow._id);
      console.log('Flow Status:', flow.status);
      console.log('Flow Lead Status:', flow.lead ? flow.lead.status : 'No lead');
      console.log('Has Extra Works:', flow.stages.some(stage => stage.extraWorks && stage.extraWorks.length > 0));

      if (flow.status === 'Cancelled' || flow.status === 'Returned') return false;
      if (flow.lead && ['Lost', 'Cancelled'].includes(flow.lead.status)) return false;

      return flow.stages.some(stage => stage.extraWorks && stage.extraWorks.length > 0);
    });
    
    console.log('Filtered flows length:', flowsWithExtraWorks.length);
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
