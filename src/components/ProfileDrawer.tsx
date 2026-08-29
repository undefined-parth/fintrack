import { useUserStore } from '@/stores/useUserStore';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, LogOut, Settings, Shapes, Wallet, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileDrawer = ({ isOpen, onClose }: ProfileDrawerProps) => {
  const { currentUser, logoutUser } = useUserStore();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) drawerRef.current?.focus();
  }, [isOpen]);

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-110 bg-black/50 backdrop-blur-sm md:hidden"
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
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed top-0 right-0 z-120 flex h-full w-[80%] max-w-sm flex-col border-l border-outline-variant/15 bg-surface p-6 shadow-2xl md:hidden"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold tracking-wider text-primary uppercase">
                Profile
              </h2>
              <button
                type="button"
                aria-label="Close profile drawer"
                onClick={onClose}
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Info */}
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-outline-variant/15 bg-surface-container p-4">
              <img
                alt="User Profile"
                className="h-11 w-11 rounded-full border border-outline-variant/20 object-cover"
                src={currentUser?.avatar}
              />
              <div>
                <p className="text-sm font-semibold text-on-surface">{currentUser?.name}</p>
                <p className="text-xs text-on-surface-variant">Active User</p>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span className="flex-1 text-sm font-semibold">{item.label}</span>
                  <ChevronRight size={14} className="opacity-30" />
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-tertiary/20 bg-tertiary/5 py-3.5 text-tertiary transition-all duration-200 hover:bg-tertiary/10"
            >
              <LogOut size={16} />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileDrawer;
