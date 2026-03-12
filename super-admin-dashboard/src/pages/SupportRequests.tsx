import React, { useEffect, useState } from 'react';
import { 
    Search, 
    User, 
    Filter,
    Reply,
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
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openOnly, setOpenOnly] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/support-requests');
            setRequests(res.data.items || []);
        } catch (err) {
            console.error('Failed to fetch support requests', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async (id: string) => {
        if (!confirm('Are you sure you want to close this ticket?')) return;
        try {
            await api.post(`/admin/tickets/${id}/status`, { status: 'CLOSED' });
            alert('Ticket closed');
            fetchRequests();
        } catch (err) {
            alert('Failed to close ticket');
        }
    };

    const handleReply = async (id: string) => {
        if (!replyContent.trim()) return;
        setSending(true);
        try {
            await api.post(`/admin/tickets/${id}/reply`, { content: replyContent });
            await api.post(`/admin/tickets/${id}/status`, { status: 'IN_PROGRESS' });
            setReplyContent('');
            alert('Reply sent');
            fetchRequests();
        } catch (err) {
            alert('Failed to send reply');
        } finally {
            setSending(false);
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
                    <button className="btn btn-primary" onClick={fetchRequests}>Refresh</button>
                </div>
            </div>

            <div className={css.tableControls}>
                <div className={css.searchWrapper}>
                    <Search className={css.searchIcon} size={16} />
                    <input
                        type="text"
                        placeholder="Search by subject, message, name, email..."
                        className={`input-field ${css.searchInput}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={css.filterGroup}>
                    <button className="btn btn-outline" onClick={() => setOpenOnly(v => !v)}>
                        <Filter size={14} /> {openOnly ? 'Showing Open Only' : 'All Statuses'}
                    </button>
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
                                requests
                                    .filter((r) => (openOnly ? r.status !== 'CLOSED' : true))
                                    .filter((r) => {
                                        const q = searchQuery.trim().toLowerCase();
                                        if (!q) return true;
                                        const hay = `${r.subject} ${r.message} ${r.user?.name || ''} ${r.user?.email || ''}`.toLowerCase();
                                        return hay.includes(q);
                                    })
                                    .map(r => (
                                    <React.Fragment key={r.id}>
                                        <tr>
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
                                                    <button className="btn btn-outline" style={{ padding: '6px' }} title="Reply" onClick={() => setSelectedTicketId(selectedTicketId === r.id ? null : r.id)}><Reply size={14} /></button>
                                                    <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--success-color)' }} title="Close Ticket" onClick={() => handleClose(r.id)}><CheckCircle2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                        {selectedTicketId === r.id && (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--accent-color)', paddingLeft: '12px' }}>
                                                            <strong>Initial Message:</strong><br/>
                                                            {r.message || 'No initial message content'}
                                                        </div>
                                                        <textarea 
                                                            className="input-field" 
                                                            placeholder="Type your response..." 
                                                            style={{ width: '100%', minHeight: '80px', background: '#18181b' }}
                                                            value={replyContent}
                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                        />
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                            <button 
                                                                className="btn btn-primary" 
                                                                disabled={!replyContent.trim() || sending}
                                                                onClick={() => handleReply(r.id)}
                                                            >
                                                                {sending ? 'Sending...' : 'Send Reply'}
                                                            </button>
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
            </div>
        </div>
    );
};
