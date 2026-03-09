import React, { useEffect, useState } from 'react';
import { 
    Wifi, 
    Cpu, 
    Database, 
    Zap,
    AlertCircle,
    Bell,
    Settings,
    Clock
} from 'lucide-react';

interface LiveEvent {
    id: string;
    type: 'LOGIN' | 'ACTION' | 'ERROR' | 'SYSTEM';
    message: string;
    time: string;
    level: 'INFO' | 'WARNING' | 'CRITICAL';
}

export const LiveMonitor: React.FC = () => {
    const [events, setEvents] = useState<LiveEvent[]>([
        { id: '1', type: 'LOGIN', message: 'User admin@example.com logged in', time: 'Just now', level: 'INFO' },
        { id: '2', type: 'ACTION', message: 'New property "Sunset Villa" published', time: '2m ago', level: 'INFO' },
        { id: '3', type: 'SYSTEM', message: 'Database backup completed', time: '5m ago', level: 'INFO' },
        { id: '4', type: 'ERROR', message: 'Failed login attempt from 192.168.1.45', time: '10m ago', level: 'WARNING' },
        { id: '5', type: 'SYSTEM', message: 'Memory usage exceeding 80% threshold', time: '12m ago', level: 'CRITICAL' },
    ]);

    const stats = [
        { label: 'Active Users', value: '42', icon: <Wifi size={16} />, color: '#10b981' },
        { label: 'CPU Load', value: '18%', icon: <Cpu size={16} />, color: '#3b82f6' },
        { label: 'DB Connections', value: '8/100', icon: <Database size={16} />, color: '#8b5cf6' },
        { label: 'Latency', value: '24ms', icon: <Zap size={16} />, color: '#f59e0b' },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            // Simulated real-time update
            const newEvent: LiveEvent = {
                id: Date.now().toString(),
                type: 'SYSTEM',
                message: 'System health check: All services operational',
                time: 'Just now',
                level: 'INFO'
            };
            setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'var(--danger-color)';
            case 'WARNING': return 'var(--warning-color)';
            default: return 'var(--accent-color)';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Live Monitor <span className="badge badge-active" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>LIVE</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time system activity and service health status</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline"><Settings size={16} /> Config</button>
                    <button className="btn btn-primary"><Bell size={16} /> Alerts</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                {stats.map((s, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Activity Stream</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {events.map((e) => (
                            <div key={e.id} style={{ 
                                padding: '16px', 
                                borderRadius: '12px', 
                                border: '1px solid var(--border-color)',
                                background: 'rgba(255,255,255,0.02)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <div style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    borderRadius: '50%', 
                                    background: getLevelColor(e.level),
                                    boxShadow: `0 0 10px ${getLevelColor(e.level)}`
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{e.type}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> {e.time}</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem' }}>{e.message}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', marginBottom: '16px' }}>Service Status</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem' }}>API Gateway</span>
                                <span style={{ color: 'var(--success-color)' }}><Zap size={14} /></span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem' }}>Image Server</span>
                                <span style={{ color: 'var(--success-color)' }}><Zap size={14} /></span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem' }}>Auth Service</span>
                                <span style={{ color: 'var(--success-color)' }}><Zap size={14} /></span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem' }}>Main Database</span>
                                <span style={{ color: 'var(--warning-color)' }}><AlertCircle size={14} /></span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--accent-color) 0%, #4f46e5 100%)', border: 'none' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'white', marginBottom: '12px' }}>System Health</h3>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: '20px' }}>Your system is 98% healthy. All core services are reporting stable response times.</p>
                        <button className="btn" style={{ width: '100%', background: 'white', color: 'var(--accent-color)', fontWeight: 600 }}>Optimize Performance</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
