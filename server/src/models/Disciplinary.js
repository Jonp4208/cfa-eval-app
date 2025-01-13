import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  },
  note: {
    type: String,
    required: true
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const disciplinarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Attendance', 'Policy Violation', 'Performance', 'Conduct', 'Safety', 'Customer Service']
  },
  severity: {
    type: String,
    required: true,
    enum: ['Minor', 'Moderate', 'Major', 'Critical']
  },
  status: {
    type: String,
    required: true,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  },
  description: {
    type: String,
    required: true
  },
  witnesses: {
    type: String
  },
  actionTaken: {
    type: String,
    required: true
  },
  followUpDate: {
    type: Date,
    required: true
  },
  followUpActions: {
    type: String,
    required: true
  },
  previousIncidents: {
    type: Boolean,
    default: false
  },
  documentationAttached: {
    type: Boolean,
    default: false
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followUps: [followUpSchema],
  documents: [documentSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Disciplinary', disciplinarySchema); 