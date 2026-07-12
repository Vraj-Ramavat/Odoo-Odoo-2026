import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Eye, EyeOff, ArrowRight, User, Lock, Trophy, Shield } from 'lucide-react';

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
    <div 
      className="min-h-screen w-full flex items-center justify-between p-6 md:p-12 relative"
      style={{ 
        backgroundImage: 'url("/login-full-bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Semi-transparent dark overlay on the left portion for readability, fading out to the right */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none lg:block hidden"
        style={{
          background: 'linear-gradient(to right, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0) 100%)'
        }}
      />
      <div 
        className="absolute inset-0 z-0 pointer-events-none lg:hidden block"
        style={{
          background: 'rgba(0, 0, 0, 0.45)'
        }}
      />

      <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-12 z-10">
        
        {/* Left Side: Branding Elements */}
        <div className="flex-1 max-w-lg text-white flex flex-col justify-between h-full space-y-10 lg:space-y-16">
          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-md">
              <Leaf size={22} color="#1A73E8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">EcoSphere</h1>
              <p className="text-[10px] font-semibold tracking-wider uppercase opacity-80">ESG Management</p>
            </div>
          </div>

          {/* Slogan and Description */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              Measure. Manage.<br />
              <span className="text-emerald-400">Improve.</span>
            </h2>
            <p className="text-sm md:text-base leading-relaxed opacity-90">
              Track your organization's Environmental, Social & Governance performance
              with real-time analytics, gamification, and comprehensive reporting.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Leaf size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Carbon Tracking</p>
                <p className="text-xs opacity-75">Automated emission calculations</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Trophy size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Gamification</p>
                <p className="text-xs opacity-75">XP, badges, and leaderboards</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                <Shield size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Compliance</p>
                <p className="text-xs opacity-75">Policy & audit management</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-6">
            Sign in to your EcoSphere account
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(217, 48, 37, 0.08)', color: 'var(--g-red)', border: '1px solid rgba(217, 48, 37, 0.15)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-700"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-700"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:opacity-95 transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #0db8a6, #0284c7)'
              }}
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

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Create Account
            </Link>
          </p>

          {/* Demo credentials box */}
          <div className="mt-6 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">DEMO CREDENTIALS</p>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p><span className="font-semibold text-emerald-600">Admin:</span> admin / EcoSphere2026!</p>
              <p><span className="font-semibold text-sky-600">Dept Head:</span> sarah.chen / EcoSphere2026!</p>
              <p><span className="font-semibold text-purple-600">Employee:</span> james.wilson / EcoSphere2026!</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
