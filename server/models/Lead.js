const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  leadType: {
    type: String,
    enum: ['Lead', 'Direct Visit'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  profession: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  bankLoan: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  bankLoanPercentage: {
    type: Number,
    default: 0
  },
  // fields for Lead Type
  leadSource: {
    type: String,
    default: ''
  },
  activeAd: {
    name: { type: String, default: '' },
    link: { type: String, default: '' }
  },
  // fields for Direct Visit Type
  projectLocation: {
    type: String,
    default: ''
  },
  // project reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: [
      'New',
      'Assigned',
      'Follow-Up',
      'Site Visit',
      'Booking',
      'Future Follow-up',
      'Lost',
      'Cancelled'
    ],
    default: 'New'
  },
  bookingInfo: {
    selectedUnits: [{ type: String }],
    alternativePhone: { type: String, default: '' },
    aadharNumber: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    hasLoan: { type: String, enum: ['Yes', 'No'], default: 'No' },
    loanDetails: {
      amountRequired: { type: Number, default: 0 },
      preferredBank: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      loanStatus: { type: String, default: '' },
      disbursedAmount: { type: Number, default: 0 }
    },
    bookingDate: { type: Date, default: Date.now }
  },
  followUpInfo: {
    nextFollowUpDate: { type: Date },
    contactedThrough: { type: String, enum: ['WhatsApp', 'Call', 'On Spot'] },
    remarks: { type: String, default: '' }
  },
  isClosed: { type: Boolean, default: false },
  isReopened: { type: Boolean, default: false },
  closeRemarks: { type: String, default: '' },
  history: [
    {
      status: { type: String, required: true },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
      note: { type: String, default: '' }
    }
  ],
  leadCost: {
    type: Number,
    default: 0
  },
  leadCategory: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold'],
    default: 'Cold'
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

// Update updatedAt on change
LeadSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Lead', LeadSchema);
