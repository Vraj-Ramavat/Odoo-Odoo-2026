import { useState, useEffect } from 'react';
import { carbonAPI } from '../api/client';
import { Leaf, Plus, Pencil, Trash2, X, Search, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function EmissionFactors() {
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    activity_type: '', scope: '1', unit: '', factor_value: '',
    source: '', effective_from: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterScope) params.scope = filterScope;
      if (!showInactive) params.active = 'true';
      const res = await carbonAPI.getEmissionFactors(params);
      setFactors(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterScope, showInactive]);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ activity_type: '', scope: '1', unit: '', factor_value: '', source: '',
      effective_from: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({
      activity_type: f.activity_type, scope: f.scope, unit: f.unit,
      factor_value: f.factor_value, source: f.source || '',
      effective_from: f.effective_from,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await carbonAPI.updateEmissionFactor(editing.id, form);
        showToast('Emission factor updated');
      } else {
        await carbonAPI.createEmissionFactor({ ...form, is_active: true });
        showToast('Emission factor created (previous version retired)');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      showToast(data ? Object.entries(data).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Error', 'error');
    }
  };

  const handleDelete = async (f) => {
    if (!window.confirm(`Delete "${f.activity_type}" factor?`)) return;
    try {
      await carbonAPI.deleteEmissionFactor(f.id);
      showToast('Factor deleted');
      fetchData();
    } catch (err) {
      showToast(err.response?.status === 409 || err.response?.status === 500
        ? 'Cannot delete: factor has linked transactions (PROTECT constraint)'
        : 'Delete failed', 'error');
    }
  };

  const filtered = factors.filter(f =>
    f.activity_type.toLowerCase().includes(search.toLowerCase()) ||
    (f.source || '').toLowerCase().includes(search.toLowerCase())
  );

  const scopeColors = {
    '1': { bg: 'var(--scope1-bg)', color: 'var(--scope1-text)', label: 'Scope 1' },
    '2': { bg: 'var(--scope2-bg)', color: 'var(--scope2-text)', label: 'Scope 2' },
    '3': { bg: 'var(--scope3-bg)', color: 'var(--scope3-text)', label: 'Scope 3' },
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Leaf size={28} style={{ color: 'var(--accent)' }} />
            Emission Factors
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Versioned carbon emission factors for calculations
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> New Factor
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap p-3 rounded-2xl border border-border shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
        <div className="relative w-80 flex items-center">
          <Search size={18} className="absolute left-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="w-full text-sm outline-none transition-all"
            placeholder="Search emission factors..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            style={{
              height: '48px',
              borderRadius: '12px',
              paddingLeft: '44px',
              paddingRight: '16px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex gap-2 items-center">
          {[{ value: '', label: 'All Scopes' }, { value: '1', label: 'Scope 1' },
            { value: '2', label: 'Scope 2' }, { value: '3', label: 'Scope 3' }].map(opt => (
            <button key={opt.value} className="btn btn-sm"
              style={{
                height: '48px',
                borderRadius: '12px',
                background: filterScope === opt.value ? 'var(--accent-glow)' : 'var(--bg-card)',
                color: filterScope === opt.value ? 'var(--badge-active-text)' : 'var(--text-primary)',
                border: `1px solid ${filterScope === opt.value ? 'var(--badge-active-border)' : 'var(--border)'}`,
                fontWeight: 600,
              }}
              onClick={() => setFilterScope(opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'var(--text-secondary)', height: '48px' }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-border" />
          <span>Show retired</span>
        </label>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
            Loading...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Activity Type</th>
                <th style={{ textAlign: 'center' }}>Scope</th>
                <th>Factor Value</th>
                <th>Unit</th>
                <th>Source</th>
                <th>Effective From</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No emission factors found</td></tr>
              ) : filtered.map((f) => {
                const sc = scopeColors[f.scope] || scopeColors['1'];
                return (
                  <tr key={f.id} style={{ opacity: f.is_active ? 1 : 0.5 }}>
                    <td><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{f.activity_type}</span></td>
                    <td className="align-middle text-center">
                      <span className="inline-flex items-center justify-center text-xs px-3 py-1 rounded-full font-semibold min-w-[80px]" style={{ background: sc.bg, color: sc.color, height: '24px' }}>
                        {sc.label}
                      </span>
                    </td>
                    <td><span className="font-mono font-bold" style={{ color: 'var(--value-text)', fontSize: 15 }}>{f.factor_value}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>kgCO2e / {f.unit}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{f.source || '--'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} /> {f.effective_from}
                      </div>
                      {f.effective_to && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>to {f.effective_to}</div>}
                    </td>
                    <td className="align-middle text-center">
                      {f.is_active ? (
                        <span className="badge badge-active"><CheckCircle size={12} /> Active</span>
                      ) : (
                        <span className="badge badge-inactive"><XCircle size={12} /> Retired</span>
                      )}
                    </td>
                    <td className="align-middle text-center">
                      <div className="flex items-center justify-center gap-1">
                        {f.is_active && (
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}><Pencil size={14} /></button>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }}
                          onClick={() => handleDelete(f)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Versioning info */}
      <div className="mt-4 p-4 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--accent)' }}>Versioning:</strong> Creating a new factor for an existing activity type automatically retires the previous version.
        Old transactions keep their original factor value for audit accuracy.
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editing ? 'Edit Emission Factor' : 'New Emission Factor'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {!editing && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                If an active factor already exists for this activity type, it will be automatically retired.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Activity Type</label>
                <input type="text" className="form-input" required placeholder="e.g. Electricity - Grid"
                  value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Scope</label>
                  <select className="form-input form-select" value={form.scope}
                    onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                    <option value="1">Scope 1 - Direct</option>
                    <option value="2">Scope 2 - Indirect (Energy)</option>
                    <option value="3">Scope 3 - Indirect (Other)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Unit</label>
                  <input type="text" className="form-input" required placeholder="kWh, litre, km..."
                    value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Factor Value (kgCO2e per unit)</label>
                  <input type="number" className="form-input" required step="0.000001" min="0"
                    value={form.factor_value} onChange={(e) => setForm({ ...form, factor_value: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Effective From</label>
                  <input type="date" className="form-input" required
                    value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Source</label>
                <input type="text" className="form-input" placeholder="e.g. DEFRA 2025, EPA eGRID"
                  value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Update' : 'Create'} Factor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
