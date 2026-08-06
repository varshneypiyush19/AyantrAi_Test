import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export async function createSupervisor(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, password, siteId } = req.body;

    if (!name || !email || !password || !siteId) {
      return res.status(400).json({ error: 'Name, email, password, and siteId are required' });
    }

    // Verify email unique
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists' });
    }

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return res.status(404).json({ error: 'Assigned site not found' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.SUPERVISOR,
        siteId,
      },
      include: {
        site: true,
      },
    });

    return res.status(201).json({
      message: 'Supervisor created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        siteId: newUser.siteId,
        site: {
          id: newUser.site?.id,
          name: newUser.site?.name,
        },
      },
    });
  } catch (error) {
    console.error('Error creating supervisor:', error);
    return res.status(500).json({ error: 'Failed to create supervisor account' });
  }
}

export async function getSupervisors(req: AuthenticatedRequest, res: Response) {
  try {
    const supervisors = await prisma.user.findMany({
      where: { role: Role.SUPERVISOR },
      include: {
        site: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = supervisors.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      siteId: s.siteId,
      site: s.site ? { id: s.site.id, name: s.site.name } : null,
      createdAt: s.createdAt,
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Error listing supervisors:', error);
    return res.status(500).json({ error: 'Failed to retrieve supervisors list' });
  }
}
