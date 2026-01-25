import express, { Router } from 'express';
import {
  getAllEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats
} from '../controllers/enquiry.controller';

const router: Router = express.Router();

// Stats route should come BEFORE /:id route
router.get('/stats/summary', getEnquiryStats);
router.get('/', getAllEnquiries);
router.get('/:id', getEnquiryById);
router.post('/', createEnquiry);
router.put('/:id', updateEnquiry);
router.delete('/:id', deleteEnquiry);

export default router;
