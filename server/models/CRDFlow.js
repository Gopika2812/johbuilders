const mongoose = require('mongoose');

const ExtraWorkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now }
});

const PaymentSplitSchema = new mongoose.Schema({
  method: { type: String, enum: ['Bank Transfer', 'Bank Loan'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  details: {
    accountNumber: String,
    customerName: String,
    bankName: String,
    loanAmount: Number,
    preferredBank: String
  }
});

const StageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  amount: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  completedDate: { type: Date },
  completionNotes: { type: String, default: '' },
  uploadedPdfs: [{ type: String }], // URLs or filenames of uploaded documents
  extraWorks: [ExtraWorkSchema],
  payments: [PaymentSplitSchema],
  demandLetter: {
    generatedAt: Date,
    subject: String,
    content: String
  }
});

const ComplaintSchema = new mongoose.Schema({
  description: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

const CRDFlowSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  unitId: {
    type: String,
    required: true
  },
  stages: [StageSchema],
  complaints: [ComplaintSchema],
  totalOriginalValue: { type: Number, required: true },
  totalExtraWorksValue: { type: Number, default: 0 },
  totalCurrentValue: { type: Number, required: true },
  debtorsAmount: { type: Number, default: 0 },
  targetAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Cancel Requested', 'Cancelled', 'Returned', 'Completed'], default: 'Active' },
  history: [{
    action: { type: String, required: true },
    notes: { type: String },
    date: { type: Date, default: Date.now },
    user: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CRDFlowSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CRDFlow', CRDFlowSchema);
