import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Sparkles,
  ClipboardList,
  Bookmark,
  UserCircle,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import Avatar from '../components/ui/Avatar';
import TalentMatchLogo from '../components/TalentMatchLogo';

const NAV_ITEMS = [
  { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Explore jobs', icon: Search },
  { to: '/client/recommendations', label: 'AI matches', icon: Sparkles },
  { to: '/client/applications', label: 'Applications', icon: ClipboardList },
  { to: '/client/saved-jobs', label: 'Saved jobs', icon: Bookmark },
  { to: '/client/profile', label: 'Profile', icon: UserCircle },
];

function SidebarContent({ onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-forest-500/10 text-forest-600' : 'text-ink-600 hover:bg-cream-100 hover:text-ink-900'
            )
          }
        >
          <item.icon className="w-[18px] h-[18px]" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function ClientLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const profile = user?.jobSeekerProfile;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-cream-200 bg-cream-50">
        <div className="flex items-center gap-2 px-5 py-5 font-display text-lg font-bold text-ink-900">
          <TalentMatchLogo className="h-8 w-8" />
          TalentMatch AI
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-ink-950/50"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative flex h-full w-64 flex-col bg-cream-50"
            >
              <div className="flex items-center justify-between px-5 py-5">
                <span className="font-display text-lg font-bold text-ink-900">TalentMatch AI</span>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 text-ink-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-cream-200 bg-cream-50/90 backdrop-blur px-5 py-3.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-2 text-ink-500 hover:bg-cream-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-cream-100 focus-ring"
              >
                <Avatar src={profile?.avatarUrl} name={profile?.fullName} size="sm" />
                <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-52 rounded-2xl border border-cream-200 bg-white p-1.5 shadow-2xl"
                  >
                    <div className="px-3 py-2 border-b border-cream-200 mb-1">
                      <p className="text-sm font-medium text-ink-900 truncate">{profile?.fullName}</p>
                      <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                    </div>
                    <NavLink
                      to="/client/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-cream-100"
                    >
                      <UserCircle className="w-4 h-4" />
                      View profile
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="px-5 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
