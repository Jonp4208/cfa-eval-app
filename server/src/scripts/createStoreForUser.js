import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Store } from '../models/index.js';

dotenv.config();

async function createStoreForUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a store
    const store = await Store.create({
      storeNumber: '0001',
      name: 'Default Store',
      location: 'Default Location',
      admins: ['677f2319869e50b2f6940215']
    });
    console.log('Created store:', store);

    // Update user with store reference
    const updatedUser = await User.findByIdAndUpdate(
      '677f2319869e50b2f6940215',
      { store: store._id },
      { new: true }
    );
    console.log('Updated user:', updatedUser);

    console.log('Successfully created store and updated user');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createStoreForUser(); 