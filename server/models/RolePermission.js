const mongoose = require('mongoose');

const RolePermissionSchema = new mongoose.Schema({
  role: {
    type: String, // e.g. "Admin", "Manager", "Sales Executive", "Site Engineer"
    required: true,
    unique: true
  },
  permissions: [{
    pageId: { type: String, required: true }, // e.g. "dashboard", "projects", "leads", "employees", "finance", "settings"
    pageName: { type: String, required: true },
    canView: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('RolePermission', RolePermissionSchema);
