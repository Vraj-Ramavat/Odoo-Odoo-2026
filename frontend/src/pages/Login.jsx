import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left — Branding Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] p-12 relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.55)), url("/login-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--bg-card), transparent)' }} />
        <div className="absolute bottom-20 -right-10 w-56 h-56 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, var(--bg-card), transparent)' }} />

        <div>
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white"
              style={{
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Leaf size={26} color="#1A73E8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'white' }}>EcoSphere</h1>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.7)' }}>ESG Management</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: 'white' }}>
            Measure. Manage.<br />
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>Improve.</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Track your organization's Environmental, Social & Governance performance
            with real-time analytics, gamification, and comprehensive reporting.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Carbon Tracking', desc: 'Automated emission calculations' },
            { label: 'Gamification', desc: 'XP, badges, and leaderboards' },
            { label: 'Compliance', desc: 'Policy & audit management' },
          ].map((feat) => (
            <div key={feat.label} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'white' }}>{feat.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--accent)]"
            >
              <Leaf size={22} color="white" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>EcoSphere</h1>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Sign in to your EcoSphere account
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(217, 48, 37, 0.1)', color: 'var(--g-red)', border: '1px solid rgba(217, 48, 37, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input pr-12"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full justify-center text-white"
              style={{ opacity: loading ? 0.7 : 1, background: 'var(--accent)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold" style={{ color: 'var(--accent)' }}>
              Create Account
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>DEMO CREDENTIALS</p>
            <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <p><span className="font-medium" style={{ color: 'var(--accent)' }}>Admin:</span> admin / EcoSphere2026!</p>
              <p><span className="font-medium" style={{ color: 'var(--blue)' }}>Dept Head:</span> sarah.chen / EcoSphere2026!</p>
              <p><span className="font-medium" style={{ color: 'var(--purple)' }}>Employee:</span> james.wilson / EcoSphere2026!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
