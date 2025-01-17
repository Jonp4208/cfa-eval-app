import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the server/.env file
const envPath = join(__dirname, '../../.env');
console.log('Loading .env file from:', envPath);
dotenv.config({ path: envPath });

// Dynamic imports for models
const importModels = async () => {
  const Store = (await import('../models/Store.js')).default;
  const User = (await import('../models/User.js')).default;
  return { Store, User };
};

async function createAdminUser() {
  try {
    console.log('Starting admin user creation...');
    
    // Import models
    const { Store, User } = await importModels();
    
    const stores = await Store.find();
    console.log(`Found ${stores.length} stores`);
    
    for (const store of stores) {
      console.log(`\nProcessing store: ${store.name}`);
      
      // Check if admin user exists
      const existingAdmin = await User.findOne({ 
        store: store._id,
        roles: { $in: ['admin', 'director'] }
      });

      if (existingAdmin) {
        console.log(`Admin user already exists for store ${store.name}`);
        continue;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const adminUser = new User({
        name: 'Store Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        store: store._id,
        roles: ['admin', 'director'],
        position: 'Director',
        departments: ['Everything'],
        isAdmin: true,
        status: 'active',
        isActive: true
      });

      await adminUser.save();
      console.log(`Created admin user for store ${store.name}`);
    }

    console.log('\nAdmin user creation completed successfully');
  } catch (error) {
    console.error('Admin user creation failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Connecting to MongoDB...');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      return createAdminUser();
    })
    .then(() => {
      console.log('Admin user creation completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Admin user creation failed:', error);
      process.exit(1);
    });
}

export { createAdminUser }; 