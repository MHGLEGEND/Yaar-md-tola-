import { Router } from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/controllers';
import { authenticate } from '../middleware/auth';
const router = Router();
router.get('/me', authenticate, getMyProfile);
router.patch('/me', authenticate, updateMyProfile);
export default router;
