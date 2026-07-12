import React, { useState, useEffect } from 'react';
import { governanceAPI, coreAPI } from '../api/client';
import { PageHeader } from '../components/ecosphere/PageHeader';
import { GCard } from '../components/ecosphere/GCard';
import { StatusChip, toneForStatus } from '../components/ecosphere/StatusChip';

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
    catch (e) { alert('Error scheduling audit'); }
  };

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
        title="Audits"
        subtitle="ESG audit management and findings"
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Schedule Audit</button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GCard className="text-center py-5">
          <p className="text-2xl font-bold text-foreground">{audits.length}</p>
          <p className="text-xs uppercase font-bold text-muted-foreground mt-0.5">Total Audits</p>
        </GCard>
        <GCard className="text-center py-5">
          <p className="text-2xl font-bold text-[var(--g-green)]">{audits.filter(a => a.status === 'completed').length}</p>
          <p className="text-xs uppercase font-bold text-muted-foreground mt-0.5">Completed</p>
        </GCard>
        <GCard className="text-center py-5">
          <p className="text-2xl font-bold text-[var(--g-blue)]">{audits.filter(a => a.status === 'in_progress').length}</p>
          <p className="text-xs uppercase font-bold text-muted-foreground mt-0.5">In Progress</p>
        </GCard>
      </div>

      {/* Table */}
      <GCard padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-[var(--g-surface)] text-[11px] font-semibold uppercase text-muted-foreground">
                <th className="py-3 pl-5 pr-2 w-10"></th>
                <th className="px-2 py-3">Audit</th>
                <th className="px-2 py-3">Type</th>
                <th className="px-2 py-3">Department</th>
                <th className="px-2 py-3">Auditor</th>
                <th className="px-2 py-3">Date</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3 text-center">Score</th>
                <th className="py-3 pl-2 pr-5 text-right">Issues</th>
              </tr>
            </thead>
            <tbody>
              {audits.map(a => {
                const isExpanded = expanded === a.id;
                return (
                  <React.Fragment key={a.id}>
                    <tr onClick={() => toggleExpand(a.id)} className="border-b border-border hover:bg-[var(--g-surface)] transition-colors cursor-pointer">
                      <td className="py-3 pl-5 pr-2 font-medium text-muted-foreground text-center">
                        {isExpanded ? '▼' : '▶'}
                      </td>
                      <td className="px-2 py-3 font-semibold text-foreground">{a.title}</td>
                      <td className="px-2 py-3">
                        <StatusChip tone={a.audit_type === 'internal' ? 'purple' : 'blue'}>
                          {a.audit_type}
                        </StatusChip>
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">{a.department_name || 'Organization-wide'}</td>
                      <td className="px-2 py-3 text-foreground">{a.auditor || '—'}</td>
                      <td className="px-2 py-3 text-muted-foreground text-xs">{a.scheduled_date}</td>
                      <td className="px-2 py-3">
                        <StatusChip tone={toneForStatus(a.status)}>
                          {a.status?.replace('_', ' ')}
                        </StatusChip>
                      </td>
                      <td className="px-2 py-3 text-center font-bold text-foreground">{a.score || '—'}</td>
                      <td className="py-3 pl-2 pr-5 text-right">
                        <StatusChip tone={a.issue_count > 0 ? 'red' : 'green'}>
                          {a.issue_count}
                        </StatusChip>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[var(--g-surface)]">
                        <td colSpan={9} className="p-5 border-b border-border">
                          <div className="space-y-4">
                            {a.findings && (
                              <div>
                                <span className="font-semibold text-xs text-muted-foreground block uppercase mb-1">Findings</span>
                                <p className="text-sm text-foreground">{a.findings}</p>
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-xs text-muted-foreground block uppercase mb-2">Linked Compliance Issues</span>
                              {issues[a.id] && issues[a.id].length > 0 ? (
                                <div className="space-y-2 max-w-2xl">
                                  {issues[a.id].map(issue => (
                                    <div key={issue.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <span className={`w-1.5 h-6 rounded-full ${issue.is_overdue || issue.severity === 'critical' ? 'bg-[var(--g-red)]' : issue.severity === 'high' ? 'bg-[var(--g-yellow)]' : 'bg-muted-foreground'}`} />
                                        <div>
                                          <p className="text-sm font-semibold text-foreground">{issue.title}</p>
                                          {issue.is_overdue && <span className="bg-[var(--g-red)] text-white text-[9px] font-bold rounded px-1.5 py-0.5 mt-0.5 inline-block">⚠ OVERDUE</span>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <StatusChip tone={toneForStatus(issue.severity)}>{issue.severity}</StatusChip>
                                        <StatusChip tone={toneForStatus(issue.status)}>{issue.status}</StatusChip>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No linked compliance issues found.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </GCard>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-foreground mb-4">Schedule Audit</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="form-label">Title</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input form-select" value={form.audit_type} onChange={e => setForm({...form, audit_type: e.target.value})}>
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <select className="form-input form-select" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    <option value="">Organization-wide</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Auditor</label>
                <input className="form-input" value={form.auditor} onChange={e => setForm({...form, auditor: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Scheduled Date</label>
                <input type="date" className="form-input" required value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
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
