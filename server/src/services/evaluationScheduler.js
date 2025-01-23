import { User, Settings, Evaluation, Template } from '../models/index.js';
import { handleError, withRetry, ErrorCategory, SchedulingError } from '../utils/errorHandler.js';
import { 
  toStoreLocalTime, 
  toUTC, 
  getStartOfDay, 
  getEndOfDay,
  adjustToBusinessDay,
  getStoreBusinessHours
} from '../utils/timezone.js';
import { validateAutoScheduling } from '../utils/settingsValidator.js';

// Add these constants at the top with other imports
const EVALUATION_CONSTRAINTS = {
  MIN_DAYS_BETWEEN: 30,  // Minimum 30 days between evaluations
  MAX_DAYS_BETWEEN: 365, // Maximum 1 year between evaluations
  GRACE_PERIOD_DAYS: 14  // Grace period for scheduling flexibility
};

/**
 * Get store timezone and business hours
 */
const getStoreTimeSettings = async (storeId) => {
  try {
    const settings = await withRetry(async () => {
      return await Settings.findOne({ store: storeId });
    });

    return {
      timezone: settings?.timezone || 'America/New_York',
      businessHours: settings?.businessHours || { start: 9, end: 17 }
    };
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      storeId,
      function: 'getStoreTimeSettings'
    });
  }
};

/**
 * Adjust date to store's business hours
 */
const adjustToBusinessHours = async (date, storeId) => {
  try {
    const { timezone, businessHours } = await getStoreTimeSettings(storeId);
    
    // First adjust for weekends
    const businessDayDate = adjustToBusinessDay(date, timezone);
    
    // Get business hours in UTC
    const hours = getStoreBusinessHours(businessDayDate, timezone, businessHours);
    
    // If date is before business hours, set to start of business hours
    if (businessDayDate < hours.start) {
      return hours.start;
    }
    
    // If date is after business hours, set to start of next business day
    if (businessDayDate > hours.end) {
      const nextDay = new Date(businessDayDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return adjustToBusinessHours(nextDay, storeId);
    }
    
    return businessDayDate;
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      date,
      storeId,
      function: 'adjustToBusinessHours'
    });
  }
};

/**
 * Get the most appropriate last evaluation date for scheduling
 */
const getLastEvaluationDate = async (employee) => {
  try {
    // Find the most recent completed evaluation
    const lastCompletedEval = await withRetry(async () => {
      return await Evaluation.findOne({
        employee: employee._id,
        status: 'completed'
      }).sort({ completedDate: -1 });
    });

    // Find any pending evaluations
    const pendingEval = await withRetry(async () => {
      return await Evaluation.findOne({
        employee: employee._id,
        status: { $ne: 'completed' }
      }).sort({ scheduledDate: -1 });
    });

    // If there's a pending evaluation that's past its scheduled date,
    // use that as the base to prevent scheduling before it's complete
    if (pendingEval && new Date(pendingEval.scheduledDate) <= new Date()) {
      return {
        date: new Date(pendingEval.scheduledDate),
        source: 'pending_evaluation',
        evaluationId: pendingEval._id
      };
    }

    // If there's a completed evaluation, use that
    if (lastCompletedEval) {
      return {
        date: new Date(lastCompletedEval.completedDate || lastCompletedEval.scheduledDate),
        source: 'completed_evaluation',
        evaluationId: lastCompletedEval._id
      };
    }

    // Fall back to hire date if no evaluations exist
    return {
      date: new Date(employee.startDate),
      source: 'hire_date'
    };
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      employeeId: employee._id,
      function: 'getLastEvaluationDate'
    });
  }
};

/**
 * Calculate the next evaluation date based on settings and employee data
 */
