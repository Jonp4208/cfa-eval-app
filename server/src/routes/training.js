import express from 'express';
import { auth } from '../middleware/auth.js';
import TrainingPosition from '../models/TrainingPosition.js';
import TrainingCategory from '../models/TrainingCategory.js';
import TrainingPlan from '../models/TrainingPlan.js';
import User from '../models/User.js';

const router = express.Router();

// Get all positions for the store
router.get('/positions', auth, async (req, res) => {
  try {
    const positions = await TrainingPosition.find({ store: req.user.store._id })
      .populate('category')
      .sort({ name: 1 });
    res.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ message: 'Error fetching positions' });
  }
});

// Create a new position
router.post('/positions', auth, async (req, res) => {
  try {
    const position = new TrainingPosition({
      ...req.body,
      store: req.user.store._id
    });
    await position.save();
    res.status(201).json(position);
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ message: 'Error creating position' });
  }
});

// Update a position
router.put('/positions/:id', auth, async (req, res) => {
  try {
    const position = await TrainingPosition.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id },
      req.body,
      { new: true }
    );
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    res.json(position);
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ message: 'Error updating position' });
  }
});

// Update position status
router.patch('/positions/:id', auth, async (req, res) => {
  try {
    const position = await TrainingPosition.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id },
      { isActive: req.body.isActive },
      { new: true }
    );
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    res.json(position);
  } catch (error) {
    console.error('Error updating position status:', error);
    res.status(500).json({ message: 'Error updating position status' });
  }
});

// Delete a position
router.delete('/positions/:id', auth, async (req, res) => {
  try {
    const position = await TrainingPosition.findOneAndDelete({
      _id: req.params.id,
      store: req.user.store._id
    });
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({ message: 'Error deleting position' });
  }
});

// Get all categories for the store
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await TrainingCategory.find({ store: req.user.store._id })
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Create a new category
router.post('/categories', auth, async (req, res) => {
  try {
    const category = new TrainingCategory({
      ...req.body,
      store: req.user.store._id
    });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Update a category
router.put('/categories/:id', auth, async (req, res) => {
  try {
    const category = await TrainingCategory.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id },
      req.body,
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Update category status
router.patch('/categories/:id', auth, async (req, res) => {
  try {
    const category = await TrainingCategory.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id },
      { isActive: req.body.isActive },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error updating category status:', error);
    res.status(500).json({ message: 'Error updating category status' });
  }
});

// Delete a category
router.delete('/categories/:id', auth, async (req, res) => {
  try {
    const category = await TrainingCategory.findOneAndDelete({
      _id: req.params.id,
      store: req.user.store._id
    });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// Get all training templates for the store
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = await TrainingPlan.find({
      store: req.user.store._id,
      isTemplate: true,
    })
      .populate('modules.position')
      .sort({ name: 1 });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Error fetching templates' });
  }
});

// Create a new template
router.post('/templates', auth, async (req, res) => {
  try {
    const template = new TrainingPlan({
      ...req.body,
      store: req.user.store._id,
      createdBy: req.user._id,
    });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Error creating template' });
  }
});

// Update a template
router.put('/templates/:id', auth, async (req, res) => {
  try {
    const template = await TrainingPlan.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id, isTemplate: true },
      req.body,
      { new: true }
    );
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Error updating template' });
  }
});

// Delete a template
router.delete('/templates/:id', auth, async (req, res) => {
  try {
    const template = await TrainingPlan.findOneAndDelete({
      _id: req.params.id,
      store: req.user.store._id,
      isTemplate: true,
    });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Error deleting template' });
  }
});

// Duplicate a template
router.post('/templates/:id/duplicate', auth, async (req, res) => {
  try {
    const template = await TrainingPlan.findOne({
      _id: req.params.id,
      store: req.user.store._id,
      isTemplate: true,
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const duplicateTemplate = new TrainingPlan({
      ...template.toObject(),
      _id: undefined,
      name: `${template.name} (Copy)`,
      createdBy: req.user._id,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await duplicateTemplate.save();
    res.status(201).json(duplicateTemplate);
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ message: 'Error duplicating template' });
  }
});

// Get active training plans
router.get('/plans/active', auth, async (req, res) => {
  try {
    const plans = await TrainingPlan.find({
      store: req.user.store._id,
      isTemplate: false,
      isActive: true,
    })
      .populate('assignedTo')
      .populate('modules.position')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching active training plans:', error);
    res.status(500).json({ message: 'Error fetching active training plans' });
  }
});

// Get employee training progress
router.get('/employees/training-progress', auth, async (req, res) => {
  try {
    const employees = await User.find({
      store: req.user.store._id,
      isActive: true,
    })
      .populate({
        path: 'trainingProgress',
        populate: {
          path: 'plan',
          populate: {
            path: 'modules.position',
          },
        },
      })
      .select('name position department trainingProgress')
      .sort({ name: 1 });

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employee training progress:', error);
    res.status(500).json({ message: 'Error fetching employee training progress' });
  }
});

// Get all training plans for the store
router.get('/plans', auth, async (req, res) => {
  try {
    const plans = await TrainingPlan.find({
      store: req.user.store._id,
      isTemplate: true
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching training plans:', error);
    res.status(500).json({ message: 'Error fetching training plans' });
  }
});

// Create a new training plan
router.post('/plans', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      department,
      type,
      days
    } = req.body;

    // Transform the days array into modules array
    const modules = days.flatMap((day) => 
      day.modules.map(module => ({
        name: module.name,
        description: module.name, // Use module name as description
        department,
        estimatedDuration: `${module.duration} minutes`,
        dayNumber: day.dayNumber,
        requiredForNewHire: type === 'New Hire'
      }))
    );

    const plan = new TrainingPlan({
      name,
      type: type === 'New Hire' ? 'NEW_HIRE' : 'REGULAR',
      department,
      numberOfDays: days.length,
      modules,
      isTemplate: true,
      createdBy: req.user._id,
      store: req.user.store._id,
      includesCoreValues: type === 'New Hire',
      includesBrandStandards: type === 'New Hire'
    });

    await plan.save();
    
    // Populate the response
    await plan.populate('createdBy', 'firstName lastName');
    
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating training plan:', error);
    res.status(500).json({ message: 'Error creating training plan' });
  }
});

// Get a specific training plan
router.get('/plans/:id', auth, async (req, res) => {
  try {
    const plan = await TrainingPlan.findOne({
      _id: req.params.id,
      store: req.user.store._id
    }).populate('createdBy', 'firstName lastName');
    
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error fetching training plan:', error);
    res.status(500).json({ message: 'Error fetching training plan' });
  }
});

// Update a training plan
router.put('/plans/:id', auth, async (req, res) => {
  try {
    const plan = await TrainingPlan.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id },
      req.body,
      { new: true }
    );
    
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error updating training plan:', error);
    res.status(500).json({ message: 'Error updating training plan' });
  }
});

// Delete a training plan
router.delete('/plans/:id', auth, async (req, res) => {
  try {
    const plan = await TrainingPlan.findOneAndDelete({
      _id: req.params.id,
      store: req.user.store._id
    });
    
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    
    res.json({ message: 'Training plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting training plan:', error);
    res.status(500).json({ message: 'Error deleting training plan' });
  }
});

export default router; 