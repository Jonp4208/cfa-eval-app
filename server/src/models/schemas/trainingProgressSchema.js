import mongoose from 'mongoose';

const trainingProgressSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  position: {
    type: String,
    enum: [
      'Team Member',
      'Trainer',
      'Leader',
      'Director'
    ],
    required: true
  },
  department: {
    type: String,
    enum: ['Front Counter', 'Drive Thru', 'Kitchen', 'Everything'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  targetCompletionDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'on_hold'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  modules: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    startDate: Date,
    completedDate: Date,
    score: Number,
    feedback: String,
    attachments: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  evaluations: [{
    date: {
      type: Date,
      required: true
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    score: Number,
    feedback: String,
    strengths: [String],
    improvements: [String]
  }],
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  certifications: [{
    name: {
      type: String,
      required: true
    },
    achievedDate: Date,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['pending', 'achieved', 'expired'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

export default trainingProgressSchema; 