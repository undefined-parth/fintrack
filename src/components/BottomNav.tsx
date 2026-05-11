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
    <nav className="fixed bottom-0 left-0 z-100 flex w-full items-center justify-around border-t border-white/5 bg-[#06080c]/80 px-2 py-3 backdrop-blur-xl md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-primary' : 'text-outline hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon
                className={`h-5 w-5 transition-transform duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
              />
              <span className="text-[10px] font-black tracking-tight uppercase">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-3 h-1 w-6 rounded-full bg-primary shadow-[0_0_10px_#799dff]"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
