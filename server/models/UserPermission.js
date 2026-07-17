const mongoose = require('mongoose');

const UserPermissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  userName: {
    type: String,
    required: true
  },
  permissions: [{
    pageId: { type: String, required: true }, // e.g. "dashboard", "projects", "leads", "employees", "finance", "settings"
    pageName: { type: String, required: true },
    canView: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    columns: { type: mongoose.Schema.Types.Mixed, default: {} }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('UserPermission', UserPermissionSchema);
