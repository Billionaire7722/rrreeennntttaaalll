import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import api from '../api/axios';

export const Growth: React.FC = () => {
  const [range, setRange] = useState('30d');
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [propertyActivity, setPropertyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [ug, pa] = await Promise.all([
          api.get(`/admin/analytics/user-growth?range=${range}`),
          api.get(`/admin/analytics/property-activity?range=${range}`),
        ]);
        setUserGrowth(ug.data || []);
        setPropertyActivity(pa.data || []);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [range]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>Growth</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>Real growth charts from backend analytics</p>
        </div>
        <select
          className="btn btn-outline"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{ background: 'transparent', color: 'inherit' }}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
        </select>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 24 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, marginBottom: 10 }}>User Growth</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="count" stroke="var(--accent-color)" fill="rgba(59, 130, 246, 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, marginBottom: 10 }}>Property Activity</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyActivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                  <Bar dataKey="created" name="Created" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deleted" name="Deleted" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

