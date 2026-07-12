import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { coreAPI, reportsAPI, carbonAPI } from '../api/client';
import {
  Building2, Users, Leaf, Shield, Trophy, TrendingUp, Activity, Target
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, change, color, accent }) => (
  <div className="glass-card stat-card" style={{ ['--accent-color']: accent }}>
    <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl`}
      style={{ background: accent }} />
    <div className="flex items-start justify-between mb-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}18`, color: accent }}
      >
        <Icon size={22} />
      </div>
      {change && (
        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
          style={{
            background: 'var(--accent-glow)',
            color: 'var(--accent)',
          }}>
          <TrendingUp size={12} style={{ transform: change < 0 ? 'rotate(180deg)' : 'none' }} />
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
  </div>
);

export default function Dashboard() {
  const { user, isAdmin, isDeptHead } = useAuth();
  const [stats, setStats] = useState({ departments: 0, emissions: '0', csr: 0, compliance: '100%', envScore: 0, socScore: 0, govScore: 0 });

  useEffect(() => {
    Promise.all([
      coreAPI.getDepartments({ status: 'active' }),
      reportsAPI.getSummary(),
      carbonAPI.getDashboard({ days: 365 }),
    ]).then(([deptRes, summaryRes, carbonRes]) => {
      const summary = summaryRes.data;
      const carbon = carbonRes.data;
      
      // Calculate average ESG scores
      let envSum = 0, socSum = 0, govSum = 0, count = 0;
      if (summary.department_scores) {
        summary.department_scores.forEach(s => {
          envSum += s.environmental;
          socSum += s.social;
          govSum += s.governance;
          count++;
        });
      }

      setStats({
        departments: deptRes.data.count ?? deptRes.data.results?.length ?? deptRes.data.length ?? 0,
        emissions: carbon.total_emissions ? `${Math.round(carbon.total_emissions).toLocaleString()} kg` : '0 kg',
        csr: summary.totals?.csr_activities ?? 0,
        compliance: summary.totals?.policies ? `${Math.round((summary.totals.policies / 4) * 100)}%` : '100%',
        envScore: count > 0 ? Math.round(envSum / count) : 82,
        socScore: count > 0 ? Math.round(socSum / count) : 78,
        govScore: count > 0 ? Math.round(govSum / count) : 85,
      });
    }).catch((e) => console.error(e));
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {greeting()}, {user?.first_name || user?.username} 
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Here's your ESG performance overview for today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={Building2} label="Departments" value={stats.departments} change={12} accent="var(--g-green)" />
        <StatCard icon={Leaf} label="Carbon Footprint (365d)" value={stats.emissions} accent="var(--g-blue)" />
        <StatCard icon={Users} label="CSR Activities" value={stats.csr} accent="var(--g-purple)" />
        <StatCard icon={Shield} label="Compliance Policies" value={stats.compliance} accent="var(--g-teal)" />
      </div>

      {/* ESG Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Environmental', score: stats.envScore, weight: '40%', color: 'var(--g-green)', icon: Leaf },
          { label: 'Social', score: stats.socScore, weight: '30%', color: 'var(--g-purple)', icon: Users },
          { label: 'Governance', score: stats.govScore, weight: '30%', color: 'var(--g-teal)', icon: Shield },
        ].map((pillar) => (
          <div key={pillar.label} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${pillar.color}18`, color: pillar.color }}>
                <pillar.icon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{pillar.label}</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Weight: {pillar.weight}</p>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bold" style={{ color: pillar.color }}>{pillar.score}</span>
              <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-primary)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${pillar.score}%`, background: pillar.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            <Activity size={18} className="inline mr-2" style={{ color: 'var(--accent)' }} />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {['Platform initialized', 'Departments configured', 'Categories set up'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'var(--bg-secondary)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>Just now</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            <Target size={18} className="inline mr-2" style={{ color: 'var(--accent)' }} />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'View Reports', icon: '📊' },
              { label: 'Join Challenge', icon: '🏆' },
              { label: 'Log Activity', icon: '📝' },
              { label: 'View Policies', icon: '📋' },
            ].map((action) => (
              <button key={action.label}
                className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <span className="text-xl">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
