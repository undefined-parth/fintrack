import { motion } from 'framer-motion';
import { BarChart3, HandCoins, LayoutDashboard, ReceiptText } from 'lucide-react';
import { NavLink } from 'react-router';

const BottomNav = () => {
  const navItems = [
    { path: '/dashboard', label: 'Dash', icon: LayoutDashboard },
    { path: '/transactions', label: 'Trans', icon: ReceiptText },
    { path: '/loans', label: 'Loans', icon: HandCoins },
    { path: '/reports', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-100 flex w-full items-center justify-around border-t border-outline-variant/15 bg-surface/80 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-xl md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 transition-all duration-200 ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <item.icon className="relative z-10 h-5 w-5" />
              <span className="relative z-10 text-[10px] font-semibold">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
