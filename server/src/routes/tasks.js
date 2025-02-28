import express from 'express';
import { auth } from '../middleware/auth.js';
import TaskList from '../models/TaskList.js';
import TaskInstance from '../models/TaskInstance.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Middleware to check if user is a leader or director
const isLeaderOrDirector = (req, res, next) => {
  if (['Leader', 'Director'].includes(req.user.position)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Leaders and Directors only.' });
  }
};

// Get all task lists for user's department and shift
router.get('/lists', auth, async (req, res) => {
  try {
    const { area } = req.query; // 'foh' or 'boh'
    
    // Base query
    const query = {
      store: req.user.store,
      isActive: true
    };

    // Add area filter if specified
    if (area === 'foh') {
      query.department = { $in: ['Front Counter', 'Drive Thru'] };
    } else if (area === 'boh') {
      query.department = 'Kitchen';
    }
    
    const taskLists = await TaskList.find(query)
      .populate('createdBy', 'name');
    
    res.json(taskLists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new task list (Leaders/Directors only)
router.post('/lists', auth, isLeaderOrDirector, async (req, res) => {
  try {
    const taskList = new TaskList({
      ...req.body,
      createdBy: req.user._id,
      store: req.user.store
    });
    
    const savedList = await taskList.save();
    res.status(201).json(savedList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update task list (Leaders/Directors only)
router.put('/lists/:id', auth, isLeaderOrDirector, async (req, res) => {
  try {
    const taskList = await TaskList.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store },
      req.body,
      { new: true }
    );
    
    if (!taskList) {
      return res.status(404).json({ message: 'Task list not found' });
    }
    
    res.json(taskList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete task list (Leaders/Directors only)
router.delete('/lists/:id', auth, isLeaderOrDirector, async (req, res) => {
  try {
    // Find the task list first
    const taskList = await TaskList.findOne({
      _id: req.params.id,
      store: req.user.store
    });
    
    if (!taskList) {
      return res.status(404).json({ message: 'Task list not found' });
    }

    // Delete all associated instances
    await TaskInstance.deleteMany({
      taskList: taskList._id,
      store: req.user.store
    });

    // Soft delete the task list
    taskList.isActive = false;
    await taskList.save();
    
    res.json({ 
      message: 'Task list and all associated instances deleted successfully',
      deletedAt: new Date()
    });
  } catch (error) {
    console.error('Error deleting task list:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get active task instances for user
router.get('/instances', auth, async (req, res) => {
  try {
    const { department, shift, date } = req.query;
    const query = { store: req.user.store };

    if (department) query.department = department;
    if (shift) query.shift = shift;
    if (date) query.date = new Date(date);

    const instances = await TaskInstance.find(query)
      .populate([
        { path: 'taskList', populate: { path: 'createdBy', select: 'name' } },
        { path: 'tasks.assignedTo', select: 'name' },
        { path: 'tasks.completedBy', select: 'name' },
        { path: 'createdBy', select: 'name' }
      ])
      .sort({ createdAt: -1 });

    res.json(instances);
  } catch (error) {
    console.error('Error fetching task instances:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create task instance from task list
router.post('/instances', auth, isLeaderOrDirector, async (req, res) => {
  try {
    const { taskListId, date, assignedTasks } = req.body;
    
    const taskList = await TaskList.findById(taskListId);
    if (!taskList) {
      return res.status(404).json({ message: 'Task list not found' });
    }
    
    const instance = new TaskInstance({
      taskList: taskList._id,
      department: taskList.department,
      shift: taskList.shift,
      date,
      tasks: taskList.tasks.map(task => ({
        title: task.title,
        description: task.description,
        estimatedTime: task.estimatedTime,
        scheduledTime: task.scheduledTime,
        status: 'pending'
      })),
      store: req.user.store,
      createdBy: req.user._id
    });
    
    const savedInstance = await instance.save();
    await savedInstance.populate([
      { path: 'taskList', populate: { path: 'createdBy', select: 'name' } },
      { path: 'tasks.assignedTo', select: 'name' },
      { path: 'tasks.completedBy', select: 'name' },
      { path: 'createdBy', select: 'name' }
    ]);
    
    res.status(201).json(savedInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update task completion status
router.patch('/instances/:instanceId/tasks/:taskId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const taskInstance = await TaskInstance.findOne({
      _id: req.params.instanceId,
      store: req.user.store
    });
    
    if (!taskInstance) {
      return res.status(404).json({ message: 'Task instance not found' });
    }
    
    const task = taskInstance.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Only check if the task is assigned to someone
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this task' });
    }
    
    task.status = status;
    if (status === 'completed') {
      task.completedBy = req.user._id;
      task.completedAt = new Date();
    } else {
      task.completedBy = undefined;
      task.completedAt = undefined;
    }
    
    await taskInstance.save();
    
    // Populate the response with user details
    await taskInstance.populate([
      { path: 'tasks.assignedTo', select: 'name' },
      { path: 'tasks.completedBy', select: 'name' }
    ]);
    
    res.json(taskInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Assign task to user
router.patch('/instances/:instanceId/tasks/:taskId/assign', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const taskInstance = await TaskInstance.findOne({
      _id: req.params.instanceId,
      store: req.user.store
    }).populate('taskList');
    
    if (!taskInstance) {
      return res.status(404).json({ message: 'Task instance not found' });
    }
    
    const task = taskInstance.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.assignedTo = userId;
    await taskInstance.save();
    
    // Create notification for assigned user
    const notification = new Notification({
      user: userId,
      store: req.user.store,
      type: 'task',
      priority: 'high',
      title: 'New Task Assignment',
      message: `You have been assigned to task: ${task.title} in ${taskInstance.taskList.name}`,
      relatedId: taskInstance._id,
      relatedModel: 'TaskInstance'
    });
    await notification.save();
    
    // Populate the response with user details
    await taskInstance.populate([
      { path: 'taskList', populate: { path: 'createdBy', select: 'name' } },
      { path: 'tasks.assignedTo', select: 'name' },
      { path: 'tasks.completedBy', select: 'name' },
      { path: 'createdBy', select: 'name' }
    ]);
    
    res.json(taskInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update task instance status
router.patch('/instances/:instanceId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const taskInstance = await TaskInstance.findOne({
      _id: req.params.instanceId,
      store: req.user.store,
      department: { $in: req.user.departments },
      shift: req.user.shift
    });
    
    if (!taskInstance) {
      return res.status(404).json({ message: 'Task instance not found' });
    }
    
    // Only allow completing if all tasks are completed
    if (status === 'completed') {
      const allTasksCompleted = taskInstance.tasks.every(task => task.status === 'completed');
      if (!allTasksCompleted) {
        return res.status(400).json({ message: 'Cannot complete instance until all tasks are completed' });
      }
    }
    
    taskInstance.status = status;
    if (status === 'completed') {
      taskInstance.completedAt = new Date();
    }
    
    await taskInstance.save();
    res.json(taskInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get task completion metrics
router.get('/metrics', auth, isLeaderOrDirector, async (req, res) => {
  try {
    const { startDate, endDate, department, shift } = req.query;
    
    const query = {
      store: req.user.store,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (department) query.department = department;
    if (shift) query.shift = shift;
    
    const taskInstances = await TaskInstance.find(query)
      .populate('tasks.completedBy', 'name');
    
    const metrics = {
      totalInstances: taskInstances.length,
      completedInstances: taskInstances.filter(i => i.status === 'completed').length,
      averageCompletionRate: taskInstances.reduce((acc, curr) => acc + curr.completionRate, 0) / taskInstances.length,
      tasksByUser: {}
    };
    
    taskInstances.forEach(instance => {
      instance.tasks.forEach(task => {
        if (task.completedBy) {
          const userId = task.completedBy._id.toString();
          metrics.tasksByUser[userId] = metrics.tasksByUser[userId] || {
            name: task.completedBy.name,
            completed: 0
          };
          metrics.tasksByUser[userId].completed++;
        }
      });
    });
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete task instance (Leaders/Directors only)
router.delete('/instances/:instanceId', auth, isLeaderOrDirector, async (req, res) => {
  try {
    const instance = await TaskInstance.findOne({
      _id: req.params.instanceId,
      store: req.user.store
    });
    
    if (!instance) {
      return res.status(404).json({ 
        message: 'Task instance not found. It may have been already deleted.' 
      });
    }
    
    await TaskInstance.deleteOne({ _id: instance._id });
    
    res.json({ 
      message: `Successfully deleted task instance`,
      deletedAt: new Date()
    });
  } catch (error) {
    console.error('Error deleting task instance:', error);
    res.status(500).json({ 
      message: 'Failed to delete task instance. Please try again or contact support if the issue persists.' 
    });
  }
});

export default router; 