const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/builders/server/.env' });
const connectDB = require('../server/config/db');
const Lead = require('../server/models/Lead');
const Project = require('../server/models/Project');
const User = require('../server/models/User');
const Quotation = require('../server/models/Quotation');

async function test() {
  await connectDB();
  console.log('Connected to database:', mongoose.connection.name);
  
  try {
    const fromDate = '2026-07-01';
    const toDate = '2026-07-31';
    let query = {};
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    
    const leads = await Lead.find(query).populate('project').populate('assignedTo');
    const quotations = await Quotation.find({}).populate('lead').populate('project').populate('createdBy');
    
    // Compute stage-by-stage payments from CRD Flow
    const bookingLeads = leads.filter(l => l.status === 'Booking' || l.status === 'Won');
    const bookingLeadIds = bookingLeads.map(l => l._id);
    const CRDFlow = require('../server/models/CRDFlow');
    const crdFlows = await CRDFlow.find({ lead: { $in: bookingLeadIds } });

    // Booked Stage leads metrics
    const bookedLeads = leads.filter(l => l.status === 'Booking');
    const bookedLeadIds = bookedLeads.map(l => l._id);
    
    console.log('bookedCrdFlows check starting');
    const bookedCrdFlows = crdFlows.filter(cf => cf.lead && bookedLeadIds.map(id => id.toString()).includes(cf.lead.toString()));
    console.log('bookedCrdFlows check complete');

    let bookedTotalValue = 0;
    let bookedReceivedValue = 0;

    bookedLeads.forEach(lead => {
      console.log('booked lead check:', lead.name);
      const cf = bookedCrdFlows.find(flow => flow.lead && flow.lead.toString() === lead._id.toString());
      if (cf) {
        bookedTotalValue += cf.totalCurrentValue || 0;
        cf.stages?.forEach(stage => {
          stage.payments?.forEach(p => {
            bookedReceivedValue += p.amount || 0;
          });
        });
      } else {
        const q = quotations.find(quot => quot.lead && quot.lead._id && quot.lead._id.toString() === lead._id.toString());
        if (q) {
          bookedTotalValue += q.totalValue || 0;
        }
      }
    });
    console.log('booked leads loop complete');

  } catch (err) {
    console.error('CRASH IN STATS LOGIC:', err);
  }
  
  await mongoose.disconnect();
}

test().catch(console.error);
