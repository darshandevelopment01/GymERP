"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/auth.routes.ts
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Employee_1 = __importDefault(require("../models/Employee"));
const Designation_1 = __importDefault(require("../models/Designation"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, identifier, password } = req.body;
        const searchIdentifier = identifier || email;
        if (!searchIdentifier) {
            return res.status(400).json({ message: 'Email or phone number is required' });
        }
        console.log('Login attempt:', searchIdentifier); // Debug log
        const user = await User_1.default.findOne({
            $or: [
                { email: searchIdentifier.toLowerCase() },
                { phone: searchIdentifier }
            ]
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Login error:', error); // Debug log
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get current user profile with designation discount
router.get('/me', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        // Get user from User model
        const user = await User_1.default.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Try to find matching employee record with populated designation
        const employee = await Employee_1.default.findOne({ email: user.email })
            .populate('designation');
        // Determine user type and discount rules:
        // - No employee record → Admin from User model → sees all designation discounts
        // - Employee with userType 'Admin' → sees all designation discounts
        // - Employee with noDiscountLimit permission → sees all designation discounts
        // - Otherwise → employee, capped at their designation's maxDiscountPercentage
        const isAdmin = !employee || employee.userType === 'Admin';
        const hasNoDiscountPerm = !!employee?.permissions?.panelAccess?.noDiscountLimit;
        const noDiscountLimit = isAdmin || hasNoDiscountPerm;
        let discountOptions = [];
        let maxDiscountPercentage = 0;
        if (noDiscountLimit) {
            // Admin: get all unique discount percentages from all active designations
            const allDesignations = await Designation_1.default.find({ status: 'active' });
            const allValues = allDesignations
                .map((d) => d.maxDiscountPercentage || 0)
                .filter((v) => v > 0);
            discountOptions = [...new Set(allValues)].sort((a, b) => a - b);
            maxDiscountPercentage = discountOptions.length > 0 ? Math.max(...discountOptions) : 0;
        }
        else {
            // Employee: use their designation's maxDiscountPercentage
            maxDiscountPercentage = employee?.designation &&
                typeof employee.designation === 'object' &&
                'maxDiscountPercentage' in employee.designation
                ? employee.designation.maxDiscountPercentage
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
                permissions: employee?.permissions || null,
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
        // Find the user in either User or Employee collection
        const searchCondition = {
            $or: [
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ]
        };
        let userModel = await User_1.default.findOne(searchCondition);
        let isEmployee = false;
        if (!userModel) {
            userModel = await Employee_1.default.findOne(searchCondition);
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
            await Employee_1.default.updateOne({ _id: userModel._id }, { $set: updateFields });
        }
        else {
            await User_1.default.updateOne({ _id: userModel._id }, { $set: updateFields });
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
        const searchCondition = {
            $or: [
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ],
            resetPasswordOtp: otp,
            resetOtpExpires: { $gt: Date.now() }
        };
        let userModel = await User_1.default.findOne(searchCondition);
        let isEmployee = false;
        if (!userModel) {
            userModel = await Employee_1.default.findOne(searchCondition);
            isEmployee = true;
        }
        if (!userModel) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        const updateFields = {
            password: hashedPassword,
            resetPasswordOtp: null,
            resetOtpExpires: null
        };
        if (isEmployee) {
            await Employee_1.default.updateOne({ _id: userModel._id }, { $set: updateFields });
        }
        else {
            await User_1.default.updateOne({ _id: userModel._id }, { $set: updateFields });
        }
        res.json({ success: true, message: 'Password reset completely successfully. You can now log in.' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
});
exports.default = router;
