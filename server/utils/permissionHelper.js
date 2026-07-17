const UserPermission = require('../models/UserPermission');

const defaultPages = [
  { pageId: 'dashboard', pageName: 'Dashboard' },
  { pageId: 'kpi_insights', pageName: 'KPI Insights' },
  { pageId: 'projects', pageName: 'Projects Directory' },
  { pageId: 'leads', pageName: 'Leads Directory' },
  { pageId: 'quotations', pageName: 'Quotation Records' },
  { pageId: 'crd_flow', pageName: 'CRD Flow' },
  { pageId: 'complaints_flow', pageName: 'Complaints Flow' },
  { pageId: 'extra_works', pageName: 'Extra Works Flow' },
  { pageId: 'extra_works_crd', pageName: 'Extra Works - CRD Team' },
  { pageId: 'extra_works_ped', pageName: 'Extra Works - PED Team' },
  { pageId: 'extra_works_client', pageName: 'Extra Works - Client Approved' },
  { pageId: 'extra_works_accounts', pageName: 'Extra Works - Accounts Team' },
  { pageId: 'extra_works_work_orders', pageName: 'Extra Works - Work Orders' },
  { pageId: 'bank_loan', pageName: 'Bank Loan History' },
  { pageId: 'overall_collection', pageName: 'Overall Collection Report' },
  { pageId: 'sales_reports', pageName: 'Sales Reports' },
  { pageId: 'crd_reports', pageName: 'CRD Reports' },
  { pageId: 'customers', pageName: 'Customers' },
  { pageId: 'tasks_board', pageName: 'Tasks Board' },
  { pageId: 'employees', pageName: 'Employees' },
  { pageId: 'audit_logs', pageName: 'Audit Logs' },
  { pageId: 'finance_budget', pageName: 'Budget Planning' },
  { pageId: 'finance_lead', pageName: 'Lead Target Planning' },
  { pageId: 'finance_summary', pageName: 'Summary Planning' },
  { pageId: 'access_control', pageName: 'Access Control' },
  { pageId: 'settings', pageName: 'Settings' }
];

const getMergedPermissions = async (user) => {
  if (!user) return [];
  let userPerm = await UserPermission.findOne({ userId: user._id });
  let permissions = [];

  if (!userPerm) {
    // Create default permissions
    permissions = defaultPages.map(page => ({
      pageId: page.pageId,
      pageName: page.pageName,
      canView: user.role === 'Superadmin' || page.pageId === 'dashboard',
      canEdit: user.role === 'Superadmin'
    }));
  } else {
    permissions = userPerm.permissions.map(p => p.toObject ? p.toObject() : p);
    // Merge missing default pages
    defaultPages.forEach(dp => {
      if (!permissions.find(p => p.pageId === dp.pageId)) {
        permissions.push({
          pageId: dp.pageId,
          pageName: dp.pageName,
          canView: user.role === 'Superadmin',
          canEdit: user.role === 'Superadmin'
        });
      }
    });
  }

  return permissions;
};

module.exports = {
  defaultPages,
  getMergedPermissions
};
