"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.resetPassword = exports.forgotPassword = exports.login = exports.registerGymOwner = void 0;
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
// Generate JWT Token
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};
// Register first gym owner (no auth required)
const registerGymOwner = async (req, res) => {
    try {
        // Check if gym owner already exists
        const existingOwner = await User_1.default.findOne({ userType: 'gym_owner' });
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
        const existingUser = await User_1.default.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Email or phone already registered' });
        }
        // Create gym owner
        const gymOwner = await User_1.default.create({
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
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register gym owner' });
    }
};
exports.registerGymOwner = registerGymOwner;
// Login with email or phone
const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Email/Phone and password are required' });
        }
        // Find user by email or phone
        const user = await User_1.default.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ]
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!user.isActive) {
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
                userType: user.userType,
                assignedRoles: user.assignedRoles,
                designation: user.designation,
                profilePhoto: user.profilePhoto,
                gender: user.gender
            },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({ error: 'Email or phone is required' });
        }
        const user = await User_1.default.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ]
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordOtp = hashedToken;
        user.resetOtpExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.save();
        // In production, send email/SMS
        res.json({
            message: 'Password reset token generated',
            resetToken, // Remove this in production
            info: 'In production, this token will be sent via email/SMS'
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};
exports.forgotPassword = forgotPassword;
// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await User_1.default.findOne({
            resetPasswordOtp: hashedToken,
            resetOtpExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        user.password = newPassword;
        user.resetPasswordOtp = undefined;
        user.resetOtpExpires = undefined;
        await user.save();
        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
exports.resetPassword = resetPassword;
// Get current user profile
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?.id)
            .select('-password -resetPasswordToken -resetPasswordExpires');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};
exports.getMe = getMe;
