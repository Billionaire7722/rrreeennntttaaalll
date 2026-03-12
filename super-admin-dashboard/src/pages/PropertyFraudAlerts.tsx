import React, { useEffect, useState } from 'react';
import { 
    ShieldAlert, 
    CheckCircle, 
    XCircle, 
    Eye, 
    Clock,
    Home,
    User,
    EyeOff
} from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface PropertyFraudAlert {
    id: string;
    propertyId: string;
    ownerId: string;
    fraudType: string;
    description: string;
    severity: string;
    status: string;
    createdAt: string;
    property: {
        name: string;
        address: string;
        status: string;
    };
    owner: {
        name: string;
        email: string;
    };
}

export const PropertyFraudAlerts: React.FC = () => {
    const [alerts, setAlerts] = useState<PropertyFraudAlert[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/monitoring/property-fraud-alerts');
            setAlerts(res.data);
        } catch (err) {
            console.error('Failed to fetch property fraud alerts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await api.post(`/admin/monitoring/property-alerts/${id}/status`, { status });
            fetchAlerts();
        } catch (err) {
            alert('Failed to update alert status');
        }
    };

    const handleHideProperty = async (propertyId: string) => {
        if (!confirm('Are you sure you want to hide this property?')) return;
        try {
            await api.patch(`/houses/${propertyId}/status`, { status: 'hidden' });
            alert('Property hidden successfully');
            fetchAlerts();
        } catch (err) {
            alert('Failed to hide property');
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
                    <h2>Property Fraud Detection</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Automated monitoring for suspicious property listings</p>
                </div>
                <div className={css.headerActions}>
                    <button className="btn btn-outline" onClick={fetchAlerts}>Refresh Alerts</button>
                </div>
            </div>

            <div className={css.tableWrapper}>
                <div className={css.tableScroll}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Listing / Alert</th>
                                <th>Owner</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Time</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && alerts.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Analyzing property listings...</td></tr>
                            ) : alerts.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No property fraud detected. System is secure.</td></tr>
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
                                                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Home size={14} className="text-muted" />
                                                        {a.property.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--danger-color)', marginTop: '2px' }}>
                                                        {a.fraudType.replace(/_/g, ' ')}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <User size={14} style={{ color: 'var(--text-muted)' }} />
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>{a.owner.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.owner.email}</div>
                                                </div>
                                            </div>
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
                                            <span className={`badge ${a.status === 'PENDING' ? 'badge-banned' : a.status === 'RESOLVED' ? 'badge-active' : 'badge-admin'}`}>
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
                                                <button className="btn btn-outline" style={{ padding: '6px' }} title="View Property"><Eye size={14} /></button>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '6px' }}
                                                    title="Open in Users app"
                                                    onClick={() => window.open(`http://localhost:3002/properties/${a.propertyId}`, '_blank')}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button onClick={() => handleHideProperty(a.propertyId)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--warning-color)' }} title="Hide Listing"><EyeOff size={14} /></button>
                                                {a.status === 'PENDING' ? (
                                                    <button onClick={() => handleStatusUpdate(a.id, 'RESOLVED')} className="btn btn-outline" style={{ padding: '6px', color: 'var(--success-color)' }} title="Mark Resolved"><CheckCircle size={14} /></button>
                                                ) : (
                                                    <button onClick={() => handleStatusUpdate(a.id, 'PENDING')} className="btn btn-outline" style={{ padding: '6px', color: 'var(--warning-color)' }} title="Reopen"><Clock size={14} /></button>
                                                )}
                                                <button onClick={() => handleStatusUpdate(a.id, 'DISMISSED')} className="btn btn-outline" style={{ padding: '6px', color: 'var(--text-muted)' }} title="Dismiss"><XCircle size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
