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
    const { email, identifier, password } = req.body;
    const searchIdentifier = identifier || email;

    if (!searchIdentifier) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }

    console.log('Login attempt:', searchIdentifier); // Debug log

    let user: any = await User.findOne({
      $or: [
        { email: searchIdentifier.toLowerCase() },
        { phone: searchIdentifier }
      ]
    });

    let isEmployeeCollection = false;

    // Fallback to Employee collection if not found in User collection
    if (!user) {
      user = await Employee.findOne({
        $or: [
          { email: searchIdentifier.toLowerCase() },
          { phone: searchIdentifier }
        ]
      });
      if (user) isEmployeeCollection = true;
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Determine active status and password comparing
    if (isEmployeeCollection) {
      if (user.status !== 'active') {
        return res.status(401).json({ message: 'Account is inactive. Contact administrator.' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      if (user.isActive === false) {
        return res.status(401).json({ message: 'Account is inactive. Contact administrator.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    let finalUserType = user.userType;
    let finalPermissions = null;

    if (isEmployeeCollection) {
      finalUserType = user.userType || 'User';
      finalPermissions = user.permissions || null;
    } else {
      // If found in User collection, they might STILL be an employee. Look them up to get their permissions!
      const linkedEmployee: any = await Employee.findOne({
        $or: [
          { email: searchIdentifier.toLowerCase() },
          { phone: searchIdentifier }
        ]
      });
      if (linkedEmployee) {
        finalPermissions = linkedEmployee.permissions || null;
        // The Employee collection's userType ('Admin'/'User') is more accurate for the app's permission logic
        finalUserType = linkedEmployee.userType || 'User';
      }
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
        email: user.email,
        userType: finalUserType,
        permissions: finalPermissions,
      }
    });
  } catch (error: any) {
    console.error('Login error:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile with designation discount
// Searches Employee first (employees log in via Employee collection),
// then falls back to User model (for the original admin account).
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // 1. Try Employee collection first
    let employee = await Employee.findById(userId).populate('designation');
    let user: any = null;

    if (employee) {
      // Found in Employee collection — use employee record directly
      const isAdmin = employee.userType === 'Admin';
      const hasNoDiscountPerm = !!(employee as any)?.permissions?.panelAccess?.noDiscountLimit;
      const noDiscountLimit = isAdmin || hasNoDiscountPerm;

      let discountOptions: number[] = [];
      let maxDiscountPercentage = 0;

      if (noDiscountLimit) {
        const allDesignations = await Designation.find({ status: 'active' });
        const allValues = allDesignations
          .map((d: any) => d.maxDiscountPercentage || 0)
          .filter((v: number) => v > 0);
        discountOptions = [...new Set(allValues)].sort((a: number, b: number) => a - b);
        maxDiscountPercentage = discountOptions.length > 0 ? Math.max(...discountOptions) : 0;
      } else {
        maxDiscountPercentage = employee.designation &&
          typeof employee.designation === 'object' &&
          'maxDiscountPercentage' in employee.designation
          ? (employee.designation as any).maxDiscountPercentage
          : 0;
        if (maxDiscountPercentage > 0) discountOptions = [maxDiscountPercentage];
      }

      return res.json({
        success: true,
        data: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          userType: employee.userType || 'User',
          designation: employee.designation || null,
          maxDiscountPercentage,
          noDiscountLimit,
          discountOptions,
          permissions: (employee as any).permissions || null,
        }
      });
    }

    // 2. Fall back to User model (original admin account)
    user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also try to find a matching employee record by email (for hybrid setups)
    const empByEmail = await Employee.findOne({ email: user.email }).populate('designation');
    const isAdmin = !empByEmail || empByEmail.userType === 'Admin';
    const hasNoDiscountPerm = !!(empByEmail as any)?.permissions?.panelAccess?.noDiscountLimit;
    const noDiscountLimit = isAdmin || hasNoDiscountPerm;

    let discountOptions: number[] = [];
    let maxDiscountPercentage = 0;

    if (noDiscountLimit) {
      const allDesignations = await Designation.find({ status: 'active' });
      const allValues = allDesignations
        .map((d: any) => d.maxDiscountPercentage || 0)
        .filter((v: number) => v > 0);
      discountOptions = [...new Set(allValues)].sort((a: number, b: number) => a - b);
      maxDiscountPercentage = discountOptions.length > 0 ? Math.max(...discountOptions) : 0;
    } else {
      maxDiscountPercentage = empByEmail?.designation &&
        typeof empByEmail.designation === 'object' &&
        'maxDiscountPercentage' in empByEmail.designation
        ? (empByEmail.designation as any).maxDiscountPercentage
        : 0;
      if (maxDiscountPercentage > 0) discountOptions = [maxDiscountPercentage];
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: isAdmin ? 'Admin' : 'User',
        designation: empByEmail?.designation || null,
        maxDiscountPercentage,
        noDiscountLimit,
        discountOptions,
        permissions: (empByEmail as any)?.permissions || null,
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password (OTP Generation)
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }

    // Find the user in either User or Employee collection
    const searchCondition = {
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    };

    let userModel: any = await User.findOne(searchCondition);
    let isEmployee = false;

    if (!userModel) {
      userModel = await Employee.findOne(searchCondition);
      isEmployee = true;
    }

    if (!userModel) {
      return res.status(404).json({ message: 'Account not found with this email or phone' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry (15 minutes from now)
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    const updateFields = { resetPasswordOtp: otp, resetOtpExpires: expires };
    if (isEmployee) {
      await Employee.updateOne({ _id: userModel._id }, { $set: updateFields });
    } else {
      await User.updateOne({ _id: userModel._id }, { $set: updateFields });
    }

    console.log(`\n================================`);
    console.log(`🔑 MOCK SMS/EMAIL SENT`);
    console.log(`To: ${identifier}`);
    console.log(`OTP: ${otp}`);
    console.log(`================================\n`);

    res.json({
      success: true,
      message: 'If the account exists, an OTP has been sent. Check terminal logs for the OTP.'
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process forgot password request', error: error.message });
  }
});

// Reset Password (OTP Verification)
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: 'Identifier, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const searchCondition = {
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ],
      resetPasswordOtp: otp,
      resetOtpExpires: { $gt: Date.now() }
    };

    let userModel: any = await User.findOne(searchCondition);
    let isEmployee = false;

    if (!userModel) {
      userModel = await Employee.findOne(searchCondition);
      isEmployee = true;
    }

    if (!userModel) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateFields = {
      password: hashedPassword,
      resetPasswordOtp: null,
      resetOtpExpires: null
    };

    if (isEmployee) {
      await Employee.updateOne({ _id: userModel._id }, { $set: updateFields });
    } else {
      await User.updateOne({ _id: userModel._id }, { $set: updateFields });
    }

    res.json({ success: true, message: 'Password reset completely successfully. You can now log in.' });

  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});

export default router;

