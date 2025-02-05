import mongoose from 'mongoose';

const disciplinarySchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['verbal', 'written', 'final', 'termination'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  incident: {
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    witnesses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  reason: {
    type: String,
    required: true
  },
  actionTaken: {
    type: String,
    required: true
  },
  improvementPlan: {
    description: String,
    timeline: String,
    goals: [{
      description: String,
      targetDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed'],
        default: 'pending'
      }
    }]
  },
  consequences: String,
  followUpDate: Date,
  followUpNotes: String,
  acknowledgement: {
    acknowledged: {
      type: Boolean,
      default: false
    },
    date: Date,
    comments: String
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'expired'],
    default: 'active'
  },
  relatedEvaluations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation'
  }]
}, {
  timestamps: true
});

export default disciplinarySchema; 