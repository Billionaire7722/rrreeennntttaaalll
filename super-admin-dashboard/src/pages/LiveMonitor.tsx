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
import { io } from 'socket.io-client';
import { resolveSocketBaseUrl } from '../api/axios';
import api from '../api/axios';

interface LiveEvent {
    id: string;
    type: 'LOGIN' | 'ACTION' | 'ERROR' | 'SYSTEM';
    message: string;
    time: string;
    level: 'INFO' | 'WARNING' | 'CRITICAL';
}

type SystemStatus = {
    timestamp: string;
    os: {
        name: string;
        platform: string;
        release: string;
        arch: string;
        uptimeSeconds: number;
    };
    versions: {
        node: string;
        docker?: string | null;
        nginx?: string | null;
    };
    cpu: {
        cores: number;
        load1: number;
        load5: number;
        load15: number;
        loadPercent: number;
    };
    memory: {
        totalBytes: number;
        freeBytes: number;
        usedBytes: number;
        usagePercent: number;
    };
    disk: {
        mount: string;
        totalBytes: number;
        usedBytes: number;
        availableBytes: number;
        usagePercent: number;
    };
    services: Array<{ name: string; status: string }>;
};

const formatBytes = (value: number) => {
    if (!Number.isFinite(value)) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let idx = 0;
    let val = value;
    while (val >= 1024 && idx < units.length - 1) {
        val /= 1024;
        idx++;
    }
    return `${val.toFixed(val >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
};

export const LiveMonitor: React.FC = () => {
    const [events, setEvents] = useState<LiveEvent[]>([]);
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [actionBusy, setActionBusy] = useState(false);

    const stats = [
        { label: 'CPU Load', value: `${status?.cpu.loadPercent.toFixed(1) || '0'}%`, icon: <Cpu size={16} />, color: '#3b82f6' },
        { label: 'RAM Used', value: `${status?.memory.usagePercent.toFixed(1) || '0'}%`, icon: <Wifi size={16} />, color: '#10b981' },
        { label: 'Disk Used', value: `${status?.disk.usagePercent.toFixed(1) || '0'}%`, icon: <Database size={16} />, color: '#8b5cf6' },
        { label: 'Uptime', value: status ? formatUptime(status.os.uptimeSeconds) : '0m', icon: <Zap size={16} />, color: '#f59e0b' },
    ];

    const fetchInitialData = async () => {
        try {
            const res = await api.get('/admin/login-logs?take=10');
            const initialEvents: LiveEvent[] = res.data.items.map((l: any) => ({
                id: l.id,
                type: 'LOGIN',
                message: `Login ${l.success ? 'success' : 'failed'} from ${l.ipAddress} (${l.user?.email || 'Unknown'})`,
                time: new Date(l.timestamp).toLocaleTimeString(),
                level: l.success ? 'INFO' : 'WARNING'
            }));
            setEvents(initialEvents);
        } catch (err) {
            console.error('Failed to fetch initial events', err);
        }
    };

    useEffect(() => {
        fetchInitialData();

        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(resolveSocketBaseUrl(), {
            auth: { token }
        });

        socket.on('new_login_log', (log: any) => {
            const newEvent: LiveEvent = {
                id: log.id,
                type: 'LOGIN',
                message: `Real-time: Login ${log.success ? 'success' : 'failed'} from ${log.ipAddress}`,
                time: 'Just now',
                level: log.success ? 'INFO' : 'WARNING'
            };
            setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
        });

        socket.on('new_audit_log', (log: any) => {
            const isSuspicious = log.actionType === 'RESTRICT_ACCOUNT' || log.actionType === 'DELETE_PROPERTY';
            const newEvent: LiveEvent = {
                id: log.id,
                type: 'ACTION',
                message: `${log.actionType} on ${log.entityType} (${log.entityId})`,
                time: 'Just now',
                level: isSuspicious ? 'WARNING' : 'INFO'
            };
            setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        let active = true;
        const loadStatus = async () => {
            try {
                const res = await api.get('/admin/system/status');
                if (active) {
                    setStatus(res.data);
                    setStatusLoading(false);
                }
            } catch (err) {
                console.error('Failed to fetch system status', err);
                if (active) setStatusLoading(false);
            }
        };

        loadStatus();
        const interval = window.setInterval(loadStatus, 5000);
        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, []);

    const runAction = async (action: string, target?: string) => {
        if (actionBusy) return;
        if (action === 'shutdown') {
            const confirmed = window.confirm('This will stop all app services. Continue?');
            if (!confirmed) return;
        }
        setActionBusy(true);
        try {
            await api.post('/admin/system/action', { action, target, confirm: action === 'shutdown' ? 'YES' : undefined });
            await api.get('/admin/system/status').then(res => setStatus(res.data));
        } catch (err) {
            console.error('Action failed', err);
            alert('Action failed. Check server logs for details.');
        } finally {
            setActionBusy(false);
        }
    };

    const serviceStatusMap = new Map(
        (status?.services || []).map((s) => [s.name, s.status])
    );

    const renderServiceStatus = (label: string, containerName: string) => {
        const value = serviceStatusMap.get(containerName) || 'Unknown';
        const isUp = value.toLowerCase().includes('up');
        const color = isUp ? 'var(--success-color)' : 'var(--warning-color)';
        const Icon = isUp ? Zap : AlertCircle;
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>{label}</span>
                <span style={{ color }}><Icon size={14} /></span>
            </div>
        );
    };

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
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>VPS Status</h3>
                    {statusLoading && !status ? (
                        <div style={{ color: 'var(--text-muted)' }}>Loading system status...</div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operating System</div>
                                    <div style={{ fontWeight: 600 }}>{status?.os.name || 'Unknown'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kernel</div>
                                    <div style={{ fontWeight: 600 }}>{status?.os.release || 'Unknown'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Node</div>
                                    <div style={{ fontWeight: 600 }}>{status?.versions.node || 'Unknown'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Docker</div>
                                    <div style={{ fontWeight: 600 }}>{status?.versions.docker || 'Unknown'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nginx</div>
                                    <div style={{ fontWeight: 600 }}>{status?.versions.nginx || 'Unknown'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Memory</div>
                                    <div style={{ fontWeight: 600 }}>
                                        {formatBytes(status?.memory.usedBytes || 0)} / {formatBytes(status?.memory.totalBytes || 0)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disk</div>
                                    <div style={{ fontWeight: 600 }}>
                                        {formatBytes(status?.disk.usedBytes || 0)} / {formatBytes(status?.disk.totalBytes || 0)}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>VPS Controls</h3>
                    <button className="btn btn-outline" disabled={actionBusy} onClick={() => runAction('restart', 'all')}>
                        Restart App Stack
                    </button>
                    <button className="btn btn-outline" disabled={actionBusy} onClick={() => runAction('stop', 'all')}>
                        Stop App Stack
                    </button>
                    <button className="btn btn-outline" disabled={actionBusy} onClick={() => runAction('start', 'all')}>
                        Start App Stack
                    </button>
                    <button className="btn btn-primary" disabled={actionBusy} onClick={() => runAction('free_memory')}>
                        Free Up RAM
                    </button>
                    <button className="btn btn-danger" disabled={actionBusy} onClick={() => runAction('shutdown')}>
                        Shut Down App Stack
                    </button>
                </div>
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
                            {renderServiceStatus('Backend API', 'rental_backend')}
                            {renderServiceStatus('Users App', 'rental_users')}
                            {renderServiceStatus('Postgres', 'rental_postgres')}
                            {renderServiceStatus('Redis', 'rental_redis')}
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
