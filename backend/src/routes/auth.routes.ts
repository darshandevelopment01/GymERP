// backend/src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Employee from '../models/Employee';
import Designation from '../models/Designation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', email); // Debug log

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error('Login error:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile with designation discount
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get user from User model
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Try to find matching employee record with populated designation
    const employee = await Employee.findOne({ email: user.email })
      .populate('designation');

    // Determine user type and discount rules:
    // - No employee record → Admin from User model → sees all designation discounts
    // - Employee with userType 'Admin' → sees all designation discounts
    // - Employee with noDiscountLimit permission → sees all designation discounts
    // - Otherwise → employee, capped at their designation's maxDiscountPercentage
    const isAdmin = !employee || employee.userType === 'Admin';
    const hasNoDiscountPerm = !!(employee as any)?.permissions?.panelAccess?.noDiscountLimit;
    const noDiscountLimit = isAdmin || hasNoDiscountPerm;

    let discountOptions: number[] = [];
    let maxDiscountPercentage = 0;

    if (noDiscountLimit) {
      // Admin: get all unique discount percentages from all active designations
      const allDesignations = await Designation.find({ status: 'active' });
      const allValues = allDesignations
        .map((d: any) => d.maxDiscountPercentage || 0)
        .filter((v: number) => v > 0);
      discountOptions = [...new Set(allValues)].sort((a, b) => a - b);
      maxDiscountPercentage = discountOptions.length > 0 ? Math.max(...discountOptions) : 0;
    } else {
      // Employee: use their designation's maxDiscountPercentage
      maxDiscountPercentage = employee?.designation &&
        typeof employee.designation === 'object' &&
        'maxDiscountPercentage' in employee.designation
        ? (employee.designation as any).maxDiscountPercentage
        : 0;
      if (maxDiscountPercentage > 0) {
        discountOptions = [maxDiscountPercentage];
      }
    }

    const userType = isAdmin ? 'Admin' : 'User';

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType,
        designation: employee?.designation || null,
        maxDiscountPercentage,
        noDiscountLimit,
        discountOptions, // Array of available discount percentages
        permissions: (employee as any)?.permissions || null,
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