const calculateNextEvaluationDate = async (employee, lastEvalInfo, settings) => {
  try {
    const { timezone } = await getStoreTimeSettings(employee.store);
    const now = new Date();

    // For first evaluation or if no previous evaluation exists
    if (lastEvalInfo.source === 'hire_date') {
      // Calculate the end of current quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const quarterEndMonth = (currentQuarter + 1) * 3;
      const quarterEnd = new Date(now.getFullYear(), quarterEndMonth, 0); // Last day of the quarter

      // If we're within 14 days of quarter end, schedule for next quarter
      if (quarterEnd.getTime() - now.getTime() < 14 * 24 * 60 * 60 * 1000) {
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
      }

      // Schedule within this quarter, but at least 14 days from now
      const minDate = new Date(now);
      minDate.setDate(minDate.getDate() + 14); // Minimum 14 days from now

      // Use the earlier of quarter end or 90 days from now
      const ninetyDaysFromNow = new Date(now);
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      
      const scheduledDate = ninetyDaysFromNow < quarterEnd ? ninetyDaysFromNow : quarterEnd;
      
      // Ensure it's not earlier than our minimum date
      const nextDate = scheduledDate < minDate ? minDate : scheduledDate;

      // Adjust to business hours and convert back to UTC
      const adjustedDate = await adjustToBusinessHours(toUTC(nextDate, timezone), employee.store);

      return {
        date: adjustedDate,
        baseDate: now,
        baseDateSource: 'first_evaluation'
      };
    }

    // For subsequent evaluations, schedule exactly 90 days from last evaluation
    const nextDate = new Date(lastEvalInfo.date);
    nextDate.setDate(nextDate.getDate() + 90);

    // If next date is in the past, schedule within this quarter
    if (nextDate < now) {
      // Calculate the end of current quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const quarterEndMonth = (currentQuarter + 1) * 3;
      const quarterEnd = new Date(now.getFullYear(), quarterEndMonth, 0);

      // If we're within 14 days of quarter end, schedule for next quarter
      if (quarterEnd.getTime() - now.getTime() < 14 * 24 * 60 * 60 * 1000) {
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
      }

      // Schedule at least 14 days from now, but before quarter end
      const minDate = new Date(now);
      minDate.setDate(minDate.getDate() + 14);
      
      const nextDate = minDate < quarterEnd ? minDate : quarterEnd;

      // Adjust to business hours and convert back to UTC
      const adjustedDate = await adjustToBusinessHours(toUTC(nextDate, timezone), employee.store);

      return {
        date: adjustedDate,
        baseDate: now,
        baseDateSource: 'catch_up'
      };
    }

    // Adjust to business hours and convert back to UTC
    const adjustedDate = await adjustToBusinessHours(toUTC(nextDate, timezone), employee.store);

    return {
      date: adjustedDate,
      baseDate: lastEvalInfo.date,
      baseDateSource: lastEvalInfo.source
    };
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      employeeId: employee._id,
      storeId: employee.store,
      function: 'calculateNextEvaluationDate'
    });
  }
};

/**
 * Handle transition modes for automatic scheduling
 */
const handleTransitionMode = async (employee, settings, nextDate) => {
  try {
    const { transitionMode } = settings.evaluations.scheduling;
    const MAX_WAIT_DAYS = 90; // Maximum wait time of 90 days
    
    const lastEvaluation = await withRetry(async () => {
      return await Evaluation.findOne({ 
        employee: employee._id,
        status: { $ne: 'completed' }
      }).sort({ scheduledDate: -1 });
    });

    if (!lastEvaluation) {
      return nextDate;
    }

    // Calculate maximum allowed date
    const maxAllowedDate = new Date();
    maxAllowedDate.setDate(maxAllowedDate.getDate() + MAX_WAIT_DAYS);

    switch (transitionMode) {
      case 'immediate':
        return nextDate;
      case 'complete_cycle':
        // Wait until current evaluation is complete
        if (lastEvaluation.status !== 'completed') {
          const completionDate = new Date(lastEvaluation.scheduledDate);
          completionDate.setDate(completionDate.getDate() + settings.evaluations.scheduling.frequency);
          
          // Check if completion date exceeds maximum wait time
          if (completionDate > maxAllowedDate) {
            handleError(
              new SchedulingError('Maximum wait time exceeded, forcing schedule', {
                originalDate: completionDate,
                maxAllowedDate,
                employeeId: employee._id
              }),
              ErrorCategory.SCHEDULING,
              { function: 'handleTransitionMode' }
            );
            return maxAllowedDate;
          }
          return completionDate;
        }
        return nextDate;
      case 'align_next':
        // Wait for next full period
        const alignedDate = new Date(nextDate);
        let iterations = 0;
        const MAX_ITERATIONS = 12; // Prevent infinite loops
        
        while (alignedDate <= lastEvaluation.scheduledDate && iterations < MAX_ITERATIONS) {
          alignedDate.setDate(alignedDate.getDate() + settings.evaluations.scheduling.frequency);
          iterations++;
        }

        // Check if aligned date exceeds maximum wait time
        if (alignedDate > maxAllowedDate || iterations >= MAX_ITERATIONS) {
          handleError(
            new SchedulingError('Maximum wait time or iterations exceeded, forcing schedule', {
              originalDate: alignedDate,
              maxAllowedDate,
              iterations,
              employeeId: employee._id
            }),
            ErrorCategory.SCHEDULING,
            { function: 'handleTransitionMode' }
          );
          return maxAllowedDate;
        }
        return alignedDate;
      default:
        throw new SchedulingError('Invalid transition mode', { transitionMode });
    }
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      employeeId: employee._id,
      storeId: employee.store,
      function: 'handleTransitionMode'
    });
  }
};

