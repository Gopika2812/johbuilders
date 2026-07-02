const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
  unitId: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'Booked', 'Under Construction', 'Sold Out'],
    default: 'New'
  },
  floor: {
    type: String, // relevant for flats
    default: ''
  },
  customerName: {
    type: String,
    default: ''
  },
  customerPhone: {
    type: String,
    default: ''
  },
  leadName: {
    type: String,
    default: ''
  },
  isLocked: {
    type: Boolean,
    default: false // tracks if edited/locked for redistribution
  },
  mapCoordinates: {
    x: { type: Number },
    y: { type: Number }
  },
  unitType: {
    type: String,
    default: 'Flat'
  },
  ratePerUom: {
    type: Number,
    default: 0
  },
  soldRatePerUom: {
    type: Number,
    default: 0
  },
  soldConsideration: {
    type: Number,
    default: 0
  }
});

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  projectType: [{
    type: String,
    enum: ['Plot', 'Flat', 'House', 'Villa']
  }],
  layoutPlanImage: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    required: true
  },
  totalLandArea: {
    type: Number,
    required: true
  },
  pricePerSqFt: {
    type: Number,
    required: true
  },
  totalValuation: {
    type: Number,
    default: 0
  },
  remainingLand: {
    type: Number,
    default: 0
  },
  units: [UnitSchema],
  marketingInfo: {
    sourceType: {
      type: String,
      default: ''
    },
    videos: [
      {
        name: { type: String, default: '' },
        link: { type: String, default: '' },
        status: { type: String, enum: ['Active', 'Paused'], default: 'Active' },
        cost: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now }
      }
    ],
    posters: [
      {
        name: { type: String, default: '' },
        link: { type: String, default: '' },
        status: { type: String, enum: ['Active', 'Paused'], default: 'Active' },
        cost: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now }
      }
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total valuation and remaining land before saving
ProjectSchema.pre('save', function (next) {
  // Update unit values based on size and price
  this.units.forEach(unit => {
    if (unit.ratePerUom && unit.ratePerUom > 0) {
      unit.price = unit.size * unit.ratePerUom;
    } else {
      unit.price = unit.size * this.pricePerSqFt;
    }
  });

  // Calculate remaining land (primarily for Plot projects)
  if (this.projectType && this.projectType.includes('Plot')) {
    const lockedUnitsSize = this.units
      .filter(u => u.isLocked)
      .reduce((sum, u) => sum + u.size, 0);
    this.remainingLand = this.totalLandArea - lockedUnitsSize;
  } else {
    this.remainingLand = 0;
  }

  // Recalculate total valuation
  this.totalValuation = this.units.reduce((sum, u) => sum + u.price, 0);

  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
