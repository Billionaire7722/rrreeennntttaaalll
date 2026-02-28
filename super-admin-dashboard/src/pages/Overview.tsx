import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, Home, Trash2, LogIn } from 'lucide-react';
import api from '../api/axios';
import css from './Overview.module.css';

interface DashboardStats {
    totalUsers: number;
    totalAdmins: number;
    totalProperties: number;
    deletedProperties: number;
    loginAttemptsToday: number;
}

export const Overview: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/metrics');
                setStats(res.data.overview);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="loading-screen">Loading Metrics...</div>;

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers, icon: <Users size={24} />, color: 'var(--accent-color)' },
        { label: 'Total Admins', value: stats?.totalAdmins, icon: <ShieldCheck size={24} />, color: 'var(--warning-color)' },
        { label: 'Total Properties', value: stats?.totalProperties, icon: <Home size={24} />, color: 'var(--success-color)' },
        { label: 'Deleted Properties', value: stats?.deletedProperties, icon: <Trash2 size={24} />, color: 'var(--danger-color)' },
        { label: 'Login Attempts (Today)', value: stats?.loginAttemptsToday, icon: <LogIn size={24} />, color: '#a371f7' },
    ];

    return (
        <div className={css.overviewGrid}>
            {statCards.map((card, idx) => (
                <div key={idx} className={`glass-panel ${css.statCard}`}>
                    <div className={css.iconBox} style={{ color: card.color, background: `${card.color}20` }}>
                        {card.icon}
                    </div>
                    <div className={css.statInfo}>
                        <p className={css.statLabel}>{card.label}</p>
                        <h3 className={css.statValue}>{card.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};
