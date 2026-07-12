import { useState, useEffect } from 'react';
import { socialAPI, coreAPI } from '../api/client';

const statusColors = {
  draft: '#4b5563', active: '#1d4ed8', completed: '#047857', cancelled: '#b91c1c',
};
const partStatusColors = {
  pending: '#92400e', approved: '#047857', rejected: '#b91c1c',
};

export default function CSRActivities() {
  const [activities, setActivities] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('activities');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', location: '', max_participants: 50, status: 'active' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [a, p, d] = await Promise.all([
        socialAPI.getActivities(),
        socialAPI.getParticipations({ status: 'pending' }),
        coreAPI.getDepartments(),
      ]);
      setActivities(a.data.results || a.data);
      setParticipations(p.data.results || p.data);
      setDepartments(d.data.results || d.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await socialAPI.createActivity(form);
      setShowModal(false);
      setForm({ title: '', description: '', start_date: '', location: '', max_participants: 50, status: 'active' });
      load();
    } catch (e) { alert(e.response?.data?.detail || 'Error creating activity'); }
  };

  const handleJoin = async (id) => {
    try { await socialAPI.joinActivity(id); load(); alert('Joined successfully!'); }
    catch (e) { alert(e.response?.data?.error || 'Could not join'); }
  };

  const handleReview = async (id, decision) => {
    try { await socialAPI.reviewParticipation(id, { status: decision }); load(); }
    catch (e) { alert(e.response?.data?.error || 'Review failed'); }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="page-title">CSR Activities</h1>
          <p className="page-subtitle">Corporate Social Responsibility programs</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${tab === 'activities' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('activities')}>Activities</button>
          <button className={`btn ${tab === 'review' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('review')}>
            Review Queue {participations.length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, padding: '2px 8px', marginLeft: 6, fontSize: 12 }}>{participations.length}</span>}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Activity</button>
        </div>
      </div>

      {tab === 'activities' ? (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {activities.map(a => (
            <div key={a.id} className="stat-card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{a.title}</h3>
                <span style={{ background: statusColors[a.status] + '22', color: statusColors[a.status], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{a.status}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px' }}>{a.description?.slice(0, 100)}{a.description?.length > 100 ? '...' : ''}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span>📍 {a.location || 'TBD'}</span>
                <span>📅 {a.start_date}</span>
                <span>👥 {a.participant_count}/{a.max_participants}</span>
                {a.department_name && <span>🏢 {a.department_name}</span>}
              </div>
              {a.impact_description && <p style={{ fontSize: 12, color: '#10b981', margin: '0 0 12px' }}>✨ {a.impact_description}</p>}
              {a.status === 'active' && (
                <button className="btn btn-primary" style={{ width: '100%', padding: '8px 0' }} onClick={() => handleJoin(a.id)}>Join Activity</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Employee</th><th>Activity</th><th>Hours</th><th>Proof</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {participations.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No pending reviews</td></tr>}
              {participations.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.employee_name}</td>
                  <td>{p.activity_title}</td>
                  <td>{p.hours_contributed}h</td>
                  <td>{p.proof_description ? '📎 Yes' : '—'}</td>
                  <td><span style={{ background: partStatusColors[p.status] + '22', color: partStatusColors[p.status], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{p.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleReview(p.id, 'approved')}>✓ Approve</button>
                      <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12, borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleReview(p.id, 'rejected')}>✗ Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16 }}>Create CSR Activity</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Title</label><input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="form-group"><label>Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label>Start Date</label><input type="date" className="form-input" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
                <div className="form-group"><label>Location</label><input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Max Participants</label><input type="number" className="form-input" value={form.max_participants} onChange={e => setForm({...form, max_participants: parseInt(e.target.value)})} /></div>
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