/**
 * Calculate optimal evaluation distribution for an evaluator
 * to prevent overload
 */
const distributeEvaluatorWorkload = async (evaluatorId, scheduledDate, storeId) => {
  try {
    const { timezone } = await getStoreTimeSettings(storeId);
    const EVALS_PER_DAY = 3;
    const DISTRIBUTION_WINDOW = 7;

    // Convert dates to store's timezone for window calculation
    const startDate = toStoreLocalTime(scheduledDate, timezone);
    startDate.setDate(startDate.getDate() - DISTRIBUTION_WINDOW);
    const endDate = toStoreLocalTime(scheduledDate, timezone);
    endDate.setDate(endDate.getDate() + DISTRIBUTION_WINDOW);

    // Get evaluations within window
    const existingEvaluations = await withRetry(async () => {
      return await Evaluation.find({
        evaluator: evaluatorId,
        store: storeId,
        scheduledDate: {
          $gte: toUTC(startDate, timezone),
          $lte: toUTC(endDate, timezone)
        }
      }).sort({ scheduledDate: 1 });
    });

    // Group by date in store's timezone
    const evalsByDate = existingEvaluations.reduce((acc, evaluation) => {
      const dateKey = toStoreLocalTime(evaluation.scheduledDate, timezone).toDateString();
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});

    // Find optimal date
    let optimalDate = toStoreLocalTime(scheduledDate, timezone);
    
    for (let i = -DISTRIBUTION_WINDOW; i <= DISTRIBUTION_WINDOW; i++) {
      const checkDate = new Date(optimalDate);
      checkDate.setDate(checkDate.getDate() + i);
      
      // Skip weekends
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
      
      const dateKey = checkDate.toDateString();
      if (!evalsByDate[dateKey] || evalsByDate[dateKey] < EVALS_PER_DAY) {
        optimalDate = checkDate;
        break;
      }
    }

    // Convert back to UTC and adjust to business hours
    return adjustToBusinessHours(toUTC(optimalDate, timezone), storeId);
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      evaluatorId,
      scheduledDate,
      storeId,
      function: 'distributeEvaluatorWorkload'
    });
  }
};

/**
 * Validate evaluation timing constraints
 */
