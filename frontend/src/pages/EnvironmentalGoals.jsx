import { useState, useEffect } from 'react';
import { carbonAPI, coreAPI } from '../api/client';
import { Target, Plus, Pencil, Trash2, X, Calendar, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

export default function EnvironmentalGoals() {
  const [goals, setGoals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    title: '', department: '', metric_type: 'carbon_reduction_pct',
    target_value: '', baseline_value: '', current_value: 0, unit: '%',
    deadline: '', status: 'on_track',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalRes, deptRes] = await Promise.all([
        carbonAPI.getGoals(),
        coreAPI.getDepartments({ status: 'active' }),
      ]);
      setGoals(goalRes.data.results || goalRes.data);
      setDepartments(deptRes.data.results || deptRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', department: '', metric_type: 'carbon_reduction_pct',
      target_value: '', baseline_value: '', current_value: 0, unit: '%', deadline: '', status: 'on_track' });
    setShowModal(true);
  };

  const openEdit = (g) => {
    setEditing(g);
    setForm({
      title: g.title, department: g.department || '', metric_type: g.metric_type,
      target_value: g.target_value, baseline_value: g.baseline_value || '', current_value: g.current_value,
      unit: g.unit || '%', deadline: g.deadline, status: g.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.department) payload.department = null;
      if (!payload.baseline_value) payload.baseline_value = null;
      if (editing) {
        await carbonAPI.updateGoal(editing.id, payload);
        showToast('Goal updated');
      } else {
        await carbonAPI.createGoal(payload);
        showToast('Goal created');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      showToast(data ? JSON.stringify(data) : 'Error', 'error');
    }
  };

  const handleDelete = async (g) => {
    if (!window.confirm(`Delete "${g.title}"?`)) return;
    try { await carbonAPI.deleteGoal(g.id); showToast('Goal deleted'); fetchData(); }
    catch { showToast('Delete failed', 'error'); }
  };

  const statusConfig = {
    on_track: { color: 'var(--badge-active-text)', bg: 'var(--badge-active-bg)', icon: TrendingUp, label: 'On Track' },
    at_risk: { color: 'var(--badge-warning-text)', bg: 'var(--badge-warning-bg)', icon: AlertTriangle, label: 'At Risk' },
    missed: { color: 'var(--badge-danger-text)', bg: 'var(--badge-danger-bg)', icon: AlertTriangle, label: 'Missed' },
    achieved: { color: 'var(--value-text)', bg: 'var(--badge-active-bg)', icon: CheckCircle, label: 'Achieved' },
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Target size={28} style={{ color: 'var(--accent)' }} />
            Environmental Goals
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Track sustainability targets and progress
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> New Goal
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16" style={{ color: 'var(--text-muted)' }}>
          <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mr-3" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <Target size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No environmental goals set</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {goals.map((g) => {
            const sc = statusConfig[g.status] || statusConfig.on_track;
            const StatusIcon = sc.icon;
            const pct = g.progress_pct;
            const barColor = g.status === 'achieved' ? 'var(--g-green)' :
              g.status === 'at_risk' ? 'var(--g-yellow)' :
              g.status === 'missed' ? 'var(--g-red)' : 'var(--g-blue)';

            return (
              <div key={g.id} className="glass-card p-6 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{g.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {g.department_name} &bull; {g.metric_type_display}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                    style={{ background: sc.bg, color: sc.color }}>
                    <StatusIcon size={12} /> {sc.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {g.current_value} / {g.target_value} {g.unit}
                    </span>
                    <span className="text-sm font-bold" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)`,
                      }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Calendar size={12} />
                    Deadline: {g.deadline}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }}
                      onClick={() => handleDelete(g)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editing ? 'Edit Goal' : 'New Environmental Goal'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Title</label>
                <input type="text" className="form-input" required placeholder="e.g. Reduce Carbon Emissions by 20%"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Department</label>
                  <select className="form-input form-select" value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    <option value="">Organization-wide</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Metric Type</label>
                  <select className="form-input form-select" value={form.metric_type}
                    onChange={(e) => setForm({ ...form, metric_type: e.target.value })}>
                    <option value="carbon_reduction_pct">Carbon Reduction %</option>
                    <option value="renewable_energy_pct">Renewable Energy %</option>
                    <option value="waste_reduction_pct">Waste Reduction %</option>
                    <option value="water_reduction_pct">Water Reduction %</option>
                    <option value="energy_efficiency">Energy Efficiency</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Target</label>
                  <input type="number" className="form-input" required step="0.01"
                    value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Current</label>
                  <input type="number" className="form-input" step="0.01"
                    value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Baseline</label>
                  <input type="number" className="form-input" step="0.01"
                    value={form.baseline_value} onChange={(e) => setForm({ ...form, baseline_value: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Unit</label>
                  <input type="text" className="form-input" value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-input" required
                    value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input form-select" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="on_track">On Track</option>
                    <option value="at_risk">At Risk</option>
                    <option value="missed">Missed</option>
                    <option value="achieved">Achieved</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'} Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
