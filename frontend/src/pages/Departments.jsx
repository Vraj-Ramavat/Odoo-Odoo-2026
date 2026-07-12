import { useState, useEffect } from 'react';
import { coreAPI, authAPI } from '../api/client';
import {
  Building2, Plus, Pencil, Trash2, X, Search, Users, ChevronDown
} from 'lucide-react';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: '', code: '', head: '', parent_department: '',
    employee_count: 0, status: 'active',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, userRes] = await Promise.all([
        coreAPI.getDepartments(),
        authAPI.getUsers(),
      ]);
      setDepartments(deptRes.data.results || deptRes.data);
      setUsers(userRes.data.results || userRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditingDept(null);
    setForm({ name: '', code: '', head: '', parent_department: '', employee_count: 0, status: 'active' });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditingDept(dept);
    setForm({
      name: dept.name, code: dept.code, head: dept.head || '',
      parent_department: dept.parent_department || '',
      employee_count: dept.employee_count, status: dept.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.head) payload.head = null;
      if (!payload.parent_department) payload.parent_department = null;
      if (editingDept) {
        await coreAPI.updateDepartment(editingDept.id, payload);
        showToast('Department updated successfully');
      } else {
        await coreAPI.createDepartment(payload);
        showToast('Department created successfully');
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

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete "${dept.name}" department?`)) return;
    try {
      await coreAPI.deleteDepartment(dept.id);
      showToast('Department deleted');
      fetchData();
    } catch (err) {
      showToast('Failed to delete department', 'error');
    }
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Building2 size={28} style={{ color: 'var(--accent)' }} />
            Departments
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage organizational departments and hierarchy
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Add Department
        </button>
      </div>

      {/* Search */}
      <div className="relative w-80 mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input py-2.5 text-sm"
          style={{ paddingLeft: '40px' }}
          placeholder="Search departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
            Loading departments...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>Head</th>
                <th>Employees</th>
                <th>Parent</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    No departments found
                  </td>
                </tr>
              ) : (
                filtered.map((dept) => (
                  <tr key={dept.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                          <Building2 size={16} />
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{dept.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-1 rounded text-xs font-mono font-semibold"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {dept.code}
                      </span>
                    </td>
                    <td>{dept.head_name || <span style={{ color: 'var(--text-muted)' }}>--</span>}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Users size={14} style={{ color: 'var(--text-muted)' }} />
                        {dept.employee_count}
                      </div>
                    </td>
                    <td>{dept.parent_name || <span style={{ color: 'var(--text-muted)' }}>--</span>}</td>
                    <td>
                      <span className={`badge ${dept.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                        {dept.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(dept)}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }}
                          onClick={() => handleDelete(dept)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingDept ? 'Edit Department' : 'New Department'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Name</label>
                  <input type="text" className="form-input" required
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Code</label>
                  <input type="text" className="form-input" required maxLength={20}
                    value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                </div>
              </div>

              <div>
                <label className="form-label">Department Head</label>
                <select className="form-input form-select" value={form.head}
                  onChange={(e) => setForm({ ...form, head: e.target.value })}>
                  <option value="">No head assigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Parent Department</label>
                <select className="form-input form-select" value={form.parent_department}
                  onChange={(e) => setForm({ ...form, parent_department: e.target.value })}>
                  <option value="">No parent (top-level)</option>
                  {departments.filter(d => d.id !== editingDept?.id).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Employee Count</label>
                  <input type="number" className="form-input" min={0}
                    value={form.employee_count} onChange={(e) => setForm({ ...form, employee_count: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input form-select" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingDept ? 'Update' : 'Create'} Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
