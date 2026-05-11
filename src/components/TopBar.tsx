import { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { Cpu } from 'lucide-react';
import ProfileDrawer from './ProfileDrawer';

const TopBar = () => {
  const { currentUser } = useUserStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 z-[100] flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#06080c]/80 px-6 backdrop-blur-xl md:hidden">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Cpu className="h-4 w-4 animate-pulse text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">
              FIN<span className="text-outline-variant opacity-40">TRACK</span>
            </h1>
          </div>
        </div>

        {/* Profile Section */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="relative group focus:outline-none"
        >
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <img
            alt="Profile"
            className="relative h-9 w-9 rounded-full border border-white/10 ring-2 ring-transparent transition-all group-hover:ring-primary/20"
            src={currentUser?.avatar}
          />
        </button>
      </header>

      <ProfileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

      <style>{`
        .text-outline-variant {
          -webkit-text-stroke: 1px rgba(255,255,255,0.3);
          color: transparent;
        }
      `}</style>
    </>
  );
};

export default TopBar;
