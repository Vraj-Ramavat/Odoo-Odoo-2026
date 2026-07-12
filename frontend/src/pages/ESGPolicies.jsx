import { useState, useEffect, useContext } from 'react';
import { governanceAPI } from '../api/client';
import { AuthContext } from '../context/AuthContext';

const catColors = { environmental: '#10b981', social: '#8b5cf6', governance: '#1a73e8', general: '#6b7280' };
const statusColors = { draft: '#6b7280', active: '#1a73e8', archived: '#9ca3af' };

export default function ESGPolicies() {
  const { user } = useContext(AuthContext);
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

  if (loading) return <div className="page-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">ESG Policies</h1>
          <p className="page-subtitle">Organization policies and compliance documents</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${tab === 'policies' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('policies')}>All Policies</button>
          <button className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('pending')}>
            My Pending {myAcks.length > 0 && <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 99, padding: '2px 8px', marginLeft: 6, fontSize: 12 }}>{myAcks.length}</span>}
          </button>
          {user?.role === 'admin' && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Policy</button>}
        </div>
      </div>

      {tab === 'policies' ? (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Policy</th><th>Category</th><th>Priority</th><th>Status</th><th>Effective Date</th><th>Acknowledgement</th></tr></thead>
            <tbody>
              {policies.map(p => {
                const pct = p.total_employees > 0 ? Math.round(p.acknowledged_count / p.total_employees * 100) : 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                    </td>
                    <td><span style={{ background: (catColors[p.category] || '#6b7280') + '22', color: catColors[p.category] || '#6b7280', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{p.category}</span></td>
                    <td><span style={{ fontWeight: 600, color: p.priority === 'mandatory' ? '#ef4444' : p.priority === 'recommended' ? '#f59e0b' : '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>{p.priority}</span></td>
                    <td><span style={{ background: (statusColors[p.status] || '#6b7280') + '22', color: statusColors[p.status], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{p.status}</span></td>
                    <td style={{ fontSize: 13 }}>{p.effective_date}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10b981' : pct > 50 ? '#1a73e8' : '#f59e0b', borderRadius: 3, transition: 'width 0.3s' }}></div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 60 }}>{p.acknowledged_count}/{p.total_employees} ({pct}%)</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {myAcks.length === 0 && <div className="stat-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>✅ All policies acknowledged!</div>}
          {myAcks.map(a => (
            <div key={a.id} className="stat-card">
              <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{a.policy_title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>This mandatory policy requires your acknowledgement.</p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleAcknowledge(a.id)}>✓ Acknowledge Policy</button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16 }}>Create ESG Policy</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Title</label><input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="form-group"><label>Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label>Category</label><select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option value="environmental">Environmental</option><option value="social">Social</option><option value="governance">Governance</option><option value="general">General</option></select></div>
                <div className="form-group"><label>Priority</label><select className="form-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}><option value="mandatory">Mandatory</option><option value="recommended">Recommended</option><option value="optional">Optional</option></select></div>
              </div>
              <div className="form-group"><label>Effective Date</label><input type="date" className="form-input" required value={form.effective_date} onChange={e => setForm({...form, effective_date: e.target.value})} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
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
