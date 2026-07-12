import { useState, useEffect } from 'react';
import { coreAPI } from '../api/client';
import { Tags, Plus, Pencil, Trash2, X, Search, Filter } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'csr', status: 'active' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      const res = await coreAPI.getCategories(params);
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterType]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditingCat(null);
    setForm({ name: '', type: 'csr', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setForm({ name: cat.name, type: cat.type, status: cat.status });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await coreAPI.updateCategory(editingCat.id, form);
        showToast('Category updated successfully');
      } else {
        await coreAPI.createCategory(form);
        showToast('Category created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
        showToast(msg, 'error');
      }
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}" category?`)) return;
    try {
      await coreAPI.deleteCategory(cat.id);
      showToast('Category deleted');
      fetchData();
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const typeColors = {
    csr: { bg: 'var(--scope2-bg)', color: 'var(--scope2-text)' },
    challenge: { bg: 'var(--scope3-bg)', color: 'var(--scope3-text)' },
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Tags size={28} style={{ color: 'var(--accent)' }} />
            Categories
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage CSR Activity and Challenge categories
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" className="form-input py-2.5 text-sm" style={{ paddingLeft: '40px' }}
            placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'csr', label: 'CSR Activity' },
            { value: 'challenge', label: 'Challenge' },
          ].map(opt => (
            <button key={opt.value}
              className="btn btn-sm"
              style={{
                background: filterType === opt.value ? 'var(--accent-glow)' : 'var(--bg-card)',
                color: filterType === opt.value ? 'var(--badge-active-text)' : 'var(--text-primary)',
                border: `1px solid ${filterType === opt.value ? 'var(--badge-active-border)' : 'var(--border)'}`,
              }}
              onClick={() => setFilterType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="flex items-center justify-center py-16" style={{ color: 'var(--text-muted)' }}>
          <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mr-3" />
          Loading categories...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <Tags size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => {
            const tc = typeColors[cat.type] || typeColors.csr;
            return (
              <div key={cat.id} className="glass-card p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: tc.bg, color: tc.color }}>
                      <Tags size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: tc.bg, color: tc.color }}>
                        {cat.type_display}
                      </span>
                    </div>
                  </div>
                  <span className={`badge ${cat.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                    {cat.status}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(cat)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }}
                    onClick={() => handleDelete(cat)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingCat ? 'Edit Category' : 'New Category'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Name</label>
                <input type="text" className="form-input" required
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Type</label>
                <select className="form-input form-select" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="csr">CSR Activity</option>
                  <option value="challenge">Challenge</option>
                </select>
              </div>

              <div>
                <label className="form-label">Status</label>
                <select className="form-input form-select" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingCat ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
