"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/dashboard.routes.ts
const express_1 = require("express");
const Member_1 = __importDefault(require("../models/Member"));
const Employee_1 = __importDefault(require("../models/Employee"));
const Branch_1 = __importDefault(require("../models/Branch"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Dashboard stats
router.get('/stats', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const totalMembers = await Member_1.default.countDocuments({ status: 'active' });
        const totalEmployees = await Employee_1.default.countDocuments({ status: 'active' });
        const activeBranches = await Branch_1.default.countDocuments({ status: 'active' });
        console.log('📊 Fetching dashboard stats:', { totalMembers, totalEmployees, activeBranches });
        const revenue = 840000;
        res.json({
            totalMembers,
            totalEmployees,
            activeBranches,
            revenue,
            growth: {
                members: 12.5,
                employees: 8.2,
                branches: 2,
                revenue: 15.3
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});
// Weekly attendance data (dynamic)
router.get('/attendance-weekly', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        monday.setHours(0, 0, 0, 0);
        const totalMembers = await Member_1.default.countDocuments({ status: 'active' });
        console.log('📊 Generating attendance data for', totalMembers, 'members');
        const weeklyData = [];
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            let attendanceRate;
            if (i < 5) {
                attendanceRate = 0.75 + Math.random() * 0.15;
            }
            else {
                attendanceRate = 0.40 + Math.random() * 0.20;
            }
            const present = Math.floor(totalMembers * attendanceRate);
            const absent = Math.floor(totalMembers * (0.15 + Math.random() * 0.10));
            weeklyData.push({
                day: days[i],
                present,
                absent,
                date: date.toISOString().split('T')[0]
            });
        }
        console.log('📊 Weekly attendance data:', weeklyData);
        res.json(weeklyData);
    }
    catch (error) {
        console.error('Attendance error:', error);
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
});
// Membership growth data (last 6 months) - Using membershipStartDate
router.get('/membership-growth', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const growthData = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        console.log('📊 Starting membership growth calculation...');
        console.log('📊 Current date:', today.toISOString());
        // Check total members first
        const totalMembers = await Member_1.default.countDocuments();
        console.log('📊 Total members in database:', totalMembers);
        for (let i = 5; i >= 0; i--) {
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            const monthName = months[new Date(today.getFullYear(), today.getMonth() - i, 1).getMonth()];
            console.log(`📊 Checking ${monthName}: counting members with membershipStartDate <= ${monthEnd.toISOString()}`);
            // Count cumulative members up to end of this month using membershipStartDate
            const count = await Member_1.default.countDocuments({
                membershipStartDate: { $lte: monthEnd }
            });
            console.log(`📊 Total members up to ${monthName}: ${count}`);
            growthData.push({
                month: monthName,
                total: count,
                year: monthEnd.getFullYear()
            });
        }
        console.log('📊 Final membership growth data:', JSON.stringify(growthData, null, 2));
        res.json(growthData);
    }
    catch (error) {
        console.error('❌ Growth data error:', error);
        res.status(500).json({ message: 'Error fetching growth data', error: error.message });
    }
});
exports.default = router;
