import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-foreground">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <main
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-8 border-b border-border bg-card">
          {/* Search */}
          <div className="relative w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search departments, activities..."
              className="w-full h-10 rounded-full bg-[var(--g-search)] pl-10 pr-4 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-[var(--g-active)] transition-all"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications bell */}
            <button className="relative p-2 rounded-full hover:bg-[var(--g-surface)] text-muted-foreground transition-colors">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--g-red)] text-white text-[10px] font-bold flex items-center justify-center">
                3
              </span>
            </button>

            {/* User info */}
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[var(--g-purple)] text-white flex items-center justify-center text-sm font-medium shadow-sm">
                {user?.full_name?.[0] || user?.username?.[0] || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
