import React, { useEffect, useState } from 'react';
import { 
    Search, 
    Filter, 
    Download,
    Activity,
    User,
    Clock
} from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface AuditLog {
    id: string;
    action: string;
    description: string;
    targetModel: string;
    targetId: string;
    createdAt: string;
    admin: {
        name: string;
        email: string;
    };
}

export const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const take = 15;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/audit-logs?skip=${skip}&take=${take}&search=${searchQuery}`);
            setLogs(res.data.logs || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchLogs, 300);
        return () => clearTimeout(timer);
    }, [skip, searchQuery]);

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'var(--success-color)';
        if (action.includes('DELETE')) return 'var(--danger-color)';
        if (action.includes('UPDATE')) return 'var(--accent-color)';
        return 'var(--text-secondary)';
    };

    return (
        <div className={css.tableContainer}>
            <div className={css.tableHeader}>
                <div>
                    <h2>Audit Logs</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Track all administrative actions across the platform</p>
                </div>
                <div className={css.headerActions}>
                    <button className="btn btn-outline"><Download size={16} /> Export Logs</button>
                </div>
            </div>

            <div className={css.tableControls}>
                <div className={css.searchWrapper}>
                    <Search className={css.searchIcon} size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by action or admin..." 
                        className={`input-field ${css.searchInput}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={css.filterGroup}>
                    <button className="btn btn-outline"><Filter size={14} /> All Actions</button>
                </div>
            </div>

            <div className={css.tableWrapper}>
                <div className={css.tableScroll}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Admin</th>
                                <th>Action</th>
                                <th>Description</th>
                                <th>Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && logs.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Loading logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>No audit logs found.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ whiteSpace: 'nowrap', width: '180px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <Clock size={14} />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <User size={14} style={{ color: 'var(--text-muted)' }} />
                                                <div style={{ fontSize: '0.875rem' }}>{log.admin?.name}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                fontWeight: 700, 
                                                color: getActionColor(log.action),
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: `${getActionColor(log.action)}15`
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '300px' }}>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {log.description}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <Activity size={12} />
                                                {log.targetModel} ({log.targetId ? log.targetId.slice(-6) : 'N/A'})
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={css.pagination}>
                    <span className={css.pageText}>
                        Showing {skip + 1} to {Math.min(skip + take, total)} of {total} events
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" disabled={skip === 0} onClick={() => setSkip(s => Math.max(0, s - take))}>Previous</button>
                        <button className="btn btn-outline" disabled={skip + take >= total} onClick={() => setSkip(s => s + take)}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