const validateEvaluationTiming = (proposedDate, lastEvalInfo, settings) => {
  try {
    const now = new Date();
    const lastEvalDate = lastEvalInfo.date;
    const daysSinceLastEval = Math.ceil((proposedDate.getTime() - lastEvalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Skip minimum time check for first evaluation (using hire date)
    if (lastEvalInfo.source !== 'hire_date') {
      // Check minimum time between evaluations
      if (daysSinceLastEval < EVALUATION_CONSTRAINTS.MIN_DAYS_BETWEEN) {
        throw new SchedulingError('Proposed evaluation date too soon after last evaluation', {
          proposedDate,
          lastEvalDate,
          daysSinceLastEval,
          minRequired: EVALUATION_CONSTRAINTS.MIN_DAYS_BETWEEN
        });
      }
    }

    // Check maximum time between evaluations
    if (daysSinceLastEval > EVALUATION_CONSTRAINTS.MAX_DAYS_BETWEEN) {
      // If we're beyond max time, schedule as soon as possible with grace period
      const adjustedDate = new Date(lastEvalDate);
      adjustedDate.setDate(adjustedDate.getDate() + EVALUATION_CONSTRAINTS.MAX_DAYS_BETWEEN);
      
      // If adjusted date is in the past, schedule within grace period from now
      if (adjustedDate < now) {
        adjustedDate.setDate(now.getDate() + EVALUATION_CONSTRAINTS.GRACE_PERIOD_DAYS);
      }

      handleError(
        new SchedulingError('Maximum time between evaluations exceeded, adjusting date', {
          originalDate: proposedDate,
          adjustedDate,
          daysSinceLastEval,
          maxAllowed: EVALUATION_CONSTRAINTS.MAX_DAYS_BETWEEN
        }),
        ErrorCategory.SCHEDULING,
        { function: 'validateEvaluationTiming' }
      );

      return adjustedDate;
    }

    return proposedDate;
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      proposedDate,
      lastEvalInfo,
      function: 'validateEvaluationTiming'
    });
  }
};

/**
 * Handle role changes and transfers for evaluation scheduling
 */
const handleEmployeeChanges = async (employee, lastEvalInfo) => {
  try {
    // Get employee's role and store history
    const roleHistory = await withRetry(async () => {
      return await User.findById(employee._id).select('roleHistory storeHistory');
    });

    if (!roleHistory) {
      return { requiresNewEvaluation: false };
    }

    const now = new Date();
    let lastChange = null;
    let changeType = null;

    // Check for role changes since last evaluation
    if (roleHistory.roleHistory?.length > 0) {
      const lastRoleChange = roleHistory.roleHistory[roleHistory.roleHistory.length - 1];
      if (new Date(lastRoleChange.date) > lastEvalInfo.date) {
        lastChange = lastRoleChange.date;
        changeType = 'role';
      }
    }

    // Check for store transfers since last evaluation
    if (roleHistory.storeHistory?.length > 0) {
      const lastStoreChange = roleHistory.storeHistory[roleHistory.storeHistory.length - 1];
      if (new Date(lastStoreChange.date) > lastEvalInfo.date) {
        if (!lastChange || new Date(lastStoreChange.date) > new Date(lastChange)) {
          lastChange = lastStoreChange.date;
          changeType = 'transfer';
        }
      }
    }

    if (!lastChange) {
      return { requiresNewEvaluation: false };
    }

    // Calculate days since change
    const daysSinceChange = Math.ceil((now.getTime() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine if new evaluation is needed based on change type and timing
    const ROLE_CHANGE_WAIT_DAYS = 30; // Wait 30 days after role change
    const TRANSFER_WAIT_DAYS = 45;    // Wait 45 days after transfer

    const waitDays = changeType === 'role' ? ROLE_CHANGE_WAIT_DAYS : TRANSFER_WAIT_DAYS;
    const requiresNewEvaluation = daysSinceChange >= waitDays;

    return {
      requiresNewEvaluation,
      changeType,
      changeDate: lastChange,
      daysSinceChange,
      waitDays
    };
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      employeeId: employee._id,
      function: 'handleEmployeeChanges'
    });
  }
};

/**
 * Check if employee is eligible for evaluation scheduling
 */
