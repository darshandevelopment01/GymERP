"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/auth.routes.ts
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Employee_1 = __importDefault(require("../models/Employee"));
const Designation_1 = __importDefault(require("../models/Designation"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const mailer_1 = require("../utils/mailer");
const router = (0, express_1.Router)();
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, identifier, password } = req.body;
        const searchIdentifier = identifier || email;
        if (!searchIdentifier) {
            return res.status(400).json({ message: 'Email or phone number is required' });
        }
        console.log('Login attempt:', searchIdentifier);
        const user = await Employee_1.default.findOne({
            $or: [
                { email: searchIdentifier.toLowerCase() },
                { phone: searchIdentifier }
            ]
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Check active status
        if (user.status !== 'active') {
            return res.status(401).json({ message: 'Account is inactive. Contact administrator.' });
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType || 'User',
                permissions: user.permissions || null,
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get current user profile with designation discount
router.get('/me', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const employee = await Employee_1.default.findById(userId).populate('designation');
        if (!employee) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isAdmin = employee.userType === 'Admin';
        const hasNoDiscountPerm = !!employee?.permissions?.panelAccess?.noDiscountLimit;
        const noDiscountLimit = isAdmin || hasNoDiscountPerm;
        let discountOptions = [];
        let maxDiscountPercentage = 0;
        if (noDiscountLimit) {
            const allDesignations = await Designation_1.default.find({ status: 'active' });
            const allValues = allDesignations
                .map((d) => d.maxDiscountPercentage || 0)
                .filter((v) => v > 0);
            discountOptions = [...new Set(allValues)].sort((a, b) => a - b);
            maxDiscountPercentage = discountOptions.length > 0 ? Math.max(...discountOptions) : 0;
        }
        else {
            maxDiscountPercentage = employee.designation &&
                typeof employee.designation === 'object' &&
                'maxDiscountPercentage' in employee.designation
                ? employee.designation.maxDiscountPercentage
                : 0;
            if (maxDiscountPercentage > 0)
                discountOptions = [maxDiscountPercentage];
        }
        res.json({
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
                permissions: employee.permissions || null,
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Forgot Password (OTP Generation)
router.post('/forgot-password', async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({ message: 'Email or phone number is required' });
        }
        const userModel = await Employee_1.default.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ]
        });
        if (!userModel) {
            return res.status(404).json({ message: 'Account not found with this email or phone' });
        }
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Set expiry (15 minutes from now)
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        await Employee_1.default.updateOne({ _id: userModel._id }, { $set: { resetPasswordOtp: otp, resetOtpExpires: expires } });
        console.log(`\n================================`);
        console.log(`🔑 MOCK SMS/EMAIL SENT`);
        console.log(`To: ${identifier}`);
        console.log(`OTP: ${otp}`);
        console.log(`================================\n`);
        // Send the OTP via email
        const emailSubject = 'Your Password Reset OTP - MuscleTime ERP';
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 16px;">Hello,</p>
        <p style="color: #475569; font-size: 16px;">We received a request to reset your password for your MuscleTime ERP account. Use the code below to proceed:</p>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3b82f6;">${otp}</span>
        </div>
        <p style="color: #475569; font-size: 14px;">This code will expire in 15 minutes.</p>
        <p style="color: #475569; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} MuscleTime ERP. All rights reserved.</p>
      </div>
    `;
        // Only attempt to send if the identifier is an email or if the user found has an email
        const recipientEmail = userModel.email;
        if (recipientEmail) {
            await (0, mailer_1.sendEmail)(recipientEmail, emailSubject, emailHtml);
        }
        res.json({
            success: true,
            message: 'If the account exists, an OTP has been sent. Check terminal logs for the OTP.'
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Failed to process forgot password request', error: error.message });
    }
});
// Reset Password (OTP Verification)
router.post('/reset-password', async (req, res) => {
    try {
        const { identifier, otp, newPassword } = req.body;
        if (!identifier || !otp || !newPassword) {
            return res.status(400).json({ message: 'Identifier, OTP, and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        const userModel = await Employee_1.default.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ],
            resetPasswordOtp: otp,
            resetOtpExpires: { $gt: Date.now() }
        });
        if (!userModel) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await Employee_1.default.updateOne({ _id: userModel._id }, {
            $set: {
                password: hashedPassword,
                resetPasswordOtp: null,
                resetOtpExpires: null
            }
        });
        res.json({ success: true, message: 'Password reset completely successfully. You can now log in.' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
});
exports.default = router;
