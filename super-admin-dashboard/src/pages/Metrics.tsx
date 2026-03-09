import React, { useEffect, useState } from 'react';
import { 
    TrendingUp, 
    Users, 
    Home, 
    Activity, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Filter
} from 'lucide-react';
import { 
    AreaChart, Area, 
    BarChart, Bar, 
    XAxis, YAxis, 
    CartesianGrid, Tooltip, 
    ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import api from '../api/axios';
import css from './Overview.module.css';

export const Metrics: React.FC = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/metrics');
            setMetrics(res.data);
        } catch (err) {
            console.error('Failed to fetch metrics', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const growthData = [
        { name: 'Jan', users: 400, properties: 240 },
        { name: 'Feb', users: 300, properties: 139 },
        { name: 'Mar', users: 200, properties: 980 },
        { name: 'Apr', users: 278, properties: 390 },
        { name: 'May', users: 189, properties: 480 },
        { name: 'Jun', users: 239, properties: 380 },
        { name: 'Jul', users: 349, properties: 430 },
    ];

    const revenueData = [
        { name: 'Mon', value: 1200 },
        { name: 'Tue', value: 2100 },
        { name: 'Wed', value: 800 },
        { name: 'Thu', value: 1600 },
        { name: 'Fri', value: 2400 },
        { name: 'Sat', value: 1800 },
        { name: 'Sun', value: 2200 },
    ];

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading comprehensive analytics...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>System Analytics</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Detailed performance metrics and growth indicators</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline"><Calendar size={16} /> Last 30 Days</button>
                    <button className="btn btn-outline"><Filter size={16} /> Filters</button>
                    <button className="btn btn-primary"><Download size={16} /> Generate Report</button>
                </div>
            </div>

            <div className={css.statsGrid}>
                <div className={css.statCard}>
                    <div className={css.statHeader}>
                        <div className={css.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Users size={20} /></div>
                        <span className={css.statTrend} style={{ color: 'var(--success-color)' }}>+12% <ArrowUpRight size={14} /></span>
                    </div>
                    <div className={css.statValue}>{metrics?.totalUsers || 0}</div>
                    <div className={css.statLabel}>Total Users Registered</div>
                </div>
                <div className={css.statCard}>
                    <div className={css.statHeader}>
                        <div className={css.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Home size={20} /></div>
                        <span className={css.statTrend} style={{ color: 'var(--success-color)' }}>+8.4% <ArrowUpRight size={14} /></span>
                    </div>
                    <div className={css.statValue}>{metrics?.totalHouses || 0}</div>
                    <div className={css.statLabel}>Properties Listed</div>
                </div>
                <div className={css.statCard}>
                    <div className={css.statHeader}>
                        <div className={css.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Activity size={20} /></div>
                        <span className={css.statTrend} style={{ color: 'var(--danger-color)' }}>-2.1% <ArrowDownRight size={14} /></span>
                    </div>
                    <div className={css.statValue}>1,284</div>
                    <div className={css.statLabel}>Daily Active Sessions</div>
                </div>
                <div className={css.statCard}>
                    <div className={css.statHeader}>
                        <div className={css.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><TrendingUp size={20} /></div>
                        <span className={css.statTrend} style={{ color: 'var(--success-color)' }}>+24% <ArrowUpRight size={14} /></span>
                    </div>
                    <div className={css.statValue}>$42.5k</div>
                    <div className={css.statLabel}>Platform Revenue</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Growth Overview</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>User vs Property registration trends</p>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="var(--accent-color)" fillOpacity={1} fill="url(#colorUsers)" />
                                <Area type="monotone" dataKey="properties" stroke="#10b981" fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Platform Activity</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Weekly engagement distribution</p>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="var(--accent-color)" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Real-time Query Performance</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Average latency and throughput</p>
                </div>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={growthData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                            />
                            <Line type="stepAfter" dataKey="users" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            <Line type="stepAfter" dataKey="properties" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
