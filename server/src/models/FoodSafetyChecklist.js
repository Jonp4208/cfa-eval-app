import mongoose from 'mongoose';

const validationSchema = new mongoose.Schema({
  // For temperature checks
  minTemp: Number,
  maxTemp: Number,
  // For yes/no checks
  requiredValue: {
    type: String,
    enum: ['yes', 'no']
  },
  // For text checks
  requiredPattern: String,
  // Common fields
  warningThreshold: Number, // For temperatures
  criticalThreshold: Number // For temperatures
}, { _id: false });

const checklistItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['yes_no', 'temperature', 'text'],
    required: true
  },
  isCritical: {
    type: Boolean,
    default: false
  },
  validation: validationSchema,
  order: {
    type: Number,
    required: true
  }
});

const foodSafetyChecklistSchema = new mongoose.Schema({
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
  weeklyDay: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: function() {
      return this.frequency === 'weekly';
    }
  },
  monthlyWeek: {
    type: Number,
    min: 1,
    max: 4,
    required: function() {
      return this.frequency === 'monthly';
    }
  },
  monthlyDay: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: function() {
      return this.frequency === 'monthly';
    }
  },
  items: [checklistItemSchema],
  department: {
    type: String,
    default: 'Kitchen'
  },
  passingScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  requiresReview: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const FoodSafetyChecklist = mongoose.models.FoodSafetyChecklist || mongoose.model('FoodSafetyChecklist', foodSafetyChecklistSchema);

export default FoodSafetyChecklist; 