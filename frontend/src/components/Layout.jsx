import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, Sun, Moon, Check, Trash, AlertCircle, CheckCircle2, Trophy, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api/client';

export default function Layout() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const [countRes, listRes] = await Promise.all([
        notificationsAPI.getUnreadCount(),
        notificationsAPI.getAll()
      ]);
      setUnreadCount(countRes.data.unread_count || 0);
      setNotifications(listRes.data.results || listRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);
      const target = notifications.find(n => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

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
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--g-surface)] text-muted-foreground transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} className="text-[var(--g-yellow)]" /> : <Moon size={20} />}
            </button>

            {/* Notifications bell */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-[var(--g-surface)] text-muted-foreground transition-colors"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--g-red)] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown panel */}
              {showNotifications && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                  style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[var(--g-surface)]">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead} 
                        className="text-xs font-semibold text-[var(--g-blue)] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Dropdown Body */}
                  <div className="overflow-y-auto flex-1 divide-y divide-border" style={{ maxHeight: '350px' }}>
                    {loading && (
                      <div className="p-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
                        Loading...
                      </div>
                    )}
                    {error && (
                      <div className="p-4 text-center text-xs text-red-500">
                        {error}
                        <button onClick={fetchNotifications} className="block mx-auto mt-2 text-[var(--g-blue)] hover:underline font-semibold">
                          Retry
                        </button>
                      </div>
                    )}
                    {!loading && !error && notifications.length === 0 && (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        No notifications yet.
                      </div>
                    )}
                    {!loading && !error && notifications.map((n) => {
                      let IconComponent = Bell;
                      let iconColor = 'text-blue-500';
                      if (n.notification_type === 'success') {
                        IconComponent = CheckCircle2;
                        iconColor = 'text-green-500';
                      } else if (n.notification_type === 'warning') {
                        IconComponent = AlertCircle;
                        iconColor = 'text-yellow-500';
                      } else if (n.notification_type === 'badge') {
                        IconComponent = Trophy;
                        iconColor = 'text-purple-500';
                      } else if (n.notification_type === 'compliance') {
                        IconComponent = Shield;
                        iconColor = 'text-red-500';
                      }

                      return (
                        <div 
                          key={n.id} 
                          className={`flex items-start gap-3 p-3 transition-colors hover:bg-[var(--g-surface)] ${
                            !n.is_read ? 'bg-[color-mix(in_oklab,var(--g-blue)_6%,transparent)]' : ''
                          }`}
                        >
                          {/* Left icon */}
                          <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                            <IconComponent size={16} />
                          </div>

                          {/* Text content */}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{n.message}</p>
                            <span className="text-[9px] text-muted-foreground mt-1 block">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col gap-1.5 shrink-0 items-center justify-center">
                            {!n.is_read && (
                              <button 
                                onClick={() => handleMarkAsRead(n.id)}
                                className="p-1 rounded hover:bg-border text-muted-foreground hover:text-foreground transition-colors"
                                title="Mark as read"
                              >
                                <Check size={12} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(n.id)}
                              className="p-1 rounded hover:bg-border text-muted-foreground hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

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
