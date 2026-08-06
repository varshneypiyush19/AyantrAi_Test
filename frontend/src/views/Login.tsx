import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Mail, Lock, AlertCircle, RefreshCw } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }
    
    setFormError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      // Error handled in AuthContext, local catch is just to stop loader
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'supervisor') => {
    if (role === 'admin') {
      setEmail('admin@safety.com');
      setPassword('admin123');
    } else {
      setEmail('supervisor1@safety.com');
      setPassword('super123');
    }
    setFormError(null);
  };

  return (
    <div 
      style={{
        display: 'flex',
        minHeight: '80vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div 
        className="glass-panel slide-in-card" 
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.05)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div 
            style={{
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.45)',
            }}
          >
            <Shield size={28} color="white" />
          </div>
          <h1 
            style={{ 
              fontSize: '28px', 
              fontFamily: 'var(--font-display)', 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ArmourLink
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            Workforce Safety Compliance & Telemetry
          </p>
        </div>

        {/* Errors */}
        {(formError || authError) && (
          <div 
            style={{
              backgroundColor: 'var(--color-danger-glow)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--color-danger)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{formError || authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label 
              htmlFor="email"
              style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={16} 
                color="var(--text-muted)" 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input 
                id="email"
                type="email" 
                placeholder="name@safety.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password"
              style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={16} 
                color="var(--text-muted)" 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw className="spin" size={16} /> : 'Sign In to Portal'}
          </button>
        </form>

        {/* Tester Quick Fill Section */}
        <div 
          style={{
            marginTop: '32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Key size={14} color="var(--color-primary-light)" />
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary-light)' }}>
              Quick Test Credentials
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => handleQuickFill('admin')}
              className="btn-secondary"
              style={{
                justifyContent: 'space-between',
                padding: '10px 16px',
                fontSize: '12px',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
              }}
            >
              <span>Admin Portal:</span>
              <span style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>admin@safety.com</span>
            </button>

            <button 
              onClick={() => handleQuickFill('supervisor')}
              className="btn-secondary"
              style={{
                justifyContent: 'space-between',
                padding: '10px 16px',
                fontSize: '12px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
              }}
            >
              <span>Supervisor (Site A):</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>supervisor1@safety.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
