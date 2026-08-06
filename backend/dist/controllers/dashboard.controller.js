"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboard = getAdminDashboard;
exports.getSupervisorDashboard = getSupervisorDashboard;
const db_1 = require("../utils/db");
const simulator_1 = require("../services/simulator");
async function getAdminDashboard(req, res) {
    try {
        const settings = simulator_1.simulatorService.getSettings();
        const cutoffTime = new Date(Date.now() - settings.escalationTimeoutSeconds * 1000);
        // 1. Core counters
        const totalSites = await db_1.prisma.site.count();
        const totalWorkers = await db_1.prisma.worker.count();
        const totalSupervisors = await db_1.prisma.user.count({ where: { role: 'SUPERVISOR' } });
        const openViolations = await db_1.prisma.violation.count({
            where: { isAcknowledged: false },
        });
        const escalatedViolations = await db_1.prisma.violation.count({
            where: {
                isAcknowledged: false,
                timestamp: { lt: cutoffTime },
            },
        });
        // 2. Fetch all violations for charts computation
        const violations = await db_1.prisma.violation.findMany({
            include: {
                worker: true,
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
        // 3. Compute chart: Violations by Department
        const deptMap = {};
        // Seed department map with known departments
        const departments = await db_1.prisma.worker.groupBy({
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
        const typeMap = {};
        violations.forEach((v) => {
            typeMap[v.type] = (typeMap[v.type] || 0) + 1;
        });
        const violationsByType = Object.keys(typeMap).map((type) => ({
            type,
            count: typeMap[type],
        }));
        // 5. Compute chart: Violations trend (grouped by date/hour)
        // We group by last 7 days
        const trendMap = {};
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
    }
    catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
    }
}
async function getSupervisorDashboard(req, res) {
    try {
        const user = req.user;
        if (!user || !user.siteId) {
            return res.status(400).json({ error: 'Supervisor is not assigned to a client site' });
        }
        const siteId = user.siteId;
        // Get site name
        const site = await db_1.prisma.site.findUnique({
            where: { id: siteId },
        });
        if (!site) {
            return res.status(404).json({ error: 'Assigned site not found' });
        }
        // Site metrics
        const totalWorkers = await db_1.prisma.worker.count({
            where: { siteId },
        });
        const openViolations = await db_1.prisma.violation.count({
            where: {
                isAcknowledged: false,
                worker: { siteId },
            },
        });
        const acknowledgedViolations = await db_1.prisma.violation.count({
            where: {
                isAcknowledged: true,
                worker: { siteId },
            },
        });
        // Recent 10 violations
        const recentViolations = await db_1.prisma.violation.findMany({
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
    }
    catch (error) {
        console.error('Error fetching supervisor dashboard data:', error);
        return res.status(500).json({ error: 'Failed to retrieve supervisor dashboard metrics' });
    }
}
