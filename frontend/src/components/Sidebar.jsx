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
      { path: '/superadmin', label: 'Super Admin Dashboard', icon: Shield, roles: ['superadmin'] },
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

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col border-r border-border bg-card transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0 border-b border-border">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--g-blue)] text-white">
          <Leaf size={18} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">EcoSphere</h1>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--g-blue)]">ESG Platform</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-full hover:bg-[var(--g-surface)] text-muted-foreground transition-colors"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
        {filteredSections.map((section) => (
          <div key={section.title}>
            {!collapsed && section.title && (
              <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                    className={`mx-2 flex items-center gap-3 rounded-r-full rounded-l-md px-3 py-2 text-sm transition-colors ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-[var(--g-active)] font-semibold text-[var(--g-blue)]'
                        : 'text-foreground hover:bg-[var(--g-surface)]'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="flex-shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="flex-shrink-0 p-3 border-t border-border">
        <div
          className={`flex items-center gap-3 p-2 rounded-full cursor-pointer hover:bg-[var(--g-surface)] transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          onClick={() => setShowProfile(!showProfile)}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--g-purple)] text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
            {user?.full_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <ChevronDown size={14} className="text-muted-foreground" />
            </>
          )}
        </div>

        {showProfile && !collapsed && (
          <div className="mt-2 rounded-lg p-1 bg-card border border-border shadow-md">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-[var(--g-red)] hover:bg-[color-mix(in_oklab,var(--g-red)_10%,var(--bg-primary))] transition-colors"
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
