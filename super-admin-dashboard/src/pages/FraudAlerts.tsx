import React, { useEffect, useState } from 'react';
import { 
    ShieldAlert, 
    CheckCircle, 
    XCircle, 
    Eye, 
    Clock,
    User
} from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';
import { UserTimelineModal } from '../components/UserTimelineModal';

interface FraudAlert {
    id: string;
    userId?: string;
    user?: { name: string; email: string };
    type: string;
    description: string;
    severity: string;
    status: string;
    createdAt: string;
}

export const FraudAlerts: React.FC = () => {
    const [alerts, setAlerts] = useState<FraudAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [timelineUserId, setTimelineUserId] = useState<string | null>(null);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/monitoring/fraud-alerts');
            setAlerts(res.data);
        } catch (err) {
            console.error('Failed to fetch fraud alerts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await api.post(`/admin/monitoring/alerts/${id}/status`, { status });
            fetchAlerts();
        } catch (err) {
            alert('Failed to update alert status');
        }
    };

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'CRITICAL': return 'var(--danger-color)';
            case 'HIGH': return '#ff4d4f';
            case 'MEDIUM': return 'var(--warning-color)';
            default: return 'var(--accent-color)';
        }
    };

    return (
        <div className={css.tableContainer}>
            <div className={css.tableHeader}>
                <div>
                    <h2>Fraud Alerts</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Automated detection of suspicious activities</p>
                </div>
                <div className={css.headerActions}>
                    <button className="btn btn-outline" onClick={fetchAlerts}>Refresh</button>
                </div>
            </div>

            <div className={css.tableWrapper}>
                <div className={css.tableScroll}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Alert</th>
                                <th>User</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Time</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && alerts.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Analyzing system activity...</td></tr>
                            ) : alerts.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No fraud alerts detected. System is healthy.</td></tr>
                            ) : (
                                alerts.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ 
                                                    padding: '8px', 
                                                    borderRadius: '8px', 
                                                    background: 'rgba(239, 68, 68, 0.1)', 
                                                    color: getSeverityColor(a.severity) 
                                                }}>
                                                    <ShieldAlert size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{a.type.replace(/_/g, ' ')}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {a.user ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <User size={14} style={{ color: 'var(--text-muted)' }} />
                                                    <div>
                                                        <div>{a.user.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.user.email}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>System/Anonymous</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ 
                                                fontWeight: '700', 
                                                fontSize: '0.75rem',
                                                color: getSeverityColor(a.severity)
                                            }}>
                                                {a.severity}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${a.status === 'OPEN' ? 'badge-banned' : 'badge-active'}`}>
                                                {a.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                <Clock size={14} />
                                                {new Date(a.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={css.actions}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '6px' }}
                                                    title={a.userId ? 'View user timeline' : 'No user attached'}
                                                    disabled={!a.userId}
                                                    onClick={() => a.userId && setTimelineUserId(a.userId)}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                {a.status === 'OPEN' ? (
                                                    <button onClick={() => handleStatusUpdate(a.id, 'RESOLVED')} className="btn btn-outline" style={{ padding: '6px', color: 'var(--success-color)' }} title="Resolve"><CheckCircle size={14} /></button>
                                                ) : (
                                                    <button onClick={() => handleStatusUpdate(a.id, 'OPEN')} className="btn btn-outline" style={{ padding: '6px', color: 'var(--warning-color)' }} title="Reopen"><Clock size={14} /></button>
                                                )}
                                                <button onClick={() => handleStatusUpdate(a.id, 'IGNORED')} className="btn btn-outline" style={{ padding: '6px', color: 'var(--text-muted)' }} title="Ignore"><XCircle size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {timelineUserId && (
                <UserTimelineModal userId={timelineUserId} userName="User" onClose={() => setTimelineUserId(null)} />
            )}
        </div>
    );
};