const isEmployeeEligible = async (employee, settings) => {
  try {
    // Check if employee is on leave
    if (employee.leaveStatus?.isOnLeave) {
      const leaveEndDate = new Date(employee.leaveStatus.endDate);
      const now = new Date();

      // If leave end date is not set or is in the future, employee is not eligible
      if (!employee.leaveStatus.endDate || leaveEndDate > now) {
        handleError(
          new SchedulingError('Employee is on leave', {
            employeeId: employee._id,
            leaveEndDate: employee.leaveStatus.endDate,
            leaveType: employee.leaveStatus.type
          }),
          ErrorCategory.SCHEDULING,
          { function: 'isEmployeeEligible' }
        );
        return false;
      }

      // If leave just ended, add grace period before scheduling
      if (leaveEndDate > new Date(now - EVALUATION_CONSTRAINTS.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)) {
        handleError(
          new SchedulingError('Employee recently returned from leave, in grace period', {
            employeeId: employee._id,
            leaveEndDate: employee.leaveStatus.endDate,
            gracePeriodDays: EVALUATION_CONSTRAINTS.GRACE_PERIOD_DAYS
          }),
          ErrorCategory.SCHEDULING,
          { function: 'isEmployeeEligible' }
        );
        return false;
      }
    }

    // Check if employee has an evaluator assigned
    if (!employee.evaluator || (typeof employee.evaluator !== 'string' && !employee.evaluator._id)) {
      handleError(
        new SchedulingError('No evaluator assigned', { 
          employeeId: employee._id 
        }),
        ErrorCategory.SCHEDULING,
        { function: 'isEmployeeEligible' }
      );
      return false;
    }

    // Check if employee's evaluator is on leave
    const evaluator = await withRetry(async () => {
      return await User.findById(employee.evaluator);
    });

    if (evaluator?.leaveStatus?.isOnLeave) {
      const evaluatorLeaveEnd = new Date(evaluator.leaveStatus.endDate);
      const now = new Date();

      if (!evaluator.leaveStatus.endDate || evaluatorLeaveEnd > now) {
        handleError(
          new SchedulingError('Evaluator is on leave', {
            employeeId: employee._id,
            evaluatorId: evaluator._id,
            leaveEndDate: evaluator.leaveStatus.endDate
          }),
          ErrorCategory.SCHEDULING,
          { function: 'isEmployeeEligible' }
        );
        return false;
      }
    }

    // Check minimum employment duration if it's their first evaluation
    const lastEvalInfo = await getLastEvaluationDate(employee);
    if (lastEvalInfo.source === 'hire_date') {
      const employmentDuration = Math.ceil(
        (new Date().getTime() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const minEmploymentDays = settings.evaluations?.scheduling?.minEmploymentDays || 90;
      
      if (employmentDuration < minEmploymentDays) {
        handleError(
          new SchedulingError('Employee has not met minimum employment duration', {
            employeeId: employee._id,
            employmentDuration,
            minRequired: minEmploymentDays
          }),
          ErrorCategory.SCHEDULING,
          { function: 'isEmployeeEligible' }
        );
        return false;
      }
    }

    // Check for role changes or transfers
    const changeStatus = await handleEmployeeChanges(employee, lastEvalInfo);
    
    // If there's been a change but not enough time has passed
    if (changeStatus.changeType && !changeStatus.requiresNewEvaluation) {
      handleError(
        new SchedulingError('Recent role/store change, waiting required period', {
          employeeId: employee._id,
          changeType: changeStatus.changeType,
          daysSinceChange: changeStatus.daysSinceChange,
          requiredWaitDays: changeStatus.waitDays
        }),
        ErrorCategory.SCHEDULING,
        { function: 'isEmployeeEligible' }
      );
      return false;
    }

    return true;
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      employeeId: employee._id,
      function: 'isEmployeeEligible'
    });
  }
};

/**
 * Calculate priority score for employee evaluation
 */
