import { User } from '../models/index.js';

// Update user metrics
export const updateUserMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const { heartsAndHands } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize metrics if it doesn't exist
    if (!user.metrics) {
      user.metrics = {};
    }

    // Update metrics while preserving other metrics data
    user.metrics = {
      ...user.metrics,
      heartsAndHands
    };

    await user.save();
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user metrics:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('Updating user:', {
      userId: id,
      updates: JSON.stringify(updates, null, 2)
    });
    
    // Find user and ensure they exist
    const user = await User.findById(id);
    if (!user) {
      console.log('User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Current user state:', JSON.stringify(user, null, 2));

    // Update allowed fields
    const allowedUpdates = ['name', 'email', 'department', 'position', 'role', 'evaluator'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        // Handle evaluator field specifically
        if (key === 'evaluator') {
          console.log('Setting evaluator:', {
            current: user[key],
            new: updates[key],
            willBeNull: updates[key] === 'none'
          });
          user[key] = updates[key] === 'none' ? null : updates[key];
        } 
        // Handle department field
        else if (key === 'department') {
          // Convert department to proper case
          const deptMap = {
            'leadership': 'Leadership',
            'foh': 'FOH',
            'boh': 'BOH'
          };
          const dept = deptMap[updates[key].toLowerCase()] || updates[key];
          console.log(`Updating department:`, {
            current: user[key],
            new: dept,
            original: updates[key]
          });
          user[key] = dept;
        }
        // Handle role field
        else if (key === 'role') {
          // Convert to lowercase for enum
          const role = updates[key].toLowerCase();
          console.log(`Updating role:`, {
            current: user[key],
            new: role
          });
          user[key] = role;
        }
        // Handle position field
        else if (key === 'position') {
          // Ensure position matches enum exactly
          const validPositions = ['Team Member', 'Trainer', 'Team Leader', 'Shift Leader', 'Manager', 'Director'];
          const position = validPositions.find(p => p.toLowerCase() === updates[key].toLowerCase());
          if (!position) {
            throw new Error(`Invalid position. Must be one of: ${validPositions.join(', ')}`);
          }
          console.log(`Updating position:`, {
            current: user[key],
            new: position
          });
          user[key] = position;
        }
        // Handle other fields
        else {
          console.log(`Updating ${key}:`, {
            current: user[key],
            new: updates[key]
          });
          user[key] = updates[key];
        }
      }
    });

    try {
      await user.save();
      console.log('User saved successfully');
    } catch (saveError) {
      console.error('Error saving user:', {
        error: saveError.message,
        validationErrors: saveError.errors,
        stack: saveError.stack
      });
      throw saveError;
    }
    
    // Populate evaluator details before sending response
    await user.populate('evaluator', 'name email');
    
    // Format the response
    const formattedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      position: user.position,
      role: user.role,
      evaluator: user.evaluator ? {
        id: user.evaluator._id,
        name: user.evaluator.name,
        email: user.evaluator.email
      } : null
    };
    
    console.log('Sending response:', JSON.stringify(formattedUser, null, 2));
    
    res.json({ 
      message: 'User updated successfully',
      user: formattedUser 
    });
  } catch (error) {
    console.error('Error updating user:', {
      error: error.message,
      stack: error.stack,
      validationErrors: error.errors
    });
    res.status(500).json({ 
      message: error.message || 'Failed to update user',
      validationErrors: error.errors
    });
  }
}; 