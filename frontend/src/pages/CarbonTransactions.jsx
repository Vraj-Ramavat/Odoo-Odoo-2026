import { useState, useEffect } from 'react';
import { carbonAPI, coreAPI } from '../api/client';
import {
  Leaf, Plus, Trash2, X, Search, Filter, Zap, ArrowUpDown, Calendar
} from 'lucide-react';

export default function CarbonTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ department: '', scope: '', source_type: '' });
  const [form, setForm] = useState({
    department: '', emission_factor: '', activity_quantity: '',
    description: '', transaction_date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.scope) params.scope = filters.scope;
      if (filters.source_type) params.source_type = filters.source_type;
      const [txnRes, deptRes, factorRes] = await Promise.all([
        carbonAPI.getTransactions(params),
        coreAPI.getDepartments({ status: 'active' }),
        carbonAPI.getEmissionFactors({ active: 'true' }),
      ]);
      setTransactions(txnRes.data.results || txnRes.data);
      setDepartments(deptRes.data.results || deptRes.data);
      setFactors(factorRes.data.results || factorRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await carbonAPI.createTransaction(form);
      showToast('Carbon transaction recorded');
      setShowModal(false);
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      showToast(data ? Object.entries(data).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Error', 'error');
    }
  };

  const scopeColors = {
    '1': { bg: 'rgba(244, 63, 94, 0.12)', color: 'var(--rose)', label: 'S1' },
    '2': { bg: 'rgba(59, 130, 246, 0.12)', color: 'var(--blue)', label: 'S2' },
    '3': { bg: 'rgba(139, 92, 246, 0.12)', color: 'var(--purple)', label: 'S3' },
  };

  const sourceColors = {
    purchase: '#3b82f6', manufacturing: '#8b5cf6',
    expense: '#f59e0b', fleet: '#f43f5e', manual: '#10b981',
  };

  // Stats
  const totalEmissions = transactions.reduce((sum, t) => sum + parseFloat(t.calculated_emissions_kgco2e || 0), 0);
  const autoCount = transactions.filter(t => t.is_auto_calculated).length;

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Leaf size={28} style={{ color: 'var(--accent)' }} />
            Carbon Transactions
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Track and record carbon emissions from operations
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({ department: '', emission_factor: '', activity_quantity: '', description: '',
            transaction_date: new Date().toISOString().split('T')[0] });
          setShowModal(true);
        }}>
          <Plus size={18} /> Manual Entry
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Total Emissions</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--accent-light)' }}>
            {totalEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>kgCO2e</span>
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Transactions</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{transactions.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Auto-Calculated</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--blue)' }}>
            {autoCount}
            <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
              <Zap size={14} className="inline" /> signal-driven
            </span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select className="form-input form-select py-2 text-sm w-48" value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="form-input form-select py-2 text-sm w-40" value={filters.scope}
          onChange={(e) => setFilters({ ...filters, scope: e.target.value })}>
          <option value="">All Scopes</option>
          <option value="1">Scope 1</option>
          <option value="2">Scope 2</option>
          <option value="3">Scope 3</option>
        </select>
        <select className="form-input form-select py-2 text-sm w-44" value={filters.source_type}
          onChange={(e) => setFilters({ ...filters, source_type: e.target.value })}>
          <option value="">All Sources</option>
          <option value="purchase">Purchase</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="expense">Expense</option>
          <option value="fleet">Fleet</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Department</th>
                <th>Source</th>
                <th>Activity</th>
                <th>Quantity</th>
                <th>Scope</th>
                <th>Emissions (kgCO2e)</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No transactions</td></tr>
              ) : transactions.map((t) => {
                const sc = scopeColors[t.scope] || scopeColors['1'];
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <Calendar size={13} /> {t.transaction_date}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{t.department_name}</td>
                    <td>
                      <span className="text-xs px-2 py-1 rounded-full font-semibold capitalize"
                        style={{ background: `${sourceColors[t.source_type] || '#666'}18`, color: sourceColors[t.source_type] || '#888' }}>
                        {t.source_type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {t.description || t.emission_factor_name}
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>
                      <span className="font-mono">{parseFloat(t.activity_quantity).toLocaleString()}</span>
                      <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{t.emission_factor_unit}</span>
                    </td>
                    <td>
                      <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono font-semibold" style={{ color: 'var(--accent-light)' }}>
                        {parseFloat(t.calculated_emissions_kgco2e).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </span>
                    </td>
                    <td>
                      {t.is_auto_calculated ? (
                        <span className="badge badge-info"><Zap size={11} /> Auto</span>
                      ) : (
                        <span className="badge badge-active">Manual</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Manual Carbon Entry</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Department</label>
                <select className="form-input form-select" required value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Emission Factor</label>
                <select className="form-input form-select" required value={form.emission_factor}
                  onChange={(e) => setForm({ ...form, emission_factor: e.target.value })}>
                  <option value="">Select factor...</option>
                  {factors.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.activity_type} — {f.factor_value} kgCO2e/{f.unit} ({f.scope_display})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Quantity</label>
                  <input type="number" className="form-input" required step="0.01" min="0"
                    value={form.activity_quantity} onChange={(e) => setForm({ ...form, activity_quantity: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" required
                    value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <input type="text" className="form-input" placeholder="Optional description"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              {form.emission_factor && form.activity_quantity && (
                <div className="p-4 rounded-lg" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--accent-light)' }}>
                    Estimated: {(parseFloat(form.activity_quantity) * parseFloat(factors.find(f => f.id == form.emission_factor)?.factor_value || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} kgCO2e
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
