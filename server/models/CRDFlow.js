const mongoose = require('mongoose');

const ExtraWorkSchema = new mongoose.Schema({
  ewId: { type: String }, // e.g., JLBEW001
  woId: { type: String }, // e.g., JLBWO001
  forUnit: { type: String }, // specific unit if multiple are booked
  name: { type: String, required: true }, // acts as description/sub-category
  category: { type: String, default: 'General' },
  unit: { type: String, default: 'Unit' },
  quantity: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, required: true }, // total amount (quantity * rate)
  status: { type: String, enum: ['Pending', 'Sent to PED', 'PED Approved', 'Returned to CRD', 'Sent to Customer', 'Client Approved', 'Sent to Accounts', 'Added to CRD', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed', 'Rejected', 'Removed by Client', 'Cancelled by Superadmin'], default: 'Pending' },
  addedAt: { type: Date, default: Date.now },
  sentToPedDate: { type: Date },
  pricingDate: { type: Date },
  customerApprovalDate: { type: Date },
  sentToAccountsDate: { type: Date },
  crdAddedDate: { type: Date },
  clientNotes: { type: String, default: '' }
});

const PaymentSplitSchema = new mongoose.Schema({
  method: { type: String, enum: ['Bank Transfer', 'Bank Loan', 'Customer Transfer'], required: true },
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
  token: { type: String }, // Random token for customer reference
  title: { type: String, default: 'Untitled Complaint' },
  description: { type: String, required: true },
  images: [{ type: String }], // Array of Cloudinary image URLs
  status: { type: String, enum: ['Pending', 'Sent to PED', 'Returned to CRD', 'Sent to Customer', 'Client Approved', 'Rejected', 'Removed by Client', 'Execution Sent to PED', 'Start Work', 'In Progress', 'Completed', 'Sent to Client (Completed)', 'Feedback Received'], default: 'Pending' },
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedPersonName: { type: String },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
  taskBoardVisible: { type: Boolean, default: true },
  scope: { type: String, enum: ['Company', 'Customer'] },
  sentToPedAt: { type: Date },
  pricingDate: { type: Date },
  customerSentDate: { type: Date },
  customerApprovalDate: { type: Date },
  executionSentDate: { type: Date },
  feedbackDate: { type: Date },
  clientFeedback: { type: String, default: '' },
  clientRating: { type: Number, default: 0 },
  clientNotes: { type: String, default: '' },
  pedPrice: { type: Number, default: 0 }
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
  credentials: {
    username: { type: String },
    password: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CRDFlowSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CRDFlow', CRDFlowSchema);
