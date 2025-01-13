import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    unique: true
  },
  general: {
    storeName: String,
    storeNumber: String,
    location: String,
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  userAccess: {
    allowRegistration: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    },
    autoAssignBasicRole: {
      type: Boolean,
      default: true
    }
  },
  evaluations: {
    enableSelfEvaluations: {
      type: Boolean,
      default: true
    },
    requireComments: {
      type: Boolean,
      default: true
    },
    allowDraftSaving: {
      type: Boolean,
      default: true
    },
    defaultReviewPeriod: {
      type: Number,
      default: 30
    }
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    evaluationReminders: {
      type: Boolean,
      default: true
    },
    systemUpdates: {
      type: Boolean,
      default: true
    },
    reminderLeadTime: {
      type: Number,
      default: 7
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;