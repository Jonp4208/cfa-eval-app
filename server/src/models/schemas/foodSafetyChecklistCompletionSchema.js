import mongoose from 'mongoose';

const foodSafetyChecklistCompletionSchema = new mongoose.Schema({
  checklist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodSafetyChecklist',
    required: true
  },
  completedItems: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: String,
    category: String,
    status: {
      type: String,
      enum: ['completed', 'failed', 'skipped'],
      required: true
    },
    temperature: Number,
    photoUrl: String,
    notes: String,
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  notes: String
}, {
  timestamps: true
});

export default foodSafetyChecklistCompletionSchema; 