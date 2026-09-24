require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
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
const summaryPlanRoutes = require('./routes/summaryPlans');
const parameterPlanRoutes = require('./routes/parameterPlans');
const rolePermissionRoutes = require('./routes/rolePermissions');
const userPermissionRoutes = require('./routes/userPermissions');
const dashboardRoutes = require('./routes/dashboard');
const auditLogRoutes = require('./routes/auditLogs');
const requestsRoutes = require('./routes/requests');
const customerRoutes = require('./routes/customer');
const extraWorksRoutes = require('./routes/extraWorks');
const tasksRoutes = require('./routes/tasks');
const userTaskRoutes = require('./routes/userTasks');
const taskCategoryRoutes = require('./routes/taskCategories');
const settingsRoutes = require('./routes/settings');
const app = express();

// Background database synchronization & seed logic (non-blocking)
const runBackgroundSync = async () => {
  try {
    const User = require('./models/User');
    try {
      await User.collection.dropIndex('email_1');
      console.log('Successfully dropped unique index email_1');
    } catch {}

    // Seed default superadmin if not exists
    const adminExists = await User.findOne({ email: 'admin@builders.com' });
    if (!adminExists) {
      await User.create({
        name: 'Superadmin',
        email: 'admin@builders.com',
        phone: '9999999999',
        password: 'adminpassword123',
        role: 'Superadmin',
        isApproved: true
      });
      console.log('Seeded default Superadmin: admin@builders.com / adminpassword123');
    }

    // Migration: Add placeholder phone numbers to existing users without one
    const usersWithoutPhone = await User.find({ phone: { $exists: false } });
    for (const u of usersWithoutPhone) {
      if (u.email === 'admin@builders.com') {
        u.phone = '9999999999';
      } else {
        const randomSuffix = Math.floor(100000 + Math.random() * 900000);
        u.phone = `999${randomSuffix}`;
      }
      await u.save();
    }
  } catch (err) {
    console.error('Background sync note:', err.message);
  }
};

// Connect Database & run background routines
connectDB().then(() => {
  setTimeout(() => {
    runBackgroundSync();
  }, 2000);
});

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
app.use('/api/summary-plans', summaryPlanRoutes);
app.use('/api/parameter-plans', parameterPlanRoutes);
app.use('/api/role-permissions', rolePermissionRoutes);
app.use('/api/user-permissions', userPermissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/extra-works', extraWorksRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/user-tasks', userTaskRoutes);
app.use('/api/task-categories', taskCategoryRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Real Estate ERP Backend is healthy' });
});

// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
