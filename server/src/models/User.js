import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'evaluator', 'admin', 'store-director', 'kitchen-director', 'service-director', 'store-leader', 'training-leader', 'shift-leader'],
    default: 'user'
  },
  department: {
    type: String,
    enum: ['FOH', 'BOH', 'Leadership', 'Training'],
    required: true
  },
  position: {
    type: String,
    enum: [
      'Team Member',
      'Trainer',
      'Team Leader',
      'Shift Leader',
      'Store Leader',
      'Kitchen Director',
      'Service Director',
      'Store Director',
      'Training Leader'
    ],
    required: true
  },
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  quadrant: {
    type: String,
    enum: ['q1', 'q2', 'q3', 'q4'],
    default: 'q3'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  previousRoles: [{
    position: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date
  }],
  evaluations: [{
    date: {
      type: Date,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    strengths: [String],
    improvements: [String]
  }],
  certifications: [{
    name: {
      type: String,
      required: true
    },
    achievedDate: {
      type: Date,
      required: true
    },
    expiryDate: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'pending'],
      default: 'active'
    }
  }],
  development: [{
    goal: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
    },
    targetDate: {
      type: Date,
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    notes: [String]
  }],
  recognition: [{
    date: {
      type: Date,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    awardedBy: {
      type: String,
      required: true
    }
  }],
  documentation: [{
    type: {
      type: String,
      enum: ['review', 'disciplinary', 'coaching'],
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    createdBy: {
      type: String,
      required: true
    }
  }],
  metrics: {
    evaluationScores: [{
      date: {
        type: Date,
        required: true
      },
      score: {
        type: Number,
        required: true
      }
    }],
    trainingCompletion: {
      type: Number,
      default: 0
    },
    goalAchievement: {
      type: Number,
      default: 0
    },
    leadershipScore: {
      type: Number,
      default: 0
    },
    heartsAndHands: {
      x: {
        type: Number,
        default: 50
      },
      y: {
        type: Number,
        default: 50
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpiry: Date
});

// Generate a random password for new users
userSchema.statics.generateRandomPassword = function() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && !this.password.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User; 