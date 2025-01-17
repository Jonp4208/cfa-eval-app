import cron from 'node-cron';
import { scheduleAllEvaluations } from './evaluationScheduler.js';

// Run at 12:00 AM every day
export const initCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running automatic evaluation scheduling...');
    try {
      await scheduleAllEvaluations();
      console.log('Automatic evaluation scheduling completed');
    } catch (error) {
      console.error('Error in evaluation scheduling cron job:', error);
    }
  });
}; 