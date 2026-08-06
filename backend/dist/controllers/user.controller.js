"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupervisor = createSupervisor;
exports.getSupervisors = getSupervisors;
const db_1 = require("../utils/db");
const bcrypt = __importStar(require("bcryptjs"));
const client_1 = require("@prisma/client");
async function createSupervisor(req, res) {
    try {
        const { name, email, password, siteId } = req.body;
        if (!name || !email || !password || !siteId) {
            return res.status(400).json({ error: 'Name, email, password, and siteId are required' });
        }
        // Verify email unique
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'A user with this email address already exists' });
        }
        // Verify site exists
        const site = await db_1.prisma.site.findUnique({
            where: { id: siteId },
        });
        if (!site) {
            return res.status(404).json({ error: 'Assigned site not found' });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        // Create user
        const newUser = await db_1.prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: client_1.Role.SUPERVISOR,
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
    }
    catch (error) {
        console.error('Error creating supervisor:', error);
        return res.status(500).json({ error: 'Failed to create supervisor account' });
    }
}
async function getSupervisors(req, res) {
    try {
        const supervisors = await db_1.prisma.user.findMany({
            where: { role: client_1.Role.SUPERVISOR },
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
    }
    catch (error) {
        console.error('Error listing supervisors:', error);
        return res.status(500).json({ error: 'Failed to retrieve supervisors list' });
    }
}
