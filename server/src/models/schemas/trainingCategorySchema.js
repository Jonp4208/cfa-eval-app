import mongoose from 'mongoose';

const trainingCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  order: {
    type: Number,
    default: 0
  },
  modules: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    order: {
      type: Number,
      default: 0
    },
    estimatedTime: Number, // in minutes
    resources: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['video', 'document', 'link'],
        required: true
      }
    }]
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

export default trainingCategorySchema; 