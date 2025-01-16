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
export const updateUser = async (req, res, normalizedData) => {
  try {
    const { id } = req.params;
    const updates = normalizedData || req.body;

    // Remove any sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates.store; // Store should only be changed through specific endpoints

    console.log('Updating user with normalized data:', {
      id,
      updates,
      departments: updates.departments,
      position: updates.position
    });

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('store', 'name storeNumber');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        departments: user.departments,
        position: user.position,
        store: user.store
      }
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
}; 