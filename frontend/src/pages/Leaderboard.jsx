import { useState, useEffect } from 'react';
import { gamificationAPI, coreAPI } from '../api/client';

const podiumColors = ['#f59e0b', '#9ca3af', '#cd7f32']; // gold, silver, bronze
const podiumLabels = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => { load(); }, [deptFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (deptFilter) params.department = deptFilter;
      const [l, d] = await Promise.all([gamificationAPI.getLeaderboard(params), coreAPI.getDepartments()]);
      setEntries(l.data.results || l.data);
      setDepartments(d.data.results || d.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"></div></div>;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">Top sustainability champions</p>
        </div>
        <select className="form-input" style={{ width: 'auto' }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
          {[1, 0, 2].map(idx => {
            const e = top3[idx];
            if (!e) return null;
            const isFirst = idx === 0;
            return (
              <div key={e.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 16, padding: isFirst ? '28px 32px' : '20px 24px',
                textAlign: 'center', minWidth: 180,
                transform: isFirst ? 'scale(1.1)' : 'none',
                boxShadow: isFirst ? `0 0 30px ${podiumColors[idx]}33` : 'none',
                borderColor: podiumColors[idx] + '44',
                order: idx === 1 ? 0 : idx === 0 ? 1 : 2,
              }}>
                <div style={{ fontSize: isFirst ? 48 : 36, marginBottom: 8 }}>{podiumLabels[idx]}</div>
                <div style={{ width: isFirst ? 64 : 52, height: isFirst ? 64 : 52, borderRadius: '50%', background: `linear-gradient(135deg, ${podiumColors[idx]}44, ${podiumColors[idx]}22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: isFirst ? 24 : 20, fontWeight: 700, color: podiumColors[idx] }}>
                  {e.employee_name?.charAt(0) || '?'}
                </div>
                <div style={{ fontWeight: 600, fontSize: isFirst ? 16 : 14, marginBottom: 4 }}>{e.employee_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{e.department_name}</div>
                <div style={{ fontSize: isFirst ? 24 : 18, fontWeight: 700, color: podiumColors[idx] }}>{e.total_xp} XP</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span>🏅 {e.badge_count}</span>
                  <span>🏆 {e.challenges_completed}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full ranked table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead><tr><th>Rank</th><th>Employee</th><th>Department</th><th>Level</th><th>XP</th><th>Badges</th><th>Challenges</th></tr></thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} style={{ background: e.rank <= 3 ? podiumColors[e.rank - 1] + '08' : undefined }}>
                <td style={{ fontWeight: 700, fontSize: 16, color: e.rank <= 3 ? podiumColors[e.rank - 1] : 'var(--text-secondary)' }}>
                  {e.rank <= 3 ? podiumLabels[e.rank - 1] : `#${e.rank}`}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>
                      {e.employee_name?.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 500 }}>{e.employee_name}</span>
                  </div>
                </td>
                <td>{e.department_name}</td>
                <td><span style={{ background: '#8b5cf622', color: '#8b5cf6', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>Lvl {e.level}</span></td>
                <td style={{ fontWeight: 600 }}>{e.total_xp} XP</td>
                <td>{e.badge_count} 🏅</td>
                <td>{e.challenges_completed} 🏆</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
