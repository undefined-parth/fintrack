import { Outlet } from 'react-router';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';

const AppLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#06080c]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] h-150 w-150 rounded-full bg-primary/5 blur-[150px] motion-safe:animate-pulse motion-reduce:animate-none" />
        <div
          className="absolute right-[-5%] bottom-[-10%] h-150 w-150 rounded-full bg-secondary/5 blur-[150px] motion-safe:animate-pulse motion-reduce:animate-none"
          style={{ animationDelay: '2s' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-size-[100%_2px,3px_100%] opacity-20" />
      </div>

      <TopBar />
      <Sidebar />

      <main className="custom-scrollbar relative flex-1 overflow-y-auto pt-16 pb-20 md:pt-0 md:pb-0">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" />
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
