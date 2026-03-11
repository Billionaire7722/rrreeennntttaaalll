import React, { useEffect, useState } from 'react';
import { 
    X, 
    ChevronRight, 
    Clock, 
    MapPin, 
    Activity, 
    User, 
    LogIn, 
    LogOut, 
    PlusCircle, 
    Edit, 
    Trash2, 
    AlertTriangle,
    ShieldCheck
} from 'lucide-react';
import api from '../api/axios';

interface ActivityLog {
    id: string;
    activityType: string;
    description: string;
    ipAddress?: string;
    country?: string;
    createdAt: string;
}

interface UserTimelineModalProps {
    userId: string;
    userName: string;
    onClose: () => void;
}

export const UserTimelineModal: React.FC<UserTimelineModalProps> = ({ userId, userName, onClose }) => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimeline = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/admin/monitoring/users/${userId}/timeline`);
                setLogs(res.data);
            } catch (err) {
                console.error('Failed to fetch timeline', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTimeline();
    }, [userId]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'login': return <LogIn size={16} className="text-success" />;
            case 'login_failed': return <ShieldCheck size={16} className="text-danger" />;
            case 'logout': return <LogOut size={16} className="text-muted" />;
            case 'property_created': return <PlusCircle size={16} style={{ color: 'var(--accent-color)' }} />;
            case 'property_updated': return <Edit size={16} style={{ color: '#2563eb' }} />;
            case 'property_deleted': return <Trash2 size={16} className="text-danger" />;
            case 'property_reported': return <AlertTriangle size={16} style={{ color: '#eab308' }} />;
            default: return <Activity size={16} />;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ 
                maxWidth: '600px', 
                width: '90%', 
                maxHeight: '80vh', 
                display: 'flex', 
                flexDirection: 'column',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-strong)'
            }}>
                <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--accent-soft)', padding: '8px', borderRadius: '8px', color: 'var(--accent-color)' }}>
                            <User size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Behavior Timeline</h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{userName}</span>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ 
                    padding: '20px', 
                    overflowY: 'auto', 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading activity data...</div>
                    ) : logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No recorded activity found for this user.</div>
                    ) : (
                        <div className="timeline">
                            {logs.map((log, index) => (
                                <div key={log.id} style={{ 
                                    display: 'flex', 
                                    gap: '16px', 
                                    position: 'relative',
                                    paddingBottom: index === logs.length - 1 ? 0 : '24px'
                                }}>
                                    {/* Line */}
                                    {index !== logs.length - 1 && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            left: '11px', 
                                            top: '24px', 
                                            bottom: 0, 
                                            width: '2px', 
                                            background: 'var(--border-color)',
                                            zIndex: 0
                                        }} />
                                    )}

                                    {/* Dot/Icon */}
                                    <div style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        borderRadius: '50%', 
                                        background: 'var(--bg-soft)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        zIndex: 1,
                                        border: '1px solid var(--border-color)',
                                        flexShrink: 0
                                    }}>
                                        {getActivityIcon(log.activityType)}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                {log.activityType.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                            {log.description}
                                        </p>
                                        {(log.ipAddress || log.country) && (
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {log.ipAddress && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ChevronRight size={10} /> {log.ipAddress}</span>}
                                                {log.country && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} /> {log.country}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ 
                    padding: '16px 20px', 
                    borderTop: '1px solid var(--border-color)', 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    background: 'var(--bg-soft)',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px'
                }}>
                    <button className="btn btn-outline" onClick={onClose}>Close Timeline</button>
                </div>
            </div>
        </div>
    );
};
