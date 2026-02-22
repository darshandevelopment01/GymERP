import express, { Router } from 'express';
import {
  getAllEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats
} from '../controllers/enquiry.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: Router = express.Router();

// Stats route should come BEFORE /:id route
router.get('/stats/summary', getEnquiryStats);
router.get('/', getAllEnquiries);
router.get('/:id', getEnquiryById);
router.post('/', authMiddleware, createEnquiry);
router.put('/:id', authMiddleware, updateEnquiry);
router.delete('/:id', deleteEnquiry);

export default router;
