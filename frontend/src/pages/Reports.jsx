import { useState } from 'react';
import { reportsAPI } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#1a73e8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const reportTypes = [
  { key: 'environmental', title: 'Environmental Report', desc: 'Carbon emissions, energy usage, and environmental goals', icon: '🌍', color: '#10b981' },
  { key: 'social', title: 'Social Report', desc: 'CSR activities, participation, and community impact', icon: '👥', color: '#8b5cf6' },
  { key: 'governance', title: 'Governance Report', desc: 'Policy compliance, audits, and risk management', icon: '⚖️', color: '#1a73e8' },
  { key: 'summary', title: 'ESG Summary', desc: 'Comprehensive overview across all pillars', icon: '📊', color: '#f59e0b' },
];

export default function Reports() {
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customModule, setCustomModule] = useState('environmental');
  const [customData, setCustomData] = useState(null);

  const generateReport = async (type) => {
    setLoading(true);
    setActiveReport(type);
    try {
      const fetcher = { environmental: reportsAPI.getEnvironmental, social: reportsAPI.getSocial, governance: reportsAPI.getGovernance, summary: reportsAPI.getSummary };
      const res = await fetcher[type]();
      setReportData(res.data);
    } catch (e) { console.error(e); alert('Error generating report'); }
    setLoading(false);
  };

  const downloadCSV = async (type) => {
    try {
      const fetcher = { environmental: reportsAPI.getEnvironmental, social: reportsAPI.getSocial, governance: reportsAPI.getGovernance, summary: reportsAPI.getSummary };
      const res = await fetcher[type]({ export: 'csv' }, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${type}_report.csv`; a.click();
    } catch (e) { console.error('CSV Download failed:', e); alert('Error downloading'); }
  };

  const generateCustom = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.getCustom({ module: customModule });
      setCustomData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and export ESG reports</p>
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', marginBottom: 28 }}>
        {reportTypes.map(r => (
          <div key={r.key} className="stat-card" style={{ cursor: 'pointer', borderColor: activeReport === r.key ? r.color : undefined, borderWidth: activeReport === r.key ? 2 : 1 }} onClick={() => generateReport(r.key)}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{r.icon}</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>{r.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>{r.desc}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '6px 0', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); generateReport(r.key); }}>Generate</button>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); downloadCSV(r.key); }}>CSV ↓</button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Results */}
      {loading && <div className="loading-spinner" style={{ margin: '40px auto' }}></div>}

      {reportData && !loading && (
        <div className="stat-card" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{reportData.report_type} Report</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Generated: {reportData.generated_at}</span>
          </div>

          {/* Summary Stats */}
          {reportData.summary && (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginBottom: 20 }}>
              {Object.entries(reportData.summary).map(([key, val]) => (
                <div key={key} style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{typeof val === 'number' ? val.toLocaleString() : String(val)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          )}

          {/* Charts for environmental */}
          {reportData.by_department && reportData.by_department.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ marginBottom: 8, fontSize: 14 }}>By Department</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reportData.by_department.map(d => ({ name: d.department__name || d.department, value: parseFloat(d.emissions || d.count || 0) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1a73e8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Policy acknowledgement table */}
          {reportData.policy_acknowledgement && (
            <div>
              <h4 style={{ marginBottom: 8, fontSize: 14 }}>Policy Acknowledgement Status</h4>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Policy</th><th>Category</th><th>Acknowledged</th><th>Total</th><th>Rate</th></tr></thead>
                  <tbody>
                    {reportData.policy_acknowledgement.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{p.title}</td>
                        <td>{p.category}</td>
                        <td>{p.acknowledged}</td>
                        <td>{p.total}</td>
                        <td style={{ fontWeight: 600, color: p.rate >= 80 ? '#10b981' : p.rate >= 50 ? '#f59e0b' : '#ef4444' }}>{p.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Department scores for summary */}
          {reportData.department_scores && (
            <div>
              <h4 style={{ marginBottom: 8, fontSize: 14 }}>Department ESG Scores</h4>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Department</th><th>Environmental</th><th>Social</th><th>Governance</th><th>Total</th></tr></thead>
                  <tbody>
                    {reportData.department_scores.map((s, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{s.department}</td>
                        <td style={{ color: '#10b981' }}>{s.environmental}</td>
                        <td style={{ color: '#8b5cf6' }}>{s.social}</td>
                        <td style={{ color: '#1a73e8' }}>{s.governance}</td>
                        <td style={{ fontWeight: 700 }}>{s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Report Builder */}
      <div className="stat-card">
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Custom Report Builder</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <select className="form-input" style={{ width: 'auto' }} value={customModule} onChange={e => setCustomModule(e.target.value)}>
            <option value="environmental">Environmental</option>
            <option value="social">Social</option>
            <option value="governance">Governance</option>
          </select>
          <button className="btn btn-primary" onClick={generateCustom}>Generate Custom</button>
          {customData && (
            <button className="btn btn-secondary" onClick={async () => {
              try {
                const res = await reportsAPI.getCustom({ module: customModule, export: 'csv' }, { responseType: 'blob' });
                const blob = new Blob([res.data], { type: 'text/csv' });
                const url = URL.createObjectURL(blob); 
                const a = document.createElement('a'); 
                a.href = url; 
                a.download = `custom_${customModule}.csv`; 
                a.click();
              } catch (e) {
                console.error('Custom CSV Download failed:', e);
                alert('Error downloading custom CSV');
              }
            }}>Download CSV ↓</button>
          )}
        </div>
        {customData && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{customData.count} records found for module: {customData.module}</p>
            {customData.data && customData.data.length > 0 && (
              <div className="data-table-wrapper" style={{ maxHeight: 300, overflow: 'auto' }}>
                <table className="data-table">
                  <thead><tr>{Object.keys(customData.data[0]).map(k => <th key={k} style={{ fontSize: 11 }}>{k.replace(/__/g, ' ').replace(/_/g, ' ')}</th>)}</tr></thead>
                  <tbody>
                    {customData.data.slice(0, 20).map((row, i) => (
                      <tr key={i}>{Object.values(row).map((v, j) => <td key={j} style={{ fontSize: 12 }}>{v === null ? '—' : String(v)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
