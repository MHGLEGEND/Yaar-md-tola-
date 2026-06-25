import { Router } from 'express';
import { getNews, getNewsById, createNews, updateNews, deleteNews } from '../controllers/newsController';
import { authenticate, requireApproved } from '../middleware/auth';

const router = Router();
router.get('/', getNews);
router.get('/:id', getNewsById);
router.post('/', authenticate, requireApproved, createNews);
router.put('/:id', authenticate, updateNews);
router.delete('/:id', authenticate, deleteNews);
export default router;
