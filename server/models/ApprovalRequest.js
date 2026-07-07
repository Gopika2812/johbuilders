const mongoose = require('mongoose');

const ApprovalRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['CRD_CANCELLATION']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  narration: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ApprovalRequestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ApprovalRequest', ApprovalRequestSchema);
