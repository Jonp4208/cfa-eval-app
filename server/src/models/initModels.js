import mongoose from 'mongoose';
import { modelDefinitions, registerModel, getRegisteredModels } from './modelRegistry.js';

// Import all model schemas
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

export function initializeModels() {
  // Register all models defined in modelDefinitions
  Object.entries(modelDefinitions).forEach(([modelName, { schema, collection }]) => {
    registerModel(modelName, schema, collection);
  });

  // Return all registered models
  return getRegisteredModels();
} 