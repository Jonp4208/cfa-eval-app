const emailTemplates = {
  trainingAssigned: (employee, plan, startDate) => ({
    subject: 'New Training Plan Assigned',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E51636;">New Training Plan Assigned</h2>
        <p>Hello ${employee.name},</p>
        <p>You have been assigned a new training plan:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Plan:</strong> ${plan.name}</li>
            <li style="margin: 10px 0;"><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
            <li style="margin: 10px 0;"><strong>Duration:</strong> ${plan.modules.length} modules</li>
          </ul>
        </div>
        <p>Please log in to the training portal to begin your training:</p>
        <p>
          <a href="https://cfa-eval-app.vercel.app" 
             style="display: inline-block; background-color: #E51636; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
            Access Training Portal
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 12px;">https://cfa-eval-app.vercel.app</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p>Best regards,<br>Training Team</p>
      </div>
    `,
  }),

  moduleCompleted: (employee, module) => ({
    subject: 'Training Module Completed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E51636;">Training Module Completed</h2>
        <p>Hello ${employee.name},</p>
        <p>Congratulations on completing the following training module:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Module:</strong> ${module.name}</li>
            <li style="margin: 10px 0;"><strong>Plan:</strong> ${employee.trainingPlan.name}</li>
          </ul>
        </div>
        <p>Keep up the good work!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p>Best regards,<br>Training Team</p>
      </div>
    `,
  }),

  trainingCompleted: (employee, plan) => ({
    subject: 'Training Plan Completed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E51636;">Training Plan Completed</h2>
        <p>Hello ${employee.name},</p>
        <p>Congratulations on completing your training plan:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Plan:</strong> ${plan.name}</li>
          </ul>
        </div>
        <p>This is a significant achievement! Your dedication to learning and improvement is appreciated.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p>Best regards,<br>Training Team</p>
      </div>
    `,
  }),

  upcomingTraining: (employee, plan, daysUntilStart) => ({
    subject: 'Upcoming Training Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E51636;">Upcoming Training Reminder</h2>
        <p>Hello ${employee.name},</p>
        <p>This is a reminder about your upcoming training:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Plan:</strong> ${plan.name}</li>
            <li style="margin: 10px 0;"><strong>Starts In:</strong> ${daysUntilStart} days</li>
            <li style="margin: 10px 0;"><strong>Start Date:</strong> ${new Date(plan.startDate).toLocaleDateString()}</li>
          </ul>
        </div>
        <p>Please ensure you are prepared to begin your training on the specified start date.</p>
        <p>You can access the training portal here:</p>
        <p>
          <a href="https://cfa-eval-app.vercel.app" 
             style="display: inline-block; background-color: #E51636; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
            Access Training Portal
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p>Best regards,<br>Training Team</p>
      </div>
    `,
  }),

  progressUpdate: (manager, updates) => ({
    subject: 'Training Progress Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E51636;">Training Progress Update</h2>
        <p>Hello ${manager.name},</p>
        <p>Here's a summary of recent training progress:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <ul style="list-style: none; padding: 0;">
            ${updates.map(update => `
              <li style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 3px;">
                <strong>${update.employee.name}:</strong>
                ${update.type === 'module' 
                  ? `Completed module "${update.module.name}"`
                  : `Completed training plan "${update.plan.name}"`}
              </li>
            `).join('')}
          </ul>
        </div>
        <p>
          <a href="https://cfa-eval-app.vercel.app" 
             style="display: inline-block; background-color: #E51636; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
            View Detailed Progress
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p>Best regards,<br>Training Team</p>
      </div>
    `,
  }),
};

export default emailTemplates; 