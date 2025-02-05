import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'evaluation_scheduled',
      'evaluation_completed',
      'evaluation_reminder',
      'self_evaluation_completed',
      'review_session_scheduled',
      'evaluation_acknowledged',
      'system_notification'
    ],
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
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  metadata: {
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evaluation'
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  expiresAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  archivedAt: {
    type: Date
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  }
}, {
  timestamps: true
});

export default notificationSchema; 