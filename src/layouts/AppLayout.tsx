import { Outlet } from 'react-router';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';

const AppLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface">
      {/* Ambient background effects */}
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-15%] left-[-10%] h-150 w-150 rounded-full bg-primary/4 blur-[120px] motion-safe:animate-pulse motion-reduce:animate-none" />
        <div
          className="absolute right-[-10%] bottom-[-15%] h-125 w-125 rounded-full bg-secondary/3 blur-[120px] motion-safe:animate-pulse motion-reduce:animate-none"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <TopBar />
      <Sidebar />

      <main className="custom-scrollbar relative z-10 flex-1 overflow-y-auto pt-16 pb-20 md:pt-0 md:pb-0">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
