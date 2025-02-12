import mongoose from 'mongoose';
import { Competency, DevelopmentPlan, Resource, BookProgress, ProgramProgress } from '../models/leadership.js';

// Competency Controllers
export const getCompetencies = async (req, res) => {
  try {
    const competencies = await Competency.find();
    res.json(competencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCompetencyById = async (req, res) => {
  try {
    const competency = await Competency.findById(req.params.id);
    if (!competency) {
      return res.status(404).json({ message: 'Competency not found' });
    }
    res.json(competency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Development Plan Controllers
export const getDevelopmentPlan = async (req, res) => {
  try {
    const { userId } = req.query;
    const User = mongoose.models.User;

    // If userId is provided and different from requesting user, verify permissions
    if (userId && userId !== req.user._id.toString()) {
      const requester = await User.findById(req.user._id);
      if (!['Leader', 'Director'].includes(requester.position)) {
        return res.status(403).json({ message: 'Insufficient permissions to view other users plans' });
      }
    }

    // Find all active plans for specified user or requesting user
    let plans = await DevelopmentPlan.find({ 
      userId: userId || req.user._id,
      status: 'active',
      isTemplate: { $ne: true }
    }).populate({
      path: 'competencies.competencyId',
      model: 'Competency'
    }).populate('assignedBy', 'name position');

    if (!plans || plans.length === 0) {
      return res.status(404).json({ 
        message: 'No development plans found',
        needsCreation: true
      });
    }

    res.json(plans);
  } catch (error) {
    console.error('Error in getDevelopmentPlan:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getTemplatePlans = async (req, res) => {
  try {
    const User = mongoose.models.User;
    const requester = await User.findById(req.user._id);
    
    console.log('Template plans request from user:', {
      id: req.user._id,
      position: requester?.position,
      name: requester?.name
    });
    
    if (!['Leader', 'Director'].includes(requester?.position)) {
      console.log('Permission denied: User position not Leader or Director');
      return res.status(403).json({ message: 'Insufficient permissions to view template plans' });
    }

    const plans = await DevelopmentPlan.find({ 
      isTemplate: true,
      status: 'active'
    }).populate({
      path: 'competencies.competencyId',
      model: 'Competency'
    });

    console.log('Found template plans:', plans.length);
    res.json(plans);
  } catch (error) {
    console.error('Error in getTemplatePlans:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createTemplatePlan = async (req, res) => {
  try {
    const User = mongoose.models.User;
    const creator = await User.findById(req.user._id);
    
    if (!['Director'].includes(creator.position)) {
      return res.status(403).json({ message: 'Only Directors can create template plans' });
    }

    const {
      name,
      description,
      currentLevel,
      targetLevel,
      roleType,
      duration,
      competencies
    } = req.body;

    const plan = new DevelopmentPlan({
      name,
      description,
      currentLevel,
      targetLevel,
      roleType,
      duration,
      competencies,
      isTemplate: true,
      status: 'active',
      createdBy: req.user._id,
      createdAt: new Date()
    });

    const savedPlan = await plan.save();
    const populatedPlan = await DevelopmentPlan.findById(savedPlan._id)
      .populate({
        path: 'competencies.competencyId',
        model: 'Competency'
      });

    res.status(201).json(populatedPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const assignPlan = async (req, res) => {
  try {
    const { planId, targetUserId, customizations } = req.body;
    const assignerId = req.user._id;
    const User = mongoose.models.User;

    // Get the template plan
    const templatePlan = await DevelopmentPlan.findById(planId).populate('competencies.competencyId');
    if (!templatePlan || !templatePlan.isTemplate) {
      return res.status(404).json({ message: 'Template plan not found' });
    }

    // Verify permissions
    const assigner = await User.findById(assignerId);
    if (!['Leader', 'Director'].includes(assigner.position)) {
      return res.status(403).json({ message: 'Insufficient permissions to assign plans' });
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Check if user already has an active plan
    const existingPlan = await DevelopmentPlan.findOne({ 
      userId: targetUserId,
      status: 'active'
    });

    if (existingPlan) {
      return res.status(400).json({ message: 'User already has an active development plan' });
    }

    // Create new plan from template
    const newPlan = new DevelopmentPlan({
      userId: targetUserId,
      name: templatePlan.name,
      description: templatePlan.description,
      currentLevel: templatePlan.currentLevel,
      targetLevel: templatePlan.targetLevel,
      roleType: templatePlan.roleType,
      duration: templatePlan.duration,
      startDate: new Date(),
      targetCompletionDate: new Date(Date.now() + templatePlan.duration * 30 * 24 * 60 * 60 * 1000),
      competencies: templatePlan.competencies,
      status: 'active',
      assignedBy: assignerId,
      assignedDate: new Date(),
      customizations,
      progress: templatePlan.competencies.map(comp => ({
        competencyId: comp.competencyId._id,
        status: 'not_started',
        startDate: new Date(),
        completedMilestones: [],
        verifiedMilestones: []
      }))
    });

    await newPlan.save();

    // Return populated plan
    const populatedPlan = await DevelopmentPlan.findById(newPlan._id)
      .populate('competencies.competencyId')
      .populate('assignedBy', 'name position');
      
    res.status(201).json(populatedPlan);
  } catch (error) {
    console.error('Error in assignPlan:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updatePlanProgress = async (req, res) => {
  try {
    const { competencyId, milestoneId, status, verified } = req.body;
    const User = mongoose.models.User;
    
    // Find the active plan
    const plan = await DevelopmentPlan.findOne({ 
      userId: req.user._id,
      status: 'active'
    });
    
    if (!plan) {
      return res.status(404).json({ message: 'Active development plan not found' });
    }

    const progressIndex = plan.progress.findIndex(
      p => p.competencyId.toString() === competencyId
    );

    if (progressIndex === -1) {
      return res.status(404).json({ message: 'Competency not found in plan' });
    }

    // Update milestone status
    if (verified) {
      const verifier = await User.findById(req.user._id);
      if (!['Leader', 'Director'].includes(verifier.position)) {
        return res.status(403).json({ message: 'Only Leaders and Directors can verify milestones' });
      }
      
      if (!plan.progress[progressIndex].verifiedMilestones.includes(milestoneId)) {
        plan.progress[progressIndex].verifiedMilestones.push(milestoneId);
      }
    } else {
      if (!plan.progress[progressIndex].completedMilestones.includes(milestoneId)) {
        plan.progress[progressIndex].completedMilestones.push(milestoneId);
      }
    }

    // Update overall competency status if needed
    const competency = await Competency.findById(competencyId);
    const totalMilestones = competency.milestones.length;
    const completedCount = plan.progress[progressIndex].completedMilestones.length;
    
    if (completedCount === totalMilestones) {
      plan.progress[progressIndex].status = 'completed';
    } else if (completedCount > 0) {
      plan.progress[progressIndex].status = 'in_progress';
    }

    plan.progress[progressIndex].lastUpdated = new Date();
    await plan.save();

    const populatedPlan = await DevelopmentPlan.findById(plan._id)
      .populate('competencies.competencyId')
      .populate('assignedBy', 'name position');

    res.json(populatedPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Resource Controllers
export const getResources = async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate('competencyIds');
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getResourcesByCompetency = async (req, res) => {
  try {
    const { competencyId } = req.params;
    const resources = await Resource.find({
      competencyIds: competencyId
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignableUsers = async (req, res) => {
  try {
    const User = mongoose.models.User;
    const assigner = await User.findById(req.user._id);
    
    console.log('Assignable users request from:', {
      id: req.user._id,
      position: assigner?.position,
      name: assigner?.name
    });
    
    if (!['Leader', 'Director'].includes(assigner?.position)) {
      console.log('Permission denied: User position not Leader or Director');
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const query = assigner.position === 'Director' 
      ? { position: { $in: ['Team Member', 'Trainer', 'Leader'] } }
      : { position: { $in: ['Team Member', 'Trainer'] } };

    console.log('Querying users with:', query);

    const users = await User.find(query)
      .select('name position email')
      .sort('name');

    console.log('Found assignable users:', users.length);
    res.json(users);
  } catch (error) {
    console.error('Error in getAssignableUsers:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all assigned plans
export const getAssignedPlans = async (req, res) => {
  try {
    const User = mongoose.models.User;
    const requester = await User.findById(req.user._id);
    
    console.log('Assigned plans request from user:', {
      id: req.user._id,
      position: requester?.position,
      name: requester?.name
    });
    
    if (!['Leader', 'Director'].includes(requester?.position)) {
      console.log('Permission denied: User position not Leader or Director');
      return res.status(403).json({ message: 'Insufficient permissions to view assigned plans' });
    }

    // Find all non-template plans
    const plans = await DevelopmentPlan.find({ 
      isTemplate: { $ne: true },
      status: { $in: ['active', 'completed'] }
    })
    .populate('userId', 'name position email')
    .populate('assignedBy', 'name position')
    .populate({
      path: 'competencies.competencyId',
      model: 'Competency'
    });

    console.log('Found assigned plans:', plans.length);
    res.json(plans);
  } catch (error) {
    console.error('Error in getAssignedPlans:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a development plan
export const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const User = mongoose.models.User;
    const requester = await User.findById(req.user._id);
    
    if (!['Director'].includes(requester?.position)) {
      return res.status(403).json({ message: 'Only Directors can delete development plans' });
    }

    const plan = await DevelopmentPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Development plan not found' });
    }

    if (plan.isTemplate) {
      return res.status(400).json({ message: 'Cannot delete template plans through this endpoint' });
    }

    await plan.deleteOne();
    res.json({ message: 'Development plan deleted successfully' });
  } catch (error) {
    console.error('Error in deletePlan:', error);
    res.status(500).json({ message: error.message });
  }
};

// Book Progress Controllers
export const updateBookProgress = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { 
      currentChapter,
      pagesRead,
      observations,
      reflection,
      weeklyAssessment
    } = req.body;

    let progress = await BookProgress.findOne({
      userId: req.user._id,
      resourceId
    });

    if (!progress) {
      const resource = await Resource.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      progress = new BookProgress({
        userId: req.user._id,
        resourceId,
        totalChapters: 12, // Default for Miller books
        startDate: new Date()
      });
    }

    // Update daily progress
    if (pagesRead || observations || reflection) {
      progress.dailyLogs.push({
        pagesRead,
        observations,
        reflection
      });
    }

    // Update weekly assessment
    if (weeklyAssessment) {
      progress.weeklyAssessments.push({
        weekNumber: progress.weeklyAssessments.length + 1,
        ...weeklyAssessment
      });
    }

    // Update chapter progress
    if (currentChapter) {
      progress.currentChapter = currentChapter;
      if (currentChapter === progress.totalChapters) {
        progress.status = 'completed';
        progress.completionDate = new Date();
      } else {
        progress.status = 'in_progress';
      }
    }

    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error('Error in updateBookProgress:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getBookProgress = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const progress = await BookProgress.findOne({
      userId: req.user._id,
      resourceId
    }).populate('resourceId');

    if (!progress) {
      return res.status(404).json({ message: 'No progress found for this book' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error in getBookProgress:', error);
    res.status(500).json({ message: error.message });
  }
};

// Program Progress Controllers
export const updateProgramProgress = async (req, res) => {
  try {
    const { planId } = req.params;
    const {
      currentLevel,
      monthlyCheckIn,
      quarterlyReview
    } = req.body;

    let progress = await ProgramProgress.findOne({
      userId: req.user._id,
      planId
    });

    if (!progress) {
      const plan = await DevelopmentPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Development plan not found' });
      }

      progress = new ProgramProgress({
        userId: req.user._id,
        planId,
        targetCompletionDate: new Date(Date.now() + (6 * 30 * 24 * 60 * 60 * 1000)) // 6 months from now
      });
    }

    // Update current level
    if (currentLevel) {
      progress.currentLevel = currentLevel;
    }

    // Add monthly check-in
    if (monthlyCheckIn) {
      progress.monthlyCheckIns.push({
        leaderId: monthlyCheckIn.leaderId,
        discussion: monthlyCheckIn.discussion
      });
    }

    // Add quarterly review
    if (quarterlyReview) {
      progress.quarterlyReviews.push({
        reviewerId: quarterlyReview.reviewerId,
        assessment: quarterlyReview.assessment
      });
    }

    // Check if program is completed
    if (progress.currentLevel === 3 && progress.bookProgress.every(bp => bp.status === 'completed')) {
      progress.status = 'completed';
      progress.actualCompletionDate = new Date();
    }

    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error('Error in updateProgramProgress:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getProgramProgress = async (req, res) => {
  try {
    const { planId } = req.params;
    const progress = await ProgramProgress.findOne({
      userId: req.user._id,
      planId
    })
    .populate('planId')
    .populate('bookProgress.resourceId');

    if (!progress) {
      return res.status(404).json({ message: 'No progress found for this program' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error in getProgramProgress:', error);
    res.status(500).json({ message: error.message });
  }
}; 