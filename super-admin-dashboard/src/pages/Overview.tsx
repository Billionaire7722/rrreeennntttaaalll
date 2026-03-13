import React from 'react';
import { Users, Home, LogIn, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useKpis, usePlatformActivity, useUserEngagement } from '../hooks/useAnalytics';
import { TimeFilter } from '../components/dashboard/TimeFilter';
import css from './Overview.module.css';

interface KpiMetric {
  value: number;
  changePct: number | null;
  periodCount?: number;
  comparison?: number | null;
  sparkline?: Array<{ time: string; value: number }>;
}

interface KpisResponse {
  totalUsers?: KpiMetric;
  newUsers?: KpiMetric;
  totalListings?: KpiMetric;
  newListings?: KpiMetric;
  favoritesAdded?: KpiMetric;
  messagesSent?: KpiMetric;
  loginAttempts?: KpiMetric;
}

const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
};

const StatCard: React.FC<{
    label: string;
    value: number | undefined;
    change?: number | null;
    icon: React.ReactNode;
    color: string;
    path: string;
    sparklineData?: Array<{ time: string; value: number }>;
}> = ({ label, value, change, icon, color, path, sparklineData }) => {
    const up = (change ?? 0) >= 0;

    return (
        <Link to={path} className={`glass-panel ${css.statCard}`} style={{ textDecoration: 'none' }}>
            <div className={css.cardHeader}>
                <div className={css.iconBox} style={{ color, background: `${color}15` }}>
                    {icon}
                </div>
                <div className={`${css.statTrend} ${up ? css.trendUp : css.trendDown}`}>
                    {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {formatPercent(change)}
                </div>
            </div>
            <div className={css.statInfo}>
                <span className={css.statLabel}>{label}</span>
                <h3 className={css.statValue}>{value?.toLocaleString() ?? '—'}</h3>
            </div>
            {sparklineData && sparklineData.length > 1 && (
                <div className={css.sparkline}>
                    <ResponsiveContainer width="100%" height={50}>
                        <LineChart data={sparklineData}>
                            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Link>
    );
};

export const Overview: React.FC = () => {
    const { data, isLoading, refetch } = useKpis();
    const { data: activityData, refetch: refetchActivity } = usePlatformActivity();
    const { data: engagementData, refetch: refetchEngagement } = useUserEngagement();

    const stats = (data ?? {}) as KpisResponse;

    const handleRefresh = () => {
        refetch();
        refetchActivity();
        refetchEngagement();
    };

    if (isLoading) return <div className="loading-screen">Preparing Command Center...</div>;

    return (
        <div className={css.overview}>
            <div className={css.filterRow}>
                <TimeFilter />
            </div>

            <div className={css.kpiGrid}>
                <StatCard
                    label="Total Users"
                    value={stats.totalUsers?.value}
                    change={stats.totalUsers?.changePct ?? null}
                    icon={<Users size={20} />}
                    color="#3b82f6"
                    path="/users"
                    sparklineData={stats.totalUsers?.sparkline}
                />
                <StatCard
                    label="New Users"
                    value={stats.newUsers?.value}
                    change={stats.newUsers?.changePct ?? null}
                    icon={<Users size={20} />}
                    color="#22c55e"
                    path="/users"
                    sparklineData={stats.newUsers?.sparkline}
                />
                <StatCard
                    label="Total Listings"
                    value={stats.totalListings?.value}
                    change={stats.totalListings?.changePct ?? null}
                    icon={<Home size={20} />}
                    color="#10b981"
                    path="/houses"
                    sparklineData={stats.totalListings?.sparkline}
                />
                <StatCard
                    label="New Listings"
                    value={stats.newListings?.value}
                    change={stats.newListings?.changePct ?? null}
                    icon={<Home size={20} />}
                    color="#0ea5e9"
                    path="/houses"
                    sparklineData={stats.newListings?.sparkline}
                />
                <StatCard
                    label="Favorites Added"
                    value={stats.favoritesAdded?.value}
                    change={stats.favoritesAdded?.changePct ?? null}
                    icon={<HeartIcon />}
                    color="#f43f5e"
                    path="/favorites"
                    sparklineData={stats.favoritesAdded?.sparkline}
                />
                <StatCard
                    label="Messages Sent"
                    value={stats.messagesSent?.value}
                    change={stats.messagesSent?.changePct ?? null}
                    icon={<MessageIcon />}
                    color="#a855f7"
                    path="/messages"
                    sparklineData={stats.messagesSent?.sparkline}
                />
                <StatCard
                    label="Login Attempts"
                    value={stats.loginAttempts?.value}
                    change={stats.loginAttempts?.changePct ?? null}
                    icon={<LogIn size={20} />}
                    color="#f59e0b"
                    path="/login-logs"
                    sparklineData={stats.loginAttempts?.sparkline}
                />
            </div>

            <div className={css.section}>
                <div className={css.sectionHeader}>
                    <h2>Platform Activity</h2>
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => refetch()} title="Refresh">
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                <div className={css.chartsGrid}>
                    <div className={`glass-panel ${css.chartCard}`}>
                        <div className={css.chartHeader}>
                            <h3 className={css.chartTitle}>User Growth</h3>
                        </div>
                        <div style={{ height: '260px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activityData?.userGrowth || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={`glass-panel ${css.chartCard}`}>
                        <div className={css.chartHeader}>
                            <h3 className={css.chartTitle}>Listings Growth</h3>
                        </div>
                        <div style={{ height: '260px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData?.listingGrowth || []}>
                                    <defs>
                                        <linearGradient id="listingGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="value" name="New Listings" stroke="#10b981" fill="url(#listingGradient)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={`glass-panel ${css.chartCard}`}>
                        <div className={css.chartHeader}>
                            <h3 className={css.chartTitle}>Favorites Trend</h3>
                        </div>
                        <div style={{ height: '260px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activityData?.favoritesTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={`glass-panel ${css.chartCard}`}>
                        <div className={css.chartHeader}>
                            <h3 className={css.chartTitle}>Messages Activity</h3>
                        </div>
                        <div style={{ height: '260px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData?.messagesActivity || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className={css.section}>
                <div className={css.sectionHeader}>
                    <h2>User Engagement</h2>
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={handleRefresh} title="Refresh">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
                <div className={`glass-panel ${css.chartCard}`}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className={css.engagementTable}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Score</th>
                                    <th>Houses</th>
                                    <th>Favorites</th>
                                    <th>Messages</th>
                                </tr>
                            </thead>
                            <tbody>
                                {engagementData && engagementData.length > 0 ? (
                                    engagementData.map(user => (
                                        <tr key={user.userId}>
                                            <td>{user.name || user.email}</td>
                                            <td>{user.score}</td>
                                            <td>{user.houses}</td>
                                            <td>{user.favorites}</td>
                                            <td>{user.messages}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '16px 0' }}>
                                            No engagement data available for the selected range.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HeartIcon = () => <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>❤️</span>;
const MessageIcon = () => <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>💬</span>;
