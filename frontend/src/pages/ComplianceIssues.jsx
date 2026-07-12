import { useState, useEffect } from 'react';
import { governanceAPI, coreAPI } from '../api/client';
import { PageHeader } from '../components/ecosphere/PageHeader';
import { GCard } from '../components/ecosphere/GCard';
import { StatusChip, toneForStatus } from '../components/ecosphere/StatusChip';

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
    catch (e) { alert('Error reporting issue'); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await governanceAPI.updateComplianceIssue(id, { status: newStatus }); load(); }
    catch (e) { alert('Error updating status'); }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const overdueCount = issues.filter(i => i.is_overdue).length;
  const criticalCount = issues.filter(i => i.severity === 'critical').length;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Compliance Issues"
        subtitle="Track and resolve compliance gaps"
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Report Issue</button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GCard className="text-center py-5">
          <p className="text-2xl font-bold text-foreground">{issues.length}</p>
          <p className="text-xs uppercase font-bold text-muted-foreground mt-0.5">Total Issues</p>
        </GCard>
        <GCard className="text-center py-5">
          <p className="text-2xl font-bold text-[var(--g-red)]">{overdueCount}</p>
          <p className="text-xs uppercase font-bold text-muted-foreground mt-0.5">Overdue</p>
        </GCard>
        <GCard className="text-center py-5">
          <p className="text-2xl font-bold text-[var(--g-red)]">{criticalCount}</p>
          <p className="text-xs uppercase font-bold text-muted-foreground mt-0.5">Critical</p>
        </GCard>
        <GCard className="text-center py-5">
          <p className="text-2xl font-bold text-[var(--g-green)]">{issues.filter(i => i.status === 'resolved').length}</p>
          <p className="text-xs uppercase font-bold text-muted-foreground mt-0.5">Resolved</p>
        </GCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select className="h-10 rounded-full border border-border bg-card px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--g-active)]" value={filters.severity} onChange={e => setFilters({...filters, severity: e.target.value})}>
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="h-10 rounded-full border border-border bg-card px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--g-active)]" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select className="h-10 rounded-full border border-border bg-card px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--g-active)]" value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Issues Table */}
      <GCard padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-[var(--g-surface)] text-[11px] font-semibold uppercase text-muted-foreground">
                <th className="py-3 pl-5 pr-2">Issue</th>
                <th className="px-2 py-3">Severity</th>
                <th className="px-2 py-3">Department</th>
                <th className="px-2 py-3">Owner</th>
                <th className="px-2 py-3">Due Date</th>
                <th className="px-2 py-3">Status</th>
                <th className="py-3 pl-2 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map(i => (
                <tr key={i.id} className={`border-b border-border last:border-0 hover:bg-[var(--g-surface)] transition-colors ${i.is_overdue ? 'bg-[color-mix(in_oklab,var(--g-red)_8%,var(--bg-primary))]' : ''}`} style={i.is_overdue ? { boxShadow: 'inset 3px 0 0 0 var(--g-red)' } : undefined}>
                  <td className="py-3 pl-5 pr-2">
                    <div className="font-semibold text-foreground">{i.title}</div>
                    {i.audit_title && <div className="text-xs text-muted-foreground mt-0.5">Audit: {i.audit_title}</div>}
                    {i.is_overdue && <span className="bg-[var(--g-red)] text-white text-[9px] font-bold rounded px-1.5 py-0.5 mt-1 inline-block">⚠ OVERDUE</span>}
                  </td>
                  <td className="px-2 py-3">
                    <StatusChip tone={toneForStatus(i.severity)}>
                      {i.severity}
                    </StatusChip>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">{i.department_name}</td>
                  <td className="px-2 py-3 text-foreground">{i.assigned_to_name || '—'}</td>
                  <td className={`px-2 py-3 text-xs ${i.is_overdue ? 'text-[var(--g-red)] font-semibold' : 'text-muted-foreground'}`}>{i.due_date || '—'}</td>
                  <td className="px-2 py-3">
                    <StatusChip tone={toneForStatus(i.status)}>
                      {i.status?.replace('_', ' ')}
                    </StatusChip>
                  </td>
                  <td className="py-3 pl-2 pr-5 text-right">
                    {i.status === 'open' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(i.id, 'in_progress')}>
                        Start
                      </button>
                    )}
                    {i.status === 'in_progress' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(i.id, 'resolved')}>
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCard>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-foreground mb-4">Report Compliance Issue</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="form-label">Title</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Severity</label>
                  <select className="form-input form-select" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <select className="form-input form-select" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    <option value="">—</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
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
