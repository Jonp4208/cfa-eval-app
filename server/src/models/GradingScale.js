import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  value: { type: Number, required: true },
  label: { type: String, required: true },
  description: { type: String },
  color: { type: String, default: '#000000' }
});

const gradingScaleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
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
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  grades: [gradeSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Ensure at least 2 grades are provided
gradingScaleSchema.pre('save', function(next) {
  if (this.grades.length < 2) {
    next(new Error('A grading scale must have at least 2 grades'));
  }
  next();
});

// Ensure grades are in ascending order by value
gradingScaleSchema.pre('save', function(next) {
  const sortedGrades = [...this.grades].sort((a, b) => a.value - b.value);
  const areGradesOrdered = this.grades.every((grade, index) => grade.value === sortedGrades[index].value);
  if (!areGradesOrdered) {
    next(new Error('Grade values must be in ascending order'));
  }
  next();
});

// Ensure only one default scale per store
gradingScaleSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { store: this.store, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const GradingScale = mongoose.model('GradingScale', gradingScaleSchema);

export default GradingScale; 