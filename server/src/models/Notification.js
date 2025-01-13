import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  type: {
    type: String,
    enum: ['disciplinary', 'evaluation', 'goal', 'recognition', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
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
    enum: ['Disciplinary', 'Evaluation', 'Goal', 'User']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // Automatically delete after 30 days
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ store: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification; 