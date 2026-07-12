import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coreAPI } from '../api/client';
import { Leaf, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password_confirm: '', role: 'employee', department: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    coreAPI.getDepartments({ status: 'active' })
      .then(res => setDepartments(res.data.results || res.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.department) delete payload.department;
      await register(payload);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        setError(messages.join(' | '));
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--accent)]"
          >
            <Leaf size={22} color="white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>EcoSphere</h1>
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Create your account</h2>
        <p className="mb-8" style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Join EcoSphere and start making an impact
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(217, 48, 37, 0.1)', color: 'var(--g-red)', border: '1px solid rgba(217, 48, 37, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name</label>
              <input type="text" className="form-input" placeholder="John" required
                value={form.first_name} onChange={(e) => updateForm('first_name', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input type="text" className="form-input" placeholder="Doe" required
                value={form.last_name} onChange={(e) => updateForm('last_name', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label">Username</label>
            <input type="text" className="form-input" placeholder="johndoe" required
              value={form.username} onChange={(e) => updateForm('username', e.target.value)} />
          </div>

          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="john@company.com" required
              value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Role</label>
              <select className="form-input form-select" value={form.role}
                onChange={(e) => updateForm('role', e.target.value)}>
                <option value="employee">Employee</option>
                <option value="dept_head">Department Head</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="form-label">Department</label>
              <select className="form-input form-select" value={form.department}
                onChange={(e) => updateForm('department', e.target.value)}>
                <option value="">Select...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input pr-12"
                placeholder="Min 6 characters"
                required minLength={6}
                value={form.password}
                onChange={(e) => updateForm('password', e.target.value)}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--text-muted)' }} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Confirm Password</label>
            <input type="password" className="form-input" placeholder="Repeat password" required minLength={6}
              value={form.password_confirm} onChange={(e) => updateForm('password_confirm', e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full justify-center mt-2 text-white"
            style={{ opacity: loading ? 0.7 : 1, background: 'var(--accent)' }}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
