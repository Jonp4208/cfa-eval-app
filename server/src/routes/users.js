import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { updateUserMetrics, updateUser } from '../controllers/users.js';
import Evaluation from '../models/Evaluation.js';
import GradingScale from '../models/GradingScale.js';
import { sendEmail } from '../utils/email.js';

dotenv.config();

const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Configure multer for file upload
const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB limit
  }
});

// Helper function to normalize user data
const normalizeUserData = (data) => {
  console.log('Normalizing user data:', data);

  // Normalize departments - ensure proper case
  if (data.departments) {
    data.departments = data.departments.map(dept => {
      switch(dept.toLowerCase()) {
        case 'front counter': return 'Front Counter';
        case 'drive thru': return 'Drive Thru';
        case 'kitchen': return 'Kitchen';
        case 'everything': return 'Everything';
        default: return dept;
      }
    });
    console.log('Normalized departments:', data.departments);
  }

  // Normalize position - ensure exact match with enum
  if (data.position) {
    const positionMap = {
      'director': 'Director',
      'team member': 'Team Member',
      'trainer': 'Trainer',
      'leader': 'Leader'
    };
    data.position = positionMap[data.position.toLowerCase()] || data.position;
    console.log('Normalized position:', data.position);

    // Set role based on position - ensure this runs after position is normalized
    data.role = data.position === 'Director' ? 'admin' : 'user';
    data.isAdmin = data.position === 'Director'; // Keep isAdmin for backward compatibility
  }

  // Normalize shift
  if (data.shift) {
    data.shift = data.shift.toLowerCase() === 'night' ? 'night' : 'day';
    console.log('Normalized shift:', data.shift);
  }

  return data;
};

// Helper function to check if user can manage users
const canManageUsers = (user) => {
  return user.role === 'admin' || user.position === 'Director' || user.position === 'Leader';
};

