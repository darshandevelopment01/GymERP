"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const ActivityLog_1 = __importDefault(require("../models/ActivityLog"));
const User_1 = __importDefault(require("../models/User"));
const Employee_1 = __importDefault(require("../models/Employee"));
const router = (0, express_1.Router)();
// Admin-only middleware
const adminOnly = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        // Check if user has an employee record
        const employee = await Employee_1.default.findOne({ email: user.email });
        // Admin = no employee record (User model admin) OR employee with Admin userType
        const isAdmin = !employee || employee.userType === 'Admin';
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin access only' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// GET all logs - admin only, read-only (no POST/PUT/DELETE)
router.get('/', auth_middleware_1.authMiddleware, adminOnly, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            ActivityLog_1.default.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityLog_1.default.countDocuments()
        ]);
        res.json({
            success: true,
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch logs' });
    }
});
exports.default = router;
