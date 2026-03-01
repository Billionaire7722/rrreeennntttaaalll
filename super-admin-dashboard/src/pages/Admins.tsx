import React, { useEffect, useState } from 'react';
import { ShieldX, ShieldCheck, Trash2, ArrowDownCircle, UserPlus, Pencil } from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface Admin {
    id: string;
    name: string;
    username: string;
    email: string;
    phone?: string;
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
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
    });
    const [changingMyPassword, setChangingMyPassword] = useState(false);
    const [myPasswordForm, setMyPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
    const [editAdmin, setEditAdmin] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
    });

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/admins?skip=${skip}&take=${take}`);
            setAdmins(res.data.admins || []);
            setTotal(res.data.total || 0);
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

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdmin.name || !newAdmin.username || !newAdmin.email || !newAdmin.password) {
            alert('Please fill name, username, email and password.');
            return;
        }

        setCreating(true);
        try {
            await api.post('/admin/admins', newAdmin);
            setNewAdmin({ name: '', username: '', email: '', phone: '', password: '' });
            await fetchAdmins();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to create admin.');
        } finally {
            setCreating(false);
        }
    };

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
        if (!window.confirm('Are you sure you want to demote this Admin to VIEWER?')) return;
        try {
            await api.patch(`/admin/admins/${id}/role`, { role: 'VIEWER' });
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

    const openEdit = (admin: Admin) => {
        setEditingAdminId(admin.id);
        setEditAdmin({
            name: admin.name || '',
            username: admin.username || '',
            email: admin.email || '',
            phone: admin.phone || '',
            password: '',
        });
    };

    const handleUpdateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAdminId) return;
        if (!editAdmin.name || !editAdmin.username || !editAdmin.email) {
            alert('Please fill name, username and email.');
            return;
        }

        setUpdating(true);
        try {
            await api.patch(`/admin/admins/${editingAdminId}`, editAdmin);
            setEditingAdminId(null);
            setEditAdmin({ name: '', username: '', email: '', phone: '', password: '' });
            await fetchAdmins();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to update admin.');
        } finally {
            setUpdating(false);
        }
    };

    const handleChangeMyPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!myPasswordForm.currentPassword || !myPasswordForm.newPassword || !myPasswordForm.confirmPassword) {
            alert('Please fill all password fields.');
            return;
        }
        if (myPasswordForm.newPassword !== myPasswordForm.confirmPassword) {
            alert('New password and confirm password do not match.');
            return;
        }
        if (myPasswordForm.newPassword.length < 8) {
            alert('New password must be at least 8 characters.');
            return;
        }

        setChangingMyPassword(true);
        try {
            await api.patch('/admin/me/password', {
                currentPassword: myPasswordForm.currentPassword,
                newPassword: myPasswordForm.newPassword,
            });
            setMyPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            alert('Super-admin password changed successfully.');
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to change password.');
        } finally {
            setChangingMyPassword(false);
        }
    };

    return (
        <div style={{ display: 'grid', gap: '20px' }}>
            <div className={`glass-panel ${css.tableContainer}`}>
                <div className={css.tableHeader}>
                    <h2>Super Admin Password</h2>
                </div>
                <form onSubmit={handleChangeMyPassword} style={{ padding: '16px 24px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <input
                        className="input-field"
                        type="password"
                        placeholder="Current password"
                        value={myPasswordForm.currentPassword}
                        onChange={(e) => setMyPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    />
                    <input
                        className="input-field"
                        type="password"
                        placeholder="New password"
                        value={myPasswordForm.newPassword}
                        onChange={(e) => setMyPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    />
                    <input
                        className="input-field"
                        type="password"
                        placeholder="Confirm new password"
                        value={myPasswordForm.confirmPassword}
                        onChange={(e) => setMyPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    />
                    <button className="btn btn-primary" type="submit" disabled={changingMyPassword}>
                        {changingMyPassword ? 'Updating...' : 'Change Password'}
                    </button>
                </form>
            </div>

            <div className={`glass-panel ${css.tableContainer}`}>
                <div className={css.tableHeader}>
                    <h2>Create Admin</h2>
                </div>
                <form onSubmit={handleCreateAdmin} style={{ padding: '16px 24px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <input className="input-field" placeholder="Full name" value={newAdmin.name} onChange={(e) => setNewAdmin((p) => ({ ...p, name: e.target.value }))} />
                    <input className="input-field" placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin((p) => ({ ...p, username: e.target.value }))} />
                    <input className="input-field" placeholder="Email" value={newAdmin.email} onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))} />
                    <input className="input-field" placeholder="Phone (optional)" value={newAdmin.phone} onChange={(e) => setNewAdmin((p) => ({ ...p, phone: e.target.value }))} />
                    <input className="input-field" type="password" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))} />
                    <button className="btn btn-primary" type="submit" disabled={creating}>
                        <UserPlus size={16} />
                        {creating ? 'Creating...' : 'Create Admin'}
                    </button>
                </form>
            </div>

            {editingAdminId && (
                <div className={`glass-panel ${css.tableContainer}`}>
                    <div className={css.tableHeader}>
                        <h2>Edit Admin</h2>
                    </div>
                    <form onSubmit={handleUpdateAdmin} style={{ padding: '16px 24px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        <input className="input-field" placeholder="Full name" value={editAdmin.name} onChange={(e) => setEditAdmin((p) => ({ ...p, name: e.target.value }))} />
                        <input className="input-field" placeholder="Username" value={editAdmin.username} onChange={(e) => setEditAdmin((p) => ({ ...p, username: e.target.value }))} />
                        <input className="input-field" placeholder="Email" value={editAdmin.email} onChange={(e) => setEditAdmin((p) => ({ ...p, email: e.target.value }))} />
                        <input className="input-field" placeholder="Phone (optional)" value={editAdmin.phone} onChange={(e) => setEditAdmin((p) => ({ ...p, phone: e.target.value }))} />
                        <input className="input-field" type="password" placeholder="New password (optional)" value={editAdmin.password} onChange={(e) => setEditAdmin((p) => ({ ...p, password: e.target.value }))} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary" type="submit" disabled={updating}>
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                className="btn btn-outline"
                                type="button"
                                onClick={() => {
                                    setEditingAdminId(null);
                                    setEditAdmin({ name: '', username: '', email: '', phone: '', password: '' });
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

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
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center' }}>Loading...</td></tr>
                            ) : admins.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center' }}>No admins found.</td></tr>
                            ) : (
                                admins.map(a => (
                                    <tr key={a.id}>
                                        <td>{a.name}</td>
                                        <td>{a.username}</td>
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
                                                        onClick={() => openEdit(a)}
                                                        className="btn btn-outline"
                                                        title="Edit Admin"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
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
                                                        title="Demote to Viewer"
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
        </div>
    );
};
