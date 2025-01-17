import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the server/.env file
const envPath = join(__dirname, '../../.env');
console.log('Loading .env file from:', envPath);
dotenv.config({ path: envPath });

console.log('MONGODB_URI:', process.env.MONGODB_URI);

// Dynamic imports for models
const importModels = async () => {
  const GradingScale = (await import('../models/GradingScale.js')).default;
  const Template = (await import('../models/Template.js')).default;
  const Store = (await import('../models/Store.js')).default;
  const User = (await import('../models/User.js')).default;
  return { GradingScale, Template, Store, User };
};

async function createDefaultScale(store, adminUser, GradingScale) {
  try {
    // Check if default scale already exists
    const existingDefault = await GradingScale.findOne({
      store: store._id,
      isDefault: true,
      isActive: true
    });

    if (existingDefault) {
      console.log(`Default scale already exists for store ${store.name}`);
      return existingDefault;
    }

    // Create the default 5-point scale
    const defaultScale = new GradingScale({
      name: 'Standard 5-Point Scale',
      description: 'Default evaluation scale from Poor to Excellent',
      store: store._id,
      createdBy: adminUser._id,
      isDefault: true,
      grades: [
        { value: 1, label: 'Poor', description: 'Significant improvement needed', color: '#dc2626' },
        { value: 2, label: 'Fair', description: 'Below expectations', color: '#f97316' },
        { value: 3, label: 'Good', description: 'Meets expectations', color: '#eab308' },
        { value: 4, label: 'Very Good', description: 'Exceeds expectations', color: '#22c55e' },
        { value: 5, label: 'Excellent', description: 'Outstanding performance', color: '#15803d' }
      ]
    });

    await defaultScale.save();
    console.log(`Created default scale for store ${store.name}`);
    return defaultScale;
  } catch (error) {
    console.error(`Error creating default scale for store ${store.name}:`, error);
    throw error;
  }
}

async function updateExistingTemplates(store, defaultScale, Template) {
  try {
    const templates = await Template.find({ store: store._id });
    let updatedCount = 0;
    
    for (const template of templates) {
      let modified = false;

      template.sections.forEach(section => {
        section.criteria.forEach(criterion => {
          // Only update if no grading scale is set
          if (!criterion.gradingScale) {
            criterion.gradingScale = defaultScale._id;
            modified = true;
          }
        });
      });

      if (modified) {
        await template.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} templates for store ${store.name}`);
  } catch (error) {
    console.error(`Error updating templates for store ${store.name}:`, error);
    throw error;
  }
}

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // Import models
    const { GradingScale, Template, Store, User } = await importModels();
    
    const stores = await Store.find();
    console.log(`Found ${stores.length} stores`);
    
    for (const store of stores) {
      console.log(`\nProcessing store: ${store.name}`);
      
      // Find admin user for the store
      const adminUser = await User.findOne({ 
        store: store._id,
        isAdmin: true,
        position: 'Director'
      });

      if (!adminUser) {
        console.log(`No admin user found for store ${store.name}, skipping...`);
        continue;
      }

      // Create default scale
      const defaultScale = await createDefaultScale(store, adminUser, GradingScale);
      
      // Update existing templates
      await updateExistingTemplates(store, defaultScale, Template);
    }

    console.log('\nMigration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Connecting to MongoDB...');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      return migrate();
    })
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrate, createDefaultScale, updateExistingTemplates }; 