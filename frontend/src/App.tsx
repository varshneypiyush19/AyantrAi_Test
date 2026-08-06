import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ViolationProvider } from './context/ViolationContext';
import { Navbar } from './components/Navbar';
import { Login } from './views/Login';
import { AdminPortal } from './views/AdminPortal';
import { SupervisorPortal } from './views/SupervisorPortal';
import { SimulatorWidget } from './components/SimulatorWidget';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div 
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div 
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.05)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Securing Connection...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ViolationProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          {user.role === 'ADMIN' ? <AdminPortal /> : <SupervisorPortal />}
        </main>
        {/* Floating IoT Device Simulation Control Widget */}
        <SimulatorWidget />
      </div>
    </ViolationProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
