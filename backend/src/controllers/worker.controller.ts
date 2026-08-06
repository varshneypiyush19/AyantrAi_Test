import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/db';

export async function getWorkers(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Supervisors only see workers assigned to their site
    if (user.role === 'SUPERVISOR') {
      if (!user.siteId) {
        return res.status(400).json({ error: 'Supervisor is not assigned to a site' });
      }
      const workers = await prisma.worker.findMany({
        where: { siteId: user.siteId },
        include: { site: true },
        orderBy: { id: 'asc' },
      });
      return res.json(workers);
    }

    // Admins see all workers
    const workers = await prisma.worker.findMany({
      include: { site: true },
      orderBy: { id: 'asc' },
    });
    return res.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    return res.status(500).json({ error: 'Failed to retrieve workers list' });
  }
}
