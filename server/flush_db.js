const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const ApprovalRequest = require('./models/ApprovalRequest');
const AuditLog = require('./models/AuditLog');
const BudgetPlan = require('./models/BudgetPlan');
const CRDFlow = require('./models/CRDFlow');
const Lead = require('./models/Lead');
const LeadGroup = require('./models/LeadGroup');
const LeadTarget = require('./models/LeadTarget');
const ParameterPlan = require('./models/ParameterPlan');
const Quotation = require('./models/Quotation');
const SummaryPlan = require('./models/SummaryPlan');
const Project = require('./models/Project');

const flushData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    console.log('Deleting ApprovalRequests...');
    await ApprovalRequest.deleteMany({});
    
    console.log('Deleting AuditLogs...');
    await AuditLog.deleteMany({});
    
    console.log('Deleting BudgetPlans...');
    await BudgetPlan.deleteMany({});
    
    console.log('Deleting CRDFlows (including Extra Works and Complaints)...');
    await CRDFlow.deleteMany({});
    
    console.log('Deleting Leads...');
    await Lead.deleteMany({});
    
    console.log('Deleting LeadGroups...');
    await LeadGroup.deleteMany({});
    
    console.log('Deleting LeadTargets...');
    await LeadTarget.deleteMany({});
    
    console.log('Deleting ParameterPlans...');
    await ParameterPlan.deleteMany({});
    
    console.log('Deleting Quotations...');
    await Quotation.deleteMany({});
    
    console.log('Deleting SummaryPlans...');
    await SummaryPlan.deleteMany({});

    // Reset units in Projects to available, instead of deleting the Projects entirely (since Projects are master data)
    console.log('Resetting Project units to New...');
    await Project.updateMany(
      {},
      {
        $set: {
          'units.$[].status': 'New',
          'units.$[].customerName': '',
          'units.$[].customerPhone': '',
          'units.$[].leadName': '',
          'units.$[].isLocked': false
        }
      }
    );

    console.log('All transactional data flushed successfully!');
    console.log('Users, Roles, Permissions, System Settings, and base Projects have been preserved.');
    
    process.exit();
  } catch (error) {
    console.error('Error with flushing data:', error);
    process.exit(1);
  }
};

flushData();
