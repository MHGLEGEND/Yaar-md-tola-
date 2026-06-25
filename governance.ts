import { Router } from 'express';
import { getOfficials, createComplaint, getMyComplaints, updateComplaintStatus } from '../controllers/controllers';
import { authenticate, requireApproved, requireAdmin } from '../middleware/auth';
const router = Router();
router.get('/officials', getOfficials);
router.post('/complaints', authenticate, requireApproved, createComplaint);
router.get('/complaints/mine', authenticate, getMyComplaints);
router.patch('/complaints/:id', authenticate, requireAdmin, updateComplaintStatus);
export default router;
