import Disciplinary from '../models/Disciplinary.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { handleAsync } from '../utils/errorHandler.js';

// Get all disciplinary incidents
export const getAllIncidents = handleAsync(async (req, res) => {
  const incidents = await Disciplinary.find()
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
    createdBy: req.user._id
  });

  await incident.populate([
    { path: 'employee', select: 'name position department' },
    { path: 'supervisor', select: 'name' },
    { path: 'createdBy', select: 'name' }
  ]);

  // Create notification for the employee
  await Notification.create({
    user: employeeId,
    store: req.user.store._id,
    type: 'disciplinary',
    title: 'New Disciplinary Incident',
    message: `A ${severity.toLowerCase()} disciplinary incident has been filed regarding ${type.toLowerCase()}. Please review the details.`,
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

// Add a follow-up to an incident
export const addFollowUp = handleAsync(async (req, res) => {
  const { date, note, status } = req.body;
  
  const incident = await Disciplinary.findById(req.params.id);
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  incident.followUps.push({
    date,
    note,
    status,
    by: req.user._id
  });

  await incident.save();
  await incident.populate('followUps.by', 'firstName lastName');

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