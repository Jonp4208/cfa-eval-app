import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending_self_evaluation',    // Initial state - waiting for employee
      'pending_manager_review',     // Employee completed, waiting for manager
      'in_review_session',         // Manager scheduled review session
      'completed'                  // Evaluation finalized
    ],
    default: 'pending_self_evaluation'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  reviewSessionDate: Date,
  completedDate: Date,
  selfEvaluation: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  managerEvaluation: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  overallComments: String,
  developmentPlan: String,
  acknowledgement: {
    acknowledged: {
      type: Boolean,
      default: false
    },
    date: Date
  },
  notificationStatus: {
    employee: {
      scheduled: { type: Boolean, default: false },
      completed: { type: Boolean, default: false },
      acknowledged: { type: Boolean, default: false }
    },
    evaluator: {
      selfEvaluationCompleted: { type: Boolean, default: false },
      reviewSessionScheduled: { type: Boolean, default: false }
    }
  },
  notificationViewed: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);
export default Evaluation;
