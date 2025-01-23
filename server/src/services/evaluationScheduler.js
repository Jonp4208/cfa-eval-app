import { User, Settings, Evaluation, Template } from '../models/index.js';

/**
 * Calculate the next evaluation date based on settings and employee data
 */
const calculateNextEvaluationDate = (employee, settings) => {
  const { frequency, cycleStart, customStartDate } = settings.evaluations.scheduling;
  const now = new Date();
  let baseDate;

  // Determine base date for calculation
  switch (cycleStart) {
    case 'hire_date':
      baseDate = new Date(employee.startDate);
      break;
    case 'last_evaluation':
      baseDate = employee.lastEvaluation ? new Date(employee.lastEvaluation) : new Date(employee.startDate);
      break;
    case 'calendar_year':
      baseDate = new Date(now.getFullYear(), 0, 1); // January 1st
      break;
    case 'fiscal_year':
      baseDate = new Date(now.getFullYear(), 9, 1); // October 1st
      break;
    case 'custom':
      baseDate = new Date(customStartDate);
      break;
    default:
      baseDate = new Date(employee.startDate);
  }

  // Calculate next date based on frequency
  const nextDate = new Date(baseDate);
  while (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + frequency);
  }

  return nextDate;
};

/**
 * Handle transition modes for automatic scheduling
 */
const handleTransitionMode = async (employee, settings, nextDate) => {
  const { transitionMode } = settings.evaluations.scheduling;
  const lastEvaluation = await Evaluation.findOne({ 
    employee: employee._id,
    status: { $ne: 'completed' }
  }).sort({ scheduledDate: -1 });

  if (!lastEvaluation) {
    return nextDate;
  }

  switch (transitionMode) {
    case 'immediate':
      return nextDate;
    case 'complete_cycle':
      // Wait until current evaluation is complete
      if (lastEvaluation.status !== 'completed') {
        const completionDate = new Date(lastEvaluation.scheduledDate);
        completionDate.setDate(completionDate.getDate() + settings.evaluations.scheduling.frequency);
        return completionDate;
      }
      return nextDate;
    case 'align_next':
      // Wait for next full period
      const alignedDate = new Date(nextDate);
      while (alignedDate <= lastEvaluation.scheduledDate) {
        alignedDate.setDate(alignedDate.getDate() + settings.evaluations.scheduling.frequency);
      }
      return alignedDate;
    default:
      return nextDate;
  }
};

/**
 * Schedule evaluations for all eligible employees in a store
 */
export const scheduleStoreEvaluations = async (storeId) => {
  try {
    // Get store settings
    const settings = await Settings.findOne({ store: storeId });
    if (!settings?.evaluations?.scheduling?.autoSchedule) {
      return;
    }

    // Get all active employees
    const employees = await User.find({ 
      store: storeId,
      status: 'active'
    });

    // Get default template
    const defaultTemplate = await Template.findOne({ 
      store: storeId,
      isActive: true
    }).sort({ createdAt: -1 });

    if (!defaultTemplate) {
      console.error('No active template found for store:', storeId);
      return;
    }

    for (const employee of employees) {
      // Skip if employee has no evaluator assigned
      if (!employee.evaluator) continue;

      const nextDate = calculateNextEvaluationDate(employee, settings);
      const scheduledDate = await handleTransitionMode(employee, settings, nextDate);

      // Check if evaluation already exists
      const existingEvaluation = await Evaluation.findOne({
        employee: employee._id,
        scheduledDate: {
          $gte: new Date(scheduledDate.setHours(0, 0, 0, 0)),
          $lt: new Date(scheduledDate.setHours(23, 59, 59, 999))
        }
      });

      if (!existingEvaluation) {
        // Create new evaluation
        await Evaluation.create({
          employee: employee._id,
          evaluator: employee.evaluator,
          store: storeId,
          template: defaultTemplate._id,
          scheduledDate: scheduledDate,
          status: 'pending_self_evaluation'
        });
      }
    }
  } catch (error) {
    console.error('Error in scheduleStoreEvaluations:', error);
  }
};

/**
 * Schedule evaluations for all stores
 * This should be run daily via a cron job
 */
export const scheduleAllEvaluations = async () => {
  try {
    const stores = await Settings.find({
      'evaluations.scheduling.autoSchedule': true
    }).distinct('store');

    for (const storeId of stores) {
      await scheduleStoreEvaluations(storeId);
    }
  } catch (error) {
    console.error('Error in scheduleAllEvaluations:', error);
  }
}; 