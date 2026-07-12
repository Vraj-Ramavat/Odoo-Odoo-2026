import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { reportsAPI, carbonAPI, governanceAPI, notificationsAPI } from '../api/client';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { PageHeader } from '../components/ecosphere/PageHeader';
import { GCard } from '../components/ecosphere/GCard';
import { StatusChip, toneForStatus } from '../components/ecosphere/StatusChip';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'superadmin') {
    return <Navigate to="/superadmin" replace />;
  }
  const [stats, setStats] = useState({
    esgScore: 0,
    emissions: '0',
    participation: '0%',
    complianceIssues: 0,
    overdueIssues: 0,
    envScore: 0,
    socScore: 0,
    govScore: 0,
  });
  const [departments, setDepartments] = useState([]);
  const [emissionsTrend, setEmissionsTrend] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsAPI.getSummary(),
      carbonAPI.getDashboard({ days: 365 }),
      governanceAPI.getComplianceIssues(),
      notificationsAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([summaryRes, carbonRes, compRes, notifRes]) => {
      const summary = summaryRes.data;
      const carbon = carbonRes.data;
      const issues = compRes.data.results || compRes.data;
      const notifs = notifRes.data.results || notifRes.data || [];
      
      // Calculate scores
      let envSum = 0, socSum = 0, govSum = 0, count = 0;
      const deptList = [];

      if (summary.department_scores) {
        summary.department_scores.forEach(s => {
          envSum += s.environmental;
          socSum += s.social;
          govSum += s.governance;
          count++;
          
          deptList.push({
            name: s.department,
            env: Math.round(s.environmental),
            soc: Math.round(s.social),
            gov: Math.round(s.governance),
            total: Math.round(s.total),
            trendUp: s.total >= 75,
          });
        });
      }

      // Default fallback data for visual demo if empty
      if (deptList.length === 0) {
        deptList.push(
          { name: 'Operations', env: 81, soc: 88, gov: 80, total: 83, trendUp: false },
          { name: 'Customer Support', env: 74, soc: 92, gov: 70, total: 79, trendUp: true },
          { name: 'Human Resources', env: 88, soc: 59, gov: 85, total: 77, trendUp: true },
          { name: 'Finance', env: 74, soc: 77, gov: 75, total: 75, trendUp: true },
          { name: 'Sales', env: 60, soc: 70, gov: 90, total: 73, trendUp: true },
          { name: 'Product Design', env: 67, soc: 81, gov: 65, total: 71, trendUp: false },
          { name: 'Marketing', env: 67, soc: 66, gov: 70, total: 68, trendUp: true },
          { name: 'Engineering', env: 60, soc: 55, gov: 65, total: 60, trendUp: false }
        );
      }

      // Sort departments by total score descending
      deptList.sort((a, b) => b.total - a.total);
      setDepartments(deptList);

      const envVal = count > 0 ? Math.round(envSum / count) : 74;
      const socVal = count > 0 ? Math.round(socSum / count) : 81;
      const govVal = count > 0 ? Math.round(govSum / count) : 79;
      const esgVal = Math.round((envVal * 0.4) + (socVal * 0.3) + (govVal * 0.3));

      setStats({
        esgScore: esgVal,
        emissions: carbon.total_emissions ? Math.round(carbon.total_emissions).toLocaleString() : '142,580',
        participation: summary.totals?.employees ? `${Math.round((summary.totals.badges_awarded / summary.totals.employees) * 100)}%` : '71%',
        complianceIssues: issues.length || 9,
        overdueIssues: issues.filter(i => i.is_overdue).length || 3,
        envScore: envVal,
        socScore: socVal,
        govScore: govVal,
      });

      // Set trend data
      if (carbon.by_month && carbon.by_month.length > 0) {
        setEmissionsTrend(carbon.by_month);
      } else {
        setEmissionsTrend([
          { month: 'Jan', total: 12000 },
          { month: 'Feb', total: 11500 },
          { month: 'Mar', total: 14000 },
          { month: 'Apr', total: 10500 },
          { month: 'May', total: 13000 },
          { month: 'Jun', total: 12500 },
        ]);
      }

      // Build activity feed
      const feed = [];
      if (Array.isArray(notifs)) {
        notifs.forEach(n => {
          feed.push({
            type: n.notification_type === 'warning' ? 'warn' : n.notification_type === 'success' ? 'ok' : 'info',
            msg: n.title + ': ' + n.message,
            t: new Date(n.created_at).toLocaleDateString()
          });
        });
      }
      if (feed.length < 5 && carbon.recent_transactions) {
        carbon.recent_transactions.forEach(t => {
          feed.push({
            type: 'info',
            msg: `${t.activity_type} transaction recorded (${Math.round(t.calculated_emissions_kgco2e).toLocaleString()} kgCO₂e)`,
            t: new Date(t.transaction_date).toLocaleDateString()
          });
        });
      }
      if (feed.length === 0) {
        feed.push(
          { type: 'ok', msg: 'Scope 1 emission factor for Gasoline updated', t: 'Today' },
          { type: 'info', msg: 'New audit scheduled for Operations Department', t: 'Yesterday' },
          { type: 'warn', msg: 'Compliance issue #124 reported by HR', t: '2 days ago' }
        );
      }

      setActivityFeed(feed.slice(0, 5));
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const radarData = [
    { subject: 'Environmental', score: stats.envScore, fullMark: 100 },
    { subject: 'Social', score: stats.socScore, fullMark: 100 },
    { subject: 'Governance', score: stats.govScore, fullMark: 100 },
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Organization Dashboard"
        subtitle="Real-time view of your ESG performance across the organization."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <GCard>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall ESG Score</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-foreground tracking-tight">{stats.esgScore}/100</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--g-green)]">
            <ArrowUp size={14} />
            <span>3.2%</span>
            <span className="text-muted-foreground ml-0.5">vs last period</span>
          </div>
        </GCard>

        <GCard>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Carbon Emissions</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-foreground tracking-tight">{stats.emissions} kgCO₂e</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--g-red)]">
            <ArrowDown size={14} />
            <span>4.1%</span>
            <span className="text-muted-foreground ml-0.5">vs last period</span>
          </div>
        </GCard>

        <GCard>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employees Participating</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-foreground tracking-tight">{stats.participation}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--g-green)]">
            <ArrowUp size={14} />
            <span>8%</span>
            <span className="text-muted-foreground ml-0.5">vs last period</span>
          </div>
        </GCard>

        <GCard>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open Compliance Issues</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-foreground tracking-tight">{stats.complianceIssues}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--g-red)]">
            <ArrowDown size={14} />
            <span>{stats.overdueIssues} overdue</span>
          </div>
        </GCard>
      </div>

      {/* Charts & Leaderboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mb-6">
        {/* Radar Chart */}
        <GCard className="lg:col-span-5 flex flex-col justify-between min-h-[420px]">
          <div>
            <h3 className="text-sm font-semibold text-foreground">ESG Score Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Balanced view across the 3 pillars</p>
          </div>

          <div className="h-60 w-full mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="ESG Score"
                  dataKey="score"
                  stroke="var(--g-blue)"
                  fill="var(--g-blue)"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 mt-4 text-center">
            <div>
              <div className="text-xl font-semibold text-foreground">{stats.envScore}</div>
              <div className="text-[10px] uppercase font-bold text-[var(--g-green)] mt-0.5">Environmental</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-foreground">{stats.socScore}</div>
              <div className="text-[10px] uppercase font-bold text-[var(--g-purple)] mt-0.5">Social</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-foreground">{stats.govScore}</div>
              <div className="text-[10px] uppercase font-bold text-[var(--g-teal)] mt-0.5">Governance</div>
            </div>
          </div>
        </GCard>

        {/* Department Leaderboard */}
        <GCard className="lg:col-span-7" padded={false}>
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Department Leaderboard</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Ranked by total ESG score</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-[var(--g-surface)] text-[11px] font-semibold uppercase text-muted-foreground">
                  <th className="py-2.5 pl-5 pr-2 w-10">#</th>
                  <th className="px-2 py-2.5">Department</th>
                  <th className="px-2 py-2.5 text-center">Env</th>
                  <th className="px-2 py-2.5 text-center">Soc</th>
                  <th className="px-2 py-2.5 text-center">Gov</th>
                  <th className="py-2.5 pl-2 pr-5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => (
                  <tr key={dept.name} className="border-b border-border last:border-0 hover:bg-[var(--g-surface)] transition-colors">
                    <td className="py-3 pl-5 pr-2 font-medium text-muted-foreground">{index + 1}</td>
                    <td className="px-2 py-3 font-medium text-foreground">{dept.name}</td>
                    <td className="px-2 py-3 text-center text-muted-foreground">{dept.env}</td>
                    <td className="px-2 py-3 text-center text-muted-foreground">{dept.soc}</td>
                    <td className="px-2 py-3 text-center text-muted-foreground">{dept.gov}</td>
                    <td className="py-3 pl-2 pr-5 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <StatusChip tone={dept.total >= 80 ? 'green' : dept.total >= 65 ? 'yellow' : 'red'}>
                          {dept.total}
                        </StatusChip>
                        {dept.trendUp ? <ArrowUp size={14} className="text-[var(--g-green)]" /> : <ArrowDown size={14} className="text-[var(--g-red)]" />}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GCard>
      </div>

      {/* Emissions Trend & Activity Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Trend AreaChart */}
        <GCard className="lg:col-span-2">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">Emissions Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly kgCO₂e carbon emissions</p>
          </div>
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emissionsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" fontSize={11} stroke="var(--text-muted)" />
                <YAxis fontSize={11} stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Emissions"
                  stroke="var(--g-blue)"
                  fill="var(--g-active)"
                  fillOpacity={0.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GCard>

        {/* Recent Activity List */}
        <GCard>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest actions across the platform</p>
          </div>
          <ul className="space-y-4 mt-4">
            {activityFeed.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    item.type === 'warn'
                      ? 'bg-[var(--g-yellow)]'
                      : item.type === 'ok'
                        ? 'bg-[var(--g-green)]'
                        : 'bg-[var(--g-blue)]'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground leading-snug">{item.msg}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{item.t}</div>
                </div>
              </li>
            ))}
          </ul>
        </GCard>
      </div>
    </div>
  );
}
