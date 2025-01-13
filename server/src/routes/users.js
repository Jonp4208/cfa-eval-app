import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { updateUserMetrics } from '../controllers/users.js';

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

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    console.log('\n=== GET /users Request ===');
    console.log('Headers:', req.headers);
    console.log('Query params:', req.query);
    console.log('User from auth middleware:', {
      _id: req.user._id,
      name: req.user.name,
      role: req.user.role,
      store: req.user.store
    });
    
    const { managerId } = req.query;
    let query = { store: req.user.store._id };

    console.log('Initial query filter:', JSON.stringify(query, null, 2));

    // For admin users, only filter by store
    if (req.user.role === 'admin') {
      console.log('Admin user - fetching all users in store');
    }
    // For managers, filter by manager ID
    else if (req.user.role === 'manager') {
      if (managerId) {
        query.manager = managerId;
      } else {
        query.manager = req.user._id;  // By default, fetch their team
      }
      console.log('Manager user - query updated:', JSON.stringify(query, null, 2));
    }
    // For other roles, they shouldn't access this endpoint
    else {
      console.log('Unauthorized role attempted to fetch users:', req.user.role);
      return res.status(403).json({ message: 'Not authorized to view users' });
    }

    console.log('Final query:', JSON.stringify(query, null, 2));
    
    const users = await User.find(query)
      .populate('manager', 'name _id')  // Populate manager field with name and _id
      .populate('store', 'name storeNumber')
      .sort({ name: 1 });  // Sort by name ascending

    console.log(`Found ${users.length} users with query:`, JSON.stringify(query, null, 2));
    console.log('Users:', JSON.stringify(users.map(u => ({ 
      _id: u._id, 
      name: u.name, 
      email: u.email,
      store: u.store?._id,
      role: u.role,
      manager: u.manager?._id
    })), null, 2));

    console.log('=== Sending Response ===\n');
    res.json({ users });
  } catch (error) {
    console.error('Error in GET /users:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch users', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching user with ID:', id);
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid user ID format:', id);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(id)
      .select('-password') // Exclude password
      .populate({
        path: 'store',
        select: 'name storeNumber'
      })
      .populate({
        path: 'manager',
        select: 'name _id'
      });

    console.log('Found user:', JSON.stringify(user, null, 2));

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure user has a store
    if (!user.store) {
      console.log('User has no store:', id);
      return res.status(500).json({ message: 'User has no associated store' });
    }

    // Ensure user belongs to the same store
    if (!req.user?.store?._id || user.store._id.toString() !== req.user.store._id.toString()) {
      console.log('User store mismatch:', {
        userStoreId: user.store._id,
        requestUserStoreId: req.user?.store?._id
      });
      return res.status(403).json({ message: 'Not authorized to view this user' });
    }

    // Transform the user object to match the expected format
    const userProfile = {
      _id: user._id,
      name: user.name || 'Unknown',
      email: user.email,
      phone: user.phone,
      department: user.department.toUpperCase(),
      position: user.position.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      role: (user.role || 'user').toUpperCase(),
      status: user.status || 'active',
      reportsTo: user.manager ? user.manager.name : 'No Manager Assigned',
      store: {
        _id: user.store._id,
        name: user.store.name || 'Unknown Store',
        storeNumber: user.store.storeNumber || 'N/A'
      },
      manager: user.manager ? {
        _id: user.manager._id,
        name: user.manager.name
      } : null,
      startDate: user.startDate || new Date(),
      previousRoles: user.previousRoles || [],
      evaluations: user.evaluations || [],
      certifications: user.certifications || [],
      development: user.development || [],
      recognition: user.recognition || [],
      documentation: user.documentation || [],
      metrics: {
        evaluationScores: user.metrics?.evaluationScores || [],
        trainingCompletion: user.metrics?.trainingCompletion || 0,
        goalAchievement: user.metrics?.goalAchievement || 0,
        leadershipScore: user.metrics?.leadershipScore || 0,
        heartsAndHands: user.metrics?.heartsAndHands || { x: 50, y: 50 }
      }
    };

    console.log('Sending user profile:', JSON.stringify(userProfile, null, 2));
    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Send a more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to fetch user profile: ${error.message}`
      : 'Failed to fetch user profile';
    res.status(500).json({ message: errorMessage, error: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
});

// Create a new user
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, department, position, role } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate a random password
    const password = User.generateRandomPassword();

    // Create new user
    const user = new User({
      name,
      email,
      department,
      position,
      role,
      password,
      status: 'active',
      store: req.user.store._id // Associate with current user's store
    });

    await user.save();

    // Send welcome email with password
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Growth Hub - CFA Team Member Development',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: #E4002B;">Welcome to Growth Hub</h1>
            <p style="color: #666;">Empowering Team Member Development</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
            <p>Hello ${name},</p>
            <p>Welcome to Growth Hub! Your account has been created successfully. Here are your login credentials:</p>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${process.env.CLIENT_URL}" style="color: #E4002B;">${process.env.CLIENT_URL}</a></p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
            </div>
            
            <p style="color: #E4002B; font-weight: bold;">Important Security Notice:</p>
            <p>For your security, please follow these steps:</p>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Log in using your email and temporary password</li>
              <li>Change your password immediately upon first login</li>
              <li>Keep your login credentials secure and do not share them</li>
            </ol>
            
            <p>If you have any questions or need assistance, please contact your manager or administrator.</p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666;">
            <p>Best regards,<br>Growth Hub Team</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, position, role, status, quadrant, manager } = req.body;

    console.log('Updating user:', {
      id,
      currentRequest: { name, email, department, position, role, status, quadrant, manager }
    });

    const user = await User.findById(id);
    if (!user) {
      console.log('User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Current user state:', JSON.stringify(user, null, 2));

    // Ensure user belongs to the same store
    if (user.store.toString() !== req.user.store._id.toString()) {
      console.log('Store mismatch:', {
        userStore: user.store.toString(),
        requestUserStore: req.user.store._id.toString()
      });
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Update user
    const updates = {
      name,
      email,
      department,
      position: position.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      role,
      status,
      manager: manager || null
    };

    console.log('Updates to apply:', JSON.stringify(updates, null, 2));

    // Only update quadrant if it's provided and different
    if (quadrant && user.quadrant !== quadrant) {
      console.log(`Updating quadrant from ${user.quadrant} to ${quadrant}`);
      updates.quadrant = quadrant;
    }

    try {
      // Use findByIdAndUpdate to get the updated document
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('manager', 'name _id');  // Populate manager details

      console.log('Updated user:', JSON.stringify(updatedUser, null, 2));

      res.json({ 
        message: 'User updated successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role.toUpperCase(),
          department: updatedUser.department.toUpperCase(),
          position: updatedUser.position.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          status: updatedUser.status,
          quadrant: updatedUser.quadrant,
          reportsTo: updatedUser.manager ? updatedUser.manager.name : 'No Manager Assigned',
          manager: updatedUser.manager  // Include full manager object for reference
        }
      });
    } catch (updateError) {
      console.error('Error during findByIdAndUpdate:', updateError);
      res.status(500).json({ 
        message: 'Failed to update user', 
        error: updateError.message,
        validationErrors: updateError.errors
      });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      message: 'Failed to update user', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

            // Send welcome email with password
            try {
              const mailOptions = {
                from: process.env.EMAIL_USER,
                to: row.email,
                subject: 'Welcome to Growth Hub - CFA Team Member Development',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; padding: 20px;">
                      <h1 style="color: #E4002B;">Welcome to Growth Hub</h1>
                      <p style="color: #666;">Empowering Team Member Development</p>
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                      <p>Hello ${row.name},</p>
                      <p>Welcome to Growth Hub! Your account has been created successfully. Here are your login credentials:</p>
                      
                      <div style="background-color: #fff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${process.env.CLIENT_URL}" style="color: #E4002B;">${process.env.CLIENT_URL}</a></p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${row.email}</p>
                        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
                      </div>
                      
                      <p style="color: #E4002B; font-weight: bold;">Important Security Notice:</p>
                      <p>For your security, please follow these steps:</p>
                      <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Log in using your email and temporary password</li>
                        <li>Change your password immediately upon first login</li>
                        <li>Keep your login credentials secure and do not share them</li>
                      </ol>
                      
                      <p>If you have any questions or need assistance, please contact your manager or administrator.</p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #666;">
                      <p>Best regards,<br>Growth Hub Team</p>
                    </div>
                  </div>
                `
              };

              await transporter.sendMail(mailOptions);
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
    user.password = newPassword;
    await user.save();

    // Send email with new password
    const mailOptions = {
      from: process.env.EMAIL_USER,
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
    };

    await transporter.sendMail(mailOptions);

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

export default router; 