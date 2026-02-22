import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import ActivityLog from '../models/ActivityLog';
import User from '../models/User';
import Employee from '../models/Employee';

const router = Router();

// Admin-only middleware
const adminOnly = async (req: Request, res: Response, next: any) => {
    try {
        const userId = req.user?.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Check if user has an employee record
        const employee = await Employee.findOne({ email: user.email });

        // Admin = no employee record (User model admin) OR employee with Admin userType
        const isAdmin = !employee || employee.userType === 'Admin';
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin access only' });
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET all logs - admin only, read-only (no POST/PUT/DELETE)
router.get('/', authMiddleware, adminOnly, async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            ActivityLog.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityLog.countDocuments()
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
    } catch (error: any) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch logs' });
    }
});

export default router;
