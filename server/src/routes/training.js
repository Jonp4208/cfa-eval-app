import express from 'express';
import { auth } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';
import TrainingCategory from '../models/TrainingCategory.js';
import TrainingPlan from '../models/TrainingPlan.js';
import User from '../models/User.js';
import TrainingProgress from '../models/TrainingProgress.js';
import * as schedule from 'node-schedule';
import emailTemplates from '../utils/emailTemplates.js';
import { handleAsync } from '../utils/errorHandler.js';

const router = express.Router();

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

// Get all training plans for the store
router.get('/plans', auth, handleAsync(async (req, res) => {
  console.log('Fetching training plans for store:', req.user.store._id);
  const plans = await TrainingPlan.find({
    store: req.user.store._id
  })
  .populate('createdBy', 'firstName lastName')
  .sort({ createdAt: -1 });
  
  console.log(`Found ${plans.length} training plans`);
  res.json(plans);
}));

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
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching active training plans:', error);
    res.status(500).json({ message: 'Error fetching active training plans' });
  }
});

// Get employee training progress
router.get('/employees/training-progress', auth, handleAsync(async (req, res) => {
  console.log('Fetching training progress for store:', req.user.store._id);
  const employees = await User.find({
    store: req.user.store._id,
    status: 'active'
  })
    .populate({
      path: 'trainingProgress',
      populate: [{
        path: 'trainingPlan',
        populate: {
          path: 'modules'
        }
      }, {
        path: 'moduleProgress.completedBy',
        model: 'User',
        select: 'firstName lastName name'
      }]
    })
    .select('name position department trainingProgress startDate')
    .sort({ name: 1 });

  console.log(`Found ${employees.length} employees with training progress`);
  res.json(employees);
}));

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

// Update module progress
router.patch('/progress/:progressId/modules/:moduleId', auth, async (req, res) => {
  try {
    const { progressId, moduleId } = req.params;
    const { completed, notes } = req.body;

    // Add permission check for trainers and above
    if (!['Director', 'Leader', 'Trainer'].includes(req.user.position)) {
      return res.status(403).json({ message: 'Only trainers and above can mark modules as complete' });
    }

    const trainingProgress = await TrainingProgress.findOne({
      _id: progressId,
      store: req.user.store._id,
    });

    if (!trainingProgress) {
      return res.status(404).json({ message: 'Training progress not found' });
    }

    // Populate training plan first
    await trainingProgress.populate({
      path: 'trainingPlan',
      populate: {
        path: 'modules'
      }
    });

    // Find the module progress entry
    const moduleProgress = trainingProgress.moduleProgress.find(
      (mp) => mp.moduleId.toString() === moduleId
    );

    if (!moduleProgress) {
      // If module progress doesn't exist, create it
      trainingProgress.moduleProgress.push({
        moduleId,
        completed,
        completionPercentage: completed ? 100 : 0,
        completedBy: completed ? req.user._id : undefined,
        completedAt: completed ? new Date() : undefined,
        notes,
      });
    } else {
      // Update existing module progress
      moduleProgress.completed = completed;
      moduleProgress.completionPercentage = completed ? 100 : 0;
      moduleProgress.completedBy = completed ? req.user._id : undefined;
      moduleProgress.completedAt = completed ? new Date() : undefined;
      moduleProgress.notes = notes;
    }

    // Check if all modules are completed
    console.log('Training Plan Modules:', trainingProgress.trainingPlan.modules.map(m => ({
      id: m._id.toString(),
      name: m.name
    })));
    console.log('Module Progress:', trainingProgress.moduleProgress.map(mp => ({
      moduleId: mp.moduleId.toString(),
      completed: mp.completed
    })));

    const allModulesCompleted = trainingProgress.trainingPlan.modules.every(
      (planModule) => {
        const moduleProgress = trainingProgress.moduleProgress.find(
          (mp) => mp.moduleId.toString() === planModule._id.toString()
        );
        const isCompleted = moduleProgress && moduleProgress.completed;
        console.log(`Module ${planModule.name} (${planModule._id}): ${isCompleted ? 'Completed' : 'Not Completed'}`);
        return isCompleted;
      }
    );

    console.log('All Modules Completed:', allModulesCompleted);

    if (allModulesCompleted) {
      trainingProgress.status = 'COMPLETED';
    } else {
      trainingProgress.status = 'IN_PROGRESS';
    }

    await trainingProgress.save();

    // Populate for response
    await trainingProgress.populate([
      {
        path: 'moduleProgress.completedBy',
        model: 'User',
        select: 'firstName lastName name'
      }
    ]);

    res.json(trainingProgress);
  } catch (error) {
    console.error('Error updating module progress:', error);
    res.status(500).json({ message: 'Error updating module progress' });
  }
});

