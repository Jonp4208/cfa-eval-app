import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['performance', 'development', 'career', 'training'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'cancelled'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  targetDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  metrics: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  milestones: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    dueDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    }
  }],
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'other']
    },
    url: String
  }],
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  relatedEvaluations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation'
  }],
  tags: [String]
}, {
  timestamps: true
});

export default goalSchema; 