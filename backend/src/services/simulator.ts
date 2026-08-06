import { prisma } from '../utils/db';
import { webSocketService } from './websocket';
import { Severity } from '@prisma/client';

const VIOLATION_TYPES = [
  { type: 'No Helmet', severity: Severity.HIGH },
  { type: 'No Safety Vest', severity: Severity.MEDIUM },
  { type: 'No Safety Harness', severity: Severity.HIGH },
  { type: 'No Gloves', severity: Severity.LOW },
  { type: 'No Safety Boots', severity: Severity.MEDIUM },
];

class SimulatorService {
  private isActive: boolean = true;
  private intervalSeconds: number = 20; // Default to 20 seconds for demo visibility
  private escalationTimeoutSeconds: number = 600; // Default to 10 minutes (600s)
  
  private simulationTimer: NodeJS.Timeout | null = null;
  private escalationTimer: NodeJS.Timeout | null = null;
  private escalatedIds = new Set<string>();

  public start() {
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

  public stop() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    if (this.escalationTimer) {
      clearInterval(this.escalationTimer);
      this.escalationTimer = null;
    }
  }

  public getSettings() {
    return {
      isActive: this.isActive,
      intervalSeconds: this.intervalSeconds,
      escalationTimeoutSeconds: this.escalationTimeoutSeconds,
    };
  }

  public configure(isActive: boolean, intervalSeconds: number, escalationTimeoutSeconds: number) {
    this.isActive = isActive;
    this.intervalSeconds = Math.max(2, intervalSeconds); // Minimum 2s to prevent crash
    this.escalationTimeoutSeconds = Math.max(1, escalationTimeoutSeconds); // Minimum 1s
    
    // Restart with new settings
    this.start();
  }

  public async triggerRandomViolation(specificWorkerId?: string): Promise<any> {
    try {
      let worker;
      if (specificWorkerId) {
        worker = await prisma.worker.findUnique({
          where: { id: specificWorkerId },
          include: { site: true },
        });
      } else {
        const count = await prisma.worker.count();
        if (count === 0) return null;
        
        const skip = Math.floor(Math.random() * count);
        worker = await prisma.worker.findFirst({
          skip,
          include: { site: true },
        });
      }

      if (!worker) return null;

      // Pick a random violation type
      const violationType = VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)];

      const violation = await prisma.violation.create({
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
      webSocketService.broadcast('NEW_VIOLATION', violation, worker.siteId);

      return violation;
    } catch (error) {
      console.error('Error triggering simulated violation:', error);
      return null;
    }
  }

  private async checkEscalations() {
    try {
      const cutoffTime = new Date(Date.now() - this.escalationTimeoutSeconds * 1000);

      // Find all unacknowledged violations created before the cutoff that we haven't already marked as escalated in-memory
      const escalations = await prisma.violation.findMany({
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
        webSocketService.broadcast('VIOLATION_ESCALATED', violation);
      }
    } catch (error) {
      console.error('Error checking escalations:', error);
    }
  }

  public clearEscalatedId(id: string) {
    this.escalatedIds.delete(id);
  }
}

export const simulatorService = new SimulatorService();
