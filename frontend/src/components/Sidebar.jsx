import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Building2, Tags, Settings, LogOut, Menu, X,
  Leaf, Users, Shield, Trophy, FileText, Bell, ChevronDown, User
} from 'lucide-react';

const navSections = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'dept_head', 'employee'] },
    ],
  },
  {
    title: 'Environmental',
    items: [
      { path: '/environmental-dashboard', label: 'Env Dashboard', icon: Leaf, roles: ['admin', 'dept_head'] },
      { path: '/emission-factors', label: 'Emission Factors', icon: Leaf, roles: ['admin', 'dept_head'] },
      { path: '/carbon-transactions', label: 'Carbon Transactions', icon: Leaf, roles: ['admin', 'dept_head'] },
      { path: '/environmental-goals', label: 'Goals', icon: Leaf, roles: ['admin', 'dept_head'] },
    ],
  },
  {
    title: 'Social',
    items: [
      { path: '/csr-activities', label: 'CSR Activities', icon: Users, roles: ['admin', 'dept_head', 'employee'] },
    ],
  },
  {
    title: 'Governance',
    items: [
      { path: '/policies', label: 'Policies', icon: Shield, roles: ['admin', 'dept_head', 'employee'] },
      { path: '/audits', label: 'Audits', icon: Shield, roles: ['admin', 'dept_head'] },
      { path: '/compliance', label: 'Compliance Issues', icon: Shield, roles: ['admin', 'dept_head'] },
    ],
  },
  {
    title: 'Gamification',
    items: [
      { path: '/challenges', label: 'Challenges', icon: Trophy, roles: ['admin', 'dept_head', 'employee'] },
      { path: '/leaderboard', label: 'Leaderboard', icon: Trophy, roles: ['admin', 'dept_head', 'employee'] },
      { path: '/rewards', label: 'Rewards', icon: Trophy, roles: ['admin', 'dept_head', 'employee'] },
    ],
  },
  {
    title: 'Reports',
    items: [
      { path: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'dept_head'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { path: '/departments', label: 'Departments', icon: Building2, roles: ['admin'] },
      { path: '/categories', label: 'Categories', icon: Tags, roles: ['admin'] },
      { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
    ],
  },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(user?.role)),
    }))
    .filter(section => section.items.length > 0);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0d1520 0%, #111827 100%)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          }}
        >
          <Leaf size={20} color="white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>EcoSphere</h1>
            <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--accent)' }}>ESG Platform</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-md hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {filteredSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      collapsed ? 'justify-center' : ''
                    }`}
                    style={{
                      color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--accent-glow)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          onClick={() => setShowProfile(!showProfile)}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: 'white',
            }}
          >
            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </>
          )}
        </div>

        {showProfile && !collapsed && (
          <div className="mt-2 rounded-lg p-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ color: 'var(--rose)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
