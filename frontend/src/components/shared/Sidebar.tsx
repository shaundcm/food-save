import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListPlus, ClipboardList, Bell,
  Users, BarChart3, LogOut, Leaf, Package, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from './UI';
import clsx from 'clsx';

const DONOR_NAV = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/listings/new',     icon: ListPlus,        label: 'Donate Food' },
  { to: '/my-listings',      icon: Package,         label: 'My Listings' },
  { to: '/notifications',    icon: Bell,            label: 'Notifications' },
];

const RECIPIENT_NAV = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/browse',           icon: Leaf,            label: 'Browse Food' },
  { to: '/my-claims',        icon: ClipboardList,   label: 'My Claims' },
  { to: '/notifications',    icon: Bell,            label: 'Notifications' },
];

const ADMIN_NAV = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',      icon: Users,           label: 'Users' },
  { to: '/admin/listings',   icon: Package,         label: 'All Listings' },
  { to: '/admin/analytics',  icon: BarChart3,       label: 'Analytics' },
  { to: '/notifications',    icon: Bell,            label: 'Notifications' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = user.role === 'DONOR' ? DONOR_NAV
    : user.role === 'RECIPIENT' ? RECIPIENT_NAV
    : ADMIN_NAV;

  const roleColor = user.role === 'DONOR' ? 'text-earth-400'
    : user.role === 'RECIPIENT' ? 'text-brand-400'
    : 'text-blue-400';

  const roleBg = user.role === 'DONOR' ? 'bg-earth-500/10 border-earth-500/20'
    : user.role === 'RECIPIENT' ? 'bg-brand-500/10 border-brand-500/20'
    : 'bg-blue-500/10 border-blue-500/20';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-surface-border bg-surface/80 backdrop-blur-md">
      {/* Logo */}
      <div className="p-5 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-brand-400" />
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">FoodSave</span>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="md" />
          <div className="min-w-0">
            <p className="font-display font-semibold text-white text-sm truncate">{user.name}</p>
            <span className={clsx('text-xs font-mono px-1.5 py-0.5 rounded border', roleColor, roleBg)}>
              {user.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 inline mr-1" />}
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('nav-link', isActive && 'active')
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
            {label === 'Notifications' && (user.unreadNotificationCount ?? 0) > 0 && (
              <span className="ml-auto bg-brand-500 text-white text-xs font-mono w-5 h-5 rounded-full flex items-center justify-center">
                {user.unreadNotificationCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-surface-border">
        <button
          onClick={handleLogout}
          className="nav-link w-full hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
