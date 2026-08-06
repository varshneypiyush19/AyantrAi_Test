import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { simulatorService } from '../services/simulator';

export async function getAdminDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    const settings = simulatorService.getSettings();
    const cutoffTime = new Date(Date.now() - settings.escalationTimeoutSeconds * 1000);

    // 1. Core counters
    const totalSites = await prisma.site.count();
    const totalWorkers = await prisma.worker.count();
    const totalSupervisors = await prisma.user.count({ where: { role: 'SUPERVISOR' } });
    
    const openViolations = await prisma.violation.count({
      where: { isAcknowledged: false },
    });

    const escalatedViolations = await prisma.violation.count({
      where: {
        isAcknowledged: false,
        timestamp: { lt: cutoffTime },
      },
    });

    // 2. Fetch all violations for charts computation
    const violations = await prisma.violation.findMany({
      include: {
        worker: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // 3. Compute chart: Violations by Department
    const deptMap: { [key: string]: number } = {};
    // Seed department map with known departments
    const departments = await prisma.worker.groupBy({
      by: ['department'],
    });
    departments.forEach(d => { deptMap[d.department] = 0; });

    violations.forEach((v) => {
      if (v.worker && v.worker.department) {
        deptMap[v.worker.department] = (deptMap[v.worker.department] || 0) + 1;
      }
    });
    const violationsByDepartment = Object.keys(deptMap).map((dept) => ({
      department: dept,
      count: deptMap[dept],
    }));

    // 4. Compute chart: Violations by Type
    const typeMap: { [key: string]: number } = {};
    violations.forEach((v) => {
      typeMap[v.type] = (typeMap[v.type] || 0) + 1;
    });
    const violationsByType = Object.keys(typeMap).map((type) => ({
      type,
      count: typeMap[type],
    }));

    // 5. Compute chart: Violations trend (grouped by date/hour)
    // We group by last 7 days
    const trendMap: { [key: string]: number } = {};
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(day => { trendMap[day] = 0; });

    violations.forEach((v) => {
      const day = v.timestamp.toISOString().split('T')[0];
      if (day in trendMap) {
        trendMap[day]++;
      }
    });

    const violationsTrend = Object.keys(trendMap).sort().map((day) => ({
      date: day,
      count: trendMap[day],
    }));

    return res.json({
      metrics: {
        totalSites,
        totalWorkers,
        totalSupervisors,
        openViolations,
        escalatedViolations,
      },
      charts: {
        violationsByDepartment,
        violationsByType,
        violationsTrend,
      },
      simulationSettings: settings,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
}

export async function getSupervisorDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.siteId) {
      return res.status(400).json({ error: 'Supervisor is not assigned to a client site' });
    }

    const siteId = user.siteId;

    // Get site name
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return res.status(404).json({ error: 'Assigned site not found' });
    }

    // Site metrics
    const totalWorkers = await prisma.worker.count({
      where: { siteId },
    });

    const openViolations = await prisma.violation.count({
      where: {
        isAcknowledged: false,
        worker: { siteId },
      },
    });

    const acknowledgedViolations = await prisma.violation.count({
      where: {
        isAcknowledged: true,
        worker: { siteId },
      },
    });

    // Recent 10 violations
    const recentViolations = await prisma.violation.findMany({
      where: {
        worker: { siteId },
      },
      include: {
        worker: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    return res.json({
      site: {
        id: site.id,
        name: site.name,
        location: site.location,
      },
      metrics: {
        totalWorkers,
        openViolations,
        acknowledgedViolations,
      },
      recentViolations,
    });
  } catch (error) {
    console.error('Error fetching supervisor dashboard data:', error);
    return res.status(500).json({ error: 'Failed to retrieve supervisor dashboard metrics' });
  }
}
