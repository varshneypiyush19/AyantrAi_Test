import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import * as dotenv from 'dotenv';

// Load env variables
dotenv.config();

import { authenticateJWT, requireRole } from './middleware/auth';
import { login, getMe } from './controllers/auth.controller';
import { getAdminDashboard, getSupervisorDashboard } from './controllers/dashboard.controller';
import { getWorkers } from './controllers/worker.controller';
import { getViolations, acknowledgeViolation, exportViolationsCSV } from './controllers/violation.controller';
import { getSites } from './controllers/site.controller';
import { createSupervisor, getSupervisors } from './controllers/user.controller';
import { simulatorService } from './services/simulator';
import { webSocketService } from './services/websocket';
import { Role } from '@prisma/client';

const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Public Routes
app.post('/api/auth/login', login);

// Authenticated Routes
app.get('/api/auth/me', authenticateJWT, getMe);
app.get('/api/sites', authenticateJWT, getSites);
app.get('/api/workers', authenticateJWT, getWorkers);

// Violations
app.get('/api/violations', authenticateJWT, getViolations);
app.get('/api/violations/export', authenticateJWT, exportViolationsCSV);
app.put('/api/violations/:id/acknowledge', authenticateJWT, acknowledgeViolation);

// Admin Only - Supervisors
app.post('/api/users/supervisors', authenticateJWT, requireRole([Role.ADMIN]), createSupervisor);
app.get('/api/users/supervisors', authenticateJWT, requireRole([Role.ADMIN]), getSupervisors);

// Dashboards
app.get('/api/dashboard/admin', authenticateJWT, requireRole([Role.ADMIN]), getAdminDashboard);
app.get('/api/dashboard/supervisor', authenticateJWT, requireRole([Role.SUPERVISOR]), getSupervisorDashboard);

// Simulator Routes (Protected, readable/writable by authenticated users for testing)
app.get('/api/simulator/settings', authenticateJWT, (req, res) => {
  res.json(simulatorService.getSettings());
});

app.post('/api/simulator/configure', authenticateJWT, (req, res) => {
  const { isActive, intervalSeconds, escalationTimeoutSeconds } = req.body;
  
  if (isActive === undefined || !intervalSeconds || !escalationTimeoutSeconds) {
    return res.status(400).json({ error: 'isActive, intervalSeconds, and escalationTimeoutSeconds are required' });
  }

  simulatorService.configure(
    Boolean(isActive),
    Number(intervalSeconds),
    Number(escalationTimeoutSeconds)
  );

  return res.json({
    message: 'Simulator configured successfully',
    settings: simulatorService.getSettings(),
  });
});

app.post('/api/simulator/trigger', authenticateJWT, async (req, res) => {
  const { workerId } = req.body;
  const violation = await simulatorService.triggerRandomViolation(workerId);
  
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
const server = createServer(app);

// Initialize WebSockets
webSocketService.initialize(server);

// Start IoT simulator service
simulatorService.start();

// Listen
server.listen(port, () => {
  console.log(`[SERVER] Running at http://localhost:${port}`);
  console.log(`[WS] Server upgrades supported on http://localhost:${port}`);
});
