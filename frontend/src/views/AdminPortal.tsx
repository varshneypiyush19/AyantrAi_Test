import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useViolations, Violation } from '../context/ViolationContext';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { 
  LayoutDashboard, AlertTriangle, Users, BarChart3, Clock, 
  MapPin, Plus, UserPlus, Eye, Check, RefreshCw, AlertCircle
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { token } = useAuth();
  const { escalatedViolations, violations, fetchViolations, acknowledgeViolation } = useViolations();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'supervisors' | 'insights'>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  
  // Create Supervisor Form State
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPassword, setSupPassword] = useState('');
  const [supSiteId, setSupSiteId] = useState('');
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5001/api/dashboard/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  const fetchSupervisors = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5001/api/users/supervisors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSupervisors(data);
      }
    } catch (err) {
      console.error('Error loading supervisors:', err);
    }
  };

  const fetchSites = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5001/api/sites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch (err) {
      console.error('Error loading sites:', err);
    }
  };

  const loadAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchAdminStats(),
      fetchSupervisors(),
      fetchSites(),
      fetchViolations()
    ]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, [token, violations, escalatedViolations]); // Reload metrics whenever websocket triggers new events

  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5001/api/users/supervisors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: supName,
          email: supEmail,
          password: supPassword,
          siteId: supSiteId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFormMsg({ type: 'success', text: 'Supervisor account created successfully!' });
        setSupName('');
        setSupEmail('');
        setSupPassword('');
        setSupSiteId('');
        fetchSupervisors();
        fetchAdminStats();
      } else {
        setFormMsg({ type: 'error', text: data.error || 'Failed to create supervisor.' });
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: 'Error connecting to backend API.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
  };

  const getSeverityColor = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (severity) {
      case 'HIGH': return 'var(--color-danger)';
      case 'MEDIUM': return 'var(--color-warning)';
      default: return 'var(--color-primary-light)';
    }
  };

  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

  return (
    <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Admin Tab Navigation */}
      <div 
        className="glass-panel" 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="btn-secondary"
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              backgroundColor: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              borderColor: activeTab === 'dashboard' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'dashboard' ? 'var(--color-primary-light)' : 'var(--text-secondary)',
            }}
          >
            <LayoutDashboard size={14} /> Dashboard Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('alerts')} 
            className="btn-secondary"
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              backgroundColor: activeTab === 'alerts' ? 'var(--color-danger-glow)' : 'transparent',
              borderColor: activeTab === 'alerts' ? 'var(--color-danger)' : 'transparent',
              color: activeTab === 'alerts' ? 'var(--color-danger)' : 'var(--text-secondary)',
              position: 'relative',
            }}
          >
            <AlertTriangle size={14} /> Escalated Alerts
            {escalatedViolations.length > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--color-danger)',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '9px',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  boxShadow: '0 0 8px var(--color-danger)',
                }}
              >
                {escalatedViolations.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('supervisors')} 
            className="btn-secondary"
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              backgroundColor: activeTab === 'supervisors' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderColor: activeTab === 'supervisors' ? 'var(--color-success)' : 'transparent',
              color: activeTab === 'supervisors' ? 'var(--color-success)' : 'var(--text-secondary)',
            }}
          >
            <Users size={14} /> Supervisors
          </button>

          <button 
            onClick={() => setActiveTab('insights')} 
            className="btn-secondary"
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              backgroundColor: activeTab === 'insights' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: activeTab === 'insights' ? 'var(--border-glass-bright)' : 'transparent',
              color: activeTab === 'insights' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <BarChart3 size={14} /> Data Insights
          </button>
        </div>

        <button 
          onClick={loadAllData} 
          className="btn-secondary" 
          style={{ padding: '8px 12px' }}
          disabled={isRefreshing}
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
        </button>
      </div>

      {/* Metrics Row */}
      {activeTab === 'dashboard' && (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
          }}
        >
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>Client Sites</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {dashboardData?.metrics?.totalSites ?? '--'}
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>Supervisors Assigned</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {dashboardData?.metrics?.totalSupervisors ?? '--'}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>Monitored Workers</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {dashboardData?.metrics?.totalWorkers ?? '--'}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>Open Incidents</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '4px', color: 'var(--color-warning)' }}>
              {dashboardData?.metrics?.openViolations ?? '--'}
            </div>
          </div>

          <div 
            className="glass-panel" 
            style={{ 
              padding: '20px', 
              border: escalatedViolations.length > 0 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-glass)',
              boxShadow: escalatedViolations.length > 0 ? '0 0 15px rgba(244, 63, 94, 0.15)' : 'none'
            }}
          >
            <div style={{ color: escalatedViolations.length > 0 ? 'var(--color-danger)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
              Escalated Alerts (&gt;10m)
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              fontFamily: 'var(--font-display)', 
              marginTop: '4px',
              color: escalatedViolations.length > 0 ? 'var(--color-danger)' : 'var(--text-primary)'
            }}>
              {escalatedViolations.length}
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents */}
      
      {/* 1. Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--color-primary-light)" />
                <h3 style={{ fontSize: '18px' }}>Live Compliance Stream (All Sites)</h3>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Showing unacknowledged violations</span>
            </div>

            {violations.length === 0 ? (
              <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No active violations detected. Sites are compliant!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>Site</th>
                      <th style={{ padding: '12px 16px' }}>Worker</th>
                      <th style={{ padding: '12px 16px' }}>Equipment Issue</th>
                      <th style={{ padding: '12px 16px' }}>Time Triggered</th>
                      <th style={{ padding: '12px 16px' }}>Severity</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Admin Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <MapPin size={12} color="var(--text-muted)" />
                            <span>{v.worker.site.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 500 }}>{v.worker.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.worker.jobProfile} • {v.worker.department}</div>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--color-danger)', fontWeight: 500 }}>{v.type}</td>
                        <td style={{ padding: '16px' }}>{formatDate(v.timestamp)}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ color: getSeverityColor(v.severity), fontWeight: 700 }}>{v.severity}</span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button 
                            onClick={() => acknowledgeViolation(v.id)} 
                            className="btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                          >
                            Force Acknowledge
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
      )}

      {/* 2. Alerts Queue (Escalated Alerts) */}
      {activeTab === 'alerts' && (
        <div className="glass-panel" style={{ padding: '24px', minHeight: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={20} color="var(--color-danger)" />
            <h3 style={{ fontSize: '18px' }}>Escalated Compliance Alerts (Unacknowledged &gt; 10 Mins)</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            These critical safety violations have occurred but have not been acknowledged by the assigned site supervisor within the 10-minute safety threshold. Immediate action is recommended.
          </p>

          {escalatedViolations.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '250px', alignItems: 'center', justifyContent: 'center', gap: '12px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
              <Check size={48} color="var(--color-success)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No escalated alerts. Supervisors are acknowledging violations on time!</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Site</th>
                    <th style={{ padding: '12px 16px' }}>Worker</th>
                    <th style={{ padding: '12px 16px' }}>Equipment Issue</th>
                    <th style={{ padding: '12px 16px' }}>Time Triggered</th>
                    <th style={{ padding: '12px 16px' }}>Unresolved For</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {escalatedViolations.map((v) => {
                    const elapsedMs = Date.now() - new Date(v.timestamp).getTime();
                    const elapsedMins = Math.floor(elapsedMs / 60000);
                    return (
                      <tr 
                        key={v.id} 
                        className="pulse-critical" 
                        style={{ borderBottom: '1px solid rgba(244,63,94,0.1)', fontSize: '13px', backgroundColor: 'rgba(244, 63, 94, 0.02)' }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600 }}>{v.worker.site.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Location: {v.worker.site.location}</div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 500 }}>{v.worker.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {v.worker.id} • {v.worker.jobProfile}</div>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--color-danger)', fontWeight: 600 }}>{v.type}</td>
                        <td style={{ padding: '16px' }}>{formatDate(v.timestamp)}</td>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-danger)' }}>
                          {elapsedMins} mins
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button 
                            onClick={() => acknowledgeViolation(v.id)} 
                            className="btn-danger" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Resolve Alert
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Supervisors Tab */}
      {activeTab === 'supervisors' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Create Supervisor Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <UserPlus size={18} color="var(--color-success)" />
              <h3 style={{ fontSize: '18px' }}>Register New Site Supervisor</h3>
            </div>

            {formMsg && (
              <div 
                style={{
                  backgroundColor: formMsg.type === 'success' ? 'var(--color-success-glow)' : 'var(--color-danger-glow)',
                  border: `1px solid ${formMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                  color: formMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '20px',
                  fontSize: '13px',
                }}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateSupervisor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rohan Sharma" 
                  value={supName} 
                  onChange={(e) => setSupName(e.target.value)} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@safety.com" 
                  value={supEmail} 
                  onChange={(e) => setSupEmail(e.target.value)} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={supPassword} 
                  onChange={(e) => setSupPassword(e.target.value)} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Assigned Client Site</label>
                <select 
                  value={supSiteId} 
                  onChange={(e) => setSupSiteId(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '12px' }}
                >
                  <option value="">-- Select client site --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Supervisors List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Active Site Supervisors</h3>
            
            {supervisors.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No supervisors registered. Use the form to create one.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {supervisors.map((s) => (
                  <div 
                    key={s.id} 
                    style={{
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      background: 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Created: {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.email}</div>
                    
                    <div 
                      style={{ 
                        marginTop: '10px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '11px', 
                        color: 'var(--color-primary-light)',
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      <MapPin size={10} />
                      <span>{s.site?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Data Insights (Analytics Charts) */}
      {activeTab === 'insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Chart: Trend */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Violations Trend (Last 7 Days)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <LineChart data={dashboardData?.charts?.violationsTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-dark-obsidian)', borderColor: 'var(--border-glass)', color: 'white' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--color-primary)" 
                    strokeWidth={3}
                    dot={{ fill: 'var(--color-primary-light)', r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            
            {/* Chart: Violations by Department */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Violations by Department</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <BarChart data={dashboardData?.charts?.violationsByDepartment || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="department" stroke="var(--text-secondary)" fontSize={10} tickFormatter={(v) => v.split(' ')[0]} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-dark-obsidian)', borderColor: 'var(--border-glass)', color: 'white' }}
                    />
                    <Bar dataKey="count" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]}>
                      {(dashboardData?.charts?.violationsByDepartment || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Violations by Type */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Violations by Type</h3>
              <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData?.charts?.violationsByType || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="type"
                    >
                      {(dashboardData?.charts?.violationsByType || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-dark-obsidian)', borderColor: 'var(--border-glass)', color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', minWidth: '120px' }}>
                  {(dashboardData?.charts?.violationsByType || []).map((entry: any, index: number) => (
                    <div key={entry.type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', backgroundColor: CHART_COLORS[index % CHART_COLORS.length], borderRadius: '2px', display: 'inline-block' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{entry.type} ({entry.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
