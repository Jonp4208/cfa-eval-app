import GradingScale from '../models/GradingScale.js';

// Get all grading scales for a store
export const getGradingScales = async (req, res) => {
  try {
    const scales = await GradingScale.find({ 
      store: req.user.store,
      isActive: true 
    }).populate('createdBy', 'name');
    
    res.json(scales);
  } catch (error) {
    console.error('Error fetching grading scales:', error);
    res.status(500).json({ message: 'Error fetching grading scales' });
  }
};

// Get a single grading scale
export const getGradingScale = async (req, res) => {
  try {
    const scale = await GradingScale.findOne({ 
      _id: req.params.id,
      store: req.user.store 
    }).populate('createdBy', 'name');
    
    if (!scale) {
      return res.status(404).json({ message: 'Grading scale not found' });
    }
    
    res.json(scale);
  } catch (error) {
    console.error('Error fetching grading scale:', error);
    res.status(500).json({ message: 'Error fetching grading scale' });
  }
};

// Create a new grading scale
export const createGradingScale = async (req, res) => {
  try {
    // Ensure user is a director
    if (req.user.position !== 'Director') {
      return res.status(403).json({ message: 'Only directors can create grading scales' });
    }

    const scale = new GradingScale({
      ...req.body,
      store: req.user.store,
      createdBy: req.user._id
    });

    await scale.save();
    res.status(201).json(scale);
  } catch (error) {
    console.error('Error creating grading scale:', error);
    if (error.message.includes('must have at least 2 grades') || 
        error.message.includes('must be in ascending order')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating grading scale' });
  }
};

// Update a grading scale
export const updateGradingScale = async (req, res) => {
  try {
    // Ensure user is a director
    if (req.user.position !== 'Director') {
      return res.status(403).json({ message: 'Only directors can update grading scales' });
    }

    const scale = await GradingScale.findOne({ 
      _id: req.params.id,
      store: req.user.store 
    });

    if (!scale) {
      return res.status(404).json({ message: 'Grading scale not found' });
    }

    // Update fields
    Object.assign(scale, req.body);
    await scale.save();

    res.json(scale);
  } catch (error) {
    console.error('Error updating grading scale:', error);
    if (error.message.includes('must have at least 2 grades') || 
        error.message.includes('must be in ascending order')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating grading scale' });
  }
};

// Delete (deactivate) a grading scale
export const deleteGradingScale = async (req, res) => {
  try {
    // Ensure user is a director
    if (req.user.position !== 'Director') {
      return res.status(403).json({ message: 'Only directors can delete grading scales' });
    }

    const scale = await GradingScale.findOne({ 
      _id: req.params.id,
      store: req.user.store 
    });

    if (!scale) {
      return res.status(404).json({ message: 'Grading scale not found' });
    }

    // Don't allow deletion of default scale
    if (scale.isDefault) {
      return res.status(400).json({ message: 'Cannot delete the default grading scale' });
    }

    // Soft delete by setting isActive to false
    scale.isActive = false;
    await scale.save();

    res.json({ message: 'Grading scale deleted successfully' });
  } catch (error) {
    console.error('Error deleting grading scale:', error);
    res.status(500).json({ message: 'Error deleting grading scale' });
  }
};

// Set a grading scale as default
export const setDefaultScale = async (req, res) => {
  try {
    // Ensure user is a director
    if (req.user.position !== 'Director') {
      return res.status(403).json({ message: 'Only directors can set default grading scales' });
    }

    const scale = await GradingScale.findOne({ 
      _id: req.params.id,
      store: req.user.store 
    });

    if (!scale) {
      return res.status(404).json({ message: 'Grading scale not found' });
    }

    scale.isDefault = true;
    await scale.save();

    res.json(scale);
  } catch (error) {
    console.error('Error setting default grading scale:', error);
    res.status(500).json({ message: 'Error setting default grading scale' });
  }
}; 