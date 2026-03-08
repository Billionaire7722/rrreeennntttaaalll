import React, { useEffect, useState } from 'react';
import { UserX, UserCheck, Trash2, Edit2, Plus, X, Eye, EyeOff } from 'lucide-react';
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
    avatarUrl?: string | null;
    coverUrl?: string | null;
    bio?: string | null;
    _count?: { ownedHouses?: number };
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
    const [showPassword, setShowPassword] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);

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

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/admins/${deleteTarget.id}`);
            fetchUsers();
            setDeleteTarget(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Action failed.');
        } finally {
            setDeleting(false);
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
        setShowPassword(false);
        setIsEditModalOpen(true);
    };

    return (
        <div className={`glass-panel ${css.tableContainer}`}>
            <div className={css.tableHeader}>
                <div>
                    <h2>User Management</h2>
                    <span className={css.totalBadge}>Total: {total}</span>
                </div>
                <button
                    className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => {
                        setFormData({ name: '', username: '', email: '', phone: '', password: '' });
                        setShowPassword(false);
                        setIsCreateModalOpen(true);
                    }}
                >
                    <Plus size={18} /> Add User
                </button>
            </div>

            <div style={{ padding: '0 24px 18px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Passwords are stored as secure hashes in the database, so current user passwords cannot be revealed. You can show or hide any new password before saving a replacement.
            </div>

            <div className={css.tableScroll}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Contact</th>
                            <th>Bio</th>
                            <th>Listings</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center' }}>No users found.</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {u.avatarUrl
                                                ? <img src={u.avatarUrl} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', flexShrink: 0 }} />
                                                : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0284c7', fontSize: '0.85rem', flexShrink: 0 }}>
                                                    {(u.name || 'U')[0].toUpperCase()}
                                                  </div>
                                            }
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>@{u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{u.email}</div>
                                        {u.phone && <div style={{ fontSize: '0.8rem', color: '#666' }}>{u.phone}</div>}
                                    </td>
                                    <td>
                                        <div style={{ maxWidth: 160, fontSize: '0.8rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.bio || ''}>
                                            {u.bio || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No bio</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 700, color: '#0ea5e9', fontSize: '1rem' }}>{u._count?.ownedHouses ?? 0}</span>
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
                                                onClick={() => setDeleteTarget(u)}
                                                className="btn btn-danger"
                                                title="Delete User"
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
                            <h3>Create New User</h3>
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
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input required type={showPassword ? "text" : "password"} placeholder="Minimum 8 chars" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ paddingRight: '40px' }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{showPassword ? 'Hide' : 'Show'}</span>
                                    </button>
                                </div>
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
                            <h3>Edit User Info</h3>
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
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input type={showPassword ? "text" : "password"} placeholder="Enter new password" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ paddingRight: '40px' }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{showPassword ? 'Hide' : 'Show'}</span>
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirm User Deletion</h3>
                            <button className="modal-close" onClick={() => !deleting && setDeleteTarget(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <p style={{ margin: 0, color: '#334155' }}>
                                You are about to soft-delete this user:
                            </p>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{deleteTarget.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#475569' }}>@{deleteTarget.username}</div>
                                <div style={{ fontSize: '0.85rem', color: '#475569' }}>{deleteTarget.email}</div>
                            </div>
                            <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', fontWeight: 600 }}>
                                This action can hide the account from normal operations.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                                    {deleting ? 'Deleting...' : 'Delete User'}
                                </button>
                            </div>
                        </div>
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



