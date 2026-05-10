import { useAccountStore } from '@/stores/useAccountStore';
import { useUserStore } from '@/stores/useUserStore';
import { NavLink, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ReceiptText,
  Shapes,
  Wallet,
  HandCoins,
  BarChart3,
  Settings,
  LogOut,
  Cpu,
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logoutUser } = useUserStore();
  const { getAccountsForUser } = useAccountStore();
  const navigate = useNavigate();

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
    <aside className="relative z-50 flex h-screen w-64 flex-col justify-between border-r border-white/5 bg-[#06080c] px-4 pt-10 pb-4 shadow-2xl">
      {/* Background Glow */}
      <div className="pointer-events-none absolute top-0 left-0 h-32 w-full bg-primary/5 blur-[80px]" />

      <div>
        <div className="mb-8 px-4">
          <div className="mb-1 flex items-center gap-3">
            <div className="h-1 w-8 bg-primary shadow-[0_0_15px_#799dff]" />
            <Cpu className="h-4 w-4 animate-pulse text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            FIN<span className="text-outline-variant opacity-40">TRACK</span>
          </h1>
          <p className="mt-1 text-[10px] font-black tracking-[0.4em] text-outline uppercase">
            Personal Finance Tracker
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-4 rounded-2xl px-5 py-2.5 transition-all duration-300 ${
                  isActive
                    ? 'border border-primary/20 bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(121,157,255,0.1)]'
                    : 'border border-transparent text-outline hover:bg-white/3 hover:text-white'
                } `
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`h-5 w-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                  />
                  <span className="text-[11px] font-black tracking-[0.2em] uppercase">
                    {item.label}
                  </span>
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto h-1 w-1 rounded-full bg-primary shadow-[0_0_10px_#799dff]"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="space-y-2">
        {/* User Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/2 p-5 backdrop-blur-3xl transition-all hover:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-md" />
              <img
                alt="User Profile"
                className="relative h-10 w-10 rounded-full border border-white/10"
                src={currentUser?.avatar}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-black tracking-tight text-white uppercase">
                {currentUser?.name}
              </p>
              <p className="text-[9px] font-bold text-primary uppercase">
                {currentUser?.currencyIcon}
                {getNetWorth(currentUser?.id).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="cursor-pointer rounded-xl border border-white/5 p-2 text-outline transition-all hover:border-tertiary/20 hover:bg-tertiary/10 hover:text-tertiary"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .text-outline-variant {
          -webkit-text-stroke: 1px rgba(255,255,255,0.3);
          color: transparent;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
