import { Router } from 'express';
import { getMarketPrices, updateMarketPrice, getPriceTrends } from '../controllers/controllers';
import { authenticate, requireAdmin } from '../middleware/auth';
const router = Router();
router.get('/', getMarketPrices);
router.get('/trends', getPriceTrends);
router.post('/update', authenticate, requireAdmin, updateMarketPrice);
export default router;
