import React, { useEffect, useState } from 'react';
import { 
    TrendingUp, 
    Users, 
    Home, 
    Activity, 
    ArrowUpRight,
    Download
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
    const [timeRange, setTimeRange] = useState('30d');
    const [charts, setCharts] = useState<{
        userGrowth: any[],
        propertyActivity: any[],
        loginTraffic: any[],
        ipDist: any[],
        heatmap: any[]
    }>({
        userGrowth: [],
        propertyActivity: [],
        loginTraffic: [],
        ipDist: [],
        heatmap: []
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mRes, ugRes, paRes, ltRes, idRes, hRes] = await Promise.allSettled([
                api.get('/admin/metrics'),
                api.get(`/admin/analytics/user-growth?range=${timeRange}`),
                api.get(`/admin/analytics/property-activity?range=${timeRange}`),
                api.get(`/admin/analytics/login-traffic?range=${timeRange}`),
                api.get('/admin/analytics/ip-distribution'),
                api.get('/admin/monitoring/heatmap')
            ]);

            if (mRes.status === 'fulfilled') {
                setMetrics(mRes.value.data.overview);
            }

            setCharts({
                userGrowth: ugRes.status === 'fulfilled' ? ugRes.value.data : [],
                propertyActivity: paRes.status === 'fulfilled' ? paRes.value.data : [],
                loginTraffic: ltRes.status === 'fulfilled' ? ltRes.value.data : [],
                ipDist: idRes.status === 'fulfilled' ? idRes.value.data : [],
                heatmap: hRes.status === 'fulfilled' ? hRes.value.data : []
            });
        } catch (err) {
            console.error('Failed to fetch metrics', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    if (loading && !metrics) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading comprehensive analytics...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>System Analytics</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Detailed performance metrics and growth indicators</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select 
                        className="btn btn-outline" 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                        style={{ background: 'transparent', color: 'inherit', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 12px' }}
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                        <option value="this_year">This Year</option>
                    </select>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            const payload = {
                                generatedAt: new Date().toISOString(),
                                timeRange,
                                overview: metrics,
                                charts,
                            };
                            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `system_metrics_${timeRange}_${new Date().toISOString().slice(0, 10)}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        <Download size={16} /> Generate Report
                    </button>
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
                    <div className={css.statValue}>{metrics?.totalProperties || 0}</div>
                    <div className={css.statLabel}>Properties Listed</div>
                </div>
                <div className={css.statCard}>
                    <div className={css.statHeader}>
                        <div className={css.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Activity size={20} /></div>
                        <span className={css.statTrend} style={{ color: 'var(--text-muted)' }}>Today</span>
                    </div>
                    <div className={css.statValue}>{metrics?.loginAttemptsToday || 0}</div>
                    <div className={css.statLabel}>Login Attempts Today</div>
                </div>
                <div className={css.statCard}>
                    <div className={css.statHeader}>
                        <div className={css.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><TrendingUp size={20} /></div>
                        <span className={css.statTrend} style={{ color: 'var(--success-color)' }}>+24% <ArrowUpRight size={14} /></span>
                    </div>
                    <div className={css.statValue}>{metrics?.openReports || 0}</div>
                    <div className={css.statLabel}>Open Reports</div>
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
                            <AreaChart data={charts.userGrowth}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                />
                                <Area type="monotone" dataKey="count" name="New Users" stroke="var(--accent-color)" fillOpacity={1} fill="url(#colorUsers)" />
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
                            <BarChart data={charts.propertyActivity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="created" name="Created" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                                <Bar dataKey="deleted" name="Deleted" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
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
                            <LineChart data={charts.loginTraffic}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                />
                                <Line type="monotone" dataKey="success" name="Success" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Login Traffic Heatmap</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Visualize peak activity hours across the week</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: '800px' }}>
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: '80px' }}></div>
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', paddingBottom: '12px' }}>
                                {[...Array(24)].map((_, i) => (
                                    <div key={i} style={{ fontSize: '10px', color: 'var(--text-muted)', width: '100%', textAlign: 'center' }}>
                                        {i === 0 ? '12am' : i === 12 ? '12pm' : i > 12 ? `${i-12}pm` : `${i}am`}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => (
                            <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ width: '80px', fontSize: '12px', color: 'var(--text-muted)' }}>{day}</div>
                                <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                                    {[...Array(24)].map((_, hIdx) => {
                                        const count = charts.heatmap.find(h => h.day === (dIdx + 1) && h.hour === hIdx)?.count || 0;
                                        const opacity = Math.min(count / 10, 1); // Scale: 10 logins = 100% opacity
                                        return (
                                            <div 
                                                key={hIdx} 
                                                title={`${day} ${hIdx}:00 - ${count} logins`}
                                                style={{ 
                                                    flex: 1, 
                                                    height: '24px', 
                                                    background: count > 0 ? `rgba(59, 130, 246, ${0.1 + opacity * 0.9})` : 'rgba(255, 255, 255, 0.03)',
                                                    borderRadius: '3px',
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Less</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        {[0, 0.2, 0.4, 0.6, 0.8, 1].map(o => (
                            <div key={o} style={{ width: '12px', height: '12px', background: `rgba(59, 130, 246, ${0.1 + o * 0.9})`, borderRadius: '2px' }} />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Geographic IP Distribution</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Analyzed from recent login activity</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Country / Region Code</th>
                                <th style={{ padding: '12px' }}>Login Count</th>
                                <th style={{ padding: '12px' }}>Weight</th>
                                <th style={{ padding: '12px' }}>Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charts.ipDist.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '12px', fontWeight: 500 }}>{item.country}</td>
                                    <td style={{ padding: '12px' }}>{item.count}</td>
                                    <td style={{ padding: '12px' }}>{item.percentage}%</td>
                                    <td style={{ padding: '12px', width: '200px' }}>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${item.percentage}%`, background: 'var(--accent-color)' }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
