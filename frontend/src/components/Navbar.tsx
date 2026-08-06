import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav 
      className="glass-panel" 
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        margin: '16px 24px',
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          style={{
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Shield size={20} color="white" />
        </div>
        <div>
          <span 
            style={{ 
              fontWeight: 800, 
              fontSize: '20px', 
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, #f8fafc, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ArmourLink
          </span>
          <span 
            style={{ 
              fontSize: '10px', 
              color: 'var(--color-primary-light)', 
              display: 'block', 
              fontWeight: 600, 
              letterSpacing: '0.05em', 
              textTransform: 'uppercase',
            }}
          >
            PPE Compliance Portal
          </span>
        </div>
      </div>

      {/* Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* User Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserIcon size={16} color="var(--text-secondary)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{user.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span 
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: user.role === 'ADMIN' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: user.role === 'ADMIN' ? 'var(--color-primary-light)' : 'var(--color-success)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                {user.role}
              </span>
              {user.site && (
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  • {user.site.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: '24px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Logout Button */}
        <button 
          onClick={logout} 
          className="btn-secondary" 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>
    </nav>
  );
};
