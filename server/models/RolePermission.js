const mongoose = require('mongoose');

const RolePermissionSchema = new mongoose.Schema({
  role: {
    type: String, // e.g. "Superadmin", "Crd team", "sales person", "ped team"
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
