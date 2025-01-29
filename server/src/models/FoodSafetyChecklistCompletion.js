import mongoose from 'mongoose';

const checklistItemCompletionSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodSafetyChecklist.items',
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pass', 'fail', 'warning', 'not_applicable'],
    required: true
  },
  notes: String,
  photo: String,
  completedAt: {
    type: Date,
    default: Date.now
  }
});

const foodSafetyChecklistCompletionSchema = new mongoose.Schema({
  checklist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodSafetyChecklist',
    required: true
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  items: [checklistItemCompletionSchema],
  overallStatus: {
    type: String,
    enum: ['pass', 'fail', 'warning', 'not_applicable'],
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  notes: String,
  completedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String
}, {
  timestamps: true
});

const FoodSafetyChecklistCompletion = mongoose.models.FoodSafetyChecklistCompletion || 
  mongoose.model('FoodSafetyChecklistCompletion', foodSafetyChecklistCompletionSchema);

export default FoodSafetyChecklistCompletion; 