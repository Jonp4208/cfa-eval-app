import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';

// Register new user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Registration attempt for:', email);
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    console.log('User created:', user);

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    const user = await User.findOne({ email }).populate('store');
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Login successful for:', email);
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      user: { 
        _id: user._id,
        name: user.name, 
        email: user.email, 
        role: user.role,
        store: user.store
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('store')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        store: user.store
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error getting profile' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = ['name', 'email', 'password'];
    
    Object.keys(req.body).forEach(update => {
      if (allowedUpdates.includes(update)) {
        updates[update] = req.body[update];
      }
    });

    // If updating password, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true }
    ).populate('store');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        store: user.store
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    console.log('Received forgot password request:', req.body);
    const { email } = req.body;

    if (!email) {
      console.log('No email provided');
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    if (user) {
      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = resetTokenExpiry;
      await user.save();
      console.log('Reset token saved for user');

      // Send reset email
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
      console.log('Reset URL:', resetUrl);
      
      const emailContent = `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `;

      try {
        console.log('Attempting to send email to:', email);
        await sendEmail({
          to: email,
          subject: 'Password Reset Request',
          html: emailContent
        });
        console.log('Reset email sent successfully');
      } catch (emailError) {
        console.error('Error sending reset email:', emailError);
        return res.status(500).json({ 
          success: false,
          message: 'Error sending reset email. Please try again.' 
        });
      }
    }

    // Always return success to prevent email enumeration
    console.log('Sending success response');
    res.json({ 
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing password reset request' 
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};