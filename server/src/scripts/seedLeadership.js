import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedLeadershipData from '../seeds/leadershipSeeds.js';

dotenv.config();

const runSeeds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB successfully');
    
    await seedLeadershipData();
    
    console.log('Leadership development data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

runSeeds(); 