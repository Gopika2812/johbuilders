const mongoose = require('mongoose');

const UserTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  projectName: {
    type: String,
    trim: true,
    default: ''
  },
  dueDate: {
    type: Date,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
    default: 'New'
  },
  priority: {
    type: String,
    enum: ['Urgent', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  attachments: [
    {
      url: { type: String, default: '' },
      name: { type: String, default: '' },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  repeatType: {
    type: String,
    enum: ['None', 'Hourly', 'Daily'],
    default: 'None'
  },
  reminderInterval: {
    type: Number,
    default: 1
  },
  lastReminderSentAt: {
    type: Date
  },
  actionTaken: {
    type: Boolean,
    default: false
  },
  snoozedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  history: [
    {
      action: { type: String, default: '' },
      status: { type: String, default: '' },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      note: { type: String, default: '' },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt timestamp before save
UserTaskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UserTask', UserTaskSchema);
