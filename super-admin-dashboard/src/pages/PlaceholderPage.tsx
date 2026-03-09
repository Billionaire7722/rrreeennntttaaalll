import React from 'react';

export const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{title}</h2>
            <p style={{ color: 'var(--text-muted)' }}> This page is currently under development as part of the dashboard redesign.</p>
        </div>
    );
};
