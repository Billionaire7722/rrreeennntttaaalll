import React, { useEffect, useState } from 'react';
import { UserX, UserCheck, Trash2, Edit2, Plus, X } from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    phone?: string;
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

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?skip=${skip}&take=${take}`);
            setUsers(res.data.users || []);
            setTotal(res.data.total || 0);
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
            await api.patch(`/admin/admins/${userId}/status`, { status: newStatus });
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Action failed.');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you absolutely sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/admins/${userId}`);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Action failed.');
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', formData);
            setIsCreateModalOpen(false);
            setFormData({ name: '', username: '', email: '', phone: '', password: '' });
            fetchUsers();
            alert("User created successfully");
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            const payload: any = {
                name: formData.name,
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
            };
            if (formData.password) {
                payload.password = formData.password;
            }
            await api.patch(`/admin/admins/${selectedUser.id}`, payload);
            setIsEditModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
            alert("User updated successfully");
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update user');
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            password: '' // leave blank unless changing
        });
        setIsEditModalOpen(true);
    };

    return (
        <div className={`glass-panel ${css.tableContainer}`}>
            <div className={css.tableHeader}>
                <div>
                    <h2>Viewer Management</h2>
                    <span className={css.totalBadge}>Total: {total}</span>
                </div>
                <button
                    className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => {
                        setFormData({ name: '', username: '', email: '', phone: '', password: '' });
                        setIsCreateModalOpen(true);
                    }}
                >
                    <Plus size={18} /> Add Viewer
                </button>
            </div>

            <div className={css.tableScroll}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
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
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>@{u.username}</div>
                                    </td>
                                    <td>
                                        <div>{u.email}</div>
                                        {u.phone && <div style={{ fontSize: '0.8rem', color: '#666' }}>{u.phone}</div>}
                                    </td>
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
                                                onClick={() => openEditModal(u)}
                                                className="btn btn-outline"
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
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
                                                title="Delete Viewer"
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

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Viewer</h3>
                            <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Full Name</label>
                                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Username</label>
                                <input required type="text" className="input-field" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email Address</label>
                                <input required type="email" className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Phone (Optional)</label>
                                <input type="text" className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Password</label>
                                <input required type="password" placeholder="Minimum 8 chars" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && selectedUser && (
                <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Viewer Info</h3>
                            <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Full Name</label>
                                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Username</label>
                                <input required type="text" className="input-field" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email Address</label>
                                <input required type="email" className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Phone</label>
                                <input type="text" className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className={css.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>New Password (leave blank to keep current)</label>
                                <input type="password" placeholder="Enter new password" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
            .modal-overlay {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); backdrop-filter: blur(3px);
                z-index: 1000; display: flex; align-items: center; justify-content: center;
            }
            .modal-content {
                background: white; border-radius: 12px; width: 440px; max-width: 90vw;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden;
            }
            .modal-header {
                padding: 1rem 1.25rem; border-bottom: 1px solid #eef2f6;
                display: flex; justify-content: space-between; align-items: center;
                background: #f8fafc;
            }
            .modal-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; font-weight: 700; }
            .modal-close {
                background: none; border: none; color: #64748b; cursor: pointer;
                display: flex; align-items: center; justify-content: center; padding: 4px;
                border-radius: 6px; transition: 0.2s;
            }
            .modal-close:hover { background: #e2e8f0; color: #0f172a; }
            .modal-body { padding: 1.25rem; }
            .input-field {
                padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px;
                font-size: 0.95rem; width: 100%; box-sizing: border-box; outline: none; transition: 0.2s;
            }
            .input-field:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
            `}</style>
        </div>
    );
};
