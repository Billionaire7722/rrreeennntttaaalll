import React, { useEffect, useState } from 'react';
import { 
    Search, 
    Filter, 
    AlertTriangle,
    User,
    Trash2,
    ShieldCheck
} from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface UserReport {
    id: string;
    reporterId: string;
    targetId: string;
    reason: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    createdAt: string;
    reporter: { name: string };
    target: { name: string };
}

export const UserReports: React.FC = () => {
    const [reports, setReports] = useState<UserReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingOnly, setPendingOnly] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/user-reports');
            setReports(res.data.items || []);
        } catch (err) {
            console.error('Failed to fetch user reports', err);
        } finally {
            setLoading(false);
        }
    };

    const handleWarn = async (userId: string, reportId: string) => {
        const reason = prompt('Enter warning reason:');
        if (!reason) return;
        try {
            await api.post(`/admin/users/${userId}/warn`, { reason });
            await api.post(`/admin/reports/user/${reportId}/status`, { status: 'RESOLVED' });
            alert('User warned and report resolved');
            fetchReports();
        } catch (err) {
            console.error(err);
            alert('Failed to warn user');
        }
    };

    const handleRestrict = async (userId: string, reportId: string) => {
        const days = prompt('Enter restriction duration in days (leave empty for permanent):');
        const durationDays = days ? parseInt(days) : undefined;
        try {
            await api.post(`/admin/users/${userId}/restrict`, { durationDays });
            await api.post(`/admin/reports/user/${reportId}/status`, { status: 'RESOLVED' });
            alert('User restricted and report resolved');
            fetchReports();
        } catch (err) {
            console.error(err);
            alert('Failed to restrict user');
        }
    };

    const handleDismiss = async (reportId: string) => {
        if (!confirm('Are you sure you want to dismiss this report?')) return;
        try {
            await api.post(`/admin/reports/user/${reportId}/status`, { status: 'DISMISSED' });
            fetchReports();
        } catch (err) {
            console.error(err);
            alert('Failed to dismiss report');
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className={css.tableContainer}>
            <div className={css.tableHeader}>
                <div>
                    <h2>User Reports</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Review and moderate reports against user profiles</p>
                </div>
            </div>

            <div className={css.tableControls}>
                <div className={css.searchWrapper}>
                    <Search className={css.searchIcon} size={16} />
                    <input
                        type="text"
                        placeholder="Search by user, reporter, reason..."
                        className={`input-field ${css.searchInput}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={css.filterGroup}>
                    <button className="btn btn-outline" onClick={() => setPendingOnly(v => !v)}>
                        <Filter size={14} /> {pendingOnly ? 'Pending Only' : 'All Statuses'}
                    </button>
                </div>
            </div>

            <div className={css.tableWrapper}>
                <div className={css.tableScroll}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Reported User</th>
                                <th>Reason</th>
                                <th>Reporter</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Loading reports...</td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No reports found.</td></tr>
                            ) : (
                                reports
                                    .filter((r) => (pendingOnly ? r.status === 'PENDING' : true))
                                    .filter((r) => {
                                        const q = searchQuery.trim().toLowerCase();
                                        if (!q) return true;
                                        const hay = `${r.target?.name || ''} ${r.reporter?.name || ''} ${r.reason || ''}`.toLowerCase();
                                        return hay.includes(q);
                                    })
                                    .map(r => (
                                    <tr key={r.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className={css.avatar} style={{ width: '28px', height: '28px' }}><User size={14} /></div>
                                                <div style={{ fontWeight: 600 }}>{r.target?.name}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                                                <AlertTriangle size={14} style={{ color: 'var(--warning-color)' }} />
                                                {r.reason}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{r.reporter?.name}</td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${r.status === 'PENDING' ? 'badge-admin' : r.status === 'RESOLVED' ? 'badge-active' : 'badge-banned'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className={css.actions} style={{ justifyContent: 'flex-end' }}>
                                                <button className="btn btn-outline" style={{ padding: '6px' }} title="Warn User" onClick={() => handleWarn(r.targetId, r.id)}><AlertTriangle size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--warning-color)' }} title="Restrict Account" onClick={() => handleRestrict(r.targetId, r.id)}><ShieldCheck size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--danger-color)' }} title="Dismiss Report" onClick={() => handleDismiss(r.id)}><Trash2 size={14} /></button>
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
