import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Save, Trash2, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import css from './Table.module.css';

type PostedByAdmin = {
    id: string;
    name: string;
};

type HouseRow = {
    id: string;
    name: string;
    created_at: string;
    updated_at?: string;
    status?: string | null;
    address: string;
    city: string;
    district: string;
    price?: number | null;
    square?: number | null;
    bedrooms?: number | null;
    description?: string | null;
    contact_phone?: string | null;
    postedByAdmins?: PostedByAdmin[];
};

const normalizeNumber = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const HousesSheet: React.FC = () => {
    const [houses, setHouses] = useState<HouseRow[]>([]);
    const [drafts, setDrafts] = useState<Record<string, HouseRow>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);

    const fetchHouses = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get('/houses?skip=0&take=500');
            const rows = Array.isArray(res.data?.data) ? res.data.data : [];
            setHouses(rows);
            setDrafts((prev) => {
                const next: Record<string, HouseRow> = {};
                for (const row of rows) {
                    next[row.id] = prev[row.id] || row;
                }
                return next;
            });
        } catch (error) {
            console.error('Failed to fetch houses sheet', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchHouses();
    }, [refreshTick]);

    useEffect(() => {
        const timer = window.setInterval(() => fetchHouses(true), 5000);
        return () => window.clearInterval(timer);
    }, []);

    const hasChanges = useMemo(() => {
        const changed: Record<string, boolean> = {};
        for (const house of houses) {
            changed[house.id] = JSON.stringify(house) !== JSON.stringify(drafts[house.id] || house);
        }
        return changed;
    }, [drafts, houses]);

    const updateDraft = (id: string, key: keyof HouseRow, value: string) => {
        setDrafts((prev) => ({
            ...prev,
            [id]: {
                ...(prev[id] || houses.find((house) => house.id === id) || { id }),
                [key]: value,
            } as HouseRow,
        }));
    };

    const saveRow = async (id: string) => {
        const draft = drafts[id];
        if (!draft) return;
        setSavingId(id);
        try {
            await api.patch(`/houses/${id}`, {
                name: draft.name,
                address: draft.address,
                city: draft.city,
                district: draft.district,
                price: normalizeNumber(String(draft.price ?? '')),
                square: normalizeNumber(String(draft.square ?? '')),
                bedrooms: normalizeNumber(String(draft.bedrooms ?? '')),
                description: draft.description || null,
                contact_phone: draft.contact_phone || null,
                status: draft.status || 'available',
            });
            await fetchHouses(true);
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Failed to save house changes.');
        } finally {
            setSavingId(null);
        }
    };

    const deleteRow = async (id: string) => {
        if (!window.confirm('Delete this house from the active listing sheet?')) return;
        setDeletingId(id);
        try {
            await api.delete(`/houses/${id}`);
            await fetchHouses(true);
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Failed to delete house.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className={`glass-panel ${css.tableContainer}`}>
            <div className={css.tableHeader}>
                <div>
                    <h2>Houses Spreadsheet</h2>
                    <span className={css.totalBadge}>Live sync every 5s</span>
                </div>
                <button className="btn btn-outline" onClick={() => setRefreshTick((prev) => prev + 1)}>
                    <RefreshCw size={16} /> Refresh now
                </button>
            </div>

            <div style={{ padding: '0 24px 18px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Super-admin edits here write directly to the database and will be picked up by all frontends on their next refresh cycle.
            </div>

            <div className={css.tableScroll}>
                <table className="data-table" style={{ minWidth: 1400 }}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Owner</th>
                            <th>Created</th>
                            <th>Status</th>
                            <th>Address</th>
                            <th>City</th>
                            <th>District</th>
                            <th>Price</th>
                            <th>Area</th>
                            <th>Bedrooms</th>
                            <th>Phone</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={13} style={{ textAlign: 'center' }}>Loading houses...</td></tr>
                        ) : houses.length === 0 ? (
                            <tr><td colSpan={13} style={{ textAlign: 'center' }}>No houses found.</td></tr>
                        ) : (
                            houses.map((house) => {
                                const draft = drafts[house.id] || house;
                                const dirty = hasChanges[house.id];
                                return (
                                    <tr key={house.id}>
                                        <td><input className="input-field" value={draft.name || ''} onChange={(e) => updateDraft(house.id, 'name', e.target.value)} /></td>
                                        <td>{(house.postedByAdmins || []).map((o) => o.name).join(', ') || 'Unknown'}</td>
                                        <td>{new Date(house.created_at).toLocaleString()}</td>
                                        <td>
                                            <select className="input-field" value={draft.status || 'available'} onChange={(e) => updateDraft(house.id, 'status', e.target.value)}>
                                                <option value="available">Available</option>
                                                <option value="rented">Rented</option>
                                            </select>
                                        </td>
                                        <td><input className="input-field" value={draft.address || ''} onChange={(e) => updateDraft(house.id, 'address', e.target.value)} /></td>
                                        <td><input className="input-field" value={draft.city || ''} onChange={(e) => updateDraft(house.id, 'city', e.target.value)} /></td>
                                        <td><input className="input-field" value={draft.district || ''} onChange={(e) => updateDraft(house.id, 'district', e.target.value)} /></td>
                                        <td><input className="input-field" value={draft.price ?? ''} onChange={(e) => updateDraft(house.id, 'price', e.target.value)} /></td>
                                        <td><input className="input-field" value={draft.square ?? ''} onChange={(e) => updateDraft(house.id, 'square', e.target.value)} /></td>
                                        <td><input className="input-field" value={draft.bedrooms ?? ''} onChange={(e) => updateDraft(house.id, 'bedrooms', e.target.value)} /></td>
                                        <td><input className="input-field" value={draft.contact_phone || ''} onChange={(e) => updateDraft(house.id, 'contact_phone', e.target.value)} /></td>
                                        <td><textarea className="input-field" style={{ minHeight: 80, resize: 'vertical' }} value={draft.description || ''} onChange={(e) => updateDraft(house.id, 'description', e.target.value)} /></td>
                                        <td>
                                            <div className={css.actions}>
                                                <button className="btn btn-primary" disabled={!dirty || savingId === house.id} onClick={() => saveRow(house.id)} title="Save changes">
                                                    {savingId === house.id ? <RefreshCw size={16} /> : <Save size={16} />}
                                                </button>
                                                <button className="btn btn-outline" disabled={!dirty || savingId === house.id} onClick={() => setDrafts((prev) => ({ ...prev, [house.id]: house }))} title="Reset row">
                                                    <Pencil size={16} />
                                                </button>
                                                <button className="btn btn-danger" disabled={deletingId === house.id} onClick={() => deleteRow(house.id)} title="Delete house">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
