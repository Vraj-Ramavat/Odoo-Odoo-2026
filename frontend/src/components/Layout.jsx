import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: '260px' }}
      >
        {/* Top Bar */}
        <header
          className="sticky top-0 z-40 h-16 flex items-center justify-between px-8"
          style={{
            background: 'rgba(10, 15, 26, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Search */}
          <div className="relative w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search departments, activities..."
              className="form-input pl-10 py-2 text-sm"
              style={{ background: 'var(--bg-card)', fontSize: '13px' }}
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications bell */}
            <button
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={20} />
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--rose)', color: 'white' }}
              >
                3
              </span>
            </button>

            {/* User info */}
            <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                  color: 'white',
                }}
              >
                {user?.first_name?.[0] || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