// Assign training plan to employee
router.post('/plans/assign', auth, async (req, res) => {
  try {
    const { employeeId, planId, startDate } = req.body;

    // Find the employee
    const employee = await User.findOne({
      _id: employeeId,
      store: req.user.store._id,
    }).select('name email position department');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Find the training plan
    const trainingPlan = await TrainingPlan.findOne({
      _id: planId,
      store: req.user.store._id,
    });

    if (!trainingPlan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }

    // Create a new training progress entry
    const trainingProgress = new TrainingProgress({
      trainee: employeeId,
      trainingPlan: planId,
      startDate: new Date(startDate),
      assignedTrainer: req.user._id,
      store: req.user.store._id,
      status: 'IN_PROGRESS',
      moduleProgress: [], // Will be populated as trainee completes modules
    });

    await trainingProgress.save();

    // Add the training progress to the employee's trainingProgress array
    employee.trainingProgress = employee.trainingProgress || [];
    employee.trainingProgress.push(trainingProgress._id);
    await employee.save();

    // Send immediate assignment notification
    try {
      await NotificationService.notifyTrainingAssigned(employee, trainingPlan, startDate);
      console.log(`Training assignment notification sent to ${employee.email}`);
    } catch (notificationError) {
      console.error('Error sending training assignment notification:', {
        error: notificationError.message,
        employee: employee._id,
        trainingPlan: trainingPlan._id,
      });
      // Continue execution even if notification fails
    }

    // Schedule a reminder notification for 1 day before the start date
    const reminderDate = new Date(startDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    
    if (reminderDate > new Date()) { // Only schedule if start date is in the future
      schedule.scheduleJob(reminderDate, async () => {
        try {
          const daysUntilStart = 1;
          await NotificationService.sendEmail(
            employee.email,
            emailTemplates.upcomingTraining(employee, trainingPlan, daysUntilStart)
          );
          console.log(`Training reminder notification sent to ${employee.email}`);
        } catch (reminderError) {
          console.error('Error sending training reminder notification:', {
            error: reminderError.message,
            employee: employee._id,
            trainingPlan: trainingPlan._id,
          });
        }
      });
      console.log(`Reminder scheduled for ${reminderDate.toISOString()}`);
    }

    // Populate the response
    await trainingProgress.populate([
      {
        path: 'trainee',
        select: 'name position department',
      },
      {
        path: 'trainingPlan',
        populate: {
          path: 'modules',
        },
      },
      {
        path: 'assignedTrainer',
        select: 'name',
      },
    ]);

    res.status(201).json(trainingProgress);
  } catch (error) {
    console.error('Error assigning training plan:', error);
    res.status(500).json({ message: 'Error assigning training plan' });
  }
});

// Delete training progress
router.delete('/trainee-progress/:id', auth, async (req, res) => {
  try {
    const trainingProgress = await TrainingProgress.findOne({
      _id: req.params.id,
      store: req.user.store._id,
    });

    if (!trainingProgress) {
      return res.status(404).json({ message: 'Training progress not found' });
    }

    // Find the employee and remove the training progress from their array
    const employee = await User.findOne({
      _id: trainingProgress.trainee,
      store: req.user.store._id,
    });

    if (employee) {
      employee.trainingProgress = employee.trainingProgress.filter(
        (progressId) => progressId.toString() !== trainingProgress._id.toString()
      );
      await employee.save();
    }

    // Delete the training progress
    await TrainingProgress.deleteOne({ _id: trainingProgress._id });

    res.json({ message: 'Training progress deleted successfully' });
  } catch (error) {
    console.error('Error deleting training progress:', error);
    res.status(500).json({ message: 'Error deleting training progress' });
  }
});

// Get current user's training progress
router.get('/progress', auth, async (req, res) => {
  try {
    const trainingProgress = await TrainingProgress.find({
      trainee: req.user._id,
      deleted: { $ne: true }
    })
    .populate({
      path: 'trainingPlan',
      populate: {
        path: 'modules'
      }
    })
    .populate('moduleProgress.completedBy', 'firstName lastName name')
    .sort({ createdAt: -1 });

    res.json(trainingProgress);
  } catch (error) {
    console.error('Error fetching user training progress:', error);
    res.status(500).json({ message: 'Error fetching training progress' });
  }
});

export default router; 