import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Worker {
  id: string;
  name: string;
  jobProfile: string;
  department: string;
  site: {
    id: string;
    name: string;
    location: string;
  };
}

export interface Violation {
  id: string;
  workerId: string;
  worker: Worker;
  type: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  isAcknowledged: boolean;
  acknowledgedById: string | null;
  acknowledgedBy: { name: string; email: string } | null;
  acknowledgedAt: string | null;
}

interface ViolationContextType {
  violations: Violation[];
  escalatedViolations: Violation[];
  isLoading: boolean;
  acknowledgeViolation: (id: string) => Promise<void>;
  triggerSimulation: (workerId?: string) => Promise<void>;
  fetchViolations: () => Promise<void>;
  socketStatus: 'connecting' | 'open' | 'closed';
}

const ViolationContext = createContext<ViolationContextType | undefined>(undefined);

export const ViolationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [escalatedViolations, setEscalatedViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'open' | 'closed'>('closed');

  // Fetch active violations
  const fetchViolations = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // Fetch open/unacknowledged violations
      const openRes = await fetch(`${import.meta.env.VITE_API_URL}/api/violations?isAcknowledged=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (openRes.ok) {
        const data = await openRes.json();
        setViolations(data);
      }

      // If user is Admin, also fetch escalated alerts
      if (user?.role === 'ADMIN') {
        const escRes = await fetch(`${import.meta.env.VITE_API_URL}/api/violations?escalatedOnly=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (escRes.ok) {
          const data = await escRes.json();
          setEscalatedViolations(data);
        }
      }
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchViolations();

      // Establish WebSocket connection
      setSocketStatus('connecting');
      const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}?token=${token}`);

      ws.onopen = () => {
        console.log('[WS] Connected to safety compliance WebSocket server');
        setSocketStatus('open');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const { type, data } = message;

        console.log(`[WS] Event received: ${type}`, data);

        if (type === 'NEW_VIOLATION') {
          // Add to open violations list
          setViolations((prev) => [data, ...prev]);
        } 
        else if (type === 'VIOLATION_ACKNOWLEDGED') {
          // Remove from open list
          setViolations((prev) => prev.filter((v) => v.id !== data.id));
          // Remove from escalated list
          setEscalatedViolations((prev) => prev.filter((v) => v.id !== data.id));
        } 
        else if (type === 'VIOLATION_ESCALATED') {
          // Add to escalated list for Admins
          if (user.role === 'ADMIN') {
            setEscalatedViolations((prev) => {
              if (prev.some((v) => v.id === data.id)) return prev;
              return [data, ...prev];
            });
          }
        }
      };

      ws.onclose = () => {
        console.log('[WS] Connection closed');
        setSocketStatus('closed');
      };

      ws.onerror = (error) => {
        console.error('[WS] Connection error:', error);
        setSocketStatus('closed');
      };

      return () => {
        ws.close();
      };
    } else {
      setViolations([]);
      setEscalatedViolations([]);
      setSocketStatus('closed');
    }
  }, [token, user]);

  // Acknowledge a violation
  const acknowledgeViolation = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/violations/${id}/acknowledge`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to acknowledge violation');
      }

      await res.json();
      // Remove from lists locally (ws will also trigger this, but updating locally makes it instant)
      setViolations((prev) => prev.filter((v) => v.id !== id));
      setEscalatedViolations((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      console.error('Failed to acknowledge violation:', error);
      alert(error instanceof Error ? error.message : 'Error acknowledging violation');
    }
  };

  // Trigger manual simulation violation
  const triggerSimulation = async (workerId?: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/simulator/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workerId }),
      });
      if (!res.ok) {
        throw new Error('Failed to trigger simulation');
      }
    } catch (error) {
      console.error('Error triggering simulation:', error);
    }
  };

  return (
    <ViolationContext.Provider
      value={{
        violations,
        escalatedViolations,
        isLoading,
        acknowledgeViolation,
        triggerSimulation,
        fetchViolations,
        socketStatus,
      }}
    >
      {children}
    </ViolationContext.Provider>
  );
};

export const useViolations = () => {
  const context = useContext(ViolationContext);
  if (context === undefined) {
    throw new Error('useViolations must be used within a ViolationProvider');
  }
  return context;
};
