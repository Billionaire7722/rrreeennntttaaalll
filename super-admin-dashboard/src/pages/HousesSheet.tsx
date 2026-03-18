import React, { useEffect, useMemo, useState } from 'react';
import {
    Search,
    Filter,
    Plus,
    Trash2,
    Edit3,
    ExternalLink,
    MapPin,
    Bed,
    Maximize2,
    RotateCcw,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import css from './Table.module.css';
import { ExportMenu, type ExportFormat } from '../components/ExportMenu';
import { downloadCsv, downloadExcel, type ExportColumn } from '../utils/export';

interface House {
    id: string;
    name: string;
    price: number | null;
    address: string;
    bedrooms: number | null;
    square: number | null;
    status: string | null;
    created_at: string;
    deleted_at?: string | null;
    owner: {
        id: string;
        name: string | null;
        avatarUrl?: string | null;
    };
}

type PropertyFilter = 'all' | 'deleted';

const normalizePropertyFilter = (value: string | null): PropertyFilter =>
    String(value || '').trim().toLowerCase() === 'deleted' ? 'deleted' : 'all';

export const HousesSheet: React.FC = () => {
    const [houses, setHouses] = useState<House[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const take = 10;
    const [searchParams, setSearchParams] = useSearchParams();
    const statusFilter = useMemo(() => normalizePropertyFilter(searchParams.get('status')), [searchParams]);
    const isDeletedView = statusFilter === 'deleted';
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        address: '',
        district: '',
        city: '',
        price: '',
        bedrooms: '',
        square: '',
        status: 'PUBLISHED',
    });

    const exportColumns: ExportColumn<House>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Property Name' },
        { key: 'address', header: 'Address' },
        { key: 'price', header: 'Price' },
        { key: 'bedrooms', header: 'Bedrooms' },
        { key: 'square', header: 'Square (m2)' },
        {
            key: 'status',
            header: 'Status',
            format: (_value, house) => (house.deleted_at ? 'DELETED' : house.status || ''),
        },
        { key: 'created_at', header: 'Created At' },
        {
            key: 'owner',
            header: 'Owner ID',
            format: (owner) => (owner as House['owner'])?.id || '',
        },
        {
            key: 'owner',
            header: 'Owner Name',
            format: (owner) => (owner as House['owner'])?.name || '',
        },
    ];

    const fetchHouses = async () => {
        setLoading(true);
        try {
            const statusParam = statusFilter === 'deleted' ? '&status=deleted' : '';
            const res = await api.get(`/houses?skip=${skip}&take=${take}&search=${encodeURIComponent(searchQuery)}${statusParam}`);
            setHouses(res.data.data || []);
            setTotal(res.data.meta?.total || 0);
        } catch (err) {
            console.error('Failed to fetch houses', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            fetchHouses();
        }, 300);
        return () => window.clearTimeout(timer);
    }, [skip, searchQuery, statusFilter]);

    const updateFilter = (nextStatus: PropertyFilter) => {
        const nextParams = new URLSearchParams(searchParams);
        if (nextStatus === 'all') {
            nextParams.delete('status');
        } else {
            nextParams.set('status', nextStatus);
        }
        setSkip(0);
        setSearchParams(nextParams);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this property?')) return;
        try {
            await api.delete(`/admin/houses/${id}`);
            fetchHouses();
        } catch (err) {
            alert('Failed to delete property');
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await api.post(`/admin/houses/${id}/restore`);
            fetchHouses();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to restore property');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/houses', {
                name: createForm.name,
                address: createForm.address,
                district: createForm.district,
                city: createForm.city,
                price: createForm.price ? Number(createForm.price) : undefined,
                bedrooms: createForm.bedrooms ? Number(createForm.bedrooms) : undefined,
                square: createForm.square ? Number(createForm.square) : undefined,
                status: createForm.status,
            });
            setIsCreateOpen(false);
            setCreateForm({
                name: '',
                address: '',
                district: '',
                city: '',
                price: '',
                bedrooms: '',
                square: '',
                status: 'PUBLISHED',
            });
            fetchHouses();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create property');
        } finally {
            setCreating(false);
        }
    };

    const handleExport = (format: ExportFormat) => {
        const baseName = isDeletedView ? 'deleted_properties_export' : 'properties_export';
        if (format === 'xlsx') {
            downloadExcel(houses, exportColumns, baseName, isDeletedView ? 'Deleted Properties' : 'Properties');
            return;
        }
        downloadCsv(houses, exportColumns, baseName);
    };

    return (
        <div className={css.tableContainer}>
            <div className={css.tableHeader}>
                <div>
                    <h2>Properties Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Review and manage real estate listings</p>
                </div>
                <div className={css.headerActions}>
                    <ExportMenu onSelect={handleExport} disabled={houses.length === 0} />
                    <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)} disabled={isDeletedView}>
                        <Plus size={16} /> Add Property
                    </button>
                </div>
            </div>

            <div className={css.tableControls}>
                <div className={css.searchWrapper}>
                    <Search className={css.searchIcon} size={16} />
                    <input
                        type="text"
                        placeholder="Search by title, location or owner..."
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
                            onChange={(e) => updateFilter(e.target.value as PropertyFilter)}
                            style={{ background: 'transparent', color: 'inherit' }}
                            aria-label="Property status filter"
                        >
                            <option value="all">All Properties</option>
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
                                <th>Property</th>
                                <th>Owner</th>
                                <th>Price</th>
                                <th>Details</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && houses.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading properties...</td></tr>
                            ) : houses.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No properties found.</td></tr>
                            ) : (
                                houses.map((house) => (
                                    <tr key={house.id}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{house.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={12} /> {house.address}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontSize: '0.875rem' }}>{house.owner?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{house.owner?.id?.slice(0, 8) || ''}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--accent-color)' }}>
                                                {house.price == null ? '-' : `$${Number(house.price).toLocaleString()}`}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bed size={12} /> {house.bedrooms ?? '-'}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Maximize2 size={12} /> {house.square ?? '-'}m2</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${isDeletedView ? 'badge-banned' : String(house.status || '').toUpperCase() === 'PUBLISHED' ? 'badge-active' : 'badge-admin'}`}>
                                                {isDeletedView ? 'DELETED' : house.status || '-'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            {new Date(house.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className={css.actions}>
                                                {isDeletedView ? (
                                                    <button onClick={() => handleRestore(house.id)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--success-color)' }} title="Restore">
                                                        <RotateCcw size={14} />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-outline" style={{ padding: '6px' }} title="View in Users app" onClick={() => window.open(`http://localhost:3002/properties/${house.id}`, '_blank')}>
                                                            <ExternalLink size={14} />
                                                        </button>
                                                        <button className="btn btn-outline" style={{ padding: '6px' }} title="Edit (via Users app)" onClick={() => window.open(`http://localhost:3002/properties/${house.id}`, '_blank')}>
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDelete(house.id)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--danger-color)' }} title="Delete"><Trash2 size={14} /></button>
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
                        {total === 0 ? 'Showing 0 of 0 properties' : `Showing ${skip + 1} to ${Math.min(skip + take, total)} of ${total} properties`}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" disabled={skip === 0} onClick={() => setSkip((current) => Math.max(0, current - take))}>Previous</button>
                        <button className="btn btn-outline" disabled={skip + take >= total} onClick={() => setSkip((current) => current + take)}>Next</button>
                    </div>
                </div>
            </div>

            {isCreateOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
                    <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--card-bg)', padding: 20, maxWidth: 520 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 style={{ margin: 0 }}>Create Property</h3>
                            <button className="btn btn-outline" onClick={() => setIsCreateOpen(false)}>Close</button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="input-field" required placeholder="Name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                            <input className="input-field" required placeholder="Address" value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <input className="input-field" required placeholder="District" value={createForm.district} onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })} />
                                <input className="input-field" required placeholder="City" value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <input className="input-field" placeholder="Price" inputMode="numeric" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })} />
                                <input className="input-field" placeholder="Bedrooms" inputMode="numeric" value={createForm.bedrooms} onChange={(e) => setCreateForm({ ...createForm, bedrooms: e.target.value })} />
                                <input className="input-field" placeholder="Square (m2)" inputMode="numeric" value={createForm.square} onChange={(e) => setCreateForm({ ...createForm, square: e.target.value })} />
                            </div>
                            <select className="input-field" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                                <option value="PUBLISHED">PUBLISHED</option>
                                <option value="DRAFT">DRAFT</option>
                                <option value="hidden">hidden</option>
                            </select>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
