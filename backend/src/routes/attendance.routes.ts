// backend/src/routes/attendance.routes.ts
import { Router } from 'express';
import {
  getAttendance,
  markAttendance,
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  getGymQr,
  qrCheckin,
  getAttendanceStats,
} from '../controllers/attendance.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getAttendance);
router.post('/mark', markAttendance);
router.get('/stats', getAttendanceStats);

router.post('/leave', applyLeave);
router.get('/leaves', getLeaves);
router.patch('/leave/:id/status', updateLeaveStatus);

router.get('/gym-qr', getGymQr);
router.post('/qr-checkin', qrCheckin);

export default router;
