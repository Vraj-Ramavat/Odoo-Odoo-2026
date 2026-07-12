import { useState, useEffect, useContext } from 'react';
import { gamificationAPI, coreAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const statusColors = { draft: '#4b5563', active: '#047857', under_review: '#b45309', completed: '#1d4ed8', archived: '#6b7280' };
const statusSteps = ['draft', 'active', 'under_review', 'completed'];

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [myParticipations, setMyParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', xp_reward: 100, start_date: '', end_date: '', target_value: 100, target_unit: 'points', status: 'draft' });

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const [c, p] = await Promise.all([
        gamificationAPI.getChallenges(params),
        gamificationAPI.getParticipations(),
      ]);
      setChallenges(c.data.results || c.data);
      setMyParticipations(p.data.results || p.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleJoin = async (id) => {
    try { await gamificationAPI.joinChallenge(id); load(); alert('Joined!'); }
    catch (e) { alert(e.response?.data?.error || 'Could not join'); }
  };

  const handleProgress = async (partId, current, target) => {
    const val = prompt('Enter progress value:', String(current));
    if (val === null) return;
    try { await gamificationAPI.updateProgress(partId, { progress: parseFloat(val) }); load(); }
    catch (e) { alert('Error updating progress'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await gamificationAPI.createChallenge(form); setShowModal(false); load(); }
    catch (e) { alert('Error'); }
  };

  const getMyPart = (challengeId) => myParticipations.find(p => p.challenge === challengeId);

  if (loading) return <div className="page-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Challenges</h1>
          <p className="page-subtitle">Sustainability challenges and competitions</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-input" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option><option value="draft">Draft</option><option value="under_review">Under Review</option><option value="completed">Completed</option>
          </select>
          {user?.role === 'admin' && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Challenge</button>}
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {challenges.map(c => {
          const myPart = getMyPart(c.id);
          const stepIdx = statusSteps.indexOf(c.status);
          return (
            <div key={c.id} className="stat-card" style={{ position: 'relative' }}>
              {/* Lifecycle stepper */}
              <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                {statusSteps.map((s, i) => (
                  <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= stepIdx ? statusColors[c.status] : 'var(--bg-secondary)', transition: 'background 0.3s' }}></div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{c.title}</h3>
                <span style={{ background: statusColors[c.status] + '22', color: statusColors[c.status], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.status?.replace('_', ' ')}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px' }}>{c.description?.slice(0, 120)}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span style={{ background: '#8b5cf622', color: '#8b5cf6', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>🏆 {c.xp_reward} XP</span>
                <span>📅 {c.start_date} → {c.end_date || '—'}</span>
                <span>👥 {c.participant_count} joined</span>
                <span>🎯 {c.target_value} {c.target_unit}</span>
                {c.department_name && <span>🏢 {c.department_name}</span>}
              </div>

              {myPart && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>Your Progress</span>
                    <span style={{ fontWeight: 600 }}>{myPart.progress_pct}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${myPart.progress_pct}%`, height: '100%', background: myPart.status === 'completed' ? '#10b981' : '#1a73e8', borderRadius: 4, transition: 'width 0.3s' }}></div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{myPart.progress} / {c.target_value} {c.target_unit}</div>
                </div>
              )}

              {c.status === 'active' && !myPart && (
                <button className="btn btn-primary" style={{ width: '100%', padding: '8px 0' }} onClick={() => handleJoin(c.id)}>Join Challenge</button>
              )}
              {c.status === 'active' && myPart && myPart.status === 'active' && (
                <button className="btn btn-secondary" style={{ width: '100%', padding: '8px 0' }} onClick={() => handleProgress(myPart.id, myPart.progress, c.target_value)}>Update Progress</button>
              )}
              {myPart && myPart.status === 'completed' && (
                <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 600, fontSize: 14 }}>✅ Challenge Completed!</div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16 }}>Create Challenge</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Title</label><input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="form-group"><label>Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label>XP Reward</label><input type="number" className="form-input" value={form.xp_reward} onChange={e => setForm({...form, xp_reward: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Target Value</label><input type="number" className="form-input" value={form.target_value} onChange={e => setForm({...form, target_value: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Start Date</label><input type="date" className="form-input" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
                <div className="form-group"><label>End Date</label><input type="date" className="form-input" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
              </div>
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
