require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const employeeRoutes = require('./routes/employees');
const leadRoutes = require('./routes/leads');
const quotationRoutes = require('./routes/quotations');
const crdFlowRoutes = require('./routes/crdFlow');
const leadGroupRoutes = require('./routes/leadGroups');
const budgetPlanRoutes = require('./routes/budgetPlans');
const leadTargetRoutes = require('./routes/leadTargets');

const app = express();

// Connect Database
connectDB().then(async () => {
  // Seed default superadmin if not exists
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin@builders.com' });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@builders.com',
        password: 'adminpassword123', // Will be hashed automatically by pre-save hook
        role: 'Admin',
        isApproved: true
      });
      console.log('Seeded default Super Admin: admin@builders.com / adminpassword123');
    }
  } catch (err) {
    console.error('Error seeding superadmin:', err.message);
  }

  // Sync booked units from leads and quotations
  try {
    const Lead = require('./models/Lead');
    const Project = require('./models/Project');
    const Quotation = require('./models/Quotation');

    // Sync from Booked leads
    const bookedLeads = await Lead.find({ status: 'Booking' });
    for (const lead of bookedLeads) {
      if (lead.bookingInfo && lead.bookingInfo.selectedUnits && lead.bookingInfo.selectedUnits.length > 0) {
        const proj = await Project.findById(lead.project);
        if (proj) {
          let updated = false;
          lead.bookingInfo.selectedUnits.forEach(unitId => {
            const unit = proj.units.find(u => u.unitId === unitId);
            if (unit && unit.status !== 'Booked') {
              unit.status = 'Booked';
              unit.customerName = lead.name;
              unit.customerPhone = lead.phone;
              unit.leadName = lead.name;
              updated = true;
            }
          });
          if (updated) {
            await proj.save();
            console.log(`Synced booked units from lead ${lead.name}`);
          }
        }
      }
    }

    // Sync from Quotations
    const quotations = await Quotation.find({});
    for (const qtn of quotations) {
      if (qtn.selectedUnits && qtn.selectedUnits.length > 0) {
        const proj = await Project.findById(qtn.project);
        if (proj) {
          let updated = false;
          qtn.selectedUnits.forEach(unitId => {
            const unit = proj.units.find(u => u.unitId === unitId);
            if (unit && unit.status !== 'Booked') {
              unit.status = 'Booked';
              unit.customerName = qtn.customerName;
              unit.customerPhone = qtn.customerPhone;
              unit.leadName = qtn.customerName;
              updated = true;
            }
          });
          if (updated) {
            await proj.save();
            console.log(`Synced booked units from quotation for ${qtn.customerName}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error syncing booked units:', err.message);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/crd-flow', crdFlowRoutes);
app.use('/api/lead-groups', leadGroupRoutes);
app.use('/api/budget-plans', budgetPlanRoutes);
app.use('/api/lead-targets', leadTargetRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Real Estate ERP Backend is healthy' });
});

// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
