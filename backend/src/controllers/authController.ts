import { Request, Response } from 'express';
import Employee from '../models/Employee';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate JWT Token
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: '30d'
  });
};

// Register first gym owner (no auth required)
export const registerGymOwner = async (req: Request, res: Response) => {
  try {
    // Check if admin already exists
    const existingOwner = await Employee.findOne({ userType: 'Admin', status: 'active' });
    if (existingOwner) {
      return res.status(400).json({ error: 'Admin already exists. Please login.' });
    }

    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email or phone exists
    const existingEmployee = await Employee.findOne({ $or: [{ email }, { phone }] });
    if (existingEmployee) {
      return res.status(400).json({ error: 'Email or phone already registered' });
    }

    // Auto-generate employeeCode
    const count = await Employee.countDocuments();
    const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin employee
    const gymOwner = await Employee.create({
      employeeCode,
      name,
      email,
      phone,
      password: hashedPassword,
      gender: 'Male', // Default, can be updated later
      userType: 'Admin',
      status: 'active',
    });

    const token = generateToken(gymOwner._id.toString());

    res.status(201).json({
      message: 'Gym owner registered successfully',
      user: {
        id: gymOwner._id,
        name: gymOwner.name,
        email: gymOwner.email,
        phone: gymOwner.phone,
        userType: gymOwner.userType
      },
      token
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register gym owner' });
  }
};

// Login with email or phone
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required' });
    }

    const user: any = await Employee.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    }).populate('designation');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check active status
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is inactive. Contact administrator.' });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString());

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        employeeCode: user.employeeCode,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType || 'User',
        designation: user.designation ? user.designation.designationName || user.designation : undefined,
        permissions: user.permissions,
        profilePhoto: user.profilePhoto,
        gender: user.gender
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    const user: any = await Employee.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordOtp = hashedToken;
    user.resetOtpExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // In production, send email/SMS
    res.json({
      message: 'Password reset token generated',
      resetToken, // Remove this in production
      info: 'In production, this token will be sent via email/SMS'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user: any = await Employee.findOne({
      resetPasswordOtp: hashedToken,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Get current user profile
export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await Employee.findById(req.user?.id)
      .select('-password -resetPasswordOtp -resetOtpExpires')
      .populate('designation');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Test Email Trigger
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const targetEmail = email || process.env.SMTP_USER;

    if (!targetEmail) {
      return res.status(400).json({ error: 'No recipient email provided and SMTP_USER not set.' });
    }

    const { sendEmail } = require('../utils/mailer');
    
    console.log(`🧪 Testing email trigger to: ${targetEmail}`);
    const start = Date.now();
    
    const success = await sendEmail(
      targetEmail,
      'MuscleTime ERP - SMTP Test',
      `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #6366f1;">SMTP Test Successful!</h2>
        <p>This is a test email from your MuscleTime ERP system.</p>
        <hr/>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Host:</strong> ${process.env.SMTP_HOST}</p>
        <p><strong>Port:</strong> ${process.env.SMTP_PORT}</p>
      </div>
      `
    );

    const duration = Date.now() - start;

    if (success) {
      res.json({ 
        success: true, 
        message: `Test email sent successfully to ${targetEmail}`,
        details: {
          duration: `${duration}ms`,
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT
        }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send test email. Check server logs for details.',
        details: {
          duration: `${duration}ms`
        }
      });
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Internal server error during email test', details: error.message });
  }
};

