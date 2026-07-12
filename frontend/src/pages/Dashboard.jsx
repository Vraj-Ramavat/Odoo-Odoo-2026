import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { coreAPI } from '../api/client';
import {
  Building2, Users, Leaf, Shield, Trophy, TrendingUp, Activity, Target
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, change, color, accent }) => (
  <div className="glass-card stat-card" style={{ ['--accent-color']: accent }}>
    <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl`}
      style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
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
            background: change > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            color: change > 0 ? 'var(--accent-light)' : 'var(--rose)',
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
  const [stats, setStats] = useState({ departments: 0, categories: 0 });

  useEffect(() => {
    Promise.all([
      coreAPI.getDepartments({ status: 'active' }),
      coreAPI.getCategories(),
    ]).then(([deptRes, catRes]) => {
      setStats({
        departments: deptRes.data.count ?? deptRes.data.results?.length ?? deptRes.data.length ?? 0,
        categories: catRes.data.count ?? catRes.data.results?.length ?? catRes.data.length ?? 0,
      });
    }).catch(() => {});
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
        <StatCard icon={Building2} label="Departments" value={stats.departments} change={12} accent="#10b981" />
        <StatCard icon={Leaf} label="Carbon Footprint" value="--" accent="#3b82f6" />
        <StatCard icon={Users} label="CSR Activities" value="--" accent="#8b5cf6" />
        <StatCard icon={Shield} label="Compliance Score" value="--" accent="#f59e0b" />
      </div>

      {/* ESG Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Environmental', score: '--', weight: '40%', color: '#10b981', icon: Leaf },
          { label: 'Social', score: '--', weight: '30%', color: '#3b82f6', icon: Users },
          { label: 'Governance', score: '--', weight: '30%', color: '#8b5cf6', icon: Shield },
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
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: '0%', background: `linear-gradient(90deg, ${pillar.color}, ${pillar.color}88)` }} />
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