// Get current user - MUST be before parameterized routes
router.get('/current', auth, async (req, res) => {
  try {
    console.log('Fetching current user with ID:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .populate('store', '_id storeNumber name location')
      .populate('manager', 'name _id')
      .populate({
        path: 'trainingProgress',
        populate: {
          path: 'trainingPlan',
          select: 'name modules'
        }
      })
      .lean();

    if (!user) {
      console.error('User not found in /current endpoint:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure required fields exist
    user.departments = user.departments || [];
    user.position = user.position || 'Team Member';
    user.role = user.role || 'user';
    user.status = user.status || 'active';
    user.trainingProgress = user.trainingProgress || [];

    // Log successful fetch
    console.log('Successfully fetched user:', {
      id: user._id,
      name: user.name,
      position: user.position,
      store: user.store?._id
    });

    res.json(user);
  } catch (error) {
    console.error('Error in /current endpoint:', error);
    res.status(500).json({ 
      message: 'Error fetching user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const { managerId } = req.query;
    let query = { store: req.user.store._id };

    // If user is a team member, they can only see their own data
    if (req.user.position === 'Team Member') {
      query._id = req.user._id;
    }
    // If user is not a team member, check if they can manage users
    else if (!canManageUsers(req.user)) {
      return res.status(403).json({ message: 'Not authorized to view users' });
    }

    // If a specific manager's team is requested (only for users who can manage)
    if (managerId && canManageUsers(req.user)) {
      query.manager = managerId;
    }
    
    const users = await User.find(query)
      .populate('manager', 'name _id')  // Populate manager field with name and _id
      .populate('store', 'name storeNumber')
      .populate({
        path: 'trainingProgress',
        populate: {
          path: 'trainingPlan',
          select: 'name modules'
        }
      })
      .sort({ name: 1 });  // Sort by name ascending

    res.json({ users });
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single user
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('store', '_id storeNumber name location')
      .populate('manager', 'name _id');

    // Users can only access their own data unless they are a leader/director
    if (user._id.toString() !== req.user._id.toString() && 
        !['director', 'leader'].some(pos => req.user.position?.toLowerCase().includes(pos))) {
      return res.status(403).json({ message: 'Not authorized to view this user' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Create a new user
router.post('/', auth, async (req, res) => {
  try {
    console.log('\n=== POST /users Request ===');
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', {
      _id: req.user._id,
      name: req.user.name,
      position: req.user.position,
      role: req.user.role
    });

    // Check if user has permission to create users
    if (!canManageUsers(req.user)) {
      console.log('Unauthorized attempt to create user by:', {
        role: req.user.role,
        position: req.user.position
      });
      return res.status(403).json({ message: 'Not authorized to create users' });
    }

    const userData = normalizeUserData({
      ...req.body,
      store: req.user.store._id, // Assign user to same store as creator
      password: Math.random().toString(36).slice(-8) // Set temporary password before creation
    });

    const user = new User(userData);
    await user.save();

    // Send welcome email with the temporary password DO NOT CHANGE THIS
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to CFA Evaluation App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #E4002B; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0;">Welcome to LD Growth!</h1>
            </div>
            
            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <p>Hello ${user.name},</p>
              
              <p>Welcome to LD-Growth. Your new home for Chick-fil-A ${req.user.store.name} development training and tasks. This is a beta web app created by Jonathon. If you have any issues or questions please reach out to me.</p>
              
              <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Access the site here:</strong> <a href="https://www.ld-growth.com" style="color: #E4002B;">www.ld-growth.com</a></p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${userData.password}</p>
              </div>
              
              <p>You will get your first evaluation soon.</p>
              
              <p style="color: #E4002B; font-weight: bold;">Important Security Notice:</p>
              <p>For your security, please change your password immediately upon first login.</p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #666;">
              <p>Thank you and enjoy!<br>LD Growth Team</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with user creation even if email fails
    }

    res.status(201).json({ user });
  } catch (error) {
    console.error('Error in POST /users:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure user belongs to the same store
    if (user.store.toString() !== req.user.store._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Check if user has permission to update
    const isLeadership = ['Director', 'Leader'].some(keyword => req.user.position?.includes(keyword));
    const isUpdatingSelf = req.user._id.toString() === id;

    if (!isLeadership && !isUpdatingSelf) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Forward to controller for processing
    await updateUser(req, res);
  } catch (error) {
    console.error('Error in user update route:', error);
    res.status(500).json({ 
      message: 'Failed to update user', 
      error: error.message 
    });
  }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure user belongs to the same store
    if (user.store.toString() !== req.user.store._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Bulk import users from CSV
router.post('/bulk-import', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const results = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true
    });

    // Create a readable stream from the buffer
    const stream = Readable.from(req.file.buffer.toString());

    // Process the CSV data
    stream.pipe(parser)
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let imported = 0;
        const errors = [];

        for (const row of results) {
          try {
            // Check if user already exists
            const existingUser = await User.findOne({ email: row.email });
            if (existingUser) {
              errors.push(`User with email ${row.email} already exists`);
              continue;
            }

            // Generate a random password
            const password = User.generateRandomPassword();

            // Create new user
            const user = new User({
              name: row.name,
              email: row.email,
              department: row.department,
              position: row.position,
              role: row.role || 'team-member',
              status: row.status || 'active',
              password,
              store: req.user.store._id // Associate with current user's store
            });

            await user.save();

            // Send welcome email
            try {
              await sendEmail({
                to: row.email,
                subject: 'Welcome to LD Growth',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #E4002B; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                      <h1 style="color: white; margin: 0;">Welcome to LD Growth!</h1>
                    </div>
                    
                    <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                      <p>Hello ${row.name},</p>
                      
                      <p>Welcome to LD-Growth. Your new home for Chick-fil-A ${req.user.store.name} development training and tasks. This is a beta web app created by Jonathon. If you have any issues or questions please reach out to me.</p>
                      
                      <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Access the site here:</strong> <a href="https://www.ld-growth.com" style="color: #E4002B;">www.ld-growth.com</a></p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${row.email}</p>
                        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
                      </div>
                      
                      <p>You will get your first evaluation soon.</p>
                      
                      <p style="color: #E4002B; font-weight: bold;">Important Security Notice:</p>
                      <p>For your security, please change your password immediately upon first login.</p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #666;">
                      <p>Thank you and enjoy!<br>LD Growth Team</p>
                    </div>
                  </div>
                `
              });
            } catch (emailError) {
              console.error('Failed to send welcome email:', emailError);
              errors.push(`User ${row.email} created but failed to send welcome email`);
            }

            imported++;
          } catch (error) {
            console.error('Error importing user:', error);
            errors.push(`Failed to import user ${row.email}: ${error.message}`);
          }
        }

        res.json({
          imported,
          errors: errors.length > 0 ? errors : undefined,
          message: `Successfully imported ${imported} users${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
        });
      });
  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Send password reset email
router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure user belongs to the same store
    if (user.store.toString() !== req.user.store._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reset password for this user' });
    }

    // Generate a new password
    const newPassword = User.generateRandomPassword();
    
    // Update password and use pre-save middleware for hashing
    user.password = newPassword;
    await user.save({ validateModifiedOnly: true }); // Only validate the modified field (password)

    // Send email with new password using the centralized email utility
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - CFA Evaluation App',
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${user.name},</p>
        <p>Your password has been reset. Here are your new login credentials:</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>New Password:</strong> ${newPassword}</p>
        <p>Please login and change your password as soon as possible.</p>
        <p>Best regards,<br>CFA Evaluation Team</p>
      `
    });

    res.json({ message: 'Password reset instructions sent successfully' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Failed to send password reset instructions' });
  }
});

// Update manager
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    console.log('Updating manager for user:', id, 'New manager:', managerId);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure user belongs to the same store
    if (user.store.toString() !== req.user.store._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // If managerId is provided, verify the manager exists and belongs to the same store
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({ message: 'Manager not found' });
      }
      if (manager.store.toString() !== req.user.store._id.toString()) {
        return res.status(403).json({ message: 'Manager must belong to the same store' });
      }
    }

    // Update manager
    user.manager = managerId || null;
    await user.save();

    // Return updated user with populated manager
    const updatedUser = await User.findById(id)
      .select('-password')
      .populate({
        path: 'store',
        select: 'name storeNumber'
      })
      .populate({
        path: 'manager',
        select: 'name _id'
      });

    res.json({ 
      message: 'Manager updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating manager:', error);
    res.status(500).json({ message: 'Failed to update manager' });
  }
});

// Update user metrics
router.patch('/:id/metrics', auth, updateUserMetrics);

// Get user's evaluation scores
router.get('/:userId/evaluation-scores', auth, async (req, res) => {
  try {
    const evaluations = await Evaluation.find({
      employee: req.params.userId,
      store: req.user.store._id,
      status: 'completed'
    })
    .populate({
      path: 'template',
      populate: {
        path: 'sections.criteria.gradingScale',
        model: 'GradingScale'
      }
    })
    .sort('completedDate');

    console.log('Found evaluations:', evaluations.map(e => ({
      id: e._id,
      date: e.completedDate,
      managerEvaluation: Object.fromEntries(e.managerEvaluation)
    })));

    // Helper function to convert string ratings to numeric values
    const getRatingValue = (rating) => {
      // Handle numeric ratings
      if (!isNaN(rating)) {
        const numericValue = parseInt(rating);
        return numericValue >= 1 && numericValue <= 4 ? numericValue : 0;
      }
      
      // Handle text ratings
      const normalizedRating = rating.trim().toLowerCase();
      
      const ratingMap = {
        '- star': 4,
        '- valued': 3,
        '- performer': 2,
        '- improvement needed': 1,
        '- improvment needed': 1,
        '- excellent': 4,
        'star': 4,
        'valued': 3,
        'performer': 2,
        'improvement needed': 1,
        'excellent': 4,
        '- very good': 4,
        'very good': 4
      };

      return ratingMap[normalizedRating] || 0;
    };

    // Calculate scores for each evaluation
    const evaluationScores = evaluations.map(evaluation => {
      console.log('Processing evaluation:', {
        id: evaluation._id,
        date: evaluation.completedDate,
        ratings: Object.fromEntries(evaluation.managerEvaluation)
      });

      let totalScore = 0;
      let totalPossible = 0;

      // Calculate total score from manager evaluation
      evaluation.template.sections.forEach((section, sectionIndex) => {
        section.criteria.forEach((criterion, criterionIndex) => {
          const key = `${sectionIndex}-${criterionIndex}`;
          const score = evaluation.managerEvaluation.get(key);
          
          if (score !== undefined) {
            const numericScore = getRatingValue(score);
            totalScore += numericScore;
            totalPossible += 4; // Since we're using a 1-4 scale
            console.log('Processed score:', { 
              key, 
              originalScore: score,
              numericScore, 
              runningTotal: totalScore, 
              possibleSoFar: totalPossible 
            });
          }
        });
      });

      // Calculate percentage score (avoid division by zero)
      const percentageScore = totalPossible > 0 
        ? Math.round((totalScore / totalPossible) * 100)
        : 0;

      console.log('Final score:', {
        id: evaluation._id,
        date: evaluation.completedDate,
        totalScore,
        totalPossible,
        percentageScore
      });

      return {
        date: evaluation.completedDate,
        score: percentageScore
      };
    });

    console.log('Final evaluation scores:', evaluationScores);
    res.json({ evaluationScores });
  } catch (error) {
    console.error('Error getting evaluation scores:', error);
    res.status(500).json({ message: 'Error getting evaluation scores' });
  }
});

export default router; 