import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const goalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Operational', 'Service', 'Leadership', 'Training', 'Team Building', 'Guest Experience'],
    default: 'Operational'
  },
  progress: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['not-started', 'in-progress', 'completed', 'overdue'],
    default: 'not-started'
  },
  dueDate: {
    type: Date,
    required: true
  },
  steps: [stepSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Update status based on progress and due date
goalSchema.pre('save', function(next) {
  if (this.progress === 100) {
    this.status = 'completed';
  } else if (this.progress > 0) {
    this.status = 'in-progress';
  } else if (new Date(this.dueDate) < new Date()) {
    this.status = 'overdue';
  }
  next();
});

export const Goal = mongoose.model('Goal', goalSchema); 