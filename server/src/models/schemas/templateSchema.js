import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  position: {
    type: String,
    required: true,
    enum: [
      'Team Member',
      'Trainer',
      'Leader',
      'Director'
    ]
  },
  sections: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    weight: {
      type: Number,
      default: 1
    },
    criteria: [{
      title: {
        type: String,
        required: true
      },
      description: String,
      weight: {
        type: Number,
        default: 1
      },
      gradingScale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradingScale'
      }
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  }
}, {
  timestamps: true
});

export default templateSchema; 