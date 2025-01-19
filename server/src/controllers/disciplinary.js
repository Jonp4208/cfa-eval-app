import Disciplinary from '../models/Disciplinary.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { handleAsync } from '../utils/errorHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Get all disciplinary incidents
export const getAllIncidents = handleAsync(async (req, res) => {
  // First, update any incidents that need status correction
  await Disciplinary.updateMany(
    { 
      $or: [
        { status: 'Open' },
        { status: { $exists: false } }
      ]
    },
    { 
      $set: { 
        status: 'Pending Acknowledgment',
      }
    }
  );

  // Build query based on user role
  let query = {};
  
  // If user is not an admin and not a manager, only show their own incidents
  if (!req.user.isAdmin && req.user.role !== 'manager') {
    query.employee = req.user._id;
  }

  // Then get incidents based on the query
  const incidents = await Disciplinary.find(query)
    .populate('employee', 'name position department')
    .populate('supervisor', 'name')
    .populate('createdBy', 'name')
    .sort('-createdAt');
  
  res.json(incidents);
});

// Get a single incident by ID
export const getIncidentById = handleAsync(async (req, res) => {
  const incident = await Disciplinary.findById(req.params.id)
    .populate('employee', 'name position department startDate')
    .populate('supervisor', 'name')
    .populate('createdBy', 'name')
    .populate('followUps.by', 'name');
  
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }
  
  res.json(incident);
});

// Create a new incident
export const createIncident = handleAsync(async (req, res) => {
  const {
    employeeId,
    date,
    type,
    severity,
    description,
    witnesses,
    actionTaken,
    followUpDate,
    followUpActions,
    previousIncidents,
    documentationAttached
  } = req.body;

  // Get employee's supervisor
  const employee = await User.findById(employeeId);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const incident = await Disciplinary.create({
    employee: employeeId,
    date,
    type,
    severity,
    description,
    witnesses,
    actionTaken,
    followUpDate,
    followUpActions,
    previousIncidents,
    documentationAttached,
    supervisor: employee.supervisor || req.user._id,
    createdBy: req.user._id,
    store: req.user.store,
    status: 'Pending Acknowledgment'
  });

  await incident.populate([
    { path: 'employee', select: 'name position department' },
    { path: 'supervisor', select: 'name' },
    { path: 'createdBy', select: 'name' }
  ]);

  // Create notification for the employee
  await Notification.create({
    user: employee._id,
    store: req.user.store._id,
    type: 'disciplinary',
    priority: 'high',
    title: 'New Disciplinary Incident',
    message: `A ${severity.toLowerCase()} disciplinary incident has been created regarding ${type.toLowerCase()}.`,
    relatedId: incident._id,
    relatedModel: 'Disciplinary'
  });

  // Get all managers in the store
  const managers = await User.find({
    store: req.user.store._id,
    role: { $in: ['admin', 'evaluator'] },
    _id: { $ne: req.user._id } // Exclude the creator
  });

  // Create notifications for all managers
  await Promise.all(managers.map(manager => 
    Notification.create({
      user: manager._id,
      store: req.user.store._id,
      type: 'disciplinary',
      title: 'New Disciplinary Incident Created',
      message: `${req.user.name} created a ${severity.toLowerCase()} disciplinary incident for ${employee.name} regarding ${type.toLowerCase()}.`,
      relatedId: incident._id,
      relatedModel: 'Disciplinary'
    })
  ));

  res.status(201).json(incident);
});

// Update an incident
export const updateIncident = handleAsync(async (req, res) => {
  const incident = await Disciplinary.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate([
    { path: 'employee', select: 'firstName lastName position department' },
    { path: 'supervisor', select: 'firstName lastName' },
    { path: 'createdBy', select: 'firstName lastName' }
  ]);

  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  res.json(incident);
});

// Acknowledge incident
export const acknowledgeIncident = handleAsync(async (req, res) => {
  const { comments, rating } = req.body;
  const { id } = req.params;

  const incident = await Disciplinary.findOne({
    _id: id,
    employee: req.user._id,
    'acknowledgment.acknowledged': { $ne: true }
  });

  if (!incident) {
    throw new ApiError(404, 'Incident not found or already acknowledged');
  }

  incident.acknowledgment = {
    acknowledged: true,
    date: new Date(),
    comments,
    rating
  };

  if (incident.requiresFollowUp) {
    incident.status = 'Pending Follow-up';
  } else {
    incident.status = 'Resolved';
  }

  await incident.save();

  // Create notification for the supervisor
  await Notification.create({
    user: incident.supervisor,
    store: req.user.store._id,
    type: 'disciplinary',
    title: 'Disciplinary Incident Acknowledged',
    message: `${req.user.name} has acknowledged the ${incident.severity.toLowerCase()} disciplinary incident.`,
    relatedId: incident._id,
    relatedModel: 'Disciplinary'
  });

  res.json(incident);
});

