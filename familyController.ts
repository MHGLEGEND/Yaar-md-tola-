import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { getCache, setCache, deleteCachePattern } from '../config/redis';
import { logger } from '../utils/logger';

// Get full family tree (optimized recursive query)
export const getFamilyTree = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = 'family:tree:full';
    const cached = await getCache(cacheKey);
    if (cached) { res.json({ success: true, data: cached }); return; }

    const allMembers = await prisma.familyMember.findMany({
      select: {
        id: true, name: true, nameUrdu: true, fatherId: true, motherId: true,
        spouseId: true, branch: true, generation: true, gender: true,
        dob: true, dod: true, photo: true, profession: true, isAlive: true, notes: true,
      },
      orderBy: [{ generation: 'asc' }, { name: 'asc' }],
    });

    // Build tree structure
    const memberMap = new Map(allMembers.map(m => [m.id, { ...m, children: [] as any[] }]));
    const roots: any[] = [];

    allMembers.forEach(member => {
      if (member.fatherId && memberMap.has(member.fatherId)) {
        (memberMap.get(member.fatherId) as any).children.push(memberMap.get(member.id));
      } else if (!member.fatherId) {
        roots.push(memberMap.get(member.id));
      }
    });

    const treeData = { roots, totalMembers: allMembers.length };
    await setCache(cacheKey, treeData, 1800);

    res.json({ success: true, data: treeData });
  } catch (error) {
    logger.error('Get family tree error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch family tree' });
  }
};

// Get single member with ancestors + descendants
export const getMemberDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const member = await prisma.familyMember.findUnique({
      where: { id },
      include: {
        father: { select: { id: true, name: true, photo: true, branch: true } },
        mother: { select: { id: true, name: true, photo: true, branch: true } },
        spouse: { select: { id: true, name: true, photo: true, branch: true } },
        children: { select: { id: true, name: true, photo: true, branch: true, gender: true, isAlive: true } },
        graveyard: true,
        user: { select: { id: true, role: true } },
      },
    });

    if (!member) { res.status(404).json({ success: false, message: 'Member not found' }); return; }

    // Get full ancestor chain
    const ancestors = await getAncestors(id);
    const descendants = await getDescendantsCount(id);

    res.json({ success: true, data: { ...member, ancestors, descendantCount: descendants } });
  } catch (error) {
    logger.error('Get member detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch member' });
  }
};

const getAncestors = async (memberId: string): Promise<any[]> => {
  const ancestors: any[] = [];
  let currentId: string | null = memberId;

  for (let i = 0; i < 20 && currentId; i++) {
    const member = await prisma.familyMember.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, fatherId: true, photo: true, generation: true, branch: true },
    });
    if (!member || !member.fatherId) break;
    currentId = member.fatherId;
    const parent = await prisma.familyMember.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, fatherId: true, photo: true, generation: true, branch: true },
    });
    if (parent) ancestors.push(parent);
    currentId = parent?.fatherId || null;
  }

  return ancestors;
};

const getDescendantsCount = async (memberId: string): Promise<number> => {
  const children = await prisma.familyMember.findMany({
    where: { fatherId: memberId },
    select: { id: true },
  });

  let count = children.length;
  for (const child of children) {
    count += await getDescendantsCount(child.id);
  }
  return count;
};

// Get members by branch
export const getMembersByBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branch } = req.params;
    const { page = '1', limit = '20', search = '' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { branch: branch as any };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { profession: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.familyMember.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        select: { id: true, name: true, photo: true, generation: true, isAlive: true, profession: true, dob: true },
        orderBy: [{ generation: 'asc' }, { name: 'asc' }],
      }),
      prisma.familyMember.count({ where }),
    ]);

    res.json({ success: true, data: members, pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, pages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch branch members' });
  }
};

// Search members
export const searchMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const members = await prisma.familyMember.findMany({
      where: {
        OR: [
          { name: { contains: q as string, mode: 'insensitive' } },
          { nameUrdu: { contains: q as string, mode: 'insensitive' } },
          { profession: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: { id: true, name: true, photo: true, branch: true, generation: true, isAlive: true },
    });

    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// Request to add a new family member
export const requestAddMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { relationType, relativeId, newMemberData } = req.body;

    // Duplicate detection
    if (newMemberData.name) {
      const possible = await prisma.familyMember.findMany({
        where: { name: { contains: newMemberData.name, mode: 'insensitive' } },
        select: { id: true, name: true, fatherId: true, branch: true },
      });
      if (possible.length > 0) {
        res.json({
          success: true,
          possibleDuplicates: possible,
          message: 'Possible duplicates found. Please confirm this is a new person.',
        });
        return;
      }
    }

    const request = await prisma.memberRequest.create({
      data: {
        requesterId: req.user!.userId,
        memberId: relativeId,
        relationType,
        newMemberData,
        status: 'PENDING',
      },
    });

    // Notify admins via audit log
    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'MEMBER_REQUEST_CREATED', resource: 'member_requests', details: { requestId: request.id, relationType } },
    });

    res.status(201).json({ success: true, message: 'Request submitted for admin approval', data: request });
  } catch (error) {
    logger.error('Request add member error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit request' });
  }
};

