import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import ActivityLog from '../models/ActivityLog';
import Employee from '../models/Employee';

const router = Router();

// Admin-only middleware
const adminOnly = async (req: Request, res: Response, next: any) => {
    try {
        const userId = req.user?.id;
        const employee: any = await Employee.findById(userId);
        if (!employee) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const isAdmin = employee.userType === 'Admin';
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
