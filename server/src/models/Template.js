import mongoose from 'mongoose';

const criterionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  gradingScale: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GradingScale',
    required: true
  },
  required: { type: Boolean, default: true }
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 },
  criteria: [criterionSchema]
});

const templateSchema = new mongoose.Schema({
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
  sections: [sectionSchema],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for sections count
templateSchema.virtual('sectionsCount').get(function() {
  return this.sections.length;
});

// Virtual for criteria count
templateSchema.virtual('criteriaCount').get(function() {
  return this.sections.reduce((count, section) => count + section.criteria.length, 0);
});

const Template = mongoose.model('Template', templateSchema);

export default Template; 