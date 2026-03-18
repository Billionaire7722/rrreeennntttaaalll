import React, { useEffect, useMemo, useState } from 'react';
import {
    UserX,
    UserCheck,
    Trash2,
    Edit2,
    Plus,
    X,
    Search,
    Filter,
    Eye,
    EyeOff,
    RotateCcw,
    Activity,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import css from './Table.module.css';
import { UserTimelineModal } from '../components/UserTimelineModal';
import { ExportMenu, type ExportFormat } from '../components/ExportMenu';
import { downloadCsv, downloadExcel, type ExportColumn } from '../utils/export';

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    created_at: string;
    last_login?: string;
    avatarUrl?: string | null;
    deleted_at?: string | null;
    riskScore?: { score: number; factors?: Record<string, unknown>; updatedAt?: string };
}

type UserFilter = 'all' | 'ACTIVE' | 'LOCKED' | 'deleted';

const normalizeUserFilter = (value: string | null): UserFilter => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'restricted' || normalized === 'locked') return 'LOCKED';
    if (normalized === 'active') return 'ACTIVE';
    if (normalized === 'deleted') return 'deleted';
    return 'all';
};

export const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const take = 10;
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const statusFilter = useMemo(() => normalizeUserFilter(searchParams.get('status')), [searchParams]);
    const isDeletedView = statusFilter === 'deleted';

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [riskDetailsUser, setRiskDetailsUser] = useState<User | null>(null);
    const [timelineUser, setTimelineUser] = useState<User | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
    });

    const exportColumns: ExportColumn<User>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'username', header: 'Username' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        {
            key: 'status',
            header: 'Status',
            format: (_value, user) => (user.deleted_at ? 'DELETED' : user.status),
        },
        { key: 'created_at', header: 'Created At' },
        {
            key: 'last_login',
            header: 'Last Login',
            format: (value) => (typeof value === 'string' ? value : ''),
        },
        {
            key: 'riskScore',
            header: 'Risk Score',
            format: (value) => {
                const riskScore = value as User['riskScore'];
                return riskScore?.score ?? '';
            },
        },
    ];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const statusParam = statusFilter === 'all' ? '' : `&status=${encodeURIComponent(statusFilter)}`;
            const res = await api.get(`/admin/users?skip=${skip}&take=${take}&search=${encodeURIComponent(searchQuery)}${statusParam}`);
            setUsers(res.data.users || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => window.clearTimeout(timer);
    }, [skip, searchQuery, statusFilter]);

    const updateFilter = (nextStatus: UserFilter) => {
        const nextParams = new URLSearchParams(searchParams);
        if (nextStatus === 'all') {
            nextParams.delete('status');
        } else {
            nextParams.set('status', nextStatus);
        }
        setSkip(0);
        setSearchParams(nextParams);
    };

    const handleStatusToggle = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        try {
            const durationDays =
                newStatus === 'LOCKED'
                    ? Number(prompt('Lock duration in days? Leave blank for indefinite lock.') || '') || undefined
                    : undefined;
            await api.patch(`/admin/users/${userId}/status`, { status: newStatus, durationDays });
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Action failed.');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/users/${deleteTarget.id}`);
            fetchUsers();
            setDeleteTarget(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Action failed.');
        } finally {
            setDeleting(false);
        }
    };

    const handleRestore = async (userId: string) => {
        try {
            await api.post(`/admin/users/${userId}/restore`);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to restore user');
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', formData);
            setIsCreateModalOpen(false);
            setFormData({ name: '', username: '', email: '', phone: '', password: '' });
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            const payload: Record<string, string> = { ...formData };
            if (!payload.password) delete payload.password;
            await api.patch(`/admin/users/${selectedUser.id}`, payload);
            setIsEditModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update user');
        }
    };

    const handleExport = (format: ExportFormat) => {
        const baseName = isDeletedView ? 'deleted_users_export' : 'users_export';
        if (format === 'xlsx') {
            downloadExcel(users, exportColumns, baseName, isDeletedView ? 'Deleted Users' : 'Users');
            return;
        }
        downloadCsv(users, exportColumns, baseName);
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            password: '',
        });
        setIsEditModalOpen(true);
    };

    return (
        <div className={css.tableContainer}>
            <div className={css.tableHeader}>
                <div>
                    <h2>User Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage and monitor platform users</p>
                </div>
                <div className={css.headerActions}>
                    <ExportMenu onSelect={handleExport} disabled={users.length === 0} />
                    <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)} disabled={isDeletedView}>
                        <Plus size={16} /> Add User
                    </button>
                </div>
            </div>

            <div className={css.tableControls}>
                <div className={css.searchWrapper}>
                    <Search className={css.searchIcon} size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, email or username..."
                        className={`input-field ${css.searchInput}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={css.filterGroup}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Filter size={14} />
                        <select
                            className="btn btn-outline"
                            value={statusFilter}
                            onChange={(e) => updateFilter(e.target.value as UserFilter)}
                            style={{ background: 'transparent', color: 'inherit' }}
                            aria-label="Status filter"
                        >
                            <option value="all">All</option>
                            <option value="ACTIVE">Active</option>
                            <option value="LOCKED">Restricted</option>
                            <option value="deleted">Deleted</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={css.tableWrapper}>
                <div className={css.tableScroll}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Risk Score</th>
                                <th>Created</th>
                                <th>Last Login</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && users.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No users found matching your search.</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className={css.userCell}>
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} className={css.avatar} alt="" />
                                                ) : (
                                                    <div className={css.avatar} style={{ background: 'var(--accent-soft)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.75rem' }}>
                                                        {(user.name || 'U')[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className={css.userName}>{user.name}</div>
                                                    <div className={css.userEmail}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-admin">{user.role}</span></td>
                                        <td>
                                            <span className={`badge ${isDeletedView ? 'badge-banned' : user.status === 'ACTIVE' ? 'badge-active' : 'badge-banned'}`}>
                                                {isDeletedView ? 'DELETED' : user.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div
                                                className={css.riskScoreCell}
                                                onClick={() => setRiskDetailsUser(user)}
                                                style={{
                                                    cursor: 'pointer',
                                                    color: (user.riskScore?.score || 0) > 60 ? 'var(--danger-color)' : (user.riskScore?.score || 0) > 30 ? 'var(--warning-color)' : 'var(--success-color)',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: (user.riskScore?.score || 0) > 60 ? 'var(--danger-color)' : (user.riskScore?.score || 0) > 30 ? 'var(--warning-color)' : 'var(--success-color)',
                                                    }}
                                                />
                                                {user.riskScore?.score || 0}%
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                                        <td>
                                            <div className={css.actions}>
                                                <button onClick={() => setTimelineUser(user)} className="btn btn-outline" style={{ padding: '6px' }} title="Activity Timeline"><Activity size={14} /></button>
                                                {isDeletedView ? (
                                                    <button onClick={() => handleRestore(user.id)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--success-color)' }} title="Restore">
                                                        <RotateCcw size={14} />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => openEditModal(user)} className="btn btn-outline" style={{ padding: '6px' }} title="Edit"><Edit2 size={14} /></button>
                                                        <button onClick={() => handleStatusToggle(user.id, user.status)} className="btn btn-outline" style={{ padding: '6px' }} title="Toggle Status">
                                                            {user.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
                                                        </button>
                                                        <button onClick={() => setDeleteTarget(user)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--danger-color)' }} title="Delete"><Trash2 size={14} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={css.pagination}>
                    <span className={css.pageText}>
                        {total === 0 ? 'Showing 0 of 0 users' : `Showing ${skip + 1} to ${Math.min(skip + take, total)} of ${total} users`}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" disabled={skip === 0} onClick={() => setSkip((current) => Math.max(0, current - take))}>Previous</button>
                        <button className="btn btn-outline" disabled={skip + take >= total} onClick={() => setSkip((current) => current + take)}>Next</button>
                    </div>
                </div>
            </div>

            {(isCreateModalOpen || isEditModalOpen) && (
                <div className="modal-overlay" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>
                    <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ color: 'var(--text-primary)' }}>{isCreateModalOpen ? 'Create User' : 'Edit User'}</h3>
                            <button className="modal-close" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}><X size={18} /></button>
                        </div>
                        <form onSubmit={isCreateModalOpen ? handleCreateSubmit : handleEditSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input required placeholder="Full Name" className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            <input required placeholder="Username" className="input-field" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                            <input required type="email" placeholder="Email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            <input placeholder="Phone" className="input-field" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} placeholder={isEditModalOpen ? 'New Password (optional)' : 'Password'} className="input-field" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isCreateModalOpen ? 'Create' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="modal-content glass-panel" style={{ background: 'var(--card-bg)', padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Confirm Deletion</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete User'}</button>
                        </div>
                    </div>
                </div>
            )}

            {riskDetailsUser && (
                <div className="modal-overlay" onClick={() => setRiskDetailsUser(null)}>
                    <div className="modal-content glass-panel" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', maxWidth: '500px' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ color: 'var(--text-primary)' }}>Risk Assessment: {riskDetailsUser.name}</h3>
                            <button className="modal-close" onClick={() => setRiskDetailsUser(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Risk Score</div>
                                    <div
                                        style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 'bold',
                                            color: (riskDetailsUser.riskScore?.score || 0) > 60 ? 'var(--danger-color)' : (riskDetailsUser.riskScore?.score || 0) > 30 ? 'var(--warning-color)' : 'var(--success-color)',
                                        }}
                                    >
                                        {riskDetailsUser.riskScore?.score || 0}%
                                    </div>
                                </div>
                                <div
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        background: (riskDetailsUser.riskScore?.score || 0) > 60 ? 'rgba(239, 68, 68, 0.1)' : (riskDetailsUser.riskScore?.score || 0) > 30 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: (riskDetailsUser.riskScore?.score || 0) > 60 ? 'var(--danger-color)' : (riskDetailsUser.riskScore?.score || 0) > 30 ? 'var(--warning-color)' : 'var(--success-color)',
                                        fontWeight: '600',
                                    }}
                                >
                                    {(riskDetailsUser.riskScore?.score || 0) > 60 ? 'High Risk' : (riskDetailsUser.riskScore?.score || 0) > 30 ? 'Moderate Risk' : 'Low Risk'}
                                </div>
                            </div>

                            <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Risk Factors</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {riskDetailsUser.riskScore?.factors && Object.entries(riskDetailsUser.riskScore.factors).length > 0 ? (
                                    Object.entries(riskDetailsUser.riskScore.factors).map(([key, value]) => (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-soft)', borderRadius: '8px' }}>
                                            <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                                            <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>+{String(value)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No significant risk factors detected for this user.</div>
                                )}
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRiskDetailsUser(null)}>Dismiss</button>
                                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { handleStatusToggle(riskDetailsUser.id, riskDetailsUser.status); setRiskDetailsUser(null); }}>
                                    {riskDetailsUser.status === 'ACTIVE' ? 'Restrict Account' : 'Reactivate Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {timelineUser && (
                <UserTimelineModal
                    userId={timelineUser.id}
                    userName={timelineUser.name}
                    onClose={() => setTimelineUser(null)}
                />
            )}

            <style>{`
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .modal-content { width: 100%; max-width: 440px; border-radius: 12px; }
                .modal-header { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
                .modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; }
                .modal-close:hover { color: var(--text-primary); }
                .modal-body { padding: 20px; }
            `}</style>
        </div>
    );
};
