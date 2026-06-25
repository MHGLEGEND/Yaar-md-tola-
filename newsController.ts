import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sendPushNotification } from '../services/notifications';
import { logger } from '../utils/logger';

export const getNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, page = '1', limit = '20', pinned } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    };
    if (category) where.category = category;
    if (pinned === 'true') where.isPinned = true;

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: { author: { select: { name: true, profilePhoto: true } } },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.news.count({ where }),
    ]);

    res.json({ success: true, data: news, pagination: { page: parseInt(page as string), total, pages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
};

export const getNewsById = async (req: Request, res: Response): Promise<void> => {
  try {
    const news = await prisma.news.findUnique({
      where: { id: req.params.id },
      include: { author: { select: { name: true, profilePhoto: true, role: true } } },
    });
    if (!news) { res.status(404).json({ success: false, message: 'News not found' }); return; }

    await prisma.news.update({ where: { id: news.id }, data: { views: { increment: 1 } } });
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
};

export const createNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category, photo, isPinned, expiresAt } = req.body;

    const news = await prisma.news.create({
      data: {
        title, content, category, photo,
        isPinned: isPinned || false,
        authorId: req.user!.userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Send push notification for important categories
    if (['EMERGENCY_ALERT', 'DEATH_ANNOUNCEMENT', 'BIRTH_ANNOUNCEMENT'].includes(category)) {
      await sendPushNotification(null, title, content.substring(0, 100) + '...', { newsId: news.id, category });
    }

    res.status(201).json({ success: true, data: news });
  } catch (error) {
    logger.error('Create news error:', error);
    res.status(500).json({ success: false, message: 'Failed to create news' });
  }
};

export const updateNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const news = await prisma.news.findUnique({ where: { id: req.params.id } });
    if (!news) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    if (news.authorId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized' }); return;
    }

    const updated = await prisma.news.update({
      where: { id: req.params.id },
      data: { ...req.body, expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update news' });
  }
};

export const deleteNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const news = await prisma.news.findUnique({ where: { id: req.params.id } });
    if (!news) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    if (news.authorId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized' }); return;
    }

    await prisma.news.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'News deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete news' });
  }
};
