import mongoose from 'mongoose';

const foodSafetyChecklistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  items: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      enum: ['Temperature', 'Cleanliness', 'Food Storage', 'Personal Hygiene', 'Equipment', 'Other'],
      required: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    requiresPhoto: {
      type: Boolean,
      default: false
    },
    requiresTemperature: {
      type: Boolean,
      default: false
    },
    temperatureRange: {
      min: Number,
      max: Number
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default foodSafetyChecklistSchema; 