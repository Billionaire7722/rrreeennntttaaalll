import React, { useEffect, useState } from 'react';
import { 
    Search, 
    Filter, 
    Download,
    Globe,
    Clock,
    User,
    CheckCircle,
    XCircle
} from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface LoginLog {
    id: string;
    userId: string;
    username: string;
    ipAddress: string;
    userAgent: string;
    status: string;
    createdAt: string;
}

export const LoginLogs: React.FC = () => {
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const take = 15;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/login-logs?skip=${skip}&take=${take}&search=${searchQuery}`);
            setLogs(res.data.logs || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch login logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchLogs, 300);
        return () => clearTimeout(timer);
    }, [skip, searchQuery]);

    return (
        <div className={css.tableContainer}>
            <div className={css.tableHeader}>
                <div>
                    <h2>Login Activity</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monitor all platform access and authentication attempts</p>
                </div>
                <div className={css.headerActions}>
                    <button className="btn btn-outline"><Download size={16} /> Export CSV</button>
                </div>
            </div>

            <div className={css.tableControls}>
                <div className={css.searchWrapper}>
                    <Search className={css.searchIcon} size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by username or IP..." 
                        className={`input-field ${css.searchInput}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={css.filterGroup}>
                    <button className="btn btn-outline"><Filter size={14} /> All Status</button>
                </div>
            </div>

            <div className={css.tableWrapper}>
                <div className={css.tableScroll}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Status</th>
                                <th>IP Address</th>
                                <th>Device / User Agent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && logs.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Loading activity...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>No login activity recorded.</td></tr>
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
                                                <div className={css.avatar} style={{ width: '24px', height: '24px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={12} />
                                                </div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{log.username}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {log.status === 'SUCCESS' ? (
                                                    <span className="badge badge-active" style={{ gap: '4px' }}>
                                                        <CheckCircle size={10} /> {log.status}
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-banned" style={{ gap: '4px' }}>
                                                        <XCircle size={10} /> {log.status}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                                                <Globe size={12} style={{ color: 'var(--text-muted)' }} />
                                                {log.ipAddress}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.userAgent}>
                                                {log.userAgent}
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
                        Showing {skip + 1} to {Math.min(skip + take, total)} of {total} records
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