const calculatePriorityScore = async (employee, lastEvalInfo) => {
  try {
    const now = new Date();
    const daysSinceLastEval = Math.ceil((now.getTime() - lastEvalInfo.date.getTime()) / (1000 * 60 * 60 * 24));
    
    let priorityScore = 0;
    
    // Base priority based on days since last evaluation
    if (daysSinceLastEval > EVALUATION_CONSTRAINTS.MAX_DAYS_BETWEEN) {
      priorityScore += 100; // Highest priority for overdue evaluations
    } else if (daysSinceLastEval > EVALUATION_CONSTRAINTS.MAX_DAYS_BETWEEN - 30) {
      priorityScore += 75; // High priority for nearly overdue
    } else if (daysSinceLastEval > EVALUATION_CONSTRAINTS.MAX_DAYS_BETWEEN - 60) {
      priorityScore += 50; // Medium priority
    }
    
    // Additional priority for employees who missed previous evaluations
    const missedEvaluations = await withRetry(async () => {
      return await Evaluation.countDocuments({
        employee: employee._id,
        status: 'missed',
        scheduledDate: { $gt: lastEvalInfo.date }
      });
    });
    
    priorityScore += missedEvaluations * 25; // Add 25 points per missed evaluation
    
    // Priority for first evaluations
    if (lastEvalInfo.source === 'hire_date') {
      priorityScore += 40;
    }
    
    // Priority for employees returning from leave
    if (employee.leaveStatus?.endDate) {
      const leaveEndDate = new Date(employee.leaveStatus.endDate);
      const daysBackFromLeave = Math.ceil((now.getTime() - leaveEndDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysBackFromLeave > EVALUATION_CONSTRAINTS.GRACE_PERIOD_DAYS && daysBackFromLeave < 30) {
        priorityScore += 30;
      }
    }
    
    // Additional priority for role changes and transfers
    const changeStatus = await handleEmployeeChanges(employee, lastEvalInfo);
    if (changeStatus.requiresNewEvaluation) {
      // Higher priority for transfers than role changes
      if (changeStatus.changeType === 'transfer') {
        priorityScore += 60;
      } else if (changeStatus.changeType === 'role') {
        priorityScore += 45;
      }
      
      // Extra priority for longer waits
      const extraWaitDays = changeStatus.daysSinceChange - changeStatus.waitDays;
      if (extraWaitDays > 0) {
        priorityScore += Math.min(extraWaitDays, 30); // Up to 30 extra points
      }
    }
    
    return priorityScore;
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      employeeId: employee._id,
      function: 'calculatePriorityScore'
    });
  }
};

/**
 * Schedule evaluations for all eligible employees in a store
 */
