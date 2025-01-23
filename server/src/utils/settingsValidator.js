import { Settings, Template, User } from '../models/index.js';
import { handleError, ErrorCategory } from './errorHandler.js';

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

/**
 * Validate and repair store settings
 */
export const validateAndRepairSettings = async (storeId) => {
  try {
    let settings = await Settings.findOne({ store: storeId });
    let wasRepaired = false;
    const repairs = [];

    // Create settings if they don't exist
    if (!settings) {
      settings = await Settings.create({
        store: storeId,
        ...DEFAULT_SETTINGS
      });
      wasRepaired = true;
      repairs.push('Created missing settings document');
    }

    // Ensure evaluations object exists
    if (!settings.evaluations) {
      settings.evaluations = DEFAULT_SETTINGS.evaluations;
      wasRepaired = true;
      repairs.push('Repaired missing evaluations object');
    }

    // Ensure scheduling object exists
    if (!settings.evaluations.scheduling) {
      settings.evaluations.scheduling = DEFAULT_SETTINGS.evaluations.scheduling;
      wasRepaired = true;
      repairs.push('Repaired missing scheduling object');
    }

    // Validate scheduling fields
    const scheduling = settings.evaluations.scheduling;
    if (typeof scheduling.autoSchedule !== 'boolean') {
      scheduling.autoSchedule = DEFAULT_SETTINGS.evaluations.scheduling.autoSchedule;
      wasRepaired = true;
      repairs.push('Repaired invalid autoSchedule value');
    }

    if (typeof scheduling.frequency !== 'number' || scheduling.frequency < 1) {
      scheduling.frequency = DEFAULT_SETTINGS.evaluations.scheduling.frequency;
      wasRepaired = true;
      repairs.push('Repaired invalid frequency value');
    }

    if (!['hire_date', 'calendar_year', 'fiscal_year', 'custom'].includes(scheduling.cycleStart)) {
      scheduling.cycleStart = DEFAULT_SETTINGS.evaluations.scheduling.cycleStart;
      wasRepaired = true;
      repairs.push('Repaired invalid cycleStart value');
    }

    if (!['immediate', 'complete_cycle', 'align_next'].includes(scheduling.transitionMode)) {
      scheduling.transitionMode = DEFAULT_SETTINGS.evaluations.scheduling.transitionMode;
      wasRepaired = true;
      repairs.push('Repaired invalid transitionMode value');
    }

    // Save repairs if needed
    if (wasRepaired) {
      await settings.save();
    }

    // Validate template
    const template = await Template.findOne({
      store: storeId,
      isActive: true
    }).sort({ createdAt: -1 });

    if (!template) {
      throw new Error('No active template found for store');
    }

    // Validate director access
    const director = await User.findOne({
      store: storeId,
      position: 'Director'
    });

    if (!director) {
      throw new Error('No director found for store');
    }

    return {
      isValid: true,
      wasRepaired,
      repairs,
      settings,
      template,
      director
    };
  } catch (error) {
    throw handleError(error, ErrorCategory.SETTINGS, {
      storeId,
      function: 'validateAndRepairSettings'
    });
  }
};

/**
 * Check if auto-scheduling is properly configured
 */
export const validateAutoScheduling = async (storeId) => {
  try {
    const issues = [];
    const configurationIssues = {
      unassignedEvaluators: 0,
      totalEmployees: 0,
      details: {
        template: null,
        employeesWithoutEvaluators: [],
        schedulingSettings: null
      }
    };

    // Check for active template - this is a critical requirement
    const template = await Template.findOne({
      store: storeId,
      isActive: true
    });

    if (!template) {
      issues.push('No active evaluation template found');
    }
    configurationIssues.details.template = template ? 'Found' : 'Missing';

    // Get all active employees
    const employees = await User.find({
      store: storeId,
      status: 'active'
    }).select('_id firstName lastName evaluator');

    // Set total employees count
    configurationIssues.totalEmployees = employees.length;

    // Check evaluator assignments - this is not a critical issue
    const employeesWithoutEvaluators = employees.filter(emp => {
      const hasNoEvaluator = !emp.evaluator || 
        (typeof emp.evaluator === 'string' && !emp.evaluator) || 
        (typeof emp.evaluator === 'object' && !emp.evaluator._id);
      
      if (hasNoEvaluator) {
        configurationIssues.details.employeesWithoutEvaluators.push({
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`
        });
      }
      return hasNoEvaluator;
    });

    const withoutEvaluator = employeesWithoutEvaluators.length;
    if (withoutEvaluator > 0) {
      configurationIssues.unassignedEvaluators = withoutEvaluator;
      console.log(`Note: ${withoutEvaluator} out of ${employees.length} employees do not have evaluators assigned and will be skipped in auto-scheduling`);
    }

    // Check if there's at least one employee with an evaluator
    const withEvaluator = employees.length - withoutEvaluator;
    if (withEvaluator === 0 && employees.length > 0) {
      issues.push('No employees have evaluators assigned');
    }

    // Get current settings
    const settings = await Settings.findOne({ store: storeId });
    if (!settings?.evaluations?.scheduling) {
      configurationIssues.details.schedulingSettings = 'Missing';
    } else {
      configurationIssues.details.schedulingSettings = 'Configured';
    }

    // Only block enabling if there's no template
    const isValid = template !== null;

    return {
      isValid,
      issues,
      configurationIssues,
      settings
    };
  } catch (error) {
    throw handleError(error, ErrorCategory.SETTINGS, {
      storeId,
      function: 'validateAutoScheduling'
    });
  }
}; 