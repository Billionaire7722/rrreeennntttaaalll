import React, { useEffect, useState } from 'react';
import { UserX, UserCheck, Trash2 } from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

export const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const take = 10;
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?skip=${skip}&take=${take}`);
            setUsers(res.data || []);
            setTotal(res.data?.length || 0);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]);

    const handleStatusToggle = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'BANNED' ? 'deactivate' : 'reactivate'} this user?`)) return;

        try {
            // NOTE: Relying on /admin/admins route due to backend endpoint consolidation, gracefully catching errors.
            await api.patch(`/admin/admins/${userId}/status`, { status: newStatus });
            fetchUsers();
        } catch {
            alert('Action failed. The backend might only support this for Admin entities currently.');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you absolutely sure you want to soft-delete this user?')) return;
        try {
            await api.delete(`/admin/admins/${userId}`); // Fallback backend endpoint mapping
            fetchUsers();
        } catch {
            alert('Action failed. The backend might only support this for Admin entities currently.');
        }
    };

    return (
        <div className={`glass-panel ${css.tableContainer}`}>
            <div className={css.tableHeader}>
                <h2>User Management</h2>
                <span className={css.totalBadge}>Total: {total}</span>
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
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center' }}>No users found.</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`badge badge-user`}>{u.role}</span></td>
                                    <td>
                                        <span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-banned'}`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className={css.actions}>
                                            <button
                                                onClick={() => handleStatusToggle(u.id, u.status)}
                                                className={`btn ${u.status === 'ACTIVE' ? 'btn-outline' : 'btn-primary'}`}
                                                title={u.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                                            >
                                                {u.status === 'ACTIVE' ? <UserX size={16} /> : <UserCheck size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="btn btn-danger"
                                                title="Soft Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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
