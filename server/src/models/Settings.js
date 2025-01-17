import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    unique: true
  },
  userAccess: {
    roleManagement: {
      storeDirectorAccess: { type: Boolean, default: true },
      kitchenDirectorAccess: { type: Boolean, default: true },
      serviceDirectorAccess: { type: Boolean, default: true },
      storeLeaderAccess: { type: Boolean, default: true },
      trainingLeaderAccess: { type: Boolean, default: true },
      shiftLeaderAccess: { type: Boolean, default: true },
      fohLeaderAccess: { type: Boolean, default: true },
      bohLeaderAccess: { type: Boolean, default: true },
      dtLeaderAccess: { type: Boolean, default: true }
    },
    evaluation: {
      departmentRestriction: { type: Boolean, default: true },
      requireStoreLeaderReview: { type: Boolean, default: true },
      requireDirectorApproval: { type: Boolean, default: true },
      trainingAccess: { type: Boolean, default: true },
      certificationApproval: { type: Boolean, default: true },
      metricsAccess: { type: Boolean, default: true },
      workflowType: { 
        type: String, 
        enum: ['simple', 'standard', 'strict'],
        default: 'standard'
      }
    }
  },
  evaluations: {
    scheduling: {
      autoSchedule: { type: Boolean, default: false },
      frequency: { type: Number, default: 90 }, // Default to quarterly (90 days)
      cycleStart: { 
        type: String,
        enum: ['hire_date', 'calendar_year', 'fiscal_year', 'custom'],
        default: 'hire_date'
      },
      customStartDate: { type: Date },
      transitionMode: {
        type: String,
        enum: ['immediate', 'complete_cycle', 'align_next'],
        default: 'complete_cycle'
      }
    }
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  compactMode: {
    type: Boolean,
    default: false
  },
  storeName: String,
  storeNumber: String,
  storeAddress: String,
  storePhone: String,
  storeEmail: String
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;