export const scheduleStoreEvaluations = async (storeId) => {
  try {
    // Validate auto-scheduling configuration
    const validation = await validateAutoScheduling(storeId);
    if (!validation.isValid) {
      throw new SchedulingError('Auto-scheduling validation failed', {
        storeId,
        issues: validation.issues
      });
    }

    const { settings } = validation;
    const { timezone } = await getStoreTimeSettings(storeId);

    // Get all active employees
    const employees = await withRetry(async () => {
      return await User.find({ 
        store: storeId,
        status: 'active'
      });
    });

    console.log('Found active employees:', {
      total: employees.length,
      employeeDetails: employees.map(emp => ({
        id: emp._id,
        hasEvaluator: !!emp.evaluator,
        startDate: emp.startDate
      }))
    });

    // Get default template
    const defaultTemplate = await withRetry(async () => {
      const template = await Template.findOne({ 
        store: storeId,
        isActive: true
      }).sort({ createdAt: -1 });

      if (!template) {
        throw new SchedulingError('No active template found', { storeId });
      }
      return template;
    });

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];
    const skipped = [];

    // Calculate priority scores for all employees
    const employeePriorities = [];
    for (const employee of employees) {
      try {
        console.log('Processing employee:', {
          id: employee._id,
          hasEvaluator: !!employee.evaluator,
          startDate: employee.startDate
        });

        // Skip employees without evaluators
        if (!employee.evaluator || (typeof employee.evaluator !== 'string' && !employee.evaluator._id)) {
          skippedCount++;
          skipped.push({
            employeeId: employee._id,
            reason: 'No evaluator assigned'
          });
          console.log('Skipping employee - no evaluator:', employee._id);
          continue;
        }

        // Check other eligibility criteria
        const isEligible = await isEmployeeEligible(employee, settings);
        if (!isEligible) {
          skippedCount++;
          skipped.push({
            employeeId: employee._id,
            reason: 'Not eligible for scheduling'
          });
          console.log('Skipping employee - not eligible:', employee._id);
          continue;
        }

        const lastEvalInfo = await getLastEvaluationDate(employee);
        console.log('Last evaluation info:', {
          employeeId: employee._id,
          lastEvalInfo
        });

        const priorityScore = await calculatePriorityScore(employee, lastEvalInfo);
        console.log('Priority score calculated:', {
          employeeId: employee._id,
          priorityScore
        });
        
        employeePriorities.push({
          employee,
          lastEvalInfo,
          priorityScore
        });
      } catch (error) {
        console.error('Error processing employee:', {
          employeeId: employee._id,
          error: error.message
        });
        errorCount++;
        errors.push({
          employeeId: employee._id,
          error: error.message
        });
      }
    }

    // Sort by priority score (highest first)
    employeePriorities.sort((a, b) => b.priorityScore - a.priorityScore);
    console.log('Sorted employee priorities:', employeePriorities.map(ep => ({
      employeeId: ep.employee._id,
      priorityScore: ep.priorityScore
    })));

    // Schedule evaluations for prioritized employees
    for (const { employee, lastEvalInfo } of employeePriorities) {
      try {
        const nextDate = await calculateNextEvaluationDate(employee, lastEvalInfo, settings);
        console.log('Calculated next evaluation date:', {
          employeeId: employee._id,
          nextDate
        });

        const validatedDate = validateEvaluationTiming(nextDate.date, lastEvalInfo, settings);
        console.log('Validated evaluation date:', {
          employeeId: employee._id,
          validatedDate
        });
        
        await createEvaluation({
          employee: employee._id,
          evaluator: employee.evaluator,
          scheduledDate: validatedDate,
          template: defaultTemplate._id,
          store: storeId,
          metadata: {
            schedulingType: 'auto',
            baseDate: nextDate.baseDate,
            baseDateSource: nextDate.baseDateSource
          }
        });

        successCount++;
        console.log('Successfully scheduled evaluation:', {
          employeeId: employee._id,
          scheduledDate: validatedDate
        });
      } catch (error) {
        console.error('Error scheduling evaluation:', {
          employeeId: employee._id,
          error: error.message
        });
        errorCount++;
        errors.push({
          employeeId: employee._id,
          error: error.message
        });
      }
    }

    // Log results
    const results = {
      total: employees.length,
      scheduled: successCount,
      skipped: skippedCount,
      errors: errorCount,
      skippedDetails: skipped,
      errorDetails: errors
    };
    console.log('Auto-scheduling completed:', results);

    return results;
  } catch (error) {
    console.error('Error in scheduleStoreEvaluations:', error);
    throw handleError(error, ErrorCategory.SCHEDULING, {
      storeId,
      function: 'scheduleStoreEvaluations'
    });
  }
};

/**
 * Schedule evaluations for all stores
 * This should be run daily via a cron job
 */
export const scheduleAllEvaluations = async () => {
  try {
    const stores = await withRetry(async () => {
      return await Settings.find({
        'evaluations.scheduling.autoSchedule': true
      }).distinct('store');
    });

    let totalSuccess = 0;
    let totalErrors = 0;
    const storeResults = [];

    for (const storeId of stores) {
      try {
        const result = await scheduleStoreEvaluations(storeId);
        totalSuccess += result.successCount;
        totalErrors += result.errorCount;
        storeResults.push({
          storeId,
          ...result
        });
      } catch (error) {
        totalErrors++;
        storeResults.push({
          storeId,
          error: error.message
        });
        handleError(error, ErrorCategory.SCHEDULING, {
          storeId,
          function: 'scheduleAllEvaluations'
        });
      }
    }

    // Log final summary
    if (totalErrors > 0) {
      handleError(
        new SchedulingError(`Completed with ${totalErrors} store errors`, { storeResults }),
        ErrorCategory.SCHEDULING,
        {
          totalStores: stores.length,
          totalSuccess,
          totalErrors,
          function: 'scheduleAllEvaluations'
        }
      );
    }

    return { totalSuccess, totalErrors, storeResults };
  } catch (error) {
    throw handleError(error, ErrorCategory.SCHEDULING, {
      function: 'scheduleAllEvaluations'
    });
  }
}; 