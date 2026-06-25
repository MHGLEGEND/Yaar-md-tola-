import { Router } from 'express';
import { getGraveyards, searchGrave } from '../controllers/controllers';
const router = Router();
router.get('/', getGraveyards);
router.get('/search', searchGrave);
export default router;
