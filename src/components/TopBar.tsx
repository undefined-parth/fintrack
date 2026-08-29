import { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import logoUrl from '@/assets/logo.svg';
import ProfileDrawer from './ProfileDrawer';

const TopBar = () => {
  const { currentUser } = useUserStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 z-100 flex h-14 w-full items-center justify-between border-b border-outline-variant/15 bg-surface/80 px-5 backdrop-blur-xl md:hidden">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <img src={logoUrl} className="h-4.5 w-4.5" alt="Logo" />
          </div>
          <h1 className="font-display text-lg font-extrabold tracking-tight text-on-surface">
            Fin<span className="text-primary">Track</span>
          </h1>
        </div>

        {/* Profile */}
        <button
          type="button"
          aria-label="Open profile menu"
          onClick={() => setIsDrawerOpen(true)}
          className="group relative rounded-full focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          <img
            alt="Profile"
            className="h-8 w-8 rounded-full border border-outline-variant/20 object-cover transition-all duration-200 group-hover:border-primary/30"
            src={currentUser?.avatar}
          />
        </button>
      </header>

      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

export default TopBar;
