import React from 'react';
import { useAuth } from '../context/useAuth';

export const AccessRequired: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="glass-panel" style={{ maxWidth: 720, width: '100%', padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Super Admin access required</h2>
        <p style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
          This dashboard no longer includes a login page. To use it, you must already have a valid
          <code style={{ marginLeft: 6 }}>SUPER_ADMIN</code> token stored in this browser.
        </p>
        <ol style={{ marginTop: 0, marginBottom: 16, paddingLeft: 18, color: 'var(--text-muted)' }}>
          <li>Login as a SUPER_ADMIN in your main app to generate a token.</li>
          <li>Open this dashboard again in the same browser/profile.</li>
        </ol>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
          <button className="btn" onClick={logout} title="Clear stored token">
            Clear token
          </button>
        </div>
      </div>
    </div>
  );
};