// Admin: approve/reject member request
export const reviewMemberRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const request = await prisma.memberRequest.findUnique({ where: { id } });
    if (!request) { res.status(404).json({ success: false, message: 'Request not found' }); return; }

    if (status === 'APPROVED') {
      const data = request.newMemberData as any;

      // Determine fatherId based on relation
      let fatherId: string | undefined;
      let motherId: string | undefined;

      if (request.relationType === 'SON' || request.relationType === 'DAUGHTER') {
        const parent = await prisma.familyMember.findUnique({ where: { id: request.memberId! } });
        if (parent?.gender === 'MALE') fatherId = parent.id;
        else motherId = parent?.id;
      } else if (request.relationType === 'FATHER') {
        // Will be linked
      }

      // Get branch & generation from relative
      let branch = data.branch;
      let generation = data.generation || 1;
      if (request.memberId) {
        const relative = await prisma.familyMember.findUnique({ where: { id: request.memberId } });
        if (relative) {
          branch = branch || relative.branch;
          generation = request.relationType === 'SON' || request.relationType === 'DAUGHTER'
            ? relative.generation + 1
            : request.relationType === 'FATHER' ? relative.generation - 1 : relative.generation;
        }
      }

      const newMember = await prisma.familyMember.create({
        data: {
          name: data.name,
          nameUrdu: data.nameUrdu,
          fatherId: fatherId || data.fatherId,
          motherId: motherId || data.motherId,
          branch: branch || 'UNASSIGNED',
          generation,
          gender: data.gender || 'MALE',
          dob: data.dob ? new Date(data.dob) : undefined,
          profession: data.profession,
          phone: data.phone,
          notes: data.notes,
        },
      });

      // If adding son/daughter, update child's fatherId
      if (request.relationType === 'SON' || request.relationType === 'DAUGHTER') {
        // Already set via fatherId above
      }

      await prisma.memberRequest.update({
        where: { id },
        data: { status: 'APPROVED', adminNote },
      });

      await deleteCachePattern('family:');
      res.json({ success: true, message: 'Member added to family tree', data: newMember });
    } else {
      await prisma.memberRequest.update({ where: { id }, data: { status: 'REJECTED', adminNote } });
      res.json({ success: true, message: 'Request rejected' });
    }
  } catch (error) {
    logger.error('Review member request error:', error);
    res.status(500).json({ success: false, message: 'Failed to review request' });
  }
};

// Admin: directly add member
export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const member = await prisma.familyMember.create({
      data: {
        name: data.name,
        nameUrdu: data.nameUrdu,
        fatherId: data.fatherId || null,
        motherId: data.motherId || null,
        spouseId: data.spouseId || null,
        branch: data.branch || 'UNASSIGNED',
        generation: data.generation || 1,
        gender: data.gender || 'MALE',
        dob: data.dob ? new Date(data.dob) : undefined,
        dod: data.dod ? new Date(data.dod) : undefined,
        profession: data.profession,
        phone: data.phone,
        email: data.email,
        photo: data.photo,
        notes: data.notes,
        isAlive: data.isAlive !== false,
      },
    });

    await deleteCachePattern('family:');
    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'MEMBER_ADDED', resource: 'family_members', details: { memberId: member.id } },
    });

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    logger.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Failed to add member' });
  }
};

export const updateMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const member = await prisma.familyMember.update({
      where: { id },
      data: {
        ...req.body,
        dob: req.body.dob ? new Date(req.body.dob) : undefined,
        dod: req.body.dod ? new Date(req.body.dod) : undefined,
        updatedAt: new Date(),
      },
    });
    await deleteCachePattern('family:');
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update member' });
  }
};

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = 'family:stats';
    const cached = await getCache(cacheKey);
    if (cached) { res.json({ success: true, data: cached }); return; }

    const [totalMembers, branches, aliveCount] = await Promise.all([
      prisma.familyMember.count(),
      prisma.familyMember.groupBy({ by: ['branch'], _count: { id: true } }),
      prisma.familyMember.count({ where: { isAlive: true } }),
    ]);

    const stats = {
      totalMembers,
      totalBranches: branches.length,
      aliveMembers: aliveCount,
      deceasedMembers: totalMembers - aliveCount,
      branchBreakdown: branches.map(b => ({ branch: b.branch, count: b._count.id })),
    };

    await setCache(cacheKey, stats, 3600);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

export const getPendingRequests = async (_req: Request, res: Response): Promise<void> => {
  try {
    const requests = await prisma.memberRequest.findMany({
      where: { status: 'PENDING' },
      include: { requester: { select: { name: true, phone: true } }, member: { select: { name: true, branch: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};
