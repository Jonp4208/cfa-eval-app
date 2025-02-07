import mongoose from 'mongoose';
import TrainingProgress from '../models/TrainingProgress.js';
import TrainingPlan from '../models/TrainingPlan.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupOrphanedProgress() {
    try {
        // Connect to MongoDB using environment variable
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB...');

        // Find all training progress records
        const allProgress = await TrainingProgress.find({});
        console.log(`Found ${allProgress.length} training progress records`);

        let deletedCount = 0;

        // Check each progress record
        for (const progress of allProgress) {
            // Try to find the associated training plan
            const plan = await TrainingPlan.findById(progress.trainingPlan);
            
            // If plan doesn't exist, delete the progress record
            if (!plan) {
                await TrainingProgress.findByIdAndDelete(progress._id);
                deletedCount++;
                console.log(`Deleted orphaned progress record: ${progress._id}`);
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} orphaned records`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the cleanup
cleanupOrphanedProgress();
