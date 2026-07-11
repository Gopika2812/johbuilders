const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerAddress: {
    type: String,
    default: ''
  },
  projectType: {
    type: String,
    enum: ['Plot', 'Flat', 'House', 'Villa'],
    required: true
  },
  selectedUnits: [{
    type: String,
    required: true
  }],
  pricePerSqFt: {
    type: Number,
    default: 0
  },
  totalArea: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    required: true
  },
  alternativePhone: {
    type: String,
    default: ''
  },
  aadharNumber: {
    type: String,
    default: ''
  },
  panNumber: {
    type: String,
    default: ''
  },
  bankLoanRequired: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  loanAmount: {
    type: Number,
    default: 0
  },
  preferredBank: {
    type: String,
    default: ''
  },
  accountNumber: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  crdPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quotation', QuotationSchema);
