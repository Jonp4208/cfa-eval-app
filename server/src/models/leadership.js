import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  criteria: [{ type: String }],
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  completedDate: { type: Date }
});

const competencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  level: {
    type: String,
    enum: ['Team Member', 'Trainer', 'Leader', 'Director'],
    required: true
  },
  milestones: [milestoneSchema],
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  source: {
    type: String,
    enum: ['Miller', 'CFA', 'Both'],
    required: true
  }
});

const mentorshipSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  notes: [{
    content: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
});

const developmentPlanSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: function() { return !this.isTemplate; }
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  currentLevel: {
    type: String,
    enum: ['Team Member', 'Trainer', 'Leader', 'Director'],
    required: true
  },
  targetLevel: {
    type: String,
    enum: ['Team Member', 'Trainer', 'Leader', 'Director'],
    required: true
  },
  roleType: {
    type: String,
    enum: ['Operations', 'Training', 'Management'],
    required: true
  },
  duration: { type: Number, required: true }, // in months
  startDate: { type: Date, default: Date.now },
  targetCompletionDate: { type: Date },
  competencies: [{
    competencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competency', required: true },
    required: { type: Boolean, default: true },
    order: { type: Number, default: 1 }
  }],
  progress: [{
    competencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competency' },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    startDate: { type: Date },
    lastUpdated: { type: Date },
    completedMilestones: [String],
    verifiedMilestones: [String]
  }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedDate: { type: Date },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'active'
  },
  isTemplate: { type: Boolean, default: false },
  customizations: {
    addedCompetencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Competency' }],
    removedCompetencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Competency' }],
    notes: String
  }
});

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['Book', 'Article', 'Video', 'Exercise'],
    required: true
  },
  source: {
    type: String,
    enum: ['Miller', 'CFA'],
    required: true
  },
  competencyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Competency' }],
  url: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const bookProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  currentChapter: { type: Number, default: 1 },
  totalChapters: { type: Number, required: true },
  dailyLogs: [{
    date: { type: Date, default: Date.now },
    pagesRead: Number,
    observations: String,
    reflection: String
  }],
  weeklyAssessments: [{
    weekNumber: Number,
    keyLearnings: String,
    applicationExamples: [String],
    improvementAreas: String,
    nextWeekGoals: String
  }],
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  startDate: { type: Date },
  completionDate: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const programProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'DevelopmentPlan', required: true },
  currentLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },
  bookProgress: [bookProgressSchema],
  monthlyCheckIns: [{
    date: { type: Date, default: Date.now },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    discussion: {
      conceptsUnderstood: [String],
      applicationExamples: [String],
      challengesFaced: String,
      nextSteps: String
    }
  }],
  quarterlyReviews: [{
    date: { type: Date, default: Date.now },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assessment: {
      knowledgeScore: { type: Number, min: 1, max: 5 },
      behavioralScore: { type: Number, min: 1, max: 5 },
      performanceScore: { type: Number, min: 1, max: 5 },
      feedback: String,
      developmentPlan: String
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'on_hold'],
    default: 'active'
  },
  startDate: { type: Date, default: Date.now },
  targetCompletionDate: { type: Date },
  actualCompletionDate: { type: Date }
});

// Function to get or create a model
const getModel = (name, schema) => {
  try {
    return mongoose.model(name);
  } catch {
    return mongoose.model(name, schema);
  }
};

// Export models using the getModel function
export const Competency = getModel('Competency', competencySchema);
export const Mentorship = getModel('Mentorship', mentorshipSchema);
export const DevelopmentPlan = getModel('DevelopmentPlan', developmentPlanSchema);
export const Resource = getModel('Resource', resourceSchema);
export const BookProgress = getModel('BookProgress', bookProgressSchema);
export const ProgramProgress = getModel('ProgramProgress', programProgressSchema); 