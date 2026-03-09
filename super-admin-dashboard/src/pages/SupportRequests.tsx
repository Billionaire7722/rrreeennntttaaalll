import React, { useEffect, useState } from 'react';
import { 
    Search, 
    User, 
    Filter,
    Reply,
    MoreVertical,
    CheckCircle2
} from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface SupportRequest {
    id: string;
    userId: string;
    subject: string;
    message: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
    user: { name: string; email: string };
}

export const SupportRequests: React.FC = () => {
    const [requests, setRequests] = useState<SupportRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/support-requests');
            setRequests(res.data.requests || []);
        } catch (err) {
            console.error('Failed to fetch support requests', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'HIGH': return 'var(--danger-color)';
            case 'MEDIUM': return 'var(--warning-color)';
            default: return 'var(--accent-color)';
        }
    };

    return (
        <div className={css.tableContainer}>
            <div className={css.tableHeader}>
                <div>
                    <h2>Support Requests</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage and respond to platform support tickets</p>
                </div>
                <div className={css.headerActions}>
                    <button className="btn btn-primary">Archive Closed</button>
                </div>
            </div>

            <div className={css.tableControls}>
                <div className={css.searchWrapper}>
                    <Search className={css.searchIcon} size={16} />
                    <input type="text" placeholder="Search support tickets..." className={`input-field ${css.searchInput}`} />
                </div>
                <div className={css.filterGroup}>
                    <button className="btn btn-outline"><Filter size={14} /> Open Only</button>
                </div>
            </div>

            <div className={css.tableWrapper}>
                <div className={css.tableScroll}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Ticket / Subject</th>
                                <th>Customer</th>
                                <th>Priority</th>
                                <th>Created</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Loading tickets...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No support requests found.</td></tr>
                            ) : (
                                requests.map(r => (
                                    <tr key={r.id}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontWeight: 600 }}>#{r.id.slice(-6)}: {r.subject}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {r.message}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className={css.avatar} style={{ width: '28px', height: '28px' }}><User size={14} /></div>
                                                <div style={{ fontSize: '0.875rem' }}>{r.user?.name}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: getPriorityColor(r.priority) }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getPriorityColor(r.priority) }} />
                                                {r.priority}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${r.status === 'OPEN' ? 'badge-admin' : r.status === 'IN_PROGRESS' ? 'badge-active' : ''}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className={css.actions} style={{ justifyContent: 'flex-end' }}>
                                                <button className="btn btn-outline" style={{ padding: '6px' }} title="Reply"><Reply size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--success-color)' }} title="Close Ticket"><CheckCircle2 size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '6px' }}><MoreVertical size={14} /></button>
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
