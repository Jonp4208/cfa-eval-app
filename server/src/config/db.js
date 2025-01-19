import mongoose from 'mongoose';
import * as Sentry from "@sentry/node";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

export const connectDB = async (retries = MAX_RETRIES) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      retryReads: true
    });
    
    console.log('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error(`MongoDB connection attempt failed (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, error);
    Sentry.captureException(error, {
      tags: { service: 'database' },
      level: 'error'
    });

    if (retries > 0) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retries - 1);
    }

    console.error('Failed to connect to MongoDB after maximum retries');
    throw error;
  }
}; 