import cron from 'node-cron';
import { scheduleAllEvaluations } from './evaluationScheduler.js';
import { Evaluation, Notification, User } from '../models/index.js';
import { sendEmailWithRetry } from '../utils/email.js';
import { handleError, withRetry, ErrorCategory } from '../utils/errorHandler.js';

const sendReminderEmail = async (evaluation, daysUntilDue) => {
  try {
    await withRetry(async () => {
      await sendEmailWithRetry({
        to: evaluation.employee.email,
        subject: `Evaluation Due in ${daysUntilDue} Days`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #E4002B;">Evaluation Reminder</h1>
            <p>Hello ${evaluation.employee.name},</p>
            <p>This is a reminder that your evaluation is due in ${daysUntilDue} days.</p>
            <p><strong>Due Date:</strong> ${new Date(evaluation.scheduledDate).toLocaleDateString()}</p>
            <p><strong>Evaluator:</strong> ${evaluation.evaluator.name}</p>
            <p>Please log in to the Growth Hub platform to complete your evaluation.</p>
            <p>Best regards,<br>Growth Hub Team</p>
          </div>
        `
      });
    });
  } catch (error) {
    handleError(error, ErrorCategory.SYSTEM, {
      evaluationId: evaluation._id,
      employeeId: evaluation.employee._id,
      function: 'sendReminderEmail'
    });
  }
};

const notifyAdminsOfFailure = async (error, context) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    
    // Create notifications for each admin
    const notifications = admins.map(admin => ({
      user: admin._id,
      store: admin.store,
      type: 'system_error',
      priority: 'urgent',
      title: 'Scheduling System Error',
      message: `Error in evaluation scheduling: ${error.message}`,
      metadata: context
    }));

    await Notification.insertMany(notifications);

    // Send emails to admins
    for (const admin of admins) {
      await withRetry(async () => {
        await sendEmailWithRetry({
          to: admin.email,
          subject: 'Evaluation Scheduling System Error',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #E4002B;">System Error Alert</h1>
              <p>An error occurred in the evaluation scheduling system:</p>
              <p><strong>Error:</strong> ${error.message}</p>
              <p><strong>Context:</strong></p>
              <pre>${JSON.stringify(context, null, 2)}</pre>
              <p>Please check the admin dashboard for more details.</p>
            </div>
          `
        });
      });
    }
  } catch (emailError) {
    handleError(emailError, ErrorCategory.SYSTEM, {
      originalError: error.message,
      function: 'notifyAdminsOfFailure'
    });
  }
};

// Schedule evaluations based on user preferences
const scheduleUserEvaluations = async () => {
  try {
    console.log('Running user-based evaluation scheduling...');
    
    // Get all users with auto-scheduling enabled
    const users = await User.find({
      'schedulingPreferences.autoSchedule': true,
      evaluator: { $exists: true }
    }).populate('evaluator');

    console.log(`Found ${users.length} users with auto-scheduling enabled`);
    
    const results = {
      scheduled: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    for (const user of users) {
      try {
        const today = new Date();
        const nextEvalDate = user.schedulingPreferences.nextEvaluationDate;
        
        // Skip if next evaluation date is not yet due
        if (!nextEvalDate || nextEvalDate > today) {
          results.skipped++;
          continue;
        }

        // Create new evaluation
        const evaluation = new Evaluation({
          employee: user._id,
          evaluator: user.evaluator._id,
          scheduledDate: nextEvalDate,
          status: 'pending_self_evaluation',
          store: user.store
        });

        await evaluation.save();
        
        // Update next evaluation date
        const newNextDate = new Date(today);
        newNextDate.setDate(today.getDate() + user.schedulingPreferences.frequency);
        
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'schedulingPreferences.nextEvaluationDate': newNextDate,
            'schedulingPreferences.lastCalculatedAt': today
          }
        });

        results.scheduled++;
        results.details.push({
          userId: user._id,
          name: user.name,
          status: 'scheduled',
          nextDate: newNextDate
        });

      } catch (error) {
        console.error(`Error scheduling evaluation for user ${user._id}:`, error);
        results.errors++;
        results.details.push({
          userId: user._id,
          name: user.name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('User-based scheduling complete:', results);
    return results;
  } catch (error) {
    console.error('Error in scheduleUserEvaluations:', error);
    throw error;
  }
};

export const initCronJobs = () => {
  // Run evaluation scheduling at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running automatic evaluation scheduling...');
    try {
      const result = await scheduleAllEvaluations();
      console.log('Automatic evaluation scheduling completed', result);

      // If there were errors, notify admins
      if (result.totalErrors > 0) {
        await notifyAdminsOfFailure(
          new Error(`Scheduling completed with ${result.totalErrors} errors`),
          {
            totalStores: result.storeResults.length,
            totalSuccess: result.totalSuccess,
            totalErrors: result.totalErrors,
            failedStores: result.storeResults.filter(r => r.error)
          }
        );
      }
    } catch (error) {
      console.error('Error in evaluation scheduling cron job:', error);
      await notifyAdminsOfFailure(error, {
        cronJob: 'scheduleAllEvaluations',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Run reminders every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('Running evaluation reminders check...');
    try {
      const upcomingEvaluations = await withRetry(async () => {
        return await Evaluation.find({
          status: { $ne: 'completed' },
          scheduledDate: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        }).populate('employee evaluator');
      });

      for (const evaluation of upcomingEvaluations) {
        try {
          const daysUntilDue = Math.ceil(
            (new Date(evaluation.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24)
          );

          // Determine notification priority based on days until due
          let priority = 'low';
          if (daysUntilDue <= 1) {
            priority = 'urgent';
          } else if (daysUntilDue <= 3) {
            priority = 'high';
          } else if (daysUntilDue <= 5) {
            priority = 'medium';
          }

          // Check if we already sent a notification today
          const existingNotification = await withRetry(async () => {
            return await Notification.findOne({
              user: evaluation.employee._id,
              relatedId: evaluation._id,
              createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });
          });

          if (!existingNotification) {
            // Create notification
            await withRetry(async () => {
              await Notification.create({
                user: evaluation.employee._id,
                store: evaluation.store,
                type: 'reminder',
                priority,
                title: 'Evaluation Due Soon',
                message: `Your evaluation is due in ${daysUntilDue} days`,
                relatedId: evaluation._id,
                relatedModel: 'Evaluation'
              });
            });

            // Send email for high priority reminders
            if (priority === 'high' || priority === 'urgent') {
              await sendReminderEmail(evaluation, daysUntilDue);
            }
          }
        } catch (error) {
          handleError(error, ErrorCategory.SYSTEM, {
            evaluationId: evaluation._id,
            function: 'reminderCronJob'
          });
        }
      }
      console.log('Evaluation reminders check completed');
    } catch (error) {
      console.error('Error in reminder cron job:', error);
      await notifyAdminsOfFailure(error, {
        cronJob: 'evaluationReminders',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Run user-based evaluation scheduling daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await scheduleUserEvaluations();
    } catch (error) {
      console.error('Error running user-based evaluation scheduling:', error);
    }
  });

  console.log('Cron jobs initialized');
}; 