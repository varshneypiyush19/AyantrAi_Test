import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/db';

export async function getSites(req: AuthenticatedRequest, res: Response) {
  try {
    const sites = await prisma.site.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return res.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return res.status(500).json({ error: 'Failed to retrieve sites list' });
  }
}
