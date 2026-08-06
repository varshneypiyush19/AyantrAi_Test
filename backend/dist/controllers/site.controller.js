"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSites = getSites;
const db_1 = require("../utils/db");
async function getSites(req, res) {
    try {
        const sites = await db_1.prisma.site.findMany({
            orderBy: {
                name: 'asc',
            },
        });
        return res.json(sites);
    }
    catch (error) {
        console.error('Error fetching sites:', error);
        return res.status(500).json({ error: 'Failed to retrieve sites list' });
    }
}
