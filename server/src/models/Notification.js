import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    alias: 'user',
    index: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    alias: 'store',
    index: true
  },
  type: {
    type: String,
    enum: ['TRAINING_ASSIGNED', 'TRAINING_COMPLETED', 'DISCIPLINARY', 'EVALUATION', 'GOAL', 'RECOGNITION', 'SYSTEM', 'REMINDER', 'TASK', 'evaluation'],
    required: true,
    set: function(v) {
      return v.toUpperCase();
    }
  },
  status: {
    type: String,
    enum: ['UNREAD', 'READ', 'ARCHIVED'],
    default: 'UNREAD',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  evaluationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation'
  },
  employee: {
    name: { type: String },
    position: { type: String },
    department: { type: String }
  },
  readAt: {
    type: Date
  },
  acknowledgedAt: {
    type: Date
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: false }
  },
  priority: {
    type: String,
    default: 'normal'
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Disciplinary', 'Evaluation', 'Goal', 'User', 'TaskInstance']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60, // Automatically delete after 30 days
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to set readAt when status changes to READ
notificationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'READ' && !this.readAt) {
    this.readAt = new Date();
  }
  if (this.evaluationId && (!this.metadata || !this.metadata.evaluationId)) {
    this.metadata = {
      ...this.metadata,
      evaluationId: this.evaluationId
    };
  }
  next();
});

// Create compound indexes
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ storeId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification; 