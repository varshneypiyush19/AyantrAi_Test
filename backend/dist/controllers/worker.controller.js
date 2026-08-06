"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkers = getWorkers;
const db_1 = require("../utils/db");
async function getWorkers(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Supervisors only see workers assigned to their site
        if (user.role === 'SUPERVISOR') {
            if (!user.siteId) {
                return res.status(400).json({ error: 'Supervisor is not assigned to a site' });
            }
            const workers = await db_1.prisma.worker.findMany({
                where: { siteId: user.siteId },
                include: { site: true },
                orderBy: { id: 'asc' },
            });
            return res.json(workers);
        }
        // Admins see all workers
        const workers = await db_1.prisma.worker.findMany({
            include: { site: true },
            orderBy: { id: 'asc' },
        });
        return res.json(workers);
    }
    catch (error) {
        console.error('Error fetching workers:', error);
        return res.status(500).json({ error: 'Failed to retrieve workers list' });
    }
}
