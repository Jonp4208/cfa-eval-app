// File: src/controllers/settings.js
import { Settings, Store } from '../models/index.js';

const DEFAULT_USER_ACCESS = {
  roleManagement: {
    storeDirectorAccess: true,
    kitchenDirectorAccess: true,
    serviceDirectorAccess: true,
    storeLeaderAccess: true,
    trainingLeaderAccess: true,
    shiftLeaderAccess: true,
    fohLeaderAccess: true,
    bohLeaderAccess: true,
    dtLeaderAccess: true
  },
  evaluation: {
    departmentRestriction: true,
    requireStoreLeaderReview: true,
    requireDirectorApproval: true,
    trainingAccess: true,
    certificationApproval: true,
    metricsAccess: true,
    workflowType: 'standard'
  }
};

const DEFAULT_EVALUATION_SETTINGS = {
  scheduling: {
    autoSchedule: false,
    frequency: 90, // Default to quarterly
    cycleStart: 'hire_date',
    transitionMode: 'complete_cycle'
  }
};

export const getSettings = async (req, res) => {
  try {
    if (!req.user.store) {
      return res.status(400).json({ 
        error: 'Store ID is required' 
      });
    }

    console.log('Getting settings for store:', req.user.store);
    let settings = await Settings.findOne({ store: req.user.store });
    
    // Get store info for read-only fields
    const store = await Store.findById(req.user.store);
    
    if (!settings) {
      console.log('No settings found, creating default settings');
      settings = await Settings.create({
        store: req.user.store,
        darkMode: false,
        compactMode: false,
        userAccess: DEFAULT_USER_ACCESS,
        evaluations: DEFAULT_EVALUATION_SETTINGS
      });
    }
    
    // Combine settings with store info
    const response = {
      ...settings.toObject(),
      storeName: store.name,
      storeNumber: store.storeNumber,
      storeAddress: store.storeAddress,
      storePhone: store.storePhone,
      storeEmail: store.storeEmail,
      visionStatement: store.visionStatement,
      missionStatement: store.missionStatement
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in getSettings:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    if (!req.user.store) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    // Check for director-level access for sensitive settings
    const isDirector = req.user.position === 'Director';
    if (!isDirector) {
      // Only allow updating personal preferences if not a director
      const allowedFields = ['darkMode', 'compactMode'];
      const requestedFields = Object.keys(req.body);
      const hasRestrictedFields = requestedFields.some(field => !allowedFields.includes(field));
      
      if (hasRestrictedFields) {
        return res.status(403).json({ error: 'Only directors can update these settings' });
      }
    }

    const settings = await Settings.findOne({ store: req.user.store });
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    // Handle resetToDefault flag - requires director access
    if (req.body.resetToDefault) {
      if (!isDirector) {
        return res.status(403).json({ error: 'Only directors can reset settings to default' });
      }
      settings.userAccess = DEFAULT_USER_ACCESS;
      settings.evaluations = DEFAULT_EVALUATION_SETTINGS;
      await settings.save();
      return res.json(settings);
    }

    // Update specific settings
    if (req.body.userAccess) {
      if (!isDirector) {
        return res.status(403).json({ error: 'Only directors can update user access settings' });
      }
      if (req.body.userAccess.roleManagement) {
        settings.userAccess.roleManagement = {
          ...settings.userAccess.roleManagement,
          ...req.body.userAccess.roleManagement
        };
      }
      if (req.body.userAccess.evaluation) {
        settings.userAccess.evaluation = {
          ...settings.userAccess.evaluation,
          ...req.body.userAccess.evaluation
        };
      }
    }

    // Update evaluations settings
    if (req.body.evaluations) {
      if (!isDirector) {
        return res.status(403).json({ error: 'Only directors can update evaluation settings' });
      }
      settings.evaluations = {
        ...settings.evaluations,
        ...req.body.evaluations
      };
    }

    // Update personal preferences
    if (req.body.darkMode !== undefined) {
      settings.darkMode = req.body.darkMode;
    }
    if (req.body.compactMode !== undefined) {
      settings.compactMode = req.body.compactMode;
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error in updateSettings:', error);
    res.status(500).json({ error: error.message });
  }
};

export const resetSettings = async (req, res) => {
  try {
    if (!req.user.store) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    await Settings.findOneAndDelete({ store: req.user.store });
    const settings = await Settings.create({
      store: req.user.store,
      darkMode: false,
      compactMode: false
    });
    
    // Get store info
    const store = await Store.findById(req.user.store);
    
    // Combine settings with store info
    const response = {
      ...settings.toObject(),
      storeName: store.name,
      storeNumber: store.storeNumber,
      storeAddress: store.storeAddress,
      storePhone: store.storePhone,
      storeEmail: store.storeEmail,
      visionStatement: store.visionStatement,
      missionStatement: store.missionStatement
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in resetSettings:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getStoreInfo = async (req, res) => {
  try {
    if (!req.user.store) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    const store = await Store.findById(req.user.store);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    console.error('Error in getStoreInfo:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateStoreInfo = async (req, res) => {
  try {
    if (!req.user.store) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update store information' });
    }

    // Only allow updating vision and mission statements
    const { visionStatement, missionStatement } = req.body;
    const updates = {};
    if (visionStatement !== undefined) updates.visionStatement = visionStatement;
    if (missionStatement !== undefined) updates.missionStatement = missionStatement;

    const store = await Store.findByIdAndUpdate(
      req.user.store,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Return the full store info in the response
    const response = {
      storeName: store.name,
      storeNumber: store.storeNumber,
      storeAddress: store.storeAddress,
      storePhone: store.storePhone,
      storeEmail: store.storeEmail,
      visionStatement: store.visionStatement,
      missionStatement: store.missionStatement
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateStoreInfo:', error);
    res.status(500).json({ error: error.message });
  }
};
