import React, { useEffect, useState } from 'react';
import { 
    Shield, 
    Globe, 
    XCircle,
    Search
} from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface SuspiciousIP {
    id: string;
    ipAddress: string;
    country?: string;
    loginAttempts: number;
    failedAttempts: number;
    affectedUsers: number;
    riskLevel: string;
    status: string;
    updatedAt: string;
}

export const SuspiciousIPs: React.FC = () => {
    const [ips, setIPs] = useState<SuspiciousIP[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchIPs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/monitoring/suspicious-ips');
            setIPs(res.data);
        } catch (err) {
            console.error('Failed to fetch suspicious IPs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIPs();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await api.post(`/admin/monitoring/ips/${id}/status`, { status });
            fetchIPs();
        } catch (err) {
            alert('Failed to update IP status');
        }
    };

    const filteredIPs = ips.filter(ip => 
        ip.ipAddress.includes(search) || 
        ip.country?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={css.tableContainer}>
            <div className={css.tableHeader}>
                <div>
                    <h2>Suspicious IP Monitoring</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Track and block abnormal IP traffic</p>
                </div>
                <div className={css.headerActions}>
                    <button className="btn btn-outline" onClick={fetchIPs}>Scan Now</button>
                    <button className="btn btn-danger">Block All High Risk</button>
                </div>
            </div>

            <div className={css.tableControls}>
                <div className={css.searchWrapper}>
                    <Search className={css.searchIcon} size={16} />
                    <input 
                        type="text" 
                        placeholder="Search IP or Country..." 
                        className={`input-field ${css.searchInput}`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className={css.tableWrapper}>
                <div className={css.tableScroll}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>IP Address</th>
                                <th>Location</th>
                                <th>Activity</th>
                                <th>Risk Level</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && ips.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Scanning logs for suspicious patterns...</td></tr>
                            ) : filteredIPs.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No suspicious IPs identified. Traffic looks normal.</td></tr>
                            ) : (
                                filteredIPs.map(ip => (
                                    <tr key={ip.id}>
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{ip.ipAddress}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Globe size={14} style={{ color: 'var(--text-muted)' }} />
                                                {ip.country || 'Unknown'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <div><strong>{ip.loginAttempts}</strong> attempts ({ip.failedAttempts} failed)</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Affected {ip.affectedUsers} accounts</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '4px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 'bold',
                                                background: ip.riskLevel === 'HIGH' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                color: ip.riskLevel === 'HIGH' ? 'var(--danger-color)' : 'var(--warning-color)'
                                            }}>
                                                {ip.riskLevel}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${ip.status === 'BLOCKED' ? 'badge-banned' : 'badge-active'}`}>
                                                {ip.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={css.actions}>
                                                {ip.status !== 'BLOCKED' ? (
                                                    <button onClick={() => handleStatusUpdate(ip.id, 'BLOCKED')} className="btn btn-outline" style={{ padding: '6px', color: 'var(--danger-color)' }} title="Block IP"><Shield size={14} /></button>
                                                ) : (
                                                    <button onClick={() => handleStatusUpdate(ip.id, 'UNBLOCKED')} className="btn btn-outline" style={{ padding: '6px', color: 'var(--success-color)' }} title="Unblock IP"><Shield size={14} /></button>
                                                )}
                                                <button onClick={() => handleStatusUpdate(ip.id, 'IGNORED')} className="btn btn-outline" style={{ padding: '6px' }} title="Ignore"><XCircle size={14} /></button>
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
