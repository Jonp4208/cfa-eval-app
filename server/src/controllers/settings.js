// File: src/controllers/settings.js
import { Settings, Store } from '../models/index.js';
import { validateAndRepairSettings, validateAutoScheduling } from '../utils/settingsValidator.js';
import { handleError, ErrorCategory } from '../utils/errorHandler.js';
import { scheduleStoreEvaluations } from '../services/evaluationScheduler.js';

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

const DEFAULT_SETTINGS = {
  evaluations: {
    scheduling: {
      autoSchedule: false,
      frequency: 90,
      cycleStart: 'hire_date',
      transitionMode: 'complete_cycle'
    }
  }
};

export const getSettings = async (req, res) => {
  try {
    if (!req.user?.store) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    // Validate and repair settings if needed
    const validation = await validateAndRepairSettings(req.user.store);
    
    // If repairs were made, log them
    if (validation.wasRepaired) {
      handleError(
        new Error('Settings were automatically repaired'),
        ErrorCategory.SETTINGS,
        {
          storeId: req.user.store,
          repairs: validation.repairs,
          function: 'getSettings'
        }
      );
    }

    res.json(validation.settings);
  } catch (error) {
    handleError(error, ErrorCategory.SETTINGS, {
      storeId: req.user?.store,
      function: 'getSettings'
    });
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    if (!req.user?.store) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    // Check for admin access for sensitive settings
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      // Only allow updating personal preferences if not an admin
      const allowedFields = ['darkMode', 'compactMode'];
      const requestedFields = Object.keys(req.body);
      const hasRestrictedFields = requestedFields.some(field => !allowedFields.includes(field));
      
      if (hasRestrictedFields) {
        return res.status(403).json({ error: 'Only administrators can update these settings' });
      }
    }

    // Get current settings
    let settings = await Settings.findOne({ store: req.user.store });
    if (!settings) {
      settings = new Settings({
        store: req.user.store,
        ...DEFAULT_SETTINGS
      });
    }

    // Handle resetToDefault flag
    if (req.body.resetToDefault) {
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only administrators can reset settings to default' });
      }
      Object.assign(settings, DEFAULT_SETTINGS);
      await settings.save();
      return res.json(settings);
    }

    let schedulingResults = null;

    // Update evaluation settings
    if (req.body.evaluations) {
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only administrators can update evaluation settings' });
      }

      // Ensure nested objects exist
      if (!settings.evaluations) {
        settings.evaluations = {};
      }
      if (!settings.evaluations.scheduling) {
        settings.evaluations.scheduling = {};
      }

      // If enabling auto-scheduling, validate all requirements are met
      if (req.body.evaluations.scheduling?.autoSchedule) {
        const autoScheduleValidation = await validateAutoScheduling(req.user.store);
        
        // Only block enabling if there are critical issues
        if (!autoScheduleValidation.isValid) {
          // Preserve existing settings in the error response
          return res.status(400).json({
            error: 'Cannot enable auto-scheduling due to configuration issues',
            issues: autoScheduleValidation.issues,
            configurationIssues: autoScheduleValidation.configurationIssues,
            currentSettings: settings.toObject()
          });
        }

        // Update scheduling settings while preserving existing values
        if (req.body.evaluations.scheduling) {
          const currentScheduling = settings.evaluations?.scheduling || {};
          settings.evaluations.scheduling = {
            ...currentScheduling,
            ...req.body.evaluations.scheduling,
            // Ensure required fields have defaults or keep existing values
            frequency: req.body.evaluations.scheduling.frequency || currentScheduling.frequency || 90,
            cycleStart: req.body.evaluations.scheduling.cycleStart || currentScheduling.cycleStart || 'hire_date',
            transitionMode: req.body.evaluations.scheduling.transitionMode || currentScheduling.transitionMode || 'complete_cycle'
          };
        }

        // Save settings before scheduling
        await settings.save();

        // Run initial scheduling
        try {
          schedulingResults = await scheduleStoreEvaluations(req.user.store);
          
          // Include scheduling results summary
          if (schedulingResults) {
            console.log('Auto-scheduling results:', {
              store: req.user.store,
              scheduled: schedulingResults.scheduled?.length || 0,
              skipped: schedulingResults.skipped?.length || 0,
              errors: schedulingResults.errors?.length || 0
            });
          }
        } catch (error) {
          // Log the error but don't prevent settings from being saved
          handleError(error, ErrorCategory.SETTINGS, {
            storeId: req.user.store,
            function: 'updateSettings - initial scheduling'
          });
          // Include error info in response
          schedulingResults = { error: error.message };
        }
      } else {
        // Update scheduling settings normally
        if (req.body.evaluations.scheduling) {
          settings.evaluations.scheduling = {
            ...settings.evaluations.scheduling,
            ...req.body.evaluations.scheduling
          };
        }
      }

      // Update other evaluation settings if they exist
      const { scheduling, ...otherEvalSettings } = req.body.evaluations;
      if (Object.keys(otherEvalSettings).length > 0) {
        settings.evaluations = {
          ...settings.evaluations,
          ...otherEvalSettings
        };
      }
    }

    // Update personal preferences
    if (req.body.darkMode !== undefined) {
      settings.darkMode = req.body.darkMode;
    }
    if (req.body.compactMode !== undefined) {
      settings.compactMode = req.body.compactMode;
    }

    // Save the settings
    await settings.save();

    // Get final validation state including configuration issues
    const finalValidation = await validateAutoScheduling(req.user.store);

    // Return settings with scheduling results and configuration issues
    const response = {
      ...settings.toObject(),
      schedulingResults,
      evaluations: {
        ...settings.toObject().evaluations,
        configurationIssues: finalValidation.configurationIssues
      }
    };

    res.json(response);
  } catch (error) {
    handleError(error, ErrorCategory.SETTINGS, {
      storeId: req.user?.store,
      function: 'updateSettings'
    });
    res.status(500).json({ error: error.message });
  }
};

export const validateSettings = async (req, res) => {
  try {
    if (!req.user?.store) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    const autoScheduleValidation = await validateAutoScheduling(req.user.store);
    
    res.json({
      isValid: autoScheduleValidation.isValid,
      issues: autoScheduleValidation.issues,
      employeeCount: autoScheduleValidation.employeeCount,
      settings: autoScheduleValidation.settings
    });
  } catch (error) {
    handleError(error, ErrorCategory.SETTINGS, {
      storeId: req.user?.store,
      function: 'validateSettings'
    });
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
