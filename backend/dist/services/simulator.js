"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulatorService = void 0;
const db_1 = require("../utils/db");
const websocket_1 = require("./websocket");
const client_1 = require("@prisma/client");
const VIOLATION_TYPES = [
    { type: 'No Helmet', severity: client_1.Severity.HIGH },
    { type: 'No Safety Vest', severity: client_1.Severity.MEDIUM },
    { type: 'No Safety Harness', severity: client_1.Severity.HIGH },
    { type: 'No Gloves', severity: client_1.Severity.LOW },
    { type: 'No Safety Boots', severity: client_1.Severity.MEDIUM },
];
class SimulatorService {
    isActive = true;
    intervalSeconds = 20; // Default to 20 seconds for demo visibility
    escalationTimeoutSeconds = 600; // Default to 10 minutes (600s)
    simulationTimer = null;
    escalationTimer = null;
    escalatedIds = new Set();
    start() {
        this.stop(); // Clear any existing timers
        console.log(`Starting simulator: active=${this.isActive}, interval=${this.intervalSeconds}s, escalation=${this.escalationTimeoutSeconds}s`);
        // Start auto-generation timer if active
        if (this.isActive) {
            this.simulationTimer = setInterval(() => {
                this.triggerRandomViolation();
            }, this.intervalSeconds * 1000);
        }
        // Start escalation checking loop (runs every 2 seconds for high responsiveness)
        this.escalationTimer = setInterval(() => {
            this.checkEscalations();
        }, 2000);
    }
    stop() {
        if (this.simulationTimer) {
            clearInterval(this.simulationTimer);
            this.simulationTimer = null;
        }
        if (this.escalationTimer) {
            clearInterval(this.escalationTimer);
            this.escalationTimer = null;
        }
    }
    getSettings() {
        return {
            isActive: this.isActive,
            intervalSeconds: this.intervalSeconds,
            escalationTimeoutSeconds: this.escalationTimeoutSeconds,
        };
    }
    configure(isActive, intervalSeconds, escalationTimeoutSeconds) {
        this.isActive = isActive;
        this.intervalSeconds = Math.max(2, intervalSeconds); // Minimum 2s to prevent crash
        this.escalationTimeoutSeconds = Math.max(1, escalationTimeoutSeconds); // Minimum 1s
        // Restart with new settings
        this.start();
    }
    async triggerRandomViolation(specificWorkerId) {
        try {
            let worker;
            if (specificWorkerId) {
                worker = await db_1.prisma.worker.findUnique({
                    where: { id: specificWorkerId },
                    include: { site: true },
                });
            }
            else {
                const count = await db_1.prisma.worker.count();
                if (count === 0)
                    return null;
                const skip = Math.floor(Math.random() * count);
                worker = await db_1.prisma.worker.findFirst({
                    skip,
                    include: { site: true },
                });
            }
            if (!worker)
                return null;
            // Pick a random violation type
            const violationType = VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)];
            const violation = await db_1.prisma.violation.create({
                data: {
                    workerId: worker.id,
                    type: violationType.type,
                    severity: violationType.severity,
                    timestamp: new Date(),
                },
                include: {
                    worker: {
                        include: {
                            site: true,
                        },
                    },
                },
            });
            console.log(`[SIMULATOR] Triggered violation: Worker ${worker.name} (${worker.id}) - ${violationType.type} at ${worker.site.name}`);
            // Broadcast to supervisors (of this site) and admins
            websocket_1.webSocketService.broadcast('NEW_VIOLATION', violation, worker.siteId);
            return violation;
        }
        catch (error) {
            console.error('Error triggering simulated violation:', error);
            return null;
        }
    }
    async checkEscalations() {
        try {
            const cutoffTime = new Date(Date.now() - this.escalationTimeoutSeconds * 1000);
            // Find all unacknowledged violations created before the cutoff that we haven't already marked as escalated in-memory
            const escalations = await db_1.prisma.violation.findMany({
                where: {
                    isAcknowledged: false,
                    timestamp: {
                        lt: cutoffTime,
                    },
                    id: {
                        notIn: Array.from(this.escalatedIds),
                    },
                },
                include: {
                    worker: {
                        include: {
                            site: true,
                        },
                    },
                },
            });
            for (const violation of escalations) {
                this.escalatedIds.add(violation.id);
                console.log(`[SIMULATOR] Escalated violation: ${violation.id} (Worker: ${violation.worker.name}) - Unacknowledged for ${this.escalationTimeoutSeconds}s`);
                // Broadcast escalation to Admins (passing null so it only goes to admins/receivers who receive all)
                // Since websocket service sends to admin, we pass siteId as undefined or call broadcast
                websocket_1.webSocketService.broadcast('VIOLATION_ESCALATED', violation);
            }
        }
        catch (error) {
            console.error('Error checking escalations:', error);
        }
    }
    clearEscalatedId(id) {
        this.escalatedIds.delete(id);
    }
}
exports.simulatorService = new SimulatorService();
