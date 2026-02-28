import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
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
    // Check if gym owner already exists
    const existingOwner = await User.findOne({ userType: 'gym_owner' });
    if (existingOwner) {
      return res.status(400).json({ error: 'Gym owner already exists. Please login.' });
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
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone already registered' });
    }

    // Create gym owner
    const gymOwner = await User.create({
      name,
      email,
      phone,
      password,
      userType: 'gym_owner'
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

    // Find user by email or phone in Admin (User) collection
    let user: any = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    let isEmployeeCollection = false;

    // Fallback to Employee collection if not found in User collection
    if (!user) {
      user = await Employee.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { phone: identifier }
        ]
      }).populate('designation');
      if (user) isEmployeeCollection = true;
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check active status
    if (isEmployeeCollection) {
      if (user.status !== 'active') {
        return res.status(401).json({ error: 'Account is inactive. Contact administrator.' });
      }
    } else {
      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is inactive. Contact administrator.' });
      }
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
        userType: isEmployeeCollection ? 'user' : user.userType,
        assignedRoles: user.assignedRoles,
        designation: user.designation ? user.designation.designationName || user.designation : undefined,
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

    let user: any = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) {
      user = await Employee.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { phone: identifier }
        ]
      });
    }

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

    let user: any = await User.findOne({
      resetPasswordOtp: hashedToken,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      user = await Employee.findOne({
        resetPasswordOtp: hashedToken,
        resetOtpExpires: { $gt: Date.now() }
      });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
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
    const user = await User.findById(req.user?.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
