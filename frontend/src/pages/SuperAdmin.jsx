import { useState, useEffect } from 'react';
import { superadminAPI } from '../api/client';
import { PageHeader } from '../components/ecosphere/PageHeader';
import { GCard } from '../components/ecosphere/GCard';
import { 
  Building2, Users, FolderTree, Flame, Search, ChevronRight, X, 
  TrendingUp, ShieldAlert, Award, FileSpreadsheet 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

export default function SuperAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    superadminAPI.getDashboard()
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load Super Admin dashboard:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-white/10 border-t-[var(--g-blue)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-foreground">Failed to load platform data</h2>
        <p className="text-sm text-muted-foreground mt-1">Please ensure you are logged in as a Super Admin.</p>
      </div>
    );
  }

  const { kpis, companies, leaderboard, emissions_timeline } = data;

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Super Admin Dashboard" 
        subtitle="Platform-wide multi-tenancy overview, compliance tracking, and emissions analytics."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <GCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[color-mix(in_oklab,var(--g-blue)_10%,transparent)] text-[var(--g-blue)]">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Companies</p>
            <h3 className="text-2xl font-bold text-foreground mt-0.5">{kpis.total_companies}</h3>
          </div>
        </GCard>

        <GCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[color-mix(in_oklab,var(--g-purple)_10%,transparent)] text-[var(--g-purple)]">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Active Users</p>
            <h3 className="text-2xl font-bold text-foreground mt-0.5">{kpis.total_users}</h3>
          </div>
        </GCard>

        <GCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[color-mix(in_oklab,var(--g-teal)_10%,transparent)] text-[var(--g-teal)]">
            <FolderTree size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Departments</p>
            <h3 className="text-2xl font-bold text-foreground mt-0.5">{kpis.total_departments}</h3>
          </div>
        </GCard>

        <GCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[color-mix(in_oklab,var(--g-red)_10%,transparent)] text-[var(--g-red)]">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Global CO2 Emissions</p>
            <h3 className="text-2xl font-bold text-foreground mt-0.5">{kpis.total_emissions_kgco2e.toLocaleString()} kg</h3>
          </div>
        </GCard>
      </div>

      {/* Analytics Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Global Weekly Emissions Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Aggregated carbon footprint output across all tenant companies.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--g-green)] bg-[color-mix(in_oklab,var(--g-green)_10%,transparent)] px-2 py-1 rounded-md font-medium">
              <TrendingUp size={14} />
              <span>Real-time Sync</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emissions_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--g-blue)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--g-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="week_start" tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '12px' }}
                  itemStyle={{ fontSize: '12px', color: 'var(--g-blue)' }}
                />
                <Area type="monotone" dataKey="total_emissions" name="Total Emissions (kgCO2e)" stroke="var(--g-blue)" strokeWidth={2} fillOpacity={1} fill="url(#colorEmissions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GCard>

        {/* Company Leaderboard */}
        <GCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Company Leaderboard</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Ranked by average internal ESG scores.</p>
            </div>
            <Award className="text-[var(--g-yellow)]" size={20} />
          </div>
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
            {leaderboard.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--g-surface)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-[var(--g-yellow)] text-white' : 
                    idx === 1 ? 'bg-slate-300 text-slate-800' : 
                    idx === 2 ? 'bg-amber-600 text-white' : 'bg-[var(--g-search)] text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[var(--g-green)]">{item.average_score}</span>
                  <p className="text-[10px] text-muted-foreground">Score Index</p>
                </div>
              </div>
            ))}
          </div>
        </GCard>
      </div>

      {/* Tenant Companies Database Grid */}
      <GCard padded={false}>
        <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground">Tenant Organization Catalog</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage data access, inspect tenant parameters, and review ESG indicators.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by company name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-full bg-[var(--g-search)] pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-[var(--g-active)] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[var(--g-surface)] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-5">Organization</th>
                <th className="py-3 px-5">Tenant ID</th>
                <th className="py-3 px-5 text-center">Users</th>
                <th className="py-3 px-5 text-center">Depts</th>
                <th className="py-3 px-5 text-right">Emissions</th>
                <th className="py-3 px-5 text-center">Open Issues</th>
                <th className="py-3 px-5 text-center">ESG Score</th>
                <th className="py-3 px-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredCompanies.map(c => (
                <tr key={c.id} className="hover:bg-[var(--g-surface)] transition-colors group">
                  <td className="py-3 px-5">
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Registered: {c.created_at || 'N/A'}</div>
                  </td>
                  <td className="py-3 px-5 text-xs font-mono text-muted-foreground">{c.code}</td>
                  <td className="py-3 px-5 text-center font-medium">{c.users_count}</td>
                  <td className="py-3 px-5 text-center font-medium">{c.departments_count}</td>
                  <td className="py-3 px-5 text-right font-medium">{c.total_emissions_kgco2e.toLocaleString()} kg</td>
                  <td className="py-3 px-5 text-center">
                    {c.open_issues_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-[color-mix(in_oklab,var(--g-red)_10%,transparent)] text-[var(--g-red)]">
                        <ShieldAlert size={12} />
                        {c.open_issues_count} Active
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span className="text-sm font-semibold text-[var(--g-green)]">{c.average_score}</span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button 
                      onClick={() => setSelectedCompany(c)}
                      className="p-1.5 rounded-full hover:bg-[var(--g-active)] text-muted-foreground group-hover:text-[var(--g-blue)] transition-all"
                      title="Inspect Tenant"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-muted-foreground">
                    No matching tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GCard>

      {/* Drilldown Tenant Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-[var(--g-surface)]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--g-blue)] bg-[var(--g-active)] px-2.5 py-1 rounded-full">
                  Tenant Organization
                </span>
                <h3 className="text-xl font-bold text-foreground mt-2">{selectedCompany.name}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {selectedCompany.code}</p>
              </div>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="p-1.5 rounded-full hover:bg-border text-muted-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-[var(--g-surface)]">
                  <span className="text-xs text-muted-foreground">Sustainability Score Index</span>
                  <div className="text-2xl font-bold text-[var(--g-green)] mt-1">{selectedCompany.average_score}</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-[var(--g-surface)]">
                  <span className="text-xs text-muted-foreground">Carbon Transactions Emissions</span>
                  <div className="text-2xl font-bold text-foreground mt-1">{selectedCompany.total_emissions_kgco2e.toLocaleString()} kg</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-muted-foreground" />
                  Tenant Details Summary
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Platform Role Limits</span>
                    <span className="font-medium text-foreground">Standard Tier</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Associated Employees</span>
                    <span className="font-medium text-foreground">{selectedCompany.users_count} Users</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Active Sub-Departments</span>
                    <span className="font-medium text-foreground">{selectedCompany.departments_count} Departments</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Open ESG Compliance Audits</span>
                    <span className="font-medium text-foreground">{selectedCompany.open_issues_count} Issues Pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-[var(--g-surface)] flex justify-end">
              <button 
                onClick={() => setSelectedCompany(null)}
                className="btn text-xs px-4 py-2 bg-foreground text-background font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
