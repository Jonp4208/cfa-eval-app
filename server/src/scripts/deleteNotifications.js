import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

async function deleteAllNotifications() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cfa-eval-app');
    console.log('Connected to MongoDB');
    
    const result = await Notification.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} notifications`);
    
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteAllNotifications(); 