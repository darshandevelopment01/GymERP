import { Router } from 'express';
import { 
  getAllMembers, 
  getMemberById,
  createMember, 
  updateMember, 
  deleteMember 
} from '../controllers/member.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes use authMiddleware
router.get('/', authMiddleware, getAllMembers);
router.get('/:id', authMiddleware, getMemberById);
router.post('/', authMiddleware, createMember);
router.put('/:id', authMiddleware, updateMember);
router.delete('/:id', authMiddleware, deleteMember);

export default router;
