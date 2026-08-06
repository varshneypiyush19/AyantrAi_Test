import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useViolations } from '../context/ViolationContext';
import { 
  Users, AlertOctagon, CheckCircle2, Download, Clock, 
  MapPin, ShieldAlert, RefreshCw
} from 'lucide-react';

export const SupervisorPortal: React.FC = () => {
  const { token, user } = useAuth();
  const { violations, acknowledgeViolation, fetchViolations, isLoading } = useViolations();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/supervisor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [token, violations]); // Refresh statistics whenever violations state changes

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchDashboardStats(), fetchViolations()]);
    setIsRefreshing(false);
  };

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      window.open(`${import.meta.env.VITE_API_URL}/api/violations/export?token=${token}`, '_blank');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
  };

  const getSeverityStyles = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (severity) {
      case 'HIGH':
        return { backgroundColor: 'var(--color-danger-glow)', color: 'var(--color-danger)', border: '1px solid rgba(244, 63, 94, 0.2)' };
      case 'MEDIUM':
        return { backgroundColor: 'var(--color-warning-glow)', color: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.2)' };
      default:
        return { backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary-light)', border: '1px solid rgba(99, 102, 241, 0.2)' };
    }
  };

  // Filter violations to only show unacknowledged ones for the supervisor's site
  const siteActiveViolations = violations.filter(v => v.worker.site.id === user?.siteId);

  return (
    <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Site Header Banner */}
      {dashboardData?.site && (
        <div 
          className="glass-panel slide-in-card" 
          style={{
            padding: '24px 32px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.8))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary-light)', fontWeight: 700 }}>
              Monitoring Station
            </span>
            <h2 style={{ fontSize: '24px', marginTop: '4px' }}>{dashboardData.site.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
              <MapPin size={14} />
              <span>{dashboardData.site.location}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleRefresh} className="btn-secondary" style={{ padding: '10px 16px' }} disabled={isRefreshing}>
              <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} /> Refresh Feed
            </button>
            <button onClick={handleExportCSV} className="btn-primary" style={{ padding: '10px 16px' }}>
              <Download size={14} /> Export Site Report
            </button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Workers Metric */}
        <div className="glass-panel slide-in-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <Users size={28} color="var(--text-secondary)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Active Site Workers</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {dashboardData?.metrics?.totalWorkers ?? '--'}
            </div>
          </div>
        </div>

        {/* Open Violations Metric */}
        <div 
          className={`glass-panel slide-in-card ${siteActiveViolations.length > 0 ? 'pulse-critical' : ''}`}
          style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div style={{ 
            backgroundColor: siteActiveViolations.length > 0 ? 'var(--color-danger-glow)' : 'rgba(255,255,255,0.03)',
            border: siteActiveViolations.length > 0 ? '1px solid rgba(244,63,94,0.3)' : '1px solid var(--border-glass)', 
            padding: '16px', 
            borderRadius: 'var(--radius-md)' 
          }}>
            <AlertOctagon size={28} color={siteActiveViolations.length > 0 ? 'var(--color-danger)' : 'var(--text-secondary)'} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Open Safety Incidents</div>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              fontFamily: 'var(--font-display)', 
              marginTop: '4px',
              color: siteActiveViolations.length > 0 ? 'var(--color-danger)' : 'var(--text-primary)'
            }}>
              {siteActiveViolations.length}
            </div>
          </div>
        </div>

        {/* Acknowledged Violations Metric */}
        <div className="glass-panel slide-in-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <CheckCircle2 size={28} color="var(--color-success)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Acknowledged Today</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '4px', color: 'var(--color-success)' }}>
              {dashboardData?.metrics?.acknowledgedViolations ?? '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Active Violations List */}
        <div className="glass-panel slide-in-card" style={{ padding: '24px', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--color-danger)" />
              <h3 style={{ fontSize: '18px' }}>Real-time Safety Violations Feed</h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
              Auto-updating via WebSocket
            </span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw className="spin" size={24} color="var(--color-primary)" />
            </div>
          ) : siteActiveViolations.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '250px', alignItems: 'center', justifyContent: 'center', gap: '12px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
              <CheckCircle2 size={48} color="var(--color-success)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>All workers are compliant. No open safety incidents!</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Worker</th>
                    <th style={{ padding: '12px 16px' }}>Details</th>
                    <th style={{ padding: '12px 16px' }}>Equipment Issue</th>
                    <th style={{ padding: '12px 16px' }}>Time Triggered</th>
                    <th style={{ padding: '12px 16px' }}>Severity</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {siteActiveViolations.map((v) => (
                    <tr 
                      key={v.id} 
                      className="slide-in-card"
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.04)', 
                        fontSize: '13px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600 }}>{v.worker.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {v.worker.id}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div>{v.worker.jobProfile}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.worker.department}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--color-danger)', fontWeight: 500 }}>{v.type}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} color="var(--text-muted)" />
                          <span>{formatDate(v.timestamp)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span 
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            ...getSeverityStyles(v.severity),
                          }}
                        >
                          {v.severity}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => acknowledgeViolation(v.id)} 
                          className="btn-primary" 
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: 'linear-gradient(135deg, var(--color-success), #34d399)',
                            boxShadow: '0 0 10px var(--color-success-glow)',
                          }}
                        >
                          Acknowledge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
