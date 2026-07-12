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
    <div style={{ fontFamily: '"Inter", -apple-system, sans-serif' }}>
      <style>{`
        .premium-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .premium-table th {
          background: #F9FAFB;
          padding: 14px 16px;
          font-size: 11px;
          font-weight: 600;
          color: #4B5563;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #E5E7EB;
        }
        .premium-table tr:hover {
          background-color: #F9FAFB;
        }
        .premium-input {
          background: #ffffff;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          padding: 8px 12px;
          width: 100%;
          color: #1F2937;
          font-size: 14px;
          margin-top: 4px;
          font-family: "Inter", sans-serif;
          outline: none;
        }
        .premium-input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        .premium-select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234B5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 32px;
        }
      `}</style>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#111827' }}>
            <Leaf size={28} style={{ color: '#10B981' }} />
            Carbon Transactions
          </h1>
          <p className="mt-1" style={{ color: '#4B5563', fontSize: '14px' }}>
            Track and record carbon emissions from operations
          </p>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', background: '#2563EB', borderColor: '#2563EB', color: '#ffffff', cursor: 'pointer' }} onClick={() => {
          setForm({ department: '', emission_factor: '', activity_quantity: '', description: '',
            transaction_date: new Date().toISOString().split('T')[0] });
          setShowModal(true);
        }}>
          <Plus size={18} /> Manual Entry
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Total Emissions</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: '#1E3A8A', marginTop: '6px', marginBottom: 0, lineHeight: 1 }}>
            {totalEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', marginLeft: '6px' }}>kgCO2e</span>
          </p>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Transactions</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginTop: '6px', marginBottom: 0, lineHeight: 1 }}>
            {transactions.length}
          </p>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Auto-Calculated</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: '#1E3A8A', marginTop: '6px', marginBottom: 0, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {autoCount}
            <span style={{ fontSize: '13px', fontWeight: 400, color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Zap size={13} style={{ color: '#2563EB' }} /> signal-driven
            </span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select className="premium-input premium-select" style={{ background: '#ffffff', borderColor: '#E5E7EB', borderRadius: '8px', color: '#374151', fontSize: '13px', padding: '8px 12px', height: '38px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', width: '192px', margin: 0 }} value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="premium-input premium-select" style={{ background: '#ffffff', borderColor: '#E5E7EB', borderRadius: '8px', color: '#374151', fontSize: '13px', padding: '8px 12px', height: '38px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', width: '160px', margin: 0 }} value={filters.scope}
          onChange={(e) => setFilters({ ...filters, scope: e.target.value })}>
          <option value="">All Scopes</option>
          <option value="1">Scope 1</option>
          <option value="2">Scope 2</option>
          <option value="3">Scope 3</option>
        </select>
        <select className="premium-input premium-select" style={{ background: '#ffffff', borderColor: '#E5E7EB', borderRadius: '8px', color: '#374151', fontSize: '13px', padding: '8px 12px', height: '38px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', width: '176px', margin: 0 }} value={filters.source_type}
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
      <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div className="p-12 text-center" style={{ color: '#6B7280' }}>
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : (
          <table className="premium-table">
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
                <tr><td colSpan={8} className="text-center py-12" style={{ color: '#6B7280', fontSize: '14px' }}>No transactions</td></tr>
              ) : transactions.map((t) => {
                const sc = scopeColors[t.scope] || scopeColors['1'];
                return (
                  <tr key={t.id}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '13px' }}>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} style={{ color: '#9CA3AF' }} /> {t.transaction_date}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', color: '#111827', fontSize: '13px', fontWeight: 500 }}>{t.department_name}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
                        style={{ background: `${sourceColors[t.source_type] || '#666'}12`, color: sourceColors[t.source_type] || '#888', border: `1px solid ${sourceColors[t.source_type] || '#666'}24` }}>
                        {t.source_type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '13px' }}>
                      {t.description || t.emission_factor_name}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', color: '#111827', fontSize: '13px' }}>
                      <span className="font-mono">{parseFloat(t.activity_quantity).toLocaleString()}</span>
                      <span className="text-xs ml-1" style={{ color: '#6B7280' }}>{t.emission_factor_unit}</span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                      <span className="font-mono font-semibold" style={{ color: '#1E3A8A', fontSize: '14px' }}>
                        {parseFloat(t.calculated_emissions_kgco2e).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                      {t.is_auto_calculated ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}><Zap size={11} /> Auto</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>Manual</span>
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
        <div className="modal-overlay" style={{ background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)' }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #E5E7EB', position: 'relative', margin: '16px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#111827' }}>Manual Carbon Entry</h2>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px', cursor: 'pointer' }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label" style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>Department</label>
                <select className="premium-input premium-select" required value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label" style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>Emission Factor</label>
                <select className="premium-input premium-select" required value={form.emission_factor}
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
                  <label className="form-label" style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>Quantity</label>
                  <input type="number" className="premium-input" required step="0.01" min="0"
                    value={form.activity_quantity} onChange={(e) => setForm({ ...form, activity_quantity: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>Date</label>
                  <input type="date" className="premium-input" required
                    value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label" style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>Description</label>
                <input type="text" className="premium-input" placeholder="Optional description"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              {form.emission_factor && form.activity_quantity && (
                <div className="p-4 rounded-lg" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <p className="text-sm font-medium" style={{ color: '#1E3A8A', margin: 0 }}>
                    Estimated: {(parseFloat(form.activity_quantity) * parseFloat(factors.find(f => f.id == form.emission_factor)?.factor_value || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} kgCO2e
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', background: '#2563EB', borderColor: '#2563EB', color: '#ffffff', cursor: 'pointer' }}>Record Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
