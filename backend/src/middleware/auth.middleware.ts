// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee';

interface JwtPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Returns a MongoDB branch filter based on the logged-in user's role.
 * - Admin: returns {} (no filter — sees all branches)
 * - User (Employee): returns { branch: { $in: employee.branches } }
 */
export const getUserBranchFilter = async (req: Request): Promise<Record<string, any>> => {
  try {
    if (!req.user?.id) return {};

    const employee: any = await Employee.findById(req.user.id).select('userType branches').lean();
    if (!employee) return {};

    // Admins see everything
    if (employee.userType === 'Admin') return {};

    // Employees see only their assigned branches
    const branches = employee.branches || [];
    if (branches.length === 0) {
      // No branches assigned — likely a legacy account; allow unrestricted access
      // rather than blocking all data (which would make User Master appear empty)
      console.warn(`⚠️ Employee ${req.user.id} has no branches assigned — showing all data`);
      return {};
    }

    return { branch: { $in: branches } };
  } catch (error) {
    console.error('getUserBranchFilter error:', error);
    return {};
  }
};
