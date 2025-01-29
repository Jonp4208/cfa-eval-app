import express from 'express';
import { auth } from '../middleware/auth.js';
import FoodSafetyChecklist from '../models/FoodSafetyChecklist.js';
import FoodSafetyChecklistCompletion from '../models/FoodSafetyChecklistCompletion.js';

const router = express.Router();

// Get all checklists for a store
router.get('/food-safety/checklists', auth, async (req, res) => {
  try {
    const checklists = await FoodSafetyChecklist.find({
      store: req.user.store._id,
      isActive: true
    }).sort({ createdAt: -1 });
    
    res.json(checklists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new checklist
router.post('/food-safety/checklists', auth, async (req, res) => {
  try {
    const checklist = new FoodSafetyChecklist({
      ...req.body,
      store: req.user.store._id,
      createdBy: req.user._id
    });
    
    const savedChecklist = await checklist.save();
    res.status(201).json(savedChecklist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a specific checklist
router.get('/food-safety/checklists/:id', auth, async (req, res) => {
  try {
    const checklist = await FoodSafetyChecklist.findOne({
      _id: req.params.id,
      store: req.user.store._id
    });
    
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }
    
    res.json(checklist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a checklist
router.patch('/food-safety/checklists/:id', auth, async (req, res) => {
  try {
    const checklist = await FoodSafetyChecklist.findOneAndUpdate(
      {
        _id: req.params.id,
        store: req.user.store._id
      },
      req.body,
      { new: true }
    );
    
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }
    
    res.json(checklist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a checklist (soft delete)
router.delete('/food-safety/checklists/:id', auth, async (req, res) => {
  try {
    const checklist = await FoodSafetyChecklist.findOneAndUpdate(
      {
        _id: req.params.id,
        store: req.user.store._id
      },
      { isActive: false },
      { new: true }
    );
    
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }
    
    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete a checklist
router.post('/food-safety/checklists/:id/complete', auth, async (req, res) => {
  try {
    const checklist = await FoodSafetyChecklist.findOne({
      _id: req.params.id,
      store: req.user.store._id
    });

    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    // Calculate score and status based on item completions
    let totalItems = 0;
    let passedItems = 0;
    let hasCriticalFail = false;

    const itemCompletions = req.body.items.map(completion => {
      const checklistItem = checklist.items.id(completion.item);
      if (!checklistItem) {
        throw new Error(`Item ${completion.item} not found in checklist`);
      }

      let status = 'pass';
      totalItems++;

      // Validate based on check type
      if (checklistItem.type === 'temperature') {
        const temp = parseFloat(completion.value);
        const { minTemp, maxTemp, warningThreshold, criticalThreshold } = checklistItem.validation;

        if (temp < minTemp - criticalThreshold || temp > maxTemp + criticalThreshold) {
          status = 'fail';
          if (checklistItem.isCritical) hasCriticalFail = true;
        } else if (temp < minTemp - warningThreshold || temp > maxTemp + warningThreshold) {
          status = 'warning';
        }

        if (status === 'pass') passedItems++;
        else if (status === 'warning') passedItems += 0.5;
      } else if (checklistItem.type === 'yes_no') {
        if (completion.value !== checklistItem.validation.requiredValue) {
          status = 'fail';
          if (checklistItem.isCritical) hasCriticalFail = true;
        } else {
          passedItems++;
        }
      } else if (checklistItem.type === 'text') {
        if (checklistItem.validation.requiredPattern) {
          const regex = new RegExp(checklistItem.validation.requiredPattern);
          if (!regex.test(completion.value)) {
            status = 'fail';
            if (checklistItem.isCritical) hasCriticalFail = true;
          } else {
            passedItems++;
          }
        } else {
          // If no pattern is required, any non-empty text passes
          if (completion.value && completion.value.trim()) {
            passedItems++;
          } else {
            status = 'fail';
            if (checklistItem.isCritical) hasCriticalFail = true;
          }
        }
      }

      return {
        item: checklistItem._id,
        value: completion.value,
        status,
        notes: completion.notes,
        photo: completion.photo
      };
    });

    const score = Math.round((passedItems / totalItems) * 100);
    const overallStatus = hasCriticalFail ? 'fail' : 
                         score < checklist.passingScore ? 'fail' :
                         score < checklist.passingScore + 10 ? 'warning' : 'pass';

    const completion = new FoodSafetyChecklistCompletion({
      checklist: checklist._id,
      completedBy: req.user._id,
      store: req.user.store._id,
      items: itemCompletions,
      overallStatus,
      score,
      notes: req.body.notes
    });

    await completion.save();
    res.status(201).json(completion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get checklist completions
router.get('/food-safety/checklists/:id/completions', auth, async (req, res) => {
  try {
    const completions = await FoodSafetyChecklistCompletion.find({
      checklist: req.params.id,
      store: req.user.store._id
    })
    .populate('completedBy', 'name')
    .populate('reviewedBy', 'name')
    .sort({ completedAt: -1 });

    res.json(completions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Review a checklist completion
router.post('/food-safety/completions/:id/review', auth, async (req, res) => {
  try {
    const completion = await FoodSafetyChecklistCompletion.findOneAndUpdate(
      {
        _id: req.params.id,
        store: req.user.store._id
      },
      {
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: req.body.notes
      },
      { new: true }
    );

    if (!completion) {
      return res.status(404).json({ message: 'Completion not found' });
    }

    res.json(completion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 