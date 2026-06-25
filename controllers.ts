import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { getCache, setCache, deleteCachePattern } from '../config/redis';
import { logger } from '../utils/logger';

// ===== MARKET CONTROLLER =====
export const getMarketPrices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cached = await getCache('market:prices');
    if (cached) { res.json({ success: true, data: cached }); return; }

    const prices = await prisma.marketPrice.findMany({ orderBy: [{ category: 'asc' }, { item: 'asc' }] });
    await setCache('market:prices', prices, 3600);
    res.json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch prices' });
  }
};

export const updateMarketPrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { item, category, price, unit } = req.body;
    const existing = await prisma.marketPrice.findFirst({ where: { item, category } });

    let record;
    if (existing) {
      record = await prisma.marketPrice.update({
        where: { id: existing.id },
        data: { price, unit, updatedBy: req.user!.userId, updatedAt: new Date() },
      });
    } else {
      record = await prisma.marketPrice.create({ data: { item, category, price, unit, updatedBy: req.user!.userId } });
    }

    // Record trend
    await prisma.priceTrend.create({ data: { item, price } });
    await deleteCachePattern('market:');

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update price' });
  }
};

export const getPriceTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { item, days = '30' } = req.query;
    const since = new Date(Date.now() - parseInt(days as string) * 86400000);

    const trends = await prisma.priceTrend.findMany({
      where: { item: item as string, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trends' });
  }
};

// ===== MOSQUE CONTROLLER =====
export const getMosques = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mosques = await prisma.mosque.findMany({
      where: { isActive: true },
      include: { committee: true },
    });
    res.json({ success: true, data: mosques });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch mosques' });
  }
};

export const getNamazTimings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mosqueId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timing = await prisma.namazTiming.findFirst({
      where: { mosqueId, date: { gte: today } },
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, data: timing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch namaz timings' });
  }
};

export const updateNamazTimings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mosqueId } = req.params;
    const { fajr, zuhr, asr, maghrib, isha, jummah, date } = req.body;

    const timing = await prisma.namazTiming.create({
      data: { mosqueId, fajr, zuhr, asr, maghrib, isha, jummah, date: date ? new Date(date) : new Date() },
    });

    res.json({ success: true, data: timing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update namaz timings' });
  }
};

export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    });
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
};

// ===== GOVERNANCE CONTROLLER =====
export const getOfficials = async (_req: Request, res: Response): Promise<void> => {
  try {
    const officials = await prisma.governanceOfficial.findMany({
      where: { isActive: true },
      orderBy: { designation: 'asc' },
    });
    res.json({ success: true, data: officials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch officials' });
  }
};

export const createComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category } = req.body;
    const complaint = await prisma.complaint.create({
      data: { userId: req.user!.userId, title, description, category },
    });
    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create complaint' });
  }
};

export const getMyComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    const complaint = await prisma.complaint.update({
      where: { id },
      data: { status, resolution, assignedTo: req.user!.userId, updatedAt: new Date() },
    });
    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update complaint' });
  }
};

// ===== GRAVEYARD CONTROLLER =====
export const getGraveyards = async (_req: Request, res: Response): Promise<void> => {
  try {
    const graveyards = await prisma.graveyard.findMany({
      where: { isActive: true },
      include: { graves: { include: { members: { select: { id: true, name: true, branch: true, dod: true } } } } },
    });
    res.json({ success: true, data: graveyards });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch graveyards' });
  }
};

export const searchGrave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const members = await prisma.familyMember.findMany({
      where: {
        graveyardId: { not: null },
        name: { contains: q as string, mode: 'insensitive' },
      },
      include: { graveyard: { include: { graveyard: true } } },
      take: 20,
    });
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// ===== SCHOOL CONTROLLER =====
export const getSchools = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    const where: any = { isActive: true };
    if (type) where.type = type;

    const schools = await prisma.school.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ success: true, data: schools });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch schools' });
  }
};

// ===== MAP CONTROLLER =====
export const getMapLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const locations = await prisma.mapLocation.findMany({ where: { isActive: true } });
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch locations' });
  }
};

// ===== ADMIN CONTROLLER =====
export const getAdminDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers, pendingUsers, totalMembers, pendingRequests,
      totalNews, totalComplaints, openComplaints,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isApproved: false } }),
      prisma.familyMember.count(),
      prisma.memberRequest.count({ where: { status: 'PENDING' } }),
      prisma.news.count({ where: { isActive: true } }),
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
    ]);

    const recentActivity = await prisma.auditLog.findMany({
      take: 20, orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });

    res.json({
      success: true,
      data: { totalUsers, pendingUsers, totalMembers, pendingRequests, totalNews, totalComplaints, openComplaints, recentActivity },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
};

export const getPendingUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { isApproved: false, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { familyMember: { select: { name: true, branch: true } } },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending users' });
  }
};

export const approveUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isApproved: approved, isActive: approved },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: approved ? 'USER_APPROVED' : 'USER_REJECTED', resource: 'users', details: { targetUserId: id } },
    });

    res.json({ success: true, message: `User ${approved ? 'approved' : 'rejected'}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', role, branch, approved } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = {};
    if (role) where.role = role;
    if (branch) where.branch = branch;
    if (approved !== undefined) where.isApproved = approved === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: parseInt(limit as string),
        select: { id: true, name: true, phone: true, email: true, role: true, branch: true, isApproved: true, createdAt: true, profilePhoto: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, pagination: { page: parseInt(page as string), total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const getAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [usersByRole, usersByBranch, newUsersThisMonth, newsThisMonth] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      prisma.user.groupBy({ by: ['branch'], _count: { id: true } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.news.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    res.json({
      success: true,
      data: { usersByRole, usersByBranch, newUsersThisMonth, newsThisMonth },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

// ===== USER CONTROLLER =====
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { familyMember: { select: { id: true, name: true, branch: true, generation: true, photo: true } } },
    });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, profilePhoto, preferredLang, darkMode } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name, profilePhoto, preferredLang, darkMode },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};
