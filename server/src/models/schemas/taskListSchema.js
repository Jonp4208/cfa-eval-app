import mongoose from 'mongoose';

const taskListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  department: {
    type: String,
    enum: ['Front Counter', 'Drive Thru', 'Kitchen', 'Everything'],
    required: true
  },
  shift: {
    type: String,
    enum: ['day', 'night', 'both'],
    default: 'both'
  },
  tasks: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    estimatedTime: Number, // in minutes
    requiresPhoto: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default taskListSchema; 