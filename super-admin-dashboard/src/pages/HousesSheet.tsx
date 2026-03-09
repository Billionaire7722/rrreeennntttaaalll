import React, { useEffect, useState } from 'react';
import { 
    Search, 
    Filter, 
    Download, 
    Plus, 
    Trash2, 
    Edit3, 
    ExternalLink,
    MapPin,
    Bed,
    Maximize2
} from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

interface House {
    id: string;
    title: string;
    price: number;
    address: string;
    bedrooms: number;
    area: number;
    status: string;
    created_at: string;
    owner: {
        name: string;
        email: string;
    };
}

export const HousesSheet: React.FC = () => {
    const [houses, setHouses] = useState<House[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const take = 10;

    const fetchHouses = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/houses?skip=${skip}&take=${take}&search=${searchQuery}`);
            setHouses(res.data.houses || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch houses', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHouses();
        }, 300);
        return () => clearTimeout(timer);
    }, [skip, searchQuery]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this property?')) return;
        try {
            await api.delete(`/houses/${id}`);
            fetchHouses();
        } catch (err) {
            alert('Failed to delete property');
        }
    };

    return (
        <div className={css.tableContainer}>
            <div className={css.tableHeader}>
                <div>
                    <h2>Properties Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Review and manage real estate listings</p>
                </div>
                <div className={css.headerActions}>
                    <button className="btn btn-outline"><Download size={16} /> Export</button>
                    <button className="btn btn-primary"><Plus size={16} /> Add Property</button>
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
                    <button className="btn btn-outline"><Filter size={14} /> Filter</button>
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
                                houses.map(h => (
                                    <tr key={h.id}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={12} /> {h.address}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontSize: '0.875rem' }}>{h.owner?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.owner?.email}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--accent-color)' }}>
                                                ${h.price.toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bed size={12} /> {h.bedrooms}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Maximize2 size={12} /> {h.area}m²</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${h.status === 'PUBLISHED' ? 'badge-active' : 'badge-banned'}`}>
                                                {h.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            {new Date(h.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className={css.actions}>
                                                <button className="btn btn-outline" style={{ padding: '6px' }} title="View Details"><ExternalLink size={14} /></button>
                                                <button className="btn btn-outline" style={{ padding: '6px' }} title="Edit"><Edit3 size={14} /></button>
                                                <button onClick={() => handleDelete(h.id)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--danger-color)' }} title="Delete"><Trash2 size={14} /></button>
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
                        Showing {skip + 1} to {Math.min(skip + take, total)} of {total} properties
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" disabled={skip === 0} onClick={() => setSkip(s => Math.max(0, s - take))}>Previous</button>
                        <button className="btn btn-outline" disabled={skip + take >= total} onClick={() => setSkip(s => s + take)}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
