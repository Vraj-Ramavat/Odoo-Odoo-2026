import { useState, useEffect } from 'react';
import { carbonAPI } from '../api/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Leaf, TrendingDown, Factory, Zap, Droplets, Calendar } from 'lucide-react';
import { PageHeader } from '../components/ecosphere/PageHeader';
import { GCard } from '../components/ecosphere/GCard';

const COLORS = ['var(--g-blue)', 'var(--g-green)', 'var(--g-purple)', 'var(--g-teal)', 'var(--g-yellow)', 'var(--g-red)'];
const SCOPE_COLORS = { 'Scope 1': 'var(--g-red)', 'Scope 2': 'var(--g-blue)', 'Scope 3': 'var(--g-purple)' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-md">
      <p className="font-semibold text-foreground mb-1 text-xs">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {parseFloat(p.value).toLocaleString(undefined, { maximumFractionDigits: 1 })} kgCO₂e
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
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
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
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Environmental Dashboard"
        subtitle="Carbon emissions overview and trends"
        actions={
          <div className="flex gap-2">
            {[{ v: 90, l: '90 Days' }, { v: 180, l: '6 Months' }, { v: 365, l: '1 Year' }].map(p => (
              <button
                key={p.v}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                  period === p.v
                    ? 'bg-[var(--g-active)] border-[var(--g-blue)] text-[var(--g-blue)]'
                    : 'bg-card border-border text-muted-foreground hover:bg-[var(--g-surface)]'
                }`}
                onClick={() => setPeriod(p.v)}
              >
                {p.l}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: TrendingDown, label: 'Total Emissions', value: `${tonsCO2} tCO₂e`, sub: `${data.total_emissions.toLocaleString(undefined, { maximumFractionDigits: 0 })} kgCO₂e`, color: 'var(--g-green)' },
          { icon: Factory, label: 'Scope 1 - Direct', value: `${(data.scope_1/1000).toFixed(1)} tCO₂e`, color: 'var(--g-red)', sub: 'Fossil fuel combustion' },
          { icon: Zap, label: 'Scope 2 - Energy', value: `${(data.scope_2/1000).toFixed(1)} tCO₂e`, color: 'var(--g-blue)', sub: 'Electricity consumption' },
          { icon: Droplets, label: 'Scope 3 - Other', value: `${(data.scope_3/1000).toFixed(1)} tCO₂e`, color: 'var(--g-purple)', sub: 'Supply chain & business travel' },
        ].map((card) => (
          <GCard key={card.label}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--g-active)]" style={{ color: card.color }}>
                <card.icon size={20} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-3xl font-semibold text-foreground tracking-tight">{card.value}</p>
            {card.sub && <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>}
          </GCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Emissions Trend */}
        <GCard className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Emissions Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Historical carbon accounting timeline</p>
          </div>
          <div className="mt-4 flex-1">
            {data.by_month.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}t`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="total" name="Emissions"
                    stroke="var(--g-green)" strokeWidth={3} dot={{ r: 4, fill: 'var(--g-green)' }}
                    activeDot={{ r: 6, stroke: 'var(--g-green)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                No trend data available
              </div>
            )}
          </div>
        </GCard>

        {/* Scope Breakdown Pie */}
        <GCard className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Scope Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribution across Greenhouse Gas scopes</p>
          </div>
          <div className="mt-4 flex-1 flex items-center justify-center">
            {scopePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={scopePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {scopePieData.map((entry) => (
                      <Cell key={entry.name} fill={SCOPE_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 0 })} kgCO₂e`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">No scope data</div>
            )}
          </div>
        </GCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Department Bar Chart */}
        <GCard className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Emissions by Department</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown of operational footprint</p>
          </div>
          <div className="mt-4 flex-1">
            {data.by_department.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.by_department} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    tickFormatter={v => `${(v/1000).toFixed(1)}t`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Emissions" radius={[0, 4, 4, 0]} barSize={16}>
                    {data.by_department.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">No department data</div>
            )}
          </div>
        </GCard>

        {/* Goals Summary + Quick Stats */}
        <div className="flex flex-col gap-6">
          {/* Goals Summary */}
          <GCard>
            <h3 className="text-sm font-semibold text-foreground mb-4">Goals Progress</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Goals', value: data.goals_summary.total, color: 'var(--text-primary)', bg: 'var(--g-surface)' },
                { label: 'Achieved', value: data.goals_summary.achieved, color: 'var(--g-green)', bg: 'rgba(30, 142, 62, 0.08)' },
                { label: 'On Track', value: data.goals_summary.on_track, color: 'var(--g-blue)', bg: 'rgba(26, 115, 232, 0.08)' },
                { label: 'At Risk', value: data.goals_summary.at_risk, color: 'var(--g-yellow)', bg: 'rgba(249, 171, 0, 0.08)' },
              ].map(g => (
                <div key={g.label} className="p-3 rounded-lg text-center" style={{ background: g.bg }}>
                  <p className="text-2xl font-bold" style={{ color: g.color }}>{g.value}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">{g.label}</p>
                </div>
              ))}
            </div>
          </GCard>

          {/* Quick Stats */}
          <GCard>
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2.5 border-b border-border text-xs">
                <span className="text-muted-foreground">Total Transactions</span>
                <span className="font-semibold text-foreground">{data.total_transactions}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border text-xs">
                <span className="text-muted-foreground">Active Emission Factors</span>
                <span className="font-semibold text-foreground">{data.active_factors}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 text-xs">
                <span className="text-muted-foreground">Avg per Transaction</span>
                <span className="font-semibold text-foreground">
                  {data.total_transactions > 0
                    ? (data.total_emissions / data.total_transactions).toFixed(1)
                    : 0} kgCO₂e
                </span>
              </div>
            </div>
          </GCard>
        </div>
      </div>
    </div>
  );
}
