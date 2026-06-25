import { Router } from 'express';
import { getMosques, getNamazTimings, updateNamazTimings, getAnnouncements } from '../controllers/controllers';
import { authenticate, requireAdmin } from '../middleware/auth';
const router = Router();
router.get('/', getMosques);
router.get('/announcements', getAnnouncements);
router.get('/:mosqueId/namaz', getNamazTimings);
router.post('/:mosqueId/namaz', authenticate, requireAdmin, updateNamazTimings);
export default router;
