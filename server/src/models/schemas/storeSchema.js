import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  phone: String,
  email: String,
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  metrics: {
    evaluationCompletion: {
      type: Number,
      default: 0
    },
    trainingProgress: {
      type: Number,
      default: 0
    },
    employeeRetention: {
      type: Number,
      default: 0
    }
  },
  settings: {
    evaluationFrequency: {
      type: Number,
      default: 90 // Default to quarterly (90 days)
    },
    autoSchedule: {
      type: Boolean,
      default: true
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

export default storeSchema; 