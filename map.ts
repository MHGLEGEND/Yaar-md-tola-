import { Router } from 'express';
import { getMapLocations } from '../controllers/controllers';
const router = Router();
router.get('/', getMapLocations);
export default router;
