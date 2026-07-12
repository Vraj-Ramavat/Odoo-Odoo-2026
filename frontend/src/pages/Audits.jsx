import { useState, useEffect } from 'react';
import { governanceAPI, coreAPI } from '../api/client';

const statusColors = { scheduled: '#f59e0b', in_progress: '#1a73e8', completed: '#10b981' };
const typeColors = { internal: '#8b5cf6', external: '#1a73e8' };

export default function Audits() {
  const [audits, setAudits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [issues, setIssues] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', audit_type: 'internal', department: '', auditor: '', scheduled_date: '', status: 'scheduled' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([governanceAPI.getAudits(), coreAPI.getDepartments()]);
      setAudits(a.data.results || a.data);
      setDepartments(d.data.results || d.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!issues[id]) {
      const r = await governanceAPI.getComplianceIssues({ audit: id });
      const items = r.data.results || r.data;
      setIssues(prev => ({ ...prev, [id]: Array.isArray(items) ? items : [] }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await governanceAPI.createAudit({ ...form, department: form.department || null }); setShowModal(false); load(); }
    catch (e) { alert('Error'); }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audits</h1>
          <p className="page-subtitle">ESG audit management and findings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Schedule Audit</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-value">{audits.length}</div><div className="stat-label">Total Audits</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#10b981' }}>{audits.filter(a => a.status === 'completed').length}</div><div className="stat-label">Completed</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#1a73e8' }}>{audits.filter(a => a.status === 'in_progress').length}</div><div className="stat-label">In Progress</div></div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead><tr><th></th><th>Audit</th><th>Type</th><th>Department</th><th>Auditor</th><th>Date</th><th>Status</th><th>Score</th><th>Issues</th></tr></thead>
          <tbody>
            {audits.map(a => (
              <>
                <tr key={a.id} onClick={() => toggleExpand(a.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ width: 30, fontSize: 12 }}>{expanded === a.id ? '▼' : '▶'}</td>
                  <td style={{ fontWeight: 500 }}>{a.title}</td>
                  <td><span style={{ background: (typeColors[a.audit_type] || '#6b7280') + '22', color: typeColors[a.audit_type], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{a.audit_type}</span></td>
                  <td>{a.department_name}</td>
                  <td>{a.auditor || '—'}</td>
                  <td style={{ fontSize: 13 }}>{a.scheduled_date}</td>
                  <td><span style={{ background: (statusColors[a.status] || '#6b7280') + '22', color: statusColors[a.status], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{a.status?.replace('_', ' ')}</span></td>
                  <td style={{ fontWeight: 600 }}>{a.score || '—'}</td>
                  <td><span style={{ background: a.issue_count > 0 ? '#ef444422' : '#10b98122', color: a.issue_count > 0 ? '#ef4444' : '#10b981', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{a.issue_count}</span></td>
                </tr>
                {expanded === a.id && (
                  <tr key={`${a.id}-details`}>
                    <td colSpan={9} style={{ background: 'var(--bg-secondary)', padding: 16 }}>
                      {a.findings && <div style={{ marginBottom: 12 }}><strong>Findings:</strong> <span style={{ color: 'var(--text-secondary)' }}>{a.findings}</span></div>}
                      {issues[a.id] && issues[a.id].length > 0 && (
                        <div>
                          <strong>Linked Issues:</strong>
                          {issues[a.id].map(issue => (
                            <div key={issue.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                              <span style={{ width: 4, height: 24, borderRadius: 2, background: issue.is_overdue ? '#ef4444' : issue.severity === 'critical' ? '#ef4444' : issue.severity === 'high' ? '#f59e0b' : '#6b7280' }}></span>
                              <span style={{ fontWeight: 500 }}>{issue.title}</span>
                              <span style={{ fontSize: 12, color: issue.severity === 'critical' ? '#ef4444' : '#6b7280' }}>[{issue.severity}]</span>
                              <span style={{ fontSize: 12 }}>{issue.status}</span>
                              {issue.is_overdue && <span style={{ fontSize: 11, background: '#ef444422', color: '#ef4444', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>OVERDUE</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {(!issues[a.id] || issues[a.id].length === 0) && <p style={{ color: 'var(--text-muted)' }}>No linked compliance issues.</p>}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16 }}>Schedule Audit</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Title</label><input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label>Type</label><select className="form-input" value={form.audit_type} onChange={e => setForm({...form, audit_type: e.target.value})}><option value="internal">Internal</option><option value="external">External</option></select></div>
                <div className="form-group"><label>Department</label><select className="form-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}><option value="">Organization-wide</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              </div>
              <div className="form-group"><label>Auditor</label><input className="form-input" value={form.auditor} onChange={e => setForm({...form, auditor: e.target.value})} /></div>
              <div className="form-group"><label>Scheduled Date</label><input type="date" className="form-input" required value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
