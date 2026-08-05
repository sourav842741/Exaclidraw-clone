import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { notificationApi } from '../../api/index.js';
import Logo from '../common/Logo.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { to: '/boards', label: 'Boards', icon: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zm2 2v2h12V7H6zm0 4v2h12v-2H6z' },
  { to: '/projects', label: 'Projects', icon: 'M3 6h18M3 12h18M3 18h12' },
  { to: '/teams', label: 'Teams', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 10v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75' },
];

export default function Layout({ children }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const { count } = await notificationApi.unread();
        setUnread(count);
      } catch (err) {
        console.error('Failed to fetch unread notifications', err);
      }
    };
    fetchUnread();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openNotifs = async () => {
    setNotifOpen(true);
    try {
      const data = await notificationApi.list({ limit: 10 });
      setNotifs(data.notifications);
      setUnread(0);
      notificationApi.markAllRead().catch(() => {});
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 flex flex-col"
          >
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <Link to="/dashboard"><Logo size={30} /></Link>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                  {item.label}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z" /></svg>
                  Admin
                </NavLink>
              )}
            </nav>
            <div className="p-3 border-t border-gray-200 dark:border-gray-800">
              <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className={`transition-all ${sidebarOpen ? 'lg:pl-64' : ''}`}>
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 h-16">
            <button onClick={toggleSidebar} className="btn-ghost !p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={openNotifs} className="btn-ghost !p-2 relative">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      className="absolute right-0 mt-2 w-80 glass-panel rounded-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-sm">Notifications</div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifs.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 text-center">No notifications yet</p>}
                        {notifs.map((n) => (
                          <div key={n._id} className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${n.read ? 'opacity-60' : ''}`}>
                            <p className="text-sm font-medium">{n.title}</p>
                            {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={handleLogout} className="btn-ghost !p-2" title="Log out">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              </button>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
