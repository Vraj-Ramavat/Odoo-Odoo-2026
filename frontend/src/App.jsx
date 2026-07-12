import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
// Phase 2 — Environmental
import EmissionFactors from './pages/EmissionFactors';
import CarbonTransactions from './pages/CarbonTransactions';
import EnvironmentalGoals from './pages/EnvironmentalGoals';
import EnvironmentalDashboard from './pages/EnvironmentalDashboard';
import CSRActivities from './pages/CSRActivities';
import ESGPolicies from './pages/ESGPolicies';
import Audits from './pages/Audits';
import ComplianceIssues from './pages/ComplianceIssues';
import Challenges from './pages/Challenges';
import Leaderboard from './pages/Leaderboard';
import Rewards from './pages/Rewards';
import Reports from './pages/Reports';
import SuperAdmin from './pages/SuperAdmin';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

// Placeholder for upcoming pages
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)' }}>This module is coming in the next phase.</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected — inside Layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />

        {/* Admin-only */}
        <Route path="departments" element={<ProtectedRoute allowedRoles={['admin']}><Departments /></ProtectedRoute>} />
        <Route path="categories" element={<ProtectedRoute allowedRoles={['admin']}><Categories /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
        <Route path="superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdmin /></ProtectedRoute>} />

        {/* Environmental (Phase 2) */}
        <Route path="environmental-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'dept_head']}><EnvironmentalDashboard /></ProtectedRoute>} />
        <Route path="emission-factors" element={<ProtectedRoute allowedRoles={['admin', 'dept_head']}><EmissionFactors /></ProtectedRoute>} />
        <Route path="carbon-transactions" element={<ProtectedRoute allowedRoles={['admin', 'dept_head']}><CarbonTransactions /></ProtectedRoute>} />
        <Route path="environmental-goals" element={<ProtectedRoute allowedRoles={['admin', 'dept_head']}><EnvironmentalGoals /></ProtectedRoute>} />

        {/* Social (Phase 3) */}
        <Route path="csr-activities" element={<CSRActivities />} />

        {/* Governance (Phase 4) */}
        <Route path="policies" element={<ESGPolicies />} />
        <Route path="audits" element={<Audits />} />
        <Route path="compliance" element={<ComplianceIssues />} />

        {/* Gamification (Phase 5) */}
        <Route path="challenges" element={<Challenges />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="rewards" element={<Rewards />} />

        {/* Reports (Phase 6) */}
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
