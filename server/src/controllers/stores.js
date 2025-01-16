import { Store, User } from '../models/index.js';

// Create new store
export const createStore = async (req, res) => {
    try {
        const { storeNumber, name, location } = req.body;

        // Check if store already exists
        const existingStore = await Store.findOne({ storeNumber });
        if (existingStore) {
            return res.status(400).json({ message: 'Store already exists' });
        }

        // Create new store
        const store = new Store({
            storeNumber,
            name,
            location,
            admins: [req.user.userId] // Add creator as admin
        });

        await store.save();

        // Update user's store reference
        await User.findByIdAndUpdate(req.user.userId, {
            store: store._id,
            role: 'admin'
        });

        res.status(201).json({
            store: {
                id: store._id,
                number: store.storeNumber,
                name: store.name,
                location: store.location
            }
        });

    } catch (error) {
        console.error('Create store error:', error);
        res.status(500).json({ message: 'Error creating store' });
    }
};

// Get store details
export const getStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId);
        
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Check if user belongs to this store
        if (store._id.toString() !== req.user.storeId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            store: {
                id: store._id,
                number: store.storeNumber,
                name: store.name,
                location: store.location
            }
        });

    } catch (error) {
        console.error('Get store error:', error);
        res.status(500).json({ message: 'Error getting store details' });
    }
};

// Update store details
export const updateStore = async (req, res) => {
    try {
        const updates = {};
        const allowedUpdates = ['name', 'location'];
        
        Object.keys(req.body).forEach(update => {
            if (allowedUpdates.includes(update)) {
                updates[update] = req.body[update];
            }
        });

        const store = await Store.findByIdAndUpdate(
            req.params.storeId,
            updates,
            { new: true }
        );

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        res.json({
            store: {
                id: store._id,
                number: store.storeNumber,
                name: store.name,
                location: store.location
            }
        });

    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ message: 'Error updating store' });
    }
};

// Get all users in a store
export const getStoreUsers = async (req, res) => {
    try {
        const users = await User.find({ store: req.params.storeId })
            .select('-password')
            .populate('store', 'storeNumber name');

        res.json({
            users: users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                departments: user.departments,
                position: user.position,
                isAdmin: user.isAdmin
            }))
        });

    } catch (error) {
        console.error('Get store users error:', error);
        res.status(500).json({ message: 'Error getting store users' });
    }
};

// Add user to store
export const addStoreUser = async (req, res) => {
    try {
        const { email, name, departments, position } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Determine if user should be admin based on position
        const isAdmin = ['Store Director', 'Kitchen Director', 'Service Director', 'Store Leader'].includes(position);

        // Create new user
        const user = new User({
            email,
            name,
            departments,
            position,
            isAdmin,
            store: req.params.storeId,
            password: User.generateRandomPassword()
        });

        await user.save();

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                departments: user.departments,
                position: user.position,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Add store user error:', error);
        res.status(500).json({ message: 'Error adding user to store' });
    }
};

// Remove user from store
export const removeStoreUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user belongs to this store
        if (user.store.toString() !== req.params.storeId) {
            return res.status(403).json({ message: 'User not in this store' });
        }

        // Cannot remove store admin
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot remove store admin' });
        }

        await User.findByIdAndDelete(req.params.userId);

        res.json({ message: 'User removed successfully' });

    } catch (error) {
        console.error('Remove store user error:', error);
        res.status(500).json({ message: 'Error removing user from store' });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { departments, position } = req.body;
        
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user belongs to this store
        if (user.store.toString() !== req.params.storeId) {
            return res.status(403).json({ message: 'User not in this store' });
        }

        // Update departments and position
        user.departments = departments;
        user.position = position;
        
        // Update isAdmin based on position
        user.isAdmin = ['Store Director', 'Kitchen Director', 'Service Director', 'Store Leader'].includes(position);
        
        await user.save();

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                departments: user.departments,
                position: user.position,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Error updating user role' });
    }
};

export const getCurrentStore = async (req, res) => {
  try {
    console.log('Getting store info for user:', req.user);
    
    if (!req.user.store) {
      console.log('No store ID found in user object');
      return res.status(400).json({ 
        message: 'User has no associated store' 
      });
    }

    // Find store by the ID stored in user object
    const store = await Store.findById(req.user.store);
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    console.error('Error in getCurrentStore:', error);
    res.status(500).json({ 
      message: 'Error fetching store information',
      error: error.message 
    });
  }
};

export const updateCurrentStore = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update store information' });
    }

    const store = await Store.findByIdAndUpdate(
      req.user.store,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    console.error('Error in updateCurrentStore:', error);
    res.status(500).json({ 
      message: 'Error updating store information',
      error: error.message 
    });
  }
};