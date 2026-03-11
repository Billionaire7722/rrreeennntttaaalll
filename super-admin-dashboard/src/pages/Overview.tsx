import React, { useEffect, useState } from 'react';
import { 
    Users, 
    Home, 
    Trash2, 
    LogIn, 
    ShieldCheck, 
    AlertCircle, 
    TrendingUp, 
    TrendingDown,
    MoreHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import api from '../api/axios';
import css from './Overview.module.css';

interface DashboardStats {
    totalUsers: number;
    totalProperties: number;
    deletedProperties: number;
    loginAttemptsToday: number;
    totalAdmins?: number; // Added
    openReports?: number; // Added
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '12px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, color: '#fafafa', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ margin: 0, color: entry.color, fontSize: '0.8rem' }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const Overview: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [charts, setCharts] = useState<{loginData: any[], actionData: any[]}>({ loginData: [], actionData: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/metrics');
                setStats({
                    ...res.data.overview,
                    totalAdmins: res.data.overview.totalAdmins || 0,
                    openReports: res.data.overview.openReports || 0
                });
                setCharts({
                    loginData: res.data.charts?.loginData || [],
                    actionData: res.data.charts?.actionData || []
                });
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="loading-screen">Preparing Command Center...</div>;

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers, icon: <Users size={20} />, color: '#3b82f6', path: '/users', trend: '+12%', up: true },
        { label: 'Total Admins', value: stats?.totalAdmins, icon: <ShieldCheck size={20} />, color: '#8b5cf6', path: '/login-attempts', trend: 'Stable', up: true },
        { label: 'Total Properties', value: stats?.totalProperties, icon: <Home size={20} />, color: '#10b981', path: '/houses', trend: '+5.4%', up: true },
        { label: 'Deleted Properties', value: stats?.deletedProperties, icon: <Trash2 size={20} />, color: '#ef4444', path: '/houses?status=deleted', trend: '-2.1%', up: false },
        { label: 'Login Attempts', value: stats?.loginAttemptsToday, icon: <LogIn size={20} />, color: '#f59e0b', path: '/login-logs', trend: '+18%', up: true },
        { label: 'Open Reports', value: stats?.openReports, icon: <AlertCircle size={20} />, color: '#f43f5e', path: '/reports/users', trend: 'Urgent', up: true },
    ];

    return (
        <div className={css.overview}>
            {/* KPI Cards Section */}
            <div className={css.kpiGrid}>
                {statCards.map((card, idx) => (
                    <Link key={idx} to={card.path} className={`glass-panel ${css.statCard}`} style={{ textDecoration: 'none' }}>
                        <div className={css.cardHeader}>
                            <div className={css.iconBox} style={{ color: card.color, background: `${card.color}15` }}>
                                {card.icon}
                            </div>
                            <div className={`${css.statTrend} ${card.up ? css.trendUp : css.trendDown}`}>
                                {card.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {card.trend}
                            </div>
                        </div>
                        <div className={css.statInfo}>
                            <span className={css.statLabel}>{card.label}</span>
                            <h3 className={css.statValue}>{card.value?.toLocaleString()}</h3>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Charts Section */}
            <div className={css.chartsGrid}>
                <div className={`glass-panel ${css.chartCard}`}>
                    <div className={css.chartHeader}>
                        <h3 className={css.chartTitle}>Authentication Traffic (7 Days)</h3>
                        <div className={css.chartActions}>
                            <button className="btn btn-outline" style={{ padding: '4px 8px' }}><MoreHorizontal size={16} /></button>
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.loginData}>
                                <defs>
                                    <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="logins" name="Success" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLogins)" />
                                <Area type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`glass-panel ${css.chartCard}`}>
                    <div className={css.chartHeader}>
                        <h3 className={css.chartTitle}>Admin Mutative Actions</h3>
                        <div className={css.chartActions}>
                            <button className="btn btn-outline" style={{ padding: '4px 8px' }}><MoreHorizontal size={16} /></button>
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.actionData}>
                                <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '0.8rem' }} />
                                <Bar dataKey="creates" name="Creates" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="updates" name="Updates" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="deletes" name="Deletes" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
