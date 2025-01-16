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
    const updates = req.body;
    const allowedUpdates = ['name', 'email', 'departments', 'position', 'status', 'manager', 'isAdmin'];
    const isValidOperation = Object.keys(updates).every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'manager') {
          user[key] = updates[key] === 'none' ? null : updates[key];
        } else {
          user[key] = updates[key];
        }
      }
    });

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      departments: user.departments,
      position: user.position,
      status: user.status,
      isAdmin: user.isAdmin,
      manager: user.manager ? {
        _id: user.manager._id,
        name: user.manager.name
      } : null
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
}; 