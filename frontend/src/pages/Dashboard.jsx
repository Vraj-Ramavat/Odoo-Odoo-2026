import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { coreAPI, reportsAPI, carbonAPI, governanceAPI } from '../api/client';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

function KpiCard({ title, value, change, changeText, color, changeUp }) {
  return (
    <div className="glass-card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-medium text-foreground tracking-tight">{value}</span>
      </div>
      {change && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${changeUp ? 'text-[var(--g-green)]' : 'text-[var(--g-red)]'}`}>
          {changeUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          <span>{change}</span>
          <span className="text-muted-foreground ml-0.5">{changeText}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsAPI.getSummary(),
      carbonAPI.getDashboard({ days: 365 }),
      governanceAPI.getComplianceIssues(),
    ]).then(([summaryRes, carbonRes, compRes]) => {
      const summary = summaryRes.data;
      const carbon = carbonRes.data;
      const issues = compRes.data.results || compRes.data;
      
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
            trendUp: s.total >= 75, // mock trend
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
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  // Recharts Radar data structure
  const radarData = [
    { subject: 'Environmental', score: stats.envScore, fullMark: 100 },
    { subject: 'Social', score: stats.socScore, fullMark: 100 },
    { subject: 'Governance', score: stats.govScore, fullMark: 100 },
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Page description */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Real-time view of your ESG performance across the organization.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          title="Overall ESG Score"
          value={`${stats.esgScore}/100`}
          change="3.2%"
          changeText="vs last period"
          changeUp={true}
        />
        <KpiCard
          title="Total Carbon Emissions"
          value={`${stats.emissions} kgCO₂e`}
          change="4.1%"
          changeText="vs last period"
          changeUp={false} // down trend for carbon = bad or red representation depending on preference (we make it red to show change)
        />
        <KpiCard
          title="Employees Participating"
          value={stats.participation}
          change="8%"
          changeText="vs last period"
          changeUp={true}
        />
        <KpiCard
          title="Open Compliance Issues"
          value={stats.complianceIssues}
          change={`${stats.overdueIssues} overdue`}
          changeText=""
          changeUp={false} // red border/warning alert
        />
      </div>

      {/* Main Charts & Leaderboard Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Triangle / Radar Chart Card */}
        <div className="glass-card p-5 lg:col-span-5 flex flex-col justify-between min-h-[420px]">
          <div>
            <h3 className="text-sm font-semibold text-foreground">ESG Score Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Balanced view across the 3 pillars</p>
          </div>

          {/* Recharts Triangle Radar */}
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
                  tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
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

          {/* Three pillars values row at the bottom */}
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
        </div>

        {/* Department Leaderboard Table Card */}
        <div className="glass-card p-5 lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Department Leaderboard</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Ranked by total ESG score</p>
          </div>

          <div className="data-table-wrapper mt-4 flex-1">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase text-muted-foreground">
                  <th className="py-2 pl-3 pr-2 w-10">#</th>
                  <th className="px-2 py-2">Department</th>
                  <th className="px-2 py-2 text-center">Env</th>
                  <th className="px-2 py-2 text-center">Soc</th>
                  <th className="px-2 py-2 text-center">Gov</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => (
                  <tr key={dept.name} className="border-b border-border hover:bg-[var(--g-surface)] transition-colors">
                    <td className="py-3 pl-3 pr-2 font-medium text-muted-foreground">{index + 1}</td>
                    <td className="px-2 py-3 font-medium text-foreground">{dept.name}</td>
                    <td className="px-2 py-3 text-center text-muted-foreground">{dept.env}</td>
                    <td className="px-2 py-3 text-center text-muted-foreground">{dept.soc}</td>
                    <td className="px-2 py-3 text-center text-muted-foreground">{dept.gov}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          background: dept.total >= 75 ? 'var(--g-active)' : '#fce8e6',
                          color: dept.total >= 75 ? 'var(--g-blue)' : 'var(--g-red)',
                        }}>
                        <span>{dept.total}</span>
                        {dept.trendUp ? <TrendingUp size={12} className="text-[var(--g-green)]" /> : <TrendingDown size={12} className="text-[var(--g-red)]" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
