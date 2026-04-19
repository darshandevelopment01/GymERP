import { Router } from 'express';
import { 
  getAllMembers, 
  getMemberById,
  createMember, 
  updateMember, 
  deleteMember,
  getMemberHistory,
  getMemberPaymentReceipt,
  freezeMember
} from '../controllers/member.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes use authMiddleware
router.get('/', authMiddleware, getAllMembers);
router.get('/:id/history', authMiddleware, getMemberHistory);
router.get('/:id/payments/:paymentIndex/receipt', authMiddleware, getMemberPaymentReceipt);
router.get('/:id', authMiddleware, getMemberById);
router.post('/', authMiddleware, createMember);
router.post('/:id/freeze', authMiddleware, freezeMember);
router.put('/:id', authMiddleware, updateMember);
router.delete('/:id', authMiddleware, deleteMember);

export default router;
