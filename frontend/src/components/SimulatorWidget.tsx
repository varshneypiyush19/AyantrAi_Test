import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useViolations } from '../context/ViolationContext';
import { Sliders, Play, Pause, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export const SimulatorWidget: React.FC = () => {
  const { token } = useAuth();
  const { triggerSimulation, socketStatus } = useViolations();
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(20);
  const [escalationSeconds, setEscalationSeconds] = useState(600);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch current simulator settings & workers
  useEffect(() => {
    if (!token) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/simulator/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsActive(data.isActive);
          setIntervalSeconds(data.intervalSeconds);
          setEscalationSeconds(data.escalationTimeoutSeconds);
        }
      } catch (err) {
        console.error('Failed to load simulator settings:', err);
      }
    };

    const fetchWorkers = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/workers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWorkers(data);
        }
      } catch (err) {
        console.error('Failed to load workers:', err);
      }
    };

    fetchSettings();
    fetchWorkers();
  }, [token]);

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsConfiguring(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:5001/api/simulator/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive,
          intervalSeconds,
          escalationTimeoutSeconds: escalationSeconds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage('Settings saved!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error updating settings');
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleTriggerViolation = async () => {
    await triggerSimulation(selectedWorkerId || undefined);
    setMessage('Violation triggered!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div 
      className="glass-panel" 
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '320px',
        zIndex: 9999,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '16px',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 15px rgba(99, 102, 241, 0.1)',
        background: 'rgba(13, 17, 28, 0.85)',
      }}
    >
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="#6366f1" />
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '15px' }}>
            IoT Device Simulator
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: socketStatus === 'open' ? 'var(--color-success)' : 'var(--color-danger)',
              display: 'inline-block',
            }}
            title={`WebSocket status: ${socketStatus}`}
          />
          {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          {/* Simulation status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            {isActive ? (
              <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
                <Play size={14} fill="var(--color-success)" /> Running automatically
              </span>
            ) : (
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
                <Pause size={14} fill="var(--text-secondary)" /> Simulation paused
              </span>
            )}
          </div>

          <form onSubmit={handleConfigure} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Auto-generate events</label>
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Generation Interval: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{intervalSeconds}s</span>
              </label>
              <input 
                type="range" 
                min="3" 
                max="120" 
                value={intervalSeconds} 
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Escalation Timeout: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {escalationSeconds >= 60 ? `${Math.round(escalationSeconds / 60)}m` : `${escalationSeconds}s`}
                </span>
              </label>
              <input 
                type="range" 
                min="5" 
                max="600" 
                step="5"
                value={escalationSeconds} 
                onChange={(e) => setEscalationSeconds(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                💡 Tip: Set to 10s for instant escalation testing!
              </span>
            </div>

            <button 
              type="submit" 
              className="btn-secondary" 
              style={{ padding: '8px 12px', width: '100%', fontSize: '12px', justifyContent: 'center' }}
              disabled={isConfiguring}
            >
              Apply Simulation Settings
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '16px', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Manual Overrides</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select 
                value={selectedWorkerId} 
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                style={{ padding: '8px', fontSize: '12px' }}
              >
                <option value="">-- Random Worker --</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id} - {w.name} ({w.jobProfile})
                  </option>
                ))}
              </select>

              <button 
                onClick={handleTriggerViolation} 
                className="btn-danger" 
                style={{ padding: '8px 12px', width: '100%', fontSize: '12px', justifyContent: 'center' }}
              >
                <AlertTriangle size={14} /> Dispatch Simulated Incident
              </button>
            </div>
          </div>

          {message && (
            <div 
              style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: 'var(--color-primary-light)', 
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
