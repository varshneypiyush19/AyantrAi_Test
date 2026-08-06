import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { simulatorService } from '../services/simulator';
import { webSocketService } from './websocket';

export async function getViolations(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { isAcknowledged, siteId, escalatedOnly } = req.query;
    const settings = simulatorService.getSettings();
    const cutoffTime = new Date(Date.now() - settings.escalationTimeoutSeconds * 1000);

    const whereClause: any = {};

    // 1. Enforce site security for supervisors
    if (user.role === 'SUPERVISOR') {
      if (!user.siteId) {
        return res.status(400).json({ error: 'Supervisor is not assigned to a site' });
      }
      whereClause.worker = { siteId: user.siteId };
    } else {
      // Admins can filter by site
      if (siteId) {
        whereClause.worker = { siteId: String(siteId) };
      }
    }

    // 2. Filter by acknowledgment status
    if (isAcknowledged !== undefined) {
      whereClause.isAcknowledged = isAcknowledged === 'true';
    }

    // 3. Filter by escalation status
    if (escalatedOnly === 'true') {
      whereClause.isAcknowledged = false;
      whereClause.timestamp = { lt: cutoffTime };
    }

    const violations = await prisma.violation.findMany({
      where: whereClause,
      include: {
        worker: {
          include: {
            site: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return res.json(violations);
  } catch (error) {
    console.error('Error fetching violations:', error);
    return res.status(500).json({ error: 'Failed to retrieve violations list' });
  }
}

export async function acknowledgeViolation(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    // Check if violation exists
    const violation = await prisma.violation.findUnique({
      where: { id },
      include: {
        worker: true,
      },
    });

    if (!violation) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    // Supervisors can only acknowledge violations from their own site
    if (user.role === 'SUPERVISOR' && violation.worker.siteId !== user.siteId) {
      return res.status(403).json({ error: 'Forbidden: You cannot acknowledge violations from other sites' });
    }

    // Update violation
    const updatedViolation = await prisma.violation.update({
      where: { id },
      data: {
        isAcknowledged: true,
        acknowledgedById: user.userId,
        acknowledgedAt: new Date(),
      },
      include: {
        worker: {
          include: {
            site: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Clear from simulator in-memory escalation list so it doesn't check it
    simulatorService.clearEscalatedId(id);

    // Broadcast acknowledgement to all connected sockets
    webSocketService.broadcast('VIOLATION_ACKNOWLEDGED', updatedViolation, violation.worker.siteId);

    console.log(`[VIOLATION] Violation ${id} acknowledged by ${user.name} (${user.role})`);

    return res.json(updatedViolation);
  } catch (error) {
    console.error('Error acknowledging violation:', error);
    return res.status(500).json({ error: 'Failed to acknowledge violation' });
  }
}

export async function exportViolationsCSV(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const whereClause: any = {};
    if (user.role === 'SUPERVISOR') {
      if (!user.siteId) {
        return res.status(400).json({ error: 'Supervisor is not assigned to a site' });
      }
      whereClause.worker = { siteId: user.siteId };
    }

    const violations = await prisma.violation.findMany({
      where: whereClause,
      include: {
        worker: {
          include: {
            site: true,
          },
        },
        acknowledgedBy: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Generate CSV string
    const headers = [
      'Violation ID',
      'Worker ID',
      'Worker Name',
      'Job Profile',
      'Department',
      'Site Name',
      'Violation Type',
      'Timestamp',
      'Severity',
      'Status',
      'Acknowledged By',
      'Acknowledged At',
    ];

    const rows = violations.map((v) => [
      v.id,
      v.workerId,
      v.worker.name,
      v.worker.jobProfile,
      v.worker.department,
      v.worker.site.name,
      v.type,
      v.timestamp.toISOString(),
      v.severity,
      v.isAcknowledged ? 'Acknowledged' : 'Open',
      v.acknowledgedBy ? v.acknowledgedBy.name : 'N/A',
      v.acknowledgedAt ? v.acknowledgedAt.toISOString() : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=violations_report_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting violations CSV:', error);
    return res.status(500).json({ error: 'Failed to export CSV file' });
  }
}
