import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  evaluationSettings: {
    defaultFrequency: {
      type: Number,
      default: 90 // Default to quarterly (90 days)
    },
    autoSchedule: {
      type: Boolean,
      default: true
    },
    reminderDays: {
      type: Number,
      default: 7
    },
    allowSelfEvaluation: {
      type: Boolean,
      default: true
    }
  },
  notificationSettings: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      evaluationScheduled: {
        type: Boolean,
        default: true
      },
      evaluationCompleted: {
        type: Boolean,
        default: true
      },
      evaluationReminder: {
        type: Boolean,
        default: true
      }
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      evaluationScheduled: {
        type: Boolean,
        default: true
      },
      evaluationCompleted: {
        type: Boolean,
        default: true
      },
      evaluationReminder: {
        type: Boolean,
        default: true
      }
    }
  },
  displaySettings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  securitySettings: {
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: true
      },
      requireUppercase: {
        type: Boolean,
        default: true
      }
    },
    sessionTimeout: {
      type: Number,
      default: 3600 // 1 hour in seconds
    }
  }
}, {
  timestamps: true
});

export default settingsSchema; 