import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface LiveSession {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    onlineStatus: 'ONLINE' | 'OFFLINE';
    lastSeenAt: string | null;
    ipAddress: string | null;
}

interface AuditLog {
    id: string;
    actorRole: string;
    actionType: string;
    entityType: string;
    entityId: string;
    afterData: unknown;
    ipAddress: string | null;
    createdAt: string;
}

const REFRESH_INTERVAL_MS = 15000;

function minutesSince(isoDate: string): number {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
}

function relativeText(isoDate: string | null): string {
    if (!isoDate) return 'Never';
    const mins = minutesSince(isoDate);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minute(s) ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour(s) ago`;
    const days = Math.floor(hours / 24);
    return `${days} day(s) ago`;
}

function mapHouseAction(actionType: string): string {
    const upper = actionType.toUpperCase();
    if (upper.startsWith('POST_HOUSES')) return 'ADD HOUSE';
    if (upper.startsWith('DELETE_HOUSES')) return 'DELETE HOUSE';
    if (upper.startsWith('PATCH_HOUSES')) return 'UPDATE HOUSE';
    return upper;
}

export const LiveMonitor: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [houseActions, setHouseActions] = useState<AuditLog[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [sessionLimit, setSessionLimit] = useState(30);
    const [actionLimit, setActionLimit] = useState(30);

    const fetchMonitorData = async () => {
        try {
            const [sessionRes, auditRes] = await Promise.all([
                api.get('/admin/live-sessions?skip=0&take=300'),
                api.get('/admin/audit-logs?skip=0&take=300'),
            ]);

            const sessionRows: LiveSession[] = (sessionRes.data?.items || [])
                .filter((item: LiveSession) => ['VIEWER', 'ADMIN', 'SUPER_ADMIN'].includes((item.role || '').toUpperCase()))
                .sort((a: LiveSession, b: LiveSession) => {
                    if (a.onlineStatus !== b.onlineStatus) return a.onlineStatus === 'ONLINE' ? -1 : 1;
                    const aTime = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
                    const bTime = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
                    return bTime - aTime;
                });

            const adminHouseActions: AuditLog[] = (auditRes.data?.items || [])
                .filter((log: AuditLog) => (log.entityType || '').toLowerCase() === 'houses')
                .filter((log: AuditLog) => ['ADMIN', 'SUPER_ADMIN'].includes((log.actorRole || '').toUpperCase()))
                .sort((a: AuditLog, b: AuditLog) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setSessions(sessionRows);
            setHouseActions(adminHouseActions);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Failed to fetch live monitor data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonitorData();
        const timer = setInterval(fetchMonitorData, REFRESH_INTERVAL_MS);
        return () => clearInterval(timer);
    }, []);

    const counts = useMemo(() => {
        const viewersOnline = sessions.filter((s) => s.onlineStatus === 'ONLINE' && s.role === 'VIEWER').length;
        const adminsOnline = sessions.filter((s) => s.onlineStatus === 'ONLINE' && (s.role === 'ADMIN' || s.role === 'SUPER_ADMIN')).length;
        return { viewersOnline, adminsOnline };
    }, [sessions]);

    const visibleSessions = sessions.slice(0, sessionLimit);
    const visibleActions = houseActions.slice(0, actionLimit);

    return (
        <div style={{ display: 'grid', gap: '20px' }}>
            <div className={`glass-panel ${css.tableContainer}`}>
                <div className={css.tableHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={24} color="var(--accent-color)" />
                        <h2>Live Session Monitor</h2>
                    </div>
                    <div className={css.headerActions}>
                        <span className={css.totalBadge}>
                            <UserRound size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                            Viewers online: {counts.viewersOnline}
                        </span>
                        <span className={css.totalBadge}>
                            <ShieldCheck size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                            Admins online: {counts.adminsOnline}
                        </span>
                        <button className="btn btn-outline" onClick={fetchMonitorData}>
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Auto-refresh every 15 seconds. Last update: {lastUpdated || 'Loading...'}
                </div>

                <div className={css.tableScroll} style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last Seen</th>
                                <th>How Long Ago</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading active sessions...</td></tr>
                            ) : visibleSessions.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No login activity found.</td></tr>
                            ) : (
                                visibleSessions.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{s.name || s.username}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.email || s.id}</div>
                                        </td>
                                        <td><span className="badge badge-admin">{s.role}</span></td>
                                        <td>
                                            {s.onlineStatus === 'ONLINE' ? (
                                                <span className="badge badge-active">ONLINE</span>
                                            ) : (
                                                <span className="badge badge-banned">OFFLINE</span>
                                            )}
                                        </td>
                                        <td>{s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : 'Never'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock3 size={14} color="var(--text-secondary)" />
                                                {relativeText(s.lastSeenAt)}
                                            </div>
                                        </td>
                                        <td>{s.ipAddress || 'Unknown'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={css.pagination}>
                    <span className={css.pageText}>Showing {visibleSessions.length} / {sessions.length} sessions</span>
                    <button
                        className="btn btn-outline"
                        disabled={visibleSessions.length >= sessions.length}
                        onClick={() => setSessionLimit((prev) => prev + 30)}
                    >
                        Load more
                    </button>
                </div>
            </div>

            <div className={`glass-panel ${css.tableContainer}`}>
                <div className={css.tableHeader}>
                    <h2>Admin House Actions (Add / Delete / Update)</h2>
                    <span className={css.totalBadge}>Recent actions: {houseActions.length}</span>
                </div>

                <div className={css.tableScroll} style={{ maxHeight: '460px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Actor Role</th>
                                <th>Action</th>
                                <th>House ID</th>
                                <th>IP Address</th>
                                <th>Payload</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading admin actions...</td></tr>
                            ) : visibleActions.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No house actions from admins found.</td></tr>
                            ) : (
                                visibleActions.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div>{new Date(log.createdAt).toLocaleString()}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{relativeText(log.createdAt)}</div>
                                        </td>
                                        <td><span className="badge badge-admin">{log.actorRole}</span></td>
                                        <td>{mapHouseAction(log.actionType)}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.entityId}</td>
                                        <td>{log.ipAddress || 'Unknown'}</td>
                                        <td style={{ maxWidth: '340px' }}>
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                {JSON.stringify(log.afterData ?? {}, null, 2)}
                                            </pre>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={css.pagination}>
                    <span className={css.pageText}>Showing {visibleActions.length} / {houseActions.length} actions</span>
                    <button
                        className="btn btn-outline"
                        disabled={visibleActions.length >= houseActions.length}
                        onClick={() => setActionLimit((prev) => prev + 30)}
                    >
                        Load more
                    </button>
                </div>
            </div>
        </div>
    );
};
