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
    
    if (!settings) {
      console.log('No settings found, creating default settings');
      settings = await Settings.create({
        store: req.user.store,
        darkMode: false,
        compactMode: false,
        storeName: '',
        storeNumber: '',
        storeAddress: '',
        storePhone: '',
        storeEmail: ''
      });
    }
    
    res.json(settings);
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

    const settings = await Settings.findOneAndUpdate(
      { store: req.user.store },
      { $set: req.body },
      { new: true, runValidators: true }
    );

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
      compactMode: false,
      storeName: '',
      storeNumber: '',
      storeAddress: '',
      storePhone: '',
      storeEmail: ''
    });
    
    res.json(settings);
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

    const store = await Store.findByIdAndUpdate(
      req.user.store,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    console.error('Error in updateStoreInfo:', error);
    res.status(500).json({ error: error.message });
  }
};
