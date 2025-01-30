const nodemailer = require('nodemailer');
const config = require('../config');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

// Email templates
const emailTemplates = {
  trainingAssigned: (employee, plan, startDate) => ({
    subject: 'New Training Plan Assigned',
    html: `
      <h2>New Training Plan Assigned</h2>
      <p>Hello ${employee.name},</p>
      <p>You have been assigned a new training plan:</p>
      <ul>
        <li><strong>Plan:</strong> ${plan.name}</li>
        <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
        <li><strong>Duration:</strong> ${plan.modules.reduce((acc, m) => acc + (m.estimatedDuration || 0), 0)} days</li>
      </ul>
      <p>Please review your training schedule and begin your training on the specified start date.</p>
      <p>You can track your progress through the training portal.</p>
      <p>Best regards,<br>Training Team</p>
    `,
  }),

  moduleCompleted: (employee, module) => ({
    subject: 'Training Module Completed',
    html: `
      <h2>Training Module Completed</h2>
      <p>Hello ${employee.name},</p>
      <p>Congratulations on completing the following training module:</p>
      <ul>
        <li><strong>Module:</strong> ${module.name}</li>
        <li><strong>Plan:</strong> ${employee.trainingPlan.name}</li>
      </ul>
      <p>Keep up the good work!</p>
      <p>Best regards,<br>Training Team</p>
    `,
  }),

  trainingCompleted: (employee, plan) => ({
    subject: 'Training Plan Completed',
    html: `
      <h2>Training Plan Completed</h2>
      <p>Hello ${employee.name},</p>
      <p>Congratulations on completing your training plan:</p>
      <ul>
        <li><strong>Plan:</strong> ${plan.name}</li>
      </ul>
      <p>This is a significant achievement! Your dedication to learning and improvement is appreciated.</p>
      <p>Best regards,<br>Training Team</p>
    `,
  }),

  upcomingTraining: (employee, plan, daysUntilStart) => ({
    subject: 'Upcoming Training Reminder',
    html: `
      <h2>Upcoming Training Reminder</h2>
      <p>Hello ${employee.name},</p>
      <p>This is a reminder about your upcoming training:</p>
      <ul>
        <li><strong>Plan:</strong> ${plan.name}</li>
        <li><strong>Starts In:</strong> ${daysUntilStart} days</li>
        <li><strong>Start Date:</strong> ${new Date(plan.startDate).toLocaleDateString()}</li>
      </ul>
      <p>Please ensure you are prepared to begin your training on the specified start date.</p>
      <p>Best regards,<br>Training Team</p>
    `,
  }),

  progressUpdate: (manager, updates) => ({
    subject: 'Training Progress Update',
    html: `
      <h2>Training Progress Update</h2>
      <p>Hello ${manager.name},</p>
      <p>Here's a summary of recent training progress:</p>
      <ul>
        ${updates.map(update => `
          <li>
            <strong>${update.employee.name}:</strong>
            ${update.type === 'module' 
              ? `Completed module "${update.module.name}"`
              : `Completed training plan "${update.plan.name}"`}
          </li>
        `).join('')}
      </ul>
      <p>View detailed progress in the training portal.</p>
      <p>Best regards,<br>Training Team</p>
    `,
  }),
};

class NotificationService {
  static async sendEmail(to, template) {
    try {
      await transporter.sendMail({
        from: config.email.from,
        to,
        subject: template.subject,
        html: template.html,
      });
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  static async notifyTrainingAssigned(employee, plan, startDate) {
    const template = emailTemplates.trainingAssigned(employee, plan, startDate);
    await this.sendEmail(employee.email, template);
  }

  static async notifyModuleCompleted(employee, module) {
    const template = emailTemplates.moduleCompleted(employee, module);
    await this.sendEmail(employee.email, template);

    // Also notify manager if module completion rate reaches certain thresholds
    const completedModules = employee.moduleProgress.filter(m => m.completed).length;
    const totalModules = employee.moduleProgress.length;
    const completionRate = (completedModules / totalModules) * 100;

    if (completionRate === 50 || completionRate === 75 || completionRate === 100) {
      const managerTemplate = emailTemplates.progressUpdate(
        { name: 'Manager' },
        [{
          employee,
          type: 'module',
          module,
        }]
      );
      await this.sendEmail(config.email.managerEmail, managerTemplate);
    }
  }

  static async notifyTrainingCompleted(employee, plan) {
    const template = emailTemplates.trainingCompleted(employee, plan);
    await this.sendEmail(employee.email, template);

    // Notify manager
    const managerTemplate = emailTemplates.progressUpdate(
      { name: 'Manager' },
      [{
        employee,
        type: 'plan',
        plan,
      }]
    );
    await this.sendEmail(config.email.managerEmail, managerTemplate);
  }

  static async sendUpcomingTrainingReminders() {
    try {
      // Get all employees with upcoming training (within next 7 days)
      const employees = await Employee.find({
        'trainingPlan.startDate': {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }).populate('trainingPlan');

      for (const employee of employees) {
        const daysUntilStart = Math.ceil(
          (new Date(employee.trainingPlan.startDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        const template = emailTemplates.upcomingTraining(
          employee,
          employee.trainingPlan,
          daysUntilStart
        );
        await this.sendEmail(employee.email, template);
      }
    } catch (error) {
      console.error('Error sending upcoming training reminders:', error);
      throw error;
    }
  }

  static async sendWeeklyProgressReport(managerId) {
    try {
      // Get all updates from the past week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const updates = await TrainingProgress.find({
        updatedAt: { $gte: oneWeekAgo },
      })
        .populate('employee')
        .populate('module')
        .populate('plan');

      if (updates.length > 0) {
        const manager = await Employee.findById(managerId);
        const template = emailTemplates.progressUpdate(manager, updates);
        await this.sendEmail(manager.email, template);
      }
    } catch (error) {
      console.error('Error sending weekly progress report:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 