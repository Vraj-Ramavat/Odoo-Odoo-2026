import { useState, useEffect } from 'react';
import { carbonAPI } from '../api/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Leaf, TrendingDown, Factory, Zap, Droplets } from 'lucide-react';

const COLORS = ['#f43f5e', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];
const SCOPE_COLORS = { 'Scope 1': '#f43f5e', 'Scope 2': '#3b82f6', 'Scope 3': '#8b5cf6' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px' }}>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 13 }}>
          {p.name}: {parseFloat(p.value).toLocaleString(undefined, { maximumFractionDigits: 1 })} kgCO2e
        </p>
      ))}
    </div>
  );
};

export default function EnvironmentalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(365);

  useEffect(() => {
    setLoading(true);
    carbonAPI.getDashboard({ days: period })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: 'var(--text-muted)' }}>
        <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mr-3" />
        Loading environmental data...
      </div>
    );
  }

  const scopePieData = [
    { name: 'Scope 1', value: data.scope_1 },
    { name: 'Scope 2', value: data.scope_2 },
    { name: 'Scope 3', value: data.scope_3 },
  ].filter(d => d.value > 0);

  const tonsCO2 = (data.total_emissions / 1000).toFixed(1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Leaf size={28} style={{ color: 'var(--accent)' }} />
            Environmental Dashboard
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Carbon emissions overview and trends
          </p>
        </div>
        <div className="flex gap-2">
          {[{ v: 90, l: '90 Days' }, { v: 180, l: '6 Months' }, { v: 365, l: '1 Year' }].map(p => (
            <button key={p.v} className="btn btn-sm"
              style={{
                background: period === p.v ? 'var(--accent-glow)' : 'var(--bg-card)',
                color: period === p.v ? 'var(--accent-light)' : 'var(--text-secondary)',
                border: `1px solid ${period === p.v ? 'var(--accent)' : 'var(--border)'}`,
              }}
              onClick={() => setPeriod(p.v)}>{p.l}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          { icon: TrendingDown, label: 'Total Emissions', value: `${tonsCO2} tCO2e`, sub: `${data.total_emissions.toLocaleString(undefined, { maximumFractionDigits: 0 })} kgCO2e`, color: '#10b981' },
          { icon: Factory, label: 'Scope 1 - Direct', value: `${(data.scope_1/1000).toFixed(1)} tCO2e`, color: '#f43f5e' },
          { icon: Zap, label: 'Scope 2 - Energy', value: `${(data.scope_2/1000).toFixed(1)} tCO2e`, color: '#3b82f6' },
          { icon: Droplets, label: 'Scope 3 - Other', value: `${(data.scope_3/1000).toFixed(1)} tCO2e`, color: '#8b5cf6' },
        ].map((card) => (
          <div key={card.label} className="glass-card p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${card.color}, ${card.color}66)` }} />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}18`, color: card.color }}>
                <card.icon size={20} />
              </div>
              <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>{card.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
            {card.sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Emissions Trend */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Emissions Trend</h3>
          {data.by_month.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.by_month}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}t`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" name="Emissions"
                  stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }}
                  activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
              No trend data available
            </div>
          )}
        </div>

        {/* Scope Breakdown Pie */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Scope Breakdown</h3>
          {scopePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={scopePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                  paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {scopePieData.map((entry) => (
                    <Cell key={entry.name} fill={SCOPE_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 0 })} kgCO2e`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>No data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Department Bar Chart */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Emissions by Department</h3>
          {data.by_department.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.by_department} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={v => `${(v/1000).toFixed(1)}t`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Emissions" radius={[0, 6, 6, 0]} barSize={24}>
                  {data.by_department.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>No data</div>
          )}
        </div>

        {/* Goals Summary + Recent */}
        <div className="space-y-5">
          {/* Goals Summary */}
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Goals Progress</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Goals', value: data.goals_summary.total, color: 'var(--text-primary)' },
                { label: 'Achieved', value: data.goals_summary.achieved, color: 'var(--accent)' },
                { label: 'On Track', value: data.goals_summary.on_track, color: 'var(--blue)' },
                { label: 'At Risk', value: data.goals_summary.at_risk, color: 'var(--amber)' },
              ].map(g => (
                <div key={g.label} className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-2xl font-bold" style={{ color: g.color }}>{g.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Transactions</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{data.total_transactions}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Emission Factors</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{data.active_factors}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Avg per Transaction</span>
                <span className="font-bold" style={{ color: 'var(--accent-light)' }}>
                  {data.total_transactions > 0
                    ? (data.total_emissions / data.total_transactions).toFixed(1)
                    : 0} kgCO2e
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
