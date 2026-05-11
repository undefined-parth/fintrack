import { useUserStore } from '@/stores/useUserStore';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, LogOut, Settings, Shapes, Wallet, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileDrawer = ({ isOpen, onClose }: ProfileDrawerProps) => {
  const { currentUser, logoutUser } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    onClose();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    navigate('/');
  };

  const menuItems = [
    { label: 'Accounts', icon: Wallet, path: '/accounts' },
    { label: 'Categories', icon: Shapes, path: '/categories' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
import { useEffect, useRef } from 'react';

const ProfileDrawer = ({ isOpen, onClose }: ProfileDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) drawerRef.current?.focus();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-110 bg-black/60 backdrop-blur-sm md:hidden"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Profile menu"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-120 h-full w-[80%] max-w-sm border-l border-white/10 bg-[`#06080c`] p-6 shadow-2xl md:hidden"
          />
        </>
      )}
    </AnimatePresence>
  );
};
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-sm font-black tracking-[0.3em] text-primary uppercase">
                Profile Info
              </h2>
              <button onClick={onClose} className="rounded-xl bg-white/5 p-2 text-outline">
                <X size={20} />
              </button>
            </div>

            {/* User Info */}
            <div className="mb-8 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/2 p-4">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-md" />
                <img
                  alt="User Profile"
                  className="relative h-12 w-12 rounded-full border border-white/10"
                  src={currentUser?.avatar}
                />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-white uppercase">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] font-bold text-outline uppercase">Active User</p>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-4 rounded-2xl px-5 py-3 transition-all duration-300 ${
                      isActive
                        ? 'border border-primary/20 bg-primary/10 text-primary'
                        : 'border border-transparent text-outline hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span className="flex-1 text-[11px] font-black tracking-widest uppercase">
                    {item.label}
                  </span>
                  <ChevronRight size={14} className="opacity-30" />
                </NavLink>
              ))}
            </nav>

            {/* Footer / Logout */}
            <div className="absolute right-6 bottom-6 left-6">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-tertiary/20 bg-tertiary/10 py-4 text-tertiary transition-all hover:bg-tertiary/20"
              >
                <LogOut size={18} />
                <span className="text-[11px] font-black tracking-widest uppercase">
                  Logout System
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileDrawer;
