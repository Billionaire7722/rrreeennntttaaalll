import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface AuditLog {
    id: string;
    actorId: string;
    actorRole: string;
    actionType: string;
    entityType: string;
    entityId: string;
    beforeData: unknown;
    afterData: unknown;
    ipAddress: string | null;
    createdAt: string;
}

export const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const take = 10;
    const [loading, setLoading] = useState(true);

    // Filters
    const [actorId, setActorId] = useState('');
    const [actionType, setActionType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                skip: skip.toString(),
                take: take.toString(),
            });
            if (actorId) params.append('adminId', actorId);
            if (actionType) params.append('actionType', actionType);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await api.get(`/admin/audit-logs?${params.toString()}`);
            setLogs(res.data.items || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]); // Fetch when page changes

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSkip(0); // Reset to first page
        fetchLogs();
    };

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    return (
        <div className={`glass-panel ${css.tableContainer}`} style={{ overflow: 'visible' }}>
            <div className={css.tableHeader}>
                <h2>Audit Trail</h2>
                <span className={css.totalBadge}>Total Records: {total}</span>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', padding: '16px 24px', flexWrap: 'wrap' }}>
                <input
                    className="input-field"
                    placeholder="Actor ID"
                    value={actorId}
                    onChange={e => setActorId(e.target.value)}
                    style={{ width: '150px' }}
                />
                <input
                    className="input-field"
                    placeholder="Action Type (e.g. DELETE)"
                    value={actionType}
                    onChange={e => setActionType(e.target.value)}
                    style={{ width: '180px' }}
                />
                <input
                    type="date"
                    className="input-field"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ width: '150px' }}
                />
                <input
                    type="date"
                    className="input-field"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ width: '150px' }}
                />
                <button type="submit" className="btn btn-primary"><Search size={16} /> Filter</button>
            </form>

            <div className={css.tableScroll}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Date</th>
                            <th>Actor</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center' }}>No audit records found.</td></tr>
                        ) : (
                            logs.map(log => (
                                <React.Fragment key={log.id}>
                                    <tr>
                                        <td>
                                            <button
                                                onClick={() => toggleRow(log.id)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                                            >
                                                {expandedRows.has(log.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </button>
                                        </td>
                                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                                        <td><span className="badge badge-admin" title={`ID: ${log.actorId}`}>{log.actorRole}</span></td>
                                        <td><span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{log.actionType}</span></td>
                                        <td>{log.entityType} ({log.entityId.slice(-6)})</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{log.ipAddress || 'Unknown'}</td>
                                    </tr>

                                    {expandedRows.has(log.id) && (
                                        <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                            <td></td>
                                            <td colSpan={5} style={{ padding: '16px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    <div>
                                                        <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Before Data:</h4>
                                                        <pre style={{ background: '#0d1117', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto' }}>
                                                            {log.beforeData ? JSON.stringify(log.beforeData, null, 2) : 'null'}
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>After Data:</h4>
                                                        <pre style={{ background: '#0d1117', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto' }}>
                                                            {log.afterData ? JSON.stringify(log.afterData, null, 2) : 'null'}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className={css.pagination}>
                <button
                    className="btn btn-outline"
                    disabled={skip === 0}
                    onClick={() => { setSkip(s => Math.max(0, s - take)); setTimeout(fetchLogs, 0); }}
                >
                    Previous
                </button>
                <span className={css.pageText}>
                    Page {Math.floor(skip / take) + 1} of {Math.ceil(total / take) || 1}
                </span>
                <button
                    className="btn btn-outline"
                    disabled={skip + take >= total}
                    onClick={() => { setSkip(s => s + take); setTimeout(fetchLogs, 0); }}
                >
                    Next
                </button>
            </div>
        </div>
    );
};
