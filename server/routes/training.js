const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
import { NotificationService } from '../services/notificationService.js';
const { Employee, TrainingPlan, TrainingProgress } = require('../models');
const User = require('../models/user');

// Get all training plans
router.get('/plans', auth, async (req, res) => {
  try {
    const plans = await TrainingPlan.find().populate('modules');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching training plans' });
  }
});

// Get active training plans
router.get('/plans/active', auth, async (req, res) => {
  try {
    const plans = await TrainingPlan.find({ active: true }).populate('modules');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching active training plans' });
  }
});

// Create a new training plan
router.post('/plans', auth, async (req, res) => {
  try {
    const plan = new TrainingPlan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ message: 'Error creating training plan' });
  }
});

// Update a training plan
router.put('/plans/:id', auth, async (req, res) => {
  try {
    const plan = await TrainingPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    res.json(plan);
  } catch (err) {
    res.status(400).json({ message: 'Error updating training plan' });
  }
});

// Delete a training plan
router.delete('/plans/:id', auth, async (req, res) => {
  try {
    const plan = await TrainingPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    res.json({ message: 'Training plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting training plan' });
  }
});

// Assign a training plan to an employee
router.post('/plans/assign', auth, async (req, res) => {
  try {
    const { employeeId, planId, startDate } = req.body;

    const employee = await User.findById(employeeId);
    const plan = await TrainingPlan.findById(planId).populate('modules');

    if (!employee || !plan) {
      return res.status(404).json({ message: 'Employee or plan not found' });
    }

    // Create initial progress entries for each module
    const moduleProgress = plan.modules.map(module => ({
      moduleId: module._id,
      completed: false,
      completionPercentage: 0
    }));

    // Create new training progress document
    const trainingProgress = new TrainingProgress({
      trainee: employee._id,
      trainingPlan: plan._id,
      startDate,
      assignedTrainer: req.user._id, // The person assigning the training
      status: 'IN_PROGRESS',
      moduleProgress,
      store: employee.store
    });

    await trainingProgress.save();

    // Add training progress to employee's training progress array
    employee.trainingProgress.push(trainingProgress._id);
    await employee.save();

    // Send notification
    await NotificationService.notifyTrainingAssigned(employee, plan, startDate);

    // Return the populated training progress
    const populatedProgress = await TrainingProgress.findById(trainingProgress._id)
      .populate('trainingPlan')
      .populate('trainee')
      .populate('assignedTrainer');

    res.json(populatedProgress);
  } catch (err) {
    console.error('Error assigning training plan:', err);
    res.status(400).json({ message: 'Error assigning training plan' });
  }
});

// Update training progress
router.post('/progress/update', auth, async (req, res) => {
  try {
    const { employeeId, moduleId, completed, notes } = req.body;

    const employee = await Employee.findById(employeeId).populate('trainingPlan');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update module progress
    const moduleIndex = employee.moduleProgress.findIndex(
      m => m.moduleId.toString() === moduleId
    );

    if (moduleIndex === -1) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const wasCompleted = employee.moduleProgress[moduleIndex].completed;
    employee.moduleProgress[moduleIndex].completed = completed;
    employee.moduleProgress[moduleIndex].notes = notes;

    await employee.save();

    // Send notifications if module was just completed
    if (completed && !wasCompleted) {
      const module = employee.trainingPlan.modules.find(
        m => m._id.toString() === moduleId
      );
      await NotificationService.notifyModuleCompleted(employee, module);

      // Check if all modules are completed
      const allCompleted = employee.moduleProgress.every(m => m.completed);
      if (allCompleted) {
        await NotificationService.notifyTrainingCompleted(employee, employee.trainingPlan);
      }
    }

    res.json(employee);
  } catch (err) {
    res.status(400).json({ message: 'Error updating training progress' });
  }
});

// Get employee training progress
router.get('/employees/training-progress', auth, async (req, res) => {
  try {
    console.log('Fetching employees for store:', req.user.store._id);
    const employees = await User.find({
      store: req.user.store._id,
      status: 'active'
    })
      .populate({
        path: 'trainingProgress',
        populate: [{
          path: 'trainingPlan',
          populate: {
            path: 'modules',
            select: 'name position completed'
          }
        }],
        select: 'status moduleProgress startDate trainingPlan'
      })
      .select('name position departments role trainingProgress')
      .sort({ name: 1 });

    console.log('Found employees:', employees.length);
    console.log('Employee details:', employees.map(e => ({ 
      name: e.name, 
      position: e.position,
      departments: e.departments,
      hasTrainingProgress: e.trainingProgress && e.trainingProgress.length > 0
    })));
    
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employee training progress:', error);
    res.status(500).json({ message: 'Error fetching employee training progress' });
  }
});

// Duplicate a training plan
router.post('/plans/:id/duplicate', auth, async (req, res) => {
  try {
    const originalPlan = await TrainingPlan.findById(req.params.id);
    if (!originalPlan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }

    const newPlan = new TrainingPlan({
      ...originalPlan.toObject(),
      _id: undefined,
      name: `${originalPlan.name} (Copy)`,
      modules: originalPlan.modules,
    });

    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (err) {
    res.status(400).json({ message: 'Error duplicating training plan' });
  }
});

// Schedule reminders job (run daily)
const scheduleReminders = require('node-schedule');
scheduleReminders.scheduleJob('0 0 * * *', async () => {
  try {
    await NotificationService.sendUpcomingTrainingReminders();
  } catch (err) {
    console.error('Error sending training reminders:', err);
  }
});

// Schedule weekly progress reports (run every Monday)
scheduleReminders.scheduleJob('0 0 * * 1', async () => {
  try {
    const managers = await Employee.find({ role: 'manager' });
    for (const manager of managers) {
      await NotificationService.sendWeeklyProgressReport(manager._id);
    }
  } catch (err) {
    console.error('Error sending weekly progress reports:', err);
  }
});

module.exports = router; 