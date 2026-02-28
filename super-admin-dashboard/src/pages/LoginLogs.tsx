import React, { useEffect, useState } from 'react';
import { History, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface LoginLog {
    id: string;
    userId: string | null;
    role: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    success: boolean;
    timestamp: string;
}

export const LoginLogs: React.FC = () => {
    const [filterFailed, setFilterFailed] = useState(false);
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const take = 15;
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const statusParam = filterFailed ? '&status=failed' : '';
            const res = await api.get(`/admin/login-logs?skip=${skip}&take=${take}${statusParam}`);
            setLogs(res.data.items || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch login logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip, filterFailed]);

    return (
        <div className={`glass-panel ${css.tableContainer}`}>
            <div className={css.tableHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={24} color="var(--accent-color)" />
                    <h2>Authentication Audits</h2>
                </div>

                <div className={css.headerActions}>
                    <button
                        className={`btn ${filterFailed ? 'btn-danger' : 'btn-outline'}`}
                        onClick={() => setFilterFailed(!filterFailed)}
                    >
                        <ShieldAlert size={16} />
                        {filterFailed ? 'Showing Failed Only' : 'Filter Failed Logins'}
                    </button>
                </div>
            </div>

            <div className={css.tableScroll}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Status</th>
                            <th>User ID</th>
                            <th>Role</th>
                            <th>IP Address</th>
                            <th>User Agent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading system logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No login records fit criteria.</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} color="var(--text-secondary)" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </td>
                                    <td>
                                        {log.success ? (
                                            <span className="badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                                <CheckCircle2 size={12} /> SUCCESS
                                            </span>
                                        ) : (
                                            <span className="badge badge-banned" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                                <ShieldAlert size={12} /> FAILED
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.userId || 'Unknown'}</td>
                                    <td><span className="badge badge-admin">{log.role || 'GUEST'}</span></td>
                                    <td>{log.ipAddress || 'Unknown'}</td>
                                    <td title={log.userAgent || ''}>
                                        {log.userAgent && log.userAgent.length > 30 ? log.userAgent.substring(0, 30) + '...' : log.userAgent || 'Unknown'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className={css.pagination}>
                <button
                    className="btn btn-outline"
                    disabled={skip === 0}
                    onClick={() => { setSkip(s => Math.max(0, s - take)); }}
                >
                    Previous
                </button>
                <span className={css.pageText}>
                    Page {Math.floor(skip / take) + 1} of {Math.ceil(total / take) || 1}
                </span>
                <button
                    className="btn btn-outline"
                    disabled={skip + take >= total}
                    onClick={() => { setSkip(s => s + take); }}
                >
                    Next
                </button>
            </div>
        </div>
    );
};
