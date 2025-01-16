// File: src/controllers/settings.js
import { Settings, Store } from '../models/index.js';

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
        compactMode: false
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

    // Extract vision and mission statements if present
    const { visionStatement, missionStatement, ...otherSettings } = req.body;

    // Update store vision and mission if provided
    if (req.user.role === 'admin' && (visionStatement !== undefined || missionStatement !== undefined)) {
      const storeUpdates = {};
      if (visionStatement !== undefined) storeUpdates.visionStatement = visionStatement;
      if (missionStatement !== undefined) storeUpdates.missionStatement = missionStatement;
      
      await Store.findByIdAndUpdate(
        req.user.store,
        { $set: storeUpdates },
        { new: true }
      );
    }

    // Update other settings
    const settings = await Settings.findOneAndUpdate(
      { store: req.user.store },
      { $set: otherSettings },
      { new: true, runValidators: true }
    );

    // Get updated store info
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
