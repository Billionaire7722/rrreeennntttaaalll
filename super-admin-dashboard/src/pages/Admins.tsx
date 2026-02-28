import React, { useEffect, useState } from 'react';
import { ShieldX, ShieldCheck, Trash2, ArrowDownCircle } from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface Admin {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

export const Admins: React.FC = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const take = 10;
    const [loading, setLoading] = useState(true);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/admins?skip=${skip}&take=${take}`);
            setAdmins(res.data || []);
            setTotal(res.data?.length || 0);
        } catch {
            console.error('Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]);

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'BANNED' ? 'suspend' : 'reactivate'} this admin?`)) return;

        try {
            await api.patch(`/admin/admins/${id}/status`, { status: newStatus });
            fetchAdmins();
        } catch {
            alert('Failed to update status.');
        }
    };

    const handleDemote = async (id: string) => {
        if (!window.confirm('Are you sure you want to demote this Admin to a regular USER?')) return;
        try {
            await api.patch(`/admin/admins/${id}/role`, { role: 'USER' });
            fetchAdmins();
        } catch {
            alert('Failed to demote admin.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('CRITICAL ACTION: Are you absolutely sure you want to soft-delete this admin account?')) return;
        try {
            await api.delete(`/admin/admins/${id}`);
            fetchAdmins();
        } catch {
            alert('Failed to delete admin.');
        }
    };

    return (
        <div className={`glass-panel ${css.tableContainer}`}>
            <div className={css.tableHeader}>
                <h2>Admin Management</h2>
                <div className={css.headerActions}>
                    <span className={css.totalBadge}>Total: {total}</span>
                </div>
            </div>

            <div className={css.tableScroll}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center' }}>No admins found.</td></tr>
                        ) : (
                            admins.map(a => (
                                <tr key={a.id}>
                                    <td>{a.name}</td>
                                    <td>{a.email}</td>
                                    <td><span className={`badge badge-admin`}>{a.role}</span></td>
                                    <td>
                                        <span className={`badge ${a.status === 'ACTIVE' ? 'badge-active' : 'badge-banned'}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td>{new Date(a.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {a.role !== 'SUPER_ADMIN' ? (
                                            <div className={css.actions}>
                                                <button
                                                    onClick={() => handleStatusToggle(a.id, a.status)}
                                                    className={`btn ${a.status === 'ACTIVE' ? 'btn-outline' : 'btn-primary'}`}
                                                    title={a.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                                                >
                                                    {a.status === 'ACTIVE' ? <ShieldX size={16} /> : <ShieldCheck size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDemote(a.id)}
                                                    className="btn btn-outline"
                                                    title="Demote to User"
                                                >
                                                    <ArrowDownCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(a.id)}
                                                    className="btn btn-danger"
                                                    title="Delete Admin"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Protected</span>
                                        )}
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
                    onClick={() => setSkip(s => Math.max(0, s - take))}
                >
                    Previous
                </button>
                <span className={css.pageText}>
                    Page {Math.floor(skip / take) + 1} of {Math.ceil(total / take) || 1}
                </span>
                <button
                    className="btn btn-outline"
                    disabled={skip + take >= total}
                    onClick={() => setSkip(s => s + take)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};
