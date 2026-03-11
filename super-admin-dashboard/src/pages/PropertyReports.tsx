import React, { useEffect, useState } from 'react';
import { 
    Search, 
    Home,
    Eye,
    CheckCircle,
    XCircle
} from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface PropertyReport {
    id: string;
    houseId: string;
    reporterId: string;
    reason: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    createdAt: string;
    house: { name: string };
    reporter: { name: string };
}

export const PropertyReports: React.FC = () => {
    const [reports, setReports] = useState<PropertyReport[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/property-reports');
            setReports(res.data.items || []);
        } catch (err) {
            console.error('Failed to fetch property reports', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (houseId: string, reportId: string) => {
        if (!confirm('Are you sure you want to SOFT DELETE this property?')) return;
        try {
            await api.delete(`/admin/houses/${houseId}`);
            await api.post(`/admin/reports/property/${reportId}/status`, { status: 'RESOLVED' });
            alert('Property deleted and report resolved');
            fetchReports();
        } catch (err) {
            console.error(err);
            alert('Failed to delete property');
        }
    };

    const handleResolve = async (reportId: string) => {
        try {
            await api.post(`/admin/reports/property/${reportId}/status`, { status: 'RESOLVED' });
            alert('Report resolved');
            fetchReports();
        } catch (err) {
            console.error(err);
            alert('Failed to resolve report');
        }
    };

    const handleDismiss = async (reportId: string) => {
        if (!confirm('Are you sure you want to dismiss this report?')) return;
        try {
            await api.post(`/admin/reports/property/${reportId}/status`, { status: 'DISMISSED' });
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
                    <h2>Property Reports</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Moderate reported real estate listings for policy violations</p>
                </div>
            </div>

            <div className={css.tableControls}>
                <div className={css.searchWrapper}>
                    <Search className={css.searchIcon} size={16} />
                    <input type="text" placeholder="Search reports..." className={`input-field ${css.searchInput}`} />
                </div>
            </div>

            <div className={css.tableWrapper}>
                <div className={css.tableScroll}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Reported Property</th>
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
                                                <div className={css.avatar} style={{ width: '28px', height: '28px', borderRadius: '4px' }}><Home size={14} /></div>
                                                <div style={{ fontWeight: 600 }}>{r.house?.name}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>{r.reason}</div>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{r.reporter?.name}</td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${r.status === 'PENDING' ? 'badge-admin' : 'badge-active'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className={css.actions} style={{ justifyContent: 'flex-end' }}>
                                                <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--success-color)' }} title="Resolve Only" onClick={() => handleResolve(r.id)}><CheckCircle size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--danger-color)' }} title="Soft Delete Property" onClick={() => handleDelete(r.houseId, r.id)}><XCircle size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '6px' }} title="Dismiss Report" onClick={() => handleDismiss(r.id)}><Eye size={14} /></button>
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
