import React, { useEffect, useState } from 'react';
import { 
    Search, 
    Filter, 
    AlertTriangle,
    User,
    Eye,
    CheckCircle,
    Trash2
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

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/user-reports');
            setReports(res.data.reports || []);
        } catch (err) {
            console.error('Failed to fetch user reports', err);
        } finally {
            setLoading(false);
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
                    <input type="text" placeholder="Search reports..." className={`input-field ${css.searchInput}`} />
                </div>
                <div className={css.filterGroup}>
                    <button className="btn btn-outline"><Filter size={14} /> Pending Only</button>
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
                                reports.map(r => (
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
                                                <button className="btn btn-outline" style={{ padding: '6px' }} title="View Details"><Eye size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--success-color)' }} title="Resolve"><CheckCircle size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--danger-color)' }} title="Dismiss"><Trash2 size={14} /></button>
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
