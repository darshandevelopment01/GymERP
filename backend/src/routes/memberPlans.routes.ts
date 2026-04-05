import { Router } from 'express';
import { getAllDietPlans, getAllWorkoutPlans } from '../controllers/masters.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Member plans routes - Read-only access for authenticated users (Staff or Members)
router.get('/diet-plans', authMiddleware, getAllDietPlans);
router.get('/workout-plans', authMiddleware, getAllWorkoutPlans);

export default router;
