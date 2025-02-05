import mongoose from 'mongoose';
import userSchema from './schemas/userSchema.js';
import evaluationSchema from './schemas/evaluationSchema.js';
import templateSchema from './schemas/templateSchema.js';
import storeSchema from './schemas/storeSchema.js';
import settingsSchema from './schemas/settingsSchema.js';
import notificationSchema from './schemas/notificationSchema.js';
import disciplinarySchema from './schemas/disciplinarySchema.js';
import gradingScaleSchema from './schemas/gradingScaleSchema.js';
import goalSchema from './schemas/goalSchema.js';
import trainingProgressSchema from './schemas/trainingProgressSchema.js';
import taskListSchema from './schemas/taskListSchema.js';
import taskInstanceSchema from './schemas/taskInstanceSchema.js';
import foodSafetyChecklistSchema from './schemas/foodSafetyChecklistSchema.js';
import foodSafetyChecklistCompletionSchema from './schemas/foodSafetyChecklistCompletionSchema.js';
import trainingCategorySchema from './schemas/trainingCategorySchema.js';
import trainingPlanSchema from './schemas/trainingPlanSchema.js';

// Model registry to prevent duplicate compilation
const models = {};

export function registerModel(modelName, schema, collection) {
  if (models[modelName]) {
    return models[modelName];
  }
  
  try {
    // Try to get existing model first
    const existingModel = mongoose.models[modelName];
    if (existingModel) {
      models[modelName] = existingModel;
      return existingModel;
    }
    
    // Create new model if it doesn't exist
    const model = mongoose.model(modelName, schema, collection);
    models[modelName] = model;
    return model;
  } catch (error) {
    console.error(`Error registering model ${modelName}:`, error);
    throw error;
  }
}

export function getModel(modelName) {
  const model = models[modelName] || mongoose.models[modelName];
  if (!model) {
    throw new Error(`Model ${modelName} not found. Make sure it is registered before use.`);
  }
  return model;
}

export function getRegisteredModels() {
  return { ...models };
}

export const modelDefinitions = {
  User: {
    schema: userSchema,
    collection: 'users'
  },
  Evaluation: {
    schema: evaluationSchema,
    collection: 'evaluations'
  },
  Template: {
    schema: templateSchema,
    collection: 'templates'
  },
  Store: {
    schema: storeSchema,
    collection: 'stores'
  },
  Settings: {
    schema: settingsSchema,
    collection: 'settings'
  },
  Notification: {
    schema: notificationSchema,
    collection: 'notifications'
  },
  Disciplinary: {
    schema: disciplinarySchema,
    collection: 'disciplinaries'
  },
  GradingScale: {
    schema: gradingScaleSchema,
    collection: 'gradingscales'
  },
  Goal: {
    schema: goalSchema,
    collection: 'goals'
  },
  TrainingProgress: {
    schema: trainingProgressSchema,
    collection: 'trainingprogress'
  },
  TaskList: {
    schema: taskListSchema,
    collection: 'tasklists'
  },
  TaskInstance: {
    schema: taskInstanceSchema,
    collection: 'taskinstances'
  },
  FoodSafetyChecklist: {
    schema: foodSafetyChecklistSchema,
    collection: 'foodsafetychecklists'
  },
  FoodSafetyChecklistCompletion: {
    schema: foodSafetyChecklistCompletionSchema,
    collection: 'foodsafetychecklistcompletions'
  },
  TrainingCategory: {
    schema: trainingCategorySchema,
    collection: 'trainingcategories'
  },
  TrainingPlan: {
    schema: trainingPlanSchema,
    collection: 'trainingplans'
  }
};

// Register all models on initialization
Object.entries(modelDefinitions).forEach(([modelName, { schema, collection }]) => {
  registerModel(modelName, schema, collection);
}); 