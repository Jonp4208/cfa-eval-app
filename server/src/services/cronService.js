import cron from 'node-cron';
import { scheduleAllEvaluations } from './evaluationScheduler.js';
import { Evaluation, Notification } from '../models/index.js';
import { sendEmailWithRetry } from '../utils/email.js';

const sendReminderEmail = async (evaluation, daysUntilDue) => {
  try {
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
  } catch (error) {
    console.error('Failed to send reminder email:', error);
  }
};

export const initCronJobs = () => {
  // Run evaluation scheduling at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running automatic evaluation scheduling...');
    try {
      await scheduleAllEvaluations();
      console.log('Automatic evaluation scheduling completed');
    } catch (error) {
      console.error('Error in evaluation scheduling cron job:', error);
    }
  });

  // Run reminders every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('Running evaluation reminders check...');
    try {
      const upcomingEvaluations = await Evaluation.find({
        status: { $ne: 'completed' },
        scheduledDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      }).populate('employee evaluator');

      for (const evaluation of upcomingEvaluations) {
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
        const existingNotification = await Notification.findOne({
          user: evaluation.employee._id,
          relatedId: evaluation._id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingNotification) {
          // Create notification
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

          // Send email for high priority reminders
          if (priority === 'high' || priority === 'urgent') {
            await sendReminderEmail(evaluation, daysUntilDue);
          }
        }
      }
      console.log('Evaluation reminders check completed');
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  });

  console.log('Cron jobs initialized');
}; 