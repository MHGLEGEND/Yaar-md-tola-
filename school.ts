import { Router } from 'express';
import { getSchools } from '../controllers/controllers';
const router = Router();
router.get('/', getSchools);
export default router;
