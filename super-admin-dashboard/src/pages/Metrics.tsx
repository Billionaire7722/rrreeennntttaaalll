import React, { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { Activity } from 'lucide-react';
import api from '../api/axios';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#0d1117', border: '1px solid #30363d', padding: '12px', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#f0f6fc', fontWeight: 600, marginBottom: '8px' }}>{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ margin: 0, color: entry.color, fontSize: '0.9rem' }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const Metrics: React.FC = () => {
    const [loginData, setLoginData] = useState<unknown[]>([]);
    const [actionData, setActionData] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/admin/metrics');
                setLoginData(res.data.charts.loginData || []);
                setActionData(res.data.charts.actionData || []);
            } catch {
                console.error('Failed to load chart metrics');
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) return <div className="loading-screen">Loading Analytics Engine...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Activity size={28} color="var(--accent-color)" />
                <h2>System Telemetry</h2>
            </div>

            <div className="glass-panel" style={{ padding: '24px', height: '400px' }}>
                <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>Authentication Traffic (7 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={loginData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f85149" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f85149" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#8b949e" />
                        <YAxis stroke="#8b949e" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} />
                        <Area type="monotone" dataKey="logins" name="Successful Logins" stroke="#58a6ff" fillOpacity={1} fill="url(#colorLogins)" />
                        <Area type="monotone" dataKey="failed" name="Failed Attempts" stroke="#f85149" fillOpacity={1} fill="url(#colorFailed)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="glass-panel" style={{ padding: '24px', height: '400px' }}>
                <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>Admin Mutative Actions (7 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={actionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                        <XAxis dataKey="day" stroke="#8b949e" />
                        <YAxis stroke="#8b949e" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="creates" name="Create Actions" stackId="a" fill="#2ea043" />
                        <Bar dataKey="updates" name="Update Actions" stackId="a" fill="#d29922" />
                        <Bar dataKey="deletes" name="Delete Actions" stackId="a" fill="#f85149" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
