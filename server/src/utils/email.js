import nodemailer from 'nodemailer';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  };

  console.log('Creating email transporter with config:', {
    ...config,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass ? '****' : undefined
    }
  });

  return nodemailer.createTransport(config);
};

export const verifyEmailConfig = async () => {
  try {
    console.log('Starting email configuration verification...');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Missing required email configuration environment variables');
    }
    
    console.log('Email configuration variables:', {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '****' : undefined
    });
    
    console.log('Creating test transporter...');
    const transporter = createTransporter();
    
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration error:', {
      error: error,
      message: error.message,
      code: error.code,
      response: error.response
    });
    return false;
  }
};

export const sendEmailWithRetry = async ({ to, subject, html }, retries = 0) => {
  try {
    console.log(`Attempting to send email (attempt ${retries + 1}/${MAX_RETRIES})...`);
    
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    console.log('Mail options:', {
      from: process.env.EMAIL_USER,
      to,
      subject
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error(`Email sending failed (attempt ${retries + 1}/${MAX_RETRIES}):`, {
      error: error,
      message: error.message,
      code: error.code,
      response: error.response
    });
    
    if (retries < MAX_RETRIES - 1) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return sendEmailWithRetry({ to, subject, html }, retries + 1);
    }
    
    throw new Error(`Failed to send email after ${MAX_RETRIES} attempts: ${error.message}`);
  }
};

// Backward compatibility wrapper
export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log('Preparing to send email:', {
      to,
      subject,
      from: process.env.EMAIL_USER
    });

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: result.messageId,
      response: result.response
    });
    return result;
  } catch (error) {
    console.error('Failed to send email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
}; 