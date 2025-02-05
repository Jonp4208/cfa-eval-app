import mongoose from 'mongoose';

const trainingPlanSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categories: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingCategory',
      required: true
    },
    modules: [{
      moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      name: String,
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
      },
      startDate: Date,
      completionDate: Date,
      notes: String
    }],
    startDate: Date,
    targetCompletionDate: Date,
    actualCompletionDate: Date
  }],
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  targetCompletionDate: Date,
  actualCompletionDate: Date,
  notes: String
}, {
  timestamps: true
});

export default trainingPlanSchema; 