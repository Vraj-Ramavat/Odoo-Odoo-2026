import { useState, useEffect } from 'react';
import { governanceAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ecosphere/PageHeader';
import { GCard } from '../components/ecosphere/GCard';
import { StatusChip, toneForStatus } from '../components/ecosphere/StatusChip';

export default function ESGPolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [myAcks, setMyAcks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('policies');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'general', priority: 'mandatory', status: 'active', effective_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        governanceAPI.getPolicies(),
        governanceAPI.getAcknowledgements({ employee: user?.id, pending: 'true' }),
      ]);
      setPolicies(p.data.results || p.data);
      setMyAcks(a.data.results || a.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await governanceAPI.createPolicy(form); setShowModal(false); load(); }
    catch (e) { alert('Error creating policy'); }
  };

  const handleAcknowledge = async (ackId) => {
    try { await governanceAPI.acknowledge(ackId); load(); alert('Policy acknowledged!'); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
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
        title="ESG Policies"
        subtitle="Organization policies and compliance documents"
        actions={
          <div className="flex items-center gap-2">
            <button className={`btn ${tab === 'policies' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('policies')}>All Policies</button>
            <button className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('pending')}>
              My Pending {myAcks.length > 0 && <span className="bg-[var(--g-yellow)] text-white rounded-full px-2 py-0.5 ml-1 text-xs">{myAcks.length}</span>}
            </button>
            {user?.role === 'admin' && <button className="btn btn-primary animate-pulse" onClick={() => setShowModal(true)}>+ New Policy</button>}
          </div>
        }
      />

      {tab === 'policies' ? (
        <GCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-[var(--g-surface)] text-[11px] font-semibold uppercase text-muted-foreground">
                  <th className="py-3 pl-5 pr-2">Policy</th>
                  <th className="px-2 py-3">Category</th>
                  <th className="px-2 py-3">Priority</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Effective Date</th>
                  <th className="py-3 pl-2 pr-5">Acknowledgement</th>
                </tr>
              </thead>
              <tbody>
                {policies.map(p => {
                  const pct = p.total_employees > 0 ? Math.round(p.acknowledged_count / p.total_employees * 100) : 0;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-[var(--g-surface)] transition-colors">
                      <td className="py-3 pl-5 pr-2">
                        <div className="font-semibold text-foreground">{p.title}</div>
                        <div className="text-xs text-muted-foreground max-w-xs truncate mt-0.5" title={p.description}>{p.description}</div>
                      </td>
                      <td className="px-2 py-3">
                        <StatusChip tone={p.category === 'governance' ? 'purple' : p.category === 'environmental' ? 'green' : 'blue'}>
                          {p.category}
                        </StatusChip>
                      </td>
                      <td className="px-2 py-3">
                        <StatusChip tone={p.priority === 'mandatory' ? 'red' : p.priority === 'recommended' ? 'yellow' : 'grey'}>
                          {p.priority}
                        </StatusChip>
                      </td>
                      <td className="px-2 py-3">
                        <StatusChip tone={toneForStatus(p.status)}>
                          {p.status}
                        </StatusChip>
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">{p.effective_date}</td>
                      <td className="py-3 pl-2 pr-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-[var(--g-surface)] rounded-full overflow-hidden border border-border">
                            <div className="h-full rounded-full bg-[var(--g-blue)] transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold min-w-[70px] text-muted-foreground">{p.acknowledged_count}/{p.total_employees} ({pct}%)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myAcks.length === 0 && (
            <GCard className="col-span-full text-center py-10 text-muted-foreground">
              ✅ All policies acknowledged!
            </GCard>
          )}
          {myAcks.map(a => (
            <GCard key={a.id} className="flex flex-col justify-between h-40">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{a.policy_title}</h3>
                <p className="text-xs text-muted-foreground mt-1">This mandatory policy requires your acknowledgement.</p>
              </div>
              <button className="btn btn-primary w-full text-center justify-center mt-4" onClick={() => handleAcknowledge(a.id)}>✓ Acknowledge Policy</button>
            </GCard>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-foreground mb-4">Create ESG Policy</h2>
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
                  <label className="form-label">Category</label>
                  <select className="form-input form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="environmental">Environmental</option>
                    <option value="social">Social</option>
                    <option value="governance">Governance</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select className="form-input form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="mandatory">Mandatory</option>
                    <option value="recommended">Recommended</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Effective Date</label>
                <input type="date" className="form-input" required value={form.effective_date} onChange={e => setForm({...form, effective_date: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