// Add follow-up
export const addFollowUp = handleAsync(async (req, res) => {
  const { id } = req.params;
  const { date, note, status } = req.body;

  const incident = await Disciplinary.findById(id);
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  incident.followUps.push({
    date,
    note,
    status,
    by: req.user._id
  });

  incident.status = 'Pending Acknowledgment';
  await incident.save();

  // Create notification for employee
  await Notification.create({
    user: incident.employee,
    store: req.user.store,
    type: 'disciplinary',
    title: 'Follow-up Added to Disciplinary Incident',
    message: `A follow-up has been added to your disciplinary incident. Please review and acknowledge.`,
    relatedId: incident._id,
    relatedModel: 'Disciplinary'
  });

  await incident.populate([
    { path: 'employee', select: 'name position department' },
    { path: 'supervisor', select: 'name' },
    { path: 'createdBy', select: 'name' },
    { path: 'followUps.by', select: 'name' }
  ]);

  res.json(incident);
});

// Complete follow-up
export const completeFollowUp = handleAsync(async (req, res) => {
  const { id, followUpId } = req.params;
  const { note } = req.body;

  const incident = await Disciplinary.findById(id);
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  const followUp = incident.followUps.id(followUpId);
  if (!followUp) {
    return res.status(404).json({ message: 'Follow-up not found' });
  }

  followUp.status = 'Completed';
  followUp.note = note;
  incident.status = 'Pending Acknowledgment';

  await incident.save();

  // Create notification for employee
  await Notification.create({
    user: incident.employee,
    store: req.user.store,
    type: 'disciplinary',
    title: 'Follow-up Completed',
    message: `The follow-up for your disciplinary incident has been completed. Please review and acknowledge.`,
    relatedId: incident._id,
    relatedModel: 'Disciplinary'
  });

  await incident.populate([
    { path: 'employee', select: 'name position department' },
    { path: 'supervisor', select: 'name' },
    { path: 'createdBy', select: 'name' },
    { path: 'followUps.by', select: 'name' }
  ]);

  res.json(incident);
});

// Add a document to an incident
export const addDocument = handleAsync(async (req, res) => {
  const { name, type, url } = req.body;
  
  const incident = await Disciplinary.findById(req.params.id);
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  incident.documents.push({
    name,
    type,
    url,
    uploadedBy: req.user._id
  });

  await incident.save();
  await incident.populate('documents.uploadedBy', 'firstName lastName');

  res.json(incident);
});

// Delete an incident
export const deleteIncident = handleAsync(async (req, res) => {
  const incident = await Disciplinary.findByIdAndDelete(req.params.id);
  
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  res.status(204).send();
});

// Get all disciplinary incidents for a specific employee
export const getEmployeeIncidents = handleAsync(async (req, res) => {
  console.log('Getting incidents for employee:', req.params.employeeId);
  const incidents = await Disciplinary.find({ employee: req.params.employeeId })
    .populate('employee', 'name position department')
    .populate('supervisor', 'name')
    .populate('createdBy', 'name')
    .sort('-createdAt');
  
  console.log('Found incidents:', incidents);
  res.json(incidents);
});

// Get all disciplinary incidents
export const getAllDisciplinaryIncidents = async (req, res) => {
    try {
        const { store } = req.user;
        console.log('Getting all disciplinary incidents for store:', store);
        
        const incidents = await Disciplinary.find({ store })
            .populate('employee', 'name')
            .populate('supervisor', 'name')
            .sort('-date');
            
        console.log('Found incidents:', incidents);
        
        res.json(incidents);
    } catch (error) {
        console.error('Error getting disciplinary incidents:', error);
        res.status(500).json({ 
            message: 'Error getting disciplinary incidents',
            error: error.message 
        });
    }
};

// Update existing incidents with proper status
export const updateExistingIncidents = handleAsync(async (req, res) => {
  const { store } = req.user;
  
  // Update all incidents that have 'Open' status or no status
  const result = await Disciplinary.updateMany(
    { 
      $or: [
        { status: 'Open' },
        { status: { $exists: false } }
      ]
    },
    { 
      $set: { 
        status: 'Pending Acknowledgment',
      }
    }
  );
  
  res.json({
    message: 'Updated existing incidents',
    modifiedCount: result.modifiedCount
  });
}); 