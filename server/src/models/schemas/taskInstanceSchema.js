import mongoose from 'mongoose';

const taskInstanceSchema = new mongoose.Schema({
  taskList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskList',
    required: true
  },
  task: {
    name: {
      type: String,
      required: true
    },
    description: String,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    estimatedTime: Number,
    requiresPhoto: Boolean
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue'],
    default: 'pending'
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  photoUrl: String,
  notes: String,
  dueDate: {
    type: Date,
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  }
}, {
  timestamps: true
});

export default taskInstanceSchema; 