import { Router } from 'express';
import * as familyCtrl from '../controllers/familyController';
import { authenticate, requireApproved, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/tree', familyCtrl.getFamilyTree);
router.get('/search', familyCtrl.searchMembers);
router.get('/stats', familyCtrl.getStats);
router.get('/branch/:branch', familyCtrl.getMembersByBranch);
router.get('/member/:id', familyCtrl.getMemberDetail);
router.post('/member', authenticate, requireAdmin, familyCtrl.addMember);
router.put('/member/:id', authenticate, requireAdmin, familyCtrl.updateMember);
router.post('/request', authenticate, requireApproved, familyCtrl.requestAddMember);
router.get('/requests', authenticate, requireAdmin, familyCtrl.getPendingRequests);
router.patch('/requests/:id/review', authenticate, requireAdmin, familyCtrl.reviewMemberRequest);

export default router;
