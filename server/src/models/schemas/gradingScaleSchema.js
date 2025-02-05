import mongoose from 'mongoose';

const gradingScaleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  levels: [{
    value: {
      type: Number,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    description: String,
    color: {
      type: String,
      default: '#000000'
    },
    minScore: {
      type: Number,
      required: true
    },
    maxScore: {
      type: Number,
      required: true
    }
  }],
  defaultScale: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default gradingScaleSchema; 