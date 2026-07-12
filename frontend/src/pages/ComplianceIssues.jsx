import { useState, useEffect } from 'react';
import { governanceAPI, coreAPI, authAPI } from '../api/client';

const sevColors = { low: '#6b7280', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
const statusColors = { open: '#ef4444', in_progress: '#1a73e8', resolved: '#10b981', closed: '#6b7280' };

export default function ComplianceIssues() {
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: '', status: '', department: '' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium', status: 'open', department: '', due_date: '' });

  useEffect(() => { load(); }, [filters]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.department) params.department = filters.department;
      const [i, d] = await Promise.all([governanceAPI.getComplianceIssues(params), coreAPI.getDepartments()]);
      setIssues(i.data.results || i.data);
      setDepartments(d.data.results || d.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await governanceAPI.createComplianceIssue({ ...form, department: form.department || null }); setShowModal(false); load(); }
    catch (e) { alert('Error'); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await governanceAPI.updateComplianceIssue(id, { status: newStatus }); load(); }
    catch (e) { alert('Error updating status'); }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"></div></div>;

  const overdueCount = issues.filter(i => i.is_overdue).length;
  const criticalCount = issues.filter(i => i.severity === 'critical').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Issues</h1>
          <p className="page-subtitle">Track and resolve compliance gaps</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Report Issue</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-value">{issues.length}</div><div className="stat-label">Total Issues</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#ef4444' }}>{overdueCount}</div><div className="stat-label">Overdue</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#ef4444' }}>{criticalCount}</div><div className="stat-label">Critical</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#10b981' }}>{issues.filter(i => i.status === 'resolved').length}</div><div className="stat-label">Resolved</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="form-input" style={{ width: 'auto' }} value={filters.severity} onChange={e => setFilters({...filters, severity: e.target.value})}>
          <option value="">All Severities</option>
          <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select className="form-input" style={{ width: 'auto' }} value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Statuses</option>
          <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
        </select>
        <select className="form-input" style={{ width: 'auto' }} value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead><tr><th style={{ width: 4 }}></th><th>Issue</th><th>Severity</th><th>Department</th><th>Owner</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {issues.map(i => (
              <tr key={i.id} style={{ background: i.is_overdue ? '#ef444408' : undefined }}>
                <td style={{ padding: 0, width: 4 }}><div style={{ width: 4, height: '100%', minHeight: 48, background: i.is_overdue ? '#ef4444' : i.severity === 'critical' ? '#ef4444' : 'transparent', borderRadius: '2px 0 0 2px' }}></div></td>
                <td>
                  <div style={{ fontWeight: 500 }}>{i.title}</div>
                  {i.audit_title && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Audit: {i.audit_title}</div>}
                  {i.is_overdue && <span style={{ fontSize: 11, background: '#ef4444', color: '#fff', padding: '1px 8px', borderRadius: 4, fontWeight: 700, marginTop: 4, display: 'inline-block' }}>⚠ OVERDUE</span>}
                </td>
                <td><span style={{ background: sevColors[i.severity] + '22', color: sevColors[i.severity], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{i.severity}</span></td>
                <td>{i.department_name}</td>
                <td style={{ fontSize: 13 }}>{i.assigned_to_name}</td>
                <td style={{ fontSize: 13, color: i.is_overdue ? '#ef4444' : undefined, fontWeight: i.is_overdue ? 600 : 400 }}>{i.due_date || '—'}</td>
                <td><span style={{ background: (statusColors[i.status] || '#6b7280') + '22', color: statusColors[i.status], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{i.status?.replace('_', ' ')}</span></td>
                <td>
                  {i.status === 'open' && <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleStatusChange(i.id, 'in_progress')}>Start</button>}
                  {i.status === 'in_progress' && <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleStatusChange(i.id, 'resolved')}>Resolve</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16 }}>Report Compliance Issue</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Title</label><input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="form-group"><label>Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label>Severity</label><select className="form-input" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
                <div className="form-group"><label>Department</label><select className="form-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}><option value="">—</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              </div>
              <div className="form-group"><label>Due Date</label><input type="date" className="form-input" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
