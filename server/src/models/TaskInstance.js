import mongoose from 'mongoose';

const taskItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  estimatedTime: Number, // in minutes
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  }
});

const taskInstanceSchema = new mongoose.Schema({
  taskList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskList',
    required: true
  },
  department: {
    type: String,
    enum: ['Front Counter', 'Drive Thru', 'Kitchen'],
    required: true
  },
  shift: {
    type: String,
    enum: ['day', 'night'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  tasks: [taskItemSchema],
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
  completionRate: {
    type: Number,
    default: 0
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Update completion rate when tasks are modified
taskInstanceSchema.pre('save', function(next) {
  const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
  this.completionRate = (completedTasks / this.tasks.length) * 100;
  this.updatedAt = new Date();
  
  if (completedTasks === this.tasks.length) {
    this.status = 'completed';
  }
  
  next();
});

export default mongoose.model('TaskInstance', taskInstanceSchema); 