import { useState, useEffect } from 'react';
import { useAccountStore } from '@/stores/useAccountStore';
import { useUserStore } from '@/stores/useUserStore';
import { NavLink, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import logoUrl from '@/assets/logo.svg';
import {
  LayoutDashboard,
  ReceiptText,
  Shapes,
  Wallet,
  HandCoins,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logoutUser } = useUserStore();
  const { getAccountsForUser } = useAccountStore();
  const navigate = useNavigate();

  // Load initial collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Keep localStorage in sync with collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: ReceiptText },
    { path: '/categories', label: 'Categories', icon: Shapes },
    { path: '/accounts', label: 'Accounts', icon: Wallet },
    { path: '/loans', label: 'Loans', icon: HandCoins },
    { path: '/reports', label: 'Analytics', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const getNetWorth = (id: string | undefined): number => {
    if (!id) return 0;
    const accounts = getAccountsForUser(id);
    return accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  };

  const handleLogout = () => {
    logoutUser();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    navigate('/');
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 76 : 260 }}
      transition={{ type: 'spring', damping: 24, stiffness: 225 }}
      className="relative z-50 hidden h-screen shrink-0 flex-col justify-between overflow-visible border-r border-outline-variant/15 bg-surface pt-8 pb-4 md:flex"
    >
      {/* Background accent */}
      <div className="pointer-events-none absolute top-0 left-0 h-40 w-full bg-linear-to-b from-primary/3 to-transparent" />

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3.5 z-60 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-outline-variant/25 bg-surface text-on-surface-variant shadow-md transition-all hover:scale-105 hover:bg-surface-container-high hover:text-on-surface active:scale-95"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="relative w-full">
        {/* Brand */}
        <div
          className={`mb-8 overflow-hidden px-4 ${isCollapsed ? 'flex justify-center pr-4 pl-4' : ''}`}
        >
          <div className="flex min-h-8 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <img src={logoUrl} className="h-5 w-5" alt="Logo" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <h1 className="font-display text-xl font-extrabold tracking-tight whitespace-nowrap text-on-surface">
                    Fin<span className="text-primary">Track</span>
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pl-10.5 text-[10px] font-medium tracking-wider whitespace-nowrap text-outline"
              >
                Personal Finance
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center rounded-xl py-2.5 transition-all duration-200 ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'
                } ${
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-highest/50 hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                      transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.2 }}
                    />
                  )}
                  <item.icon className="relative z-10 h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="relative z-10 overflow-hidden text-[13px] font-semibold tracking-wide whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Card */}
      <div className="relative px-3">
        <div
          className={`overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container transition-all duration-200 hover:border-outline-variant/30 ${
            isCollapsed ? 'p-2' : 'p-4'
          }`}
        >
          <div
            className={`flex items-center justify-between ${
              isCollapsed ? 'flex-col gap-3' : 'gap-3'
            }`}
          >
            <div className="relative shrink-0">
              <img
                alt="User Profile"
                className="h-9 w-9 rounded-full border border-outline-variant/20 object-cover"
                src={currentUser?.avatar}
              />
              <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-container bg-secondary" />
            </div>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="ml-1 min-w-0 flex-1 overflow-hidden"
                >
                  <p className="truncate text-sm font-semibold text-on-surface">
                    {currentUser?.name}
                  </p>
                  <p className="font-mono text-xs whitespace-nowrap text-secondary">
                    {currentUser?.currencyIcon}
                    {getNetWorth(currentUser?.id).toLocaleString()}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 rounded-lg p-2 text-on-surface-variant transition-all duration-200 hover:bg-tertiary/10 hover:text-tertiary"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
