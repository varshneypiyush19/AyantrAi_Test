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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const dotenv = __importStar(require("dotenv"));
// Load env variables
dotenv.config();
const auth_1 = require("./middleware/auth");
const auth_controller_1 = require("./controllers/auth.controller");
const dashboard_controller_1 = require("./controllers/dashboard.controller");
const worker_controller_1 = require("./controllers/worker.controller");
const violation_controller_1 = require("./controllers/violation.controller");
const site_controller_1 = require("./controllers/site.controller");
const user_controller_1 = require("./controllers/user.controller");
const simulator_1 = require("./services/simulator");
const websocket_1 = require("./services/websocket");
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
const port = process.env.PORT || 5001;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Public Routes
app.post('/api/auth/login', auth_controller_1.login);
// Authenticated Routes
app.get('/api/auth/me', auth_1.authenticateJWT, auth_controller_1.getMe);
app.get('/api/sites', auth_1.authenticateJWT, site_controller_1.getSites);
app.get('/api/workers', auth_1.authenticateJWT, worker_controller_1.getWorkers);
// Violations
app.get('/api/violations', auth_1.authenticateJWT, violation_controller_1.getViolations);
app.get('/api/violations/export', auth_1.authenticateJWT, violation_controller_1.exportViolationsCSV);
app.put('/api/violations/:id/acknowledge', auth_1.authenticateJWT, violation_controller_1.acknowledgeViolation);
// Admin Only - Supervisors
app.post('/api/users/supervisors', auth_1.authenticateJWT, (0, auth_1.requireRole)([client_1.Role.ADMIN]), user_controller_1.createSupervisor);
app.get('/api/users/supervisors', auth_1.authenticateJWT, (0, auth_1.requireRole)([client_1.Role.ADMIN]), user_controller_1.getSupervisors);
// Dashboards
app.get('/api/dashboard/admin', auth_1.authenticateJWT, (0, auth_1.requireRole)([client_1.Role.ADMIN]), dashboard_controller_1.getAdminDashboard);
app.get('/api/dashboard/supervisor', auth_1.authenticateJWT, (0, auth_1.requireRole)([client_1.Role.SUPERVISOR]), dashboard_controller_1.getSupervisorDashboard);
// Simulator Routes (Protected, readable/writable by authenticated users for testing)
app.get('/api/simulator/settings', auth_1.authenticateJWT, (req, res) => {
    res.json(simulator_1.simulatorService.getSettings());
});
app.post('/api/simulator/configure', auth_1.authenticateJWT, (req, res) => {
    const { isActive, intervalSeconds, escalationTimeoutSeconds } = req.body;
    if (isActive === undefined || !intervalSeconds || !escalationTimeoutSeconds) {
        return res.status(400).json({ error: 'isActive, intervalSeconds, and escalationTimeoutSeconds are required' });
    }
    simulator_1.simulatorService.configure(Boolean(isActive), Number(intervalSeconds), Number(escalationTimeoutSeconds));
    return res.json({
        message: 'Simulator configured successfully',
        settings: simulator_1.simulatorService.getSettings(),
    });
});
app.post('/api/simulator/trigger', auth_1.authenticateJWT, async (req, res) => {
    const { workerId } = req.body;
    const violation = await simulator_1.simulatorService.triggerRandomViolation(workerId);
    if (!violation) {
        return res.status(500).json({ error: 'Failed to trigger simulated violation' });
    }
    return res.json({
        message: 'Violation triggered successfully',
        violation,
    });
});
// Root route healthcheck
app.get('/', (req, res) => {
    res.json({ status: 'healthy', service: 'PPE Compliance API' });
});
// Create HTTP server
const server = (0, http_1.createServer)(app);
// Initialize WebSockets
websocket_1.webSocketService.initialize(server);
// Start IoT simulator service
simulator_1.simulatorService.start();
// Listen
server.listen(port, () => {
    console.log(`[SERVER] Running at PORT :${port}`);
    console.log(`[WS] Server upgrades supported on PORT :${port}`);
});